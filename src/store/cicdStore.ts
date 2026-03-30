import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

export type StageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
export type Environment = 'dev' | 'staging' | 'production';
export type DeploymentStrategy = 'rolling' | 'blue-green' | 'canary';

export interface StageLog {
  timestamp: number;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface PipelineStage {
  id: string;
  name: string;
  status: StageStatus;
  logs: StageLog[];
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface PipelineRun {
  id: string;
  backendId?: string; // ID from the backend database
  commitMessage: string;
  branch: string;
  environment: Environment;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  stages: PipelineStage[];
  startTime: number;
  endTime?: number;
  version: string;
  deploymentStrategy: DeploymentStrategy;
}

interface CICDState {
  pipelineRuns: PipelineRun[];
  currentRun: PipelineRun | null;
  selectedStage: string | null;
  deployedVersions: Map<Environment, string>;
  isRunning: boolean;
  
  // Actions
  triggerPipeline: (commitMessage: string, branch: string, environment: Environment, strategy: DeploymentStrategy) => void;
  cancelPipeline: () => void;
  selectStage: (stageId: string | null) => void;
  rollbackToPrevious: (environment: Environment) => void;
  clearHistory: () => Promise<void>;
  loadPipelines: () => Promise<void>;
  setPipelines: (pipelines: PipelineRun[]) => void;
}

let pipelineCounter = 0;
let versionCounter = { major: 1, minor: 0, patch: 0 };

const getNextVersion = (): string => {
  versionCounter.patch++;
  if (versionCounter.patch > 9) {
    versionCounter.patch = 0;
    versionCounter.minor++;
  }
  if (versionCounter.minor > 9) {
    versionCounter.minor = 0;
    versionCounter.major++;
  }
  return `v${versionCounter.major}.${versionCounter.minor}.${versionCounter.patch}`;
};

const addLog = (stage: PipelineStage, message: string, level: StageLog['level'] = 'info') => {
  stage.logs.push({
    timestamp: Date.now(),
    message,
    level,
  });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useCICDStore = create<CICDState>((set, get) => ({
  pipelineRuns: [],
  currentRun: null,
  selectedStage: null,
  deployedVersions: new Map(),
  isRunning: false,

  triggerPipeline: async (commitMessage, branch, environment, strategy) => {
    const state = get();
    if (state.isRunning) {
      toast.error('Pipeline already running');
      return;
    }

    pipelineCounter++;
    const version = getNextVersion();
    
    const stages: PipelineStage[] = [
      { id: 'checkout', name: 'Checkout Code', status: 'pending', logs: [] },
      { id: 'build', name: 'Build', status: 'pending', logs: [] },
      { id: 'test', name: 'Test', status: 'pending', logs: [] },
      { id: 'docker', name: 'Dockerize', status: 'pending', logs: [] },
      { id: 'push', name: 'Push to Registry', status: 'pending', logs: [] },
      { id: 'deploy', name: 'Deploy', status: 'pending', logs: [] },
    ];

    const newRun: PipelineRun = {
      id: `pipeline-${pipelineCounter}-${Date.now()}`,
      commitMessage,
      branch,
      environment,
      status: 'running',
      stages,
      startTime: Date.now(),
      version,
      deploymentStrategy: strategy,
    };

    set({ currentRun: newRun, isRunning: true, pipelineRuns: [newRun, ...state.pipelineRuns] });
    
    toast.success(`Pipeline started for ${branch}`, {
      description: `${commitMessage} → ${version}`,
    });

    // Save pipeline to backend
    let backendPipelineId: string | undefined;
    try {
      const response = await apiClient.createPipeline({
        name: commitMessage,
        branch,
        status: 'running',
        steps: stages,
        version,
      }) as any;
      backendPipelineId = response.id;
      newRun.backendId = backendPipelineId;
    } catch (error) {
      console.error('Failed to save pipeline to backend:', error);
      toast.error('Failed to save pipeline', {
        description: 'Pipeline will run but won\'t be persisted'
      });
    }

    // Run pipeline stages
    await runPipeline(newRun, environment, version, backendPipelineId);
  },

  cancelPipeline: () => {
    const { currentRun } = get();
    if (currentRun) {
      currentRun.status = 'cancelled';
      currentRun.endTime = Date.now();
      set({ currentRun: { ...currentRun }, isRunning: false });
      toast.warning('Pipeline cancelled');
    }
  },

  selectStage: (stageId) => {
    set({ selectedStage: stageId });
  },

  rollbackToPrevious: (environment) => {
    const { pipelineRuns, deployedVersions } = get();
    const successfulRuns = pipelineRuns.filter(
      (run) => run.status === 'success' && run.environment === environment
    );
    
    if (successfulRuns.length < 2) {
      toast.error('No previous version to rollback to');
      return;
    }

    const previousRun = successfulRuns[1];
    deployedVersions.set(environment, previousRun.version);
    
    set({ deployedVersions: new Map(deployedVersions) });
    
    toast.success(`Rolled back ${environment} to ${previousRun.version}`, {
      description: 'Previous stable version restored',
    });
  },

  clearHistory: async () => {
    const { pipelineRuns } = get();
    
    // Delete all pipelines from backend
    try {
      const deletePromises = pipelineRuns
        .filter(run => run.backendId)
        .map(run => apiClient.deletePipeline(run.backendId!));
      
      await Promise.all(deletePromises);
      
      set({ pipelineRuns: [], currentRun: null, selectedStage: null });
      toast.success('Pipeline history cleared');
    } catch (error) {
      console.error('Failed to clear pipelines from backend:', error);
      // Still clear from local state even if backend fails
      set({ pipelineRuns: [], currentRun: null, selectedStage: null });
      toast.warning('Pipeline history cleared locally', {
        description: 'Some pipelines may still exist in database'
      });
    }
  },

  loadPipelines: async () => {
    try {
      const pipelines = await apiClient.getPipelines() as any[];
      // Convert backend pipelines to frontend format
      const pipelineRuns: PipelineRun[] = pipelines.map((p: any) => ({
        id: p.id,
        backendId: p.id,
        commitMessage: p.name,
        branch: p.branch || 'main',
        environment: 'dev' as Environment,
        status: p.status as any,
        stages: p.steps || [],
        startTime: new Date(p.createdAt).getTime(),
        endTime: p.updatedAt ? new Date(p.updatedAt).getTime() : undefined,
        version: p.version || 'v1.0.0',
        deploymentStrategy: 'rolling' as DeploymentStrategy,
      }));
      
      // Initialize version counter from highest existing version
      if (pipelineRuns.length > 0) {
        const versions = pipelineRuns
          .map(p => p.version)
          .filter(v => v && v.startsWith('v'))
          .map(v => {
            const match = v.match(/v(\d+)\.(\d+)\.(\d+)/);
            if (match) {
              return { major: parseInt(match[1]), minor: parseInt(match[2]), patch: parseInt(match[3]) };
            }
            return null;
          })
          .filter(v => v !== null) as Array<{major: number, minor: number, patch: number}>;
        
        if (versions.length > 0) {
          // Find the highest version
          const latest = versions.reduce((max, curr) => {
            if (curr.major > max.major) return curr;
            if (curr.major === max.major && curr.minor > max.minor) return curr;
            if (curr.major === max.major && curr.minor === max.minor && curr.patch > max.patch) return curr;
            return max;
          });
          versionCounter = { ...latest };
        }
      }
      
      set({ pipelineRuns });
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  },

  setPipelines: (pipelines) => {
    set({ pipelineRuns: pipelines });
  },
}));

// Pipeline execution logic
async function runPipeline(run: PipelineRun, environment: Environment, version: string, backendId?: string) {
  const updateRun = (updates: Partial<PipelineRun>) => {
    const state = useCICDStore.getState();
    const updatedRun = { ...run, ...updates };
    useCICDStore.setState({
      currentRun: updatedRun,
      pipelineRuns: state.pipelineRuns.map((r) => (r.id === run.id ? updatedRun : r)),
    });
  };

  try {
    // Stage 1: Checkout
    await runCheckoutStage(run.stages[0], run.branch);
    if (run.status === 'cancelled') return;

    // Stage 2: Build
    const buildSuccess = await runBuildStage(run.stages[1], environment);
    if (!buildSuccess) {
      failPipeline(run, 'Build failed', backendId);
      return;
    }

    // Stage 3: Test
    const testSuccess = await runTestStage(run.stages[2], environment);
    if (!testSuccess) {
      failPipeline(run, 'Tests failed - deployment blocked', backendId);
      return;
    }

    // Stage 4: Dockerize
    const dockerSuccess = await runDockerStage(run.stages[3], version);
    if (!dockerSuccess) {
      failPipeline(run, 'Docker build failed', backendId);
      return;
    }

    // Stage 5: Push
    const pushSuccess = await runPushStage(run.stages[4], version);
    if (!pushSuccess) {
      failPipeline(run, 'Push to registry failed', backendId);
      return;
    }

    // Stage 6: Deploy
    const deploySuccess = await runDeployStage(run.stages[5], environment, version, run.deploymentStrategy);
    if (!deploySuccess) {
      failPipeline(run, 'Deployment failed - triggering rollback', backendId);
      return;
    }

    // Success!
    run.status = 'success';
    run.endTime = Date.now();
    updateRun({ status: 'success', endTime: Date.now() });
    
    const { deployedVersions } = useCICDStore.getState();
    deployedVersions.set(environment, version);
    useCICDStore.setState({ 
      deployedVersions: new Map(deployedVersions),
      isRunning: false 
    });

    // Update pipeline status in backend
    if (backendId) {
      try {
        await apiClient.updatePipeline(backendId, {
          status: 'success',
          steps: run.stages,
        });
        console.log('✅ Pipeline status updated in backend');
      } catch (error) {
        console.error('Failed to update pipeline in backend:', error);
      }
    }

    toast.success(`🚀 Deployment successful!`, {
      description: `${version} deployed to ${environment}`,
      duration: 4000,
    });

  } catch (error) {
    failPipeline(run, 'Pipeline error: ' + (error as Error).message, backendId);
  }
}

async function runCheckoutStage(stage: PipelineStage, branch: string): Promise<boolean> {
  stage.status = 'running';
  stage.startTime = Date.now();
  addLog(stage, `🔄 Checking out branch: ${branch}...`);
  await sleep(800);
  
  addLog(stage, `✓ Cloning repository...`, 'info');
  await sleep(500);
  addLog(stage, `✓ Checked out branch: ${branch}`, 'success');
  
  stage.status = 'success';
  stage.endTime = Date.now();
  stage.duration = stage.endTime - stage.startTime;
  return true;
}

async function runBuildStage(stage: PipelineStage, environment: Environment): Promise<boolean> {
  stage.status = 'running';
  stage.startTime = Date.now();
  
  addLog(stage, '📦 Installing dependencies...');
  await sleep(1200);
  
  addLog(stage, '├─ npm install');
  await sleep(600);
  addLog(stage, '├─ 243 packages installed');
  await sleep(400);
  
  addLog(stage, '🔨 Compiling application...');
  await sleep(1000);
  
  // Simulate occasional build failures (10% chance)
  if (environment === 'production' && Math.random() < 0.1) {
    addLog(stage, '❌ Build failed: Missing dependency', 'error');
    stage.status = 'failed';
    stage.endTime = Date.now();
    stage.duration = stage.endTime - stage.startTime;
    return false;
  }
  
  addLog(stage, '✓ Build completed successfully', 'success');
  stage.status = 'success';
  stage.endTime = Date.now();
  stage.duration = stage.endTime - stage.startTime;
  return true;
}

async function runTestStage(stage: PipelineStage, environment: Environment): Promise<boolean> {
  stage.status = 'running';
  stage.startTime = Date.now();
  
  addLog(stage, '🧪 Running test suite...');
  await sleep(1500);
  
  addLog(stage, '├─ Unit tests: Running...');
  await sleep(800);
  
  // Simulate test failures (15% for dev, 5% for staging/prod)
  const failureChance = environment === 'dev' ? 0.15 : 0.05;
  
  if (Math.random() < failureChance) {
    addLog(stage, '├─ Unit tests: 23 passed, 2 failed', 'error');
    addLog(stage, '│  ✗ AuthService.login() - Expected 200, got 401', 'error');
    addLog(stage, '│  ✗ UserController.create() - Validation failed', 'error');
    addLog(stage, '❌ Test suite failed', 'error');
    stage.status = 'failed';
    stage.endTime = Date.now();
    stage.duration = stage.endTime - stage.startTime;
    return false;
  }
  
  addLog(stage, '├─ Unit tests: 25 passed', 'success');
  await sleep(500);
  addLog(stage, '├─ Integration tests: 8 passed', 'success');
  await sleep(300);
  addLog(stage, '✓ All tests passed', 'success');
  
  stage.status = 'success';
  stage.endTime = Date.now();
  stage.duration = stage.endTime - stage.startTime;
  return true;
}

async function runDockerStage(stage: PipelineStage, version: string): Promise<boolean> {
  stage.status = 'running';
  stage.startTime = Date.now();
  
  addLog(stage, `🐳 Building Docker image: my-app:${version}`);
  await sleep(1000);
  
  addLog(stage, '├─ Step 1/5: FROM node:18-alpine');
  await sleep(400);
  addLog(stage, '├─ Step 2/5: WORKDIR /app');
  await sleep(300);
  addLog(stage, '├─ Step 3/5: COPY package*.json ./');
  await sleep(400);
  addLog(stage, '├─ Step 4/5: RUN npm install');
  await sleep(800);
  addLog(stage, '├─ Step 5/5: COPY . .');
  await sleep(500);
  
  addLog(stage, `✓ Successfully built image: my-app:${version}`, 'success');
  addLog(stage, `✓ Tagged as: my-app:${version}`, 'success');
  
  stage.status = 'success';
  stage.endTime = Date.now();
  stage.duration = stage.endTime - stage.startTime;
  return true;
}

async function runPushStage(stage: PipelineStage, version: string): Promise<boolean> {
  stage.status = 'running';
  stage.startTime = Date.now();
  
  addLog(stage, `📤 Pushing to container registry...`);
  await sleep(800);
  
  addLog(stage, `├─ Pushing my-app:${version}`);
  await sleep(1200);
  addLog(stage, `├─ Layer 1/3: Pushed`);
  await sleep(400);
  addLog(stage, `├─ Layer 2/3: Pushed`);
  await sleep(400);
  addLog(stage, `├─ Layer 3/3: Pushed`);
  await sleep(400);
  
  addLog(stage, `✓ Image pushed successfully`, 'success');
  addLog(stage, `✓ Available at: registry.io/my-app:${version}`, 'success');
  
  stage.status = 'success';
  stage.endTime = Date.now();
  stage.duration = stage.endTime - stage.startTime;
  return true;
}

async function runDeployStage(
  stage: PipelineStage, 
  environment: Environment, 
  version: string,
  strategy: DeploymentStrategy
): Promise<boolean> {
  stage.status = 'running';
  stage.startTime = Date.now();
  
  const strategyNames = {
    rolling: 'Rolling Update',
    'blue-green': 'Blue/Green Deployment',
    canary: 'Canary Deployment',
  };
  
  addLog(stage, `🚀 Deploying to ${environment} using ${strategyNames[strategy]}...`);
  await sleep(1000);
  
  addLog(stage, `├─ Applying Kubernetes manifests...`);
  await sleep(800);
  
  if (strategy === 'rolling') {
    addLog(stage, `├─ Updating deployment: my-app`);
    await sleep(600);
    addLog(stage, `├─ Rolling out new pods: 0/3`);
    await sleep(800);
    addLog(stage, `├─ Rolling out new pods: 1/3`);
    await sleep(800);
    addLog(stage, `├─ Rolling out new pods: 2/3`);
    await sleep(800);
    addLog(stage, `├─ Rolling out new pods: 3/3`);
    await sleep(600);
  } else if (strategy === 'blue-green') {
    addLog(stage, `├─ Creating green environment...`);
    await sleep(1000);
    addLog(stage, `├─ Testing green environment...`);
    await sleep(800);
    addLog(stage, `├─ Switching traffic to green...`);
    await sleep(600);
    addLog(stage, `├─ Destroying blue environment...`);
    await sleep(500);
  } else {
    addLog(stage, `├─ Deploying canary (10% traffic)...`);
    await sleep(1000);
    addLog(stage, `├─ Monitoring canary health...`);
    await sleep(1200);
    addLog(stage, `├─ Canary healthy - scaling to 100%...`);
    await sleep(800);
  }
  
  // Simulate deployment failures (5% chance for prod)
  if (environment === 'production' && Math.random() < 0.05) {
    addLog(stage, '❌ Deployment failed: Health check timeout', 'error');
    addLog(stage, '⚠️ Triggering automatic rollback...', 'warning');
    stage.status = 'failed';
    stage.endTime = Date.now();
    stage.duration = stage.endTime - stage.startTime;
    return false;
  }
  
  addLog(stage, `├─ All pods are ready and healthy`);
  addLog(stage, `✓ Deployment successful - ${version} is live!`, 'success');
  
  stage.status = 'success';
  stage.endTime = Date.now();
  stage.duration = stage.endTime - stage.startTime;
  return true;
}

function failPipeline(run: PipelineRun, message: string, backendId?: string) {
  run.status = 'failed';
  run.endTime = Date.now();
  
  const state = useCICDStore.getState();
  useCICDStore.setState({
    currentRun: { ...run },
    pipelineRuns: state.pipelineRuns.map((r) => (r.id === run.id ? { ...run } : r)),
    isRunning: false,
  });
  
  // Update pipeline status in backend
  if (backendId) {
    apiClient.updatePipeline(backendId, {
      status: 'failed',
      steps: run.stages,
    }).catch(error => {
      console.error('Failed to update pipeline in backend:', error);
    });
  }
  
  toast.error('Pipeline Failed', {
    description: message,
    duration: 5000,
  });
}
