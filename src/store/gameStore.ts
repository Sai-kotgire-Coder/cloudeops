import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { useIAMStore } from './iam/iamStore';
import { evaluatePermission } from './iam/engine';
import { ARN_PREFIX } from './iam/types';
import { useSchedulerStore } from './schedulerStore';
import { useScenarioStore } from './scenarioStore';
import { useAlertStore } from './alertStore';
import { usePaymentStore } from './paymentStore';
import { apiClient } from '@/lib/apiClient';

const STATE_VERSION = '1.0.0';

// Helper to save game state to backend (debounced)
let saveGameStateTimeout: ReturnType<typeof setTimeout> | null = null;
const saveGameStateToBackend = (state: any) => {
  if (saveGameStateTimeout) {
    clearTimeout(saveGameStateTimeout);
  }
  saveGameStateTimeout = setTimeout(async () => {
    try {
      await apiClient.updateGameState({
        isRunning: state.isRunning,
        tick: state.tick,
        score: state.score,
        scoreHistory: state.scoreHistory,
        pendingPods: state.pendingPods,
        scenario: state.scenario,
        totalCost: state.totalCost,
        hasLoadBalancer: state.hasLoadBalancer,
        asg: state.asg,
        hpa: state.hpa,
        vpa: state.vpa,
        traffic: state.traffic,
        targetTraffic: state.targetTraffic,
        cpuAvg: state.cpuAvg,
        errorRate: state.errorRate,
        latencyAvg: state.latencyAvg,
        metricsHistory: state.metricsHistory,
        tutorialStep: state.tutorialStep,
        tutorialComplete: state.tutorialComplete,
        kubectlCommandCount: state.kubectlCommandCount
      });
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }, 500); // Debounce 500ms
};

export const INSTANCE_TYPES = {
  't3.micro':  { id: 't3.micro',  name: 't3.micro',  maxRps: 100,  costPerHour: 0.0104, ramGib: 1,  vcpu: 2, maxPods: 2 },
  't3.small':  { id: 't3.small',  name: 't3.small',  maxRps: 250,  costPerHour: 0.0208, ramGib: 2,  vcpu: 2, maxPods: 5 },
  'm5.large':  { id: 'm5.large',  name: 'm5.large',  maxRps: 1000, costPerHour: 0.0960, ramGib: 8,  vcpu: 2, maxPods: 20 },
  'c5.xlarge': { id: 'c5.xlarge', name: 'c5.xlarge', maxRps: 3000, costPerHour: 0.1700, ramGib: 8,  vcpu: 4, maxPods: 60 },
} as const;

export type InstanceTypeId = keyof typeof INSTANCE_TYPES;

export interface Pod {
  id: string;
  appId: string;
  version: string;
  cpu: number;
  memory: number;
  currentRps: number;
  status: 'running' | 'crashed' | 'terminating';
}

export interface Deployment {
  id: string;
  version: string;
  replicas: number;
}

export interface Application {
  id: string;
  name: string;
  image?: string;
  port?: number;
  envVars?: { key: string; value: string }[];
  strategy?: 'Rolling' | 'Blue/Green';
  requests?: { cpu: string; memory: string };
  healthCheck?: { liveness: boolean; readiness: boolean };
  activeVersion: string;
  deployments: Deployment[];
  assignedInstances: string[]; // IDs of instances assigned to this app
}

export interface Instance {
  id: string;
  name: string;
  typeId: InstanceTypeId;
  status: 'provisioning' | 'running' | 'crashed' | 'stopped' | 'booting';
  cpu: number;
  memory: number;
  currentRps: number;
  provisionTimer: number;
  memoryLeakFactor: number;
  scaledBy?: 'hpa' | 'vpa' | 'asg' | 'manual';
  roleId?: string;
  assignedAppId: string | null; // ID of app this instance is assigned to
  pods: Pod[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  message: string;
  emoji: string;
  timestamp: number;
  dismissed: boolean;
}

export interface ASGConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCpuUp: number;
  targetCpuDown: number;
  instanceType: InstanceTypeId;
}

export interface HPAConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCpuPercent: number;
  scaleUpCooldownTicks: number;
  scaleDownCooldownTicks: number;
  lastScaleTick: number;
}

export interface VPAConfig {
  enabled: boolean;
  mode: 'Off' | 'Initial' | 'Auto';
  minInstanceType: InstanceTypeId;
  maxInstanceType: InstanceTypeId;
}

// Score actions and their point values
export const SCORE_ACTIONS = {
  healthy_tick:           { points: 1,   label: 'Healthy tick (CPU < 70%)',           emoji: '✅' },
  reboot_crashed:         { points: 50,  label: 'Rebooted a crashed server',           emoji: '🔄' },
  scale_out:              { points: 30,  label: 'Scaled out (added instance)',          emoji: '📈' },
  enable_lb:              { points: 40,  label: 'Enabled Load Balancer',               emoji: '⚖️' },
  enable_hpa:             { points: 60,  label: 'Enabled HPA (Horizontal Pod Autoscaler)', emoji: '🤖' },
  enable_vpa:             { points: 40,  label: 'Enabled VPA (Vertical Pod Autoscaler)',   emoji: '📦' },
  asg_scale_out:          { points: 20,  label: 'ASG auto-scaled out',                 emoji: '🚀' },
  survive_spike:          { points: 100, label: 'Survived traffic spike without crash', emoji: '🏆' },
  under_budget:           { points: 10,  label: 'Efficient: low cost, zero errors',    emoji: '💰' },
  crash_penalty:          { points: -30, label: 'Server crashed under load',            emoji: '💥' },
  high_error_penalty:     { points: -5,  label: 'High error rate (>10%)',              emoji: '🔴' },
} as const;

export type ScoreAction = keyof typeof SCORE_ACTIONS;

export interface ScoreEvent {
  action: ScoreAction;
  delta: number;
  timestamp: number;
}

interface GameState {
  isRunning: boolean;
  tick: number;
  score: number;
  scoreHistory: ScoreEvent[];
  pendingPods: { appId: string; version: string; }[];
  applications: Application[];
  scenario: string;
  totalCost: number;

  instances: Instance[];
  hasLoadBalancer: boolean;
  asg: ASGConfig;
  hpa: HPAConfig;
  vpa: VPAConfig;

  traffic: number;
  targetTraffic: number;
  cpuAvg: number;
  errorRate: number;
  latencyAvg: number;
  metricsHistory: { tick: number; rps: number; cpu: number; errors: number; latency: number }[];
  alerts: Alert[];
  tutorialStep: number;
  tutorialComplete: boolean;
  // Only progress signal for kubectl Lab, which has no dedicated workspace
  // model of its own -- see src/lib/kubectlEngine.ts.
  kubectlCommandCount: number;

  advanceTutorial: () => void;
  completeTutorial: () => void;

  toggleSimulation: () => void;
  addInstance: (typeId?: InstanceTypeId, roleId?: string) => Promise<void>;
  removeInstance: (id: string) => Promise<void>;
  restartInstance: (id: string) => void;
  stopInstance: (id: string) => void;
  startInstance: (id: string) => void;
  setTraffic: (val: number) => void;
  setTargetTraffic: (val: number) => void;
  toggleLoadBalancer: () => void;
  updateASG: (config: Partial<ASGConfig>) => void;
  updateHPA: (config: Partial<HPAConfig>) => void;
  updateVPA: (config: Partial<VPAConfig>) => void;
  dismissAlert: (id: string) => void;
  triggerIncident: (type: 'crash' | 'leak' | 'spike') => void;
  changeInstanceType: (id: string, typeId: InstanceTypeId) => void;
  instanceAccessStorage: (id: string, actionName: 'read' | 'write' | 'delete') => void;
  setInstanceRole: (id: string, roleId: string) => void;
  addScore: (action: ScoreAction) => void;
  simulationTick: () => void;
  reconcileDeployments: () => void;
  schedulePendingPods: () => void;

  createApplication: (name: string, config?: Partial<Application>) => Promise<void>;
  createDeployment: (appId: string, version: string, replicas: number) => void;
  scaleDeployment: (appId: string, version: string, replicas: number) => void;
  setActiveVersion: (appId: string, version: string) => void;
  deletePod: (id: string) => void;
  restartPod: (id: string) => void;
  attachInstance: (appId: string, instanceId: string) => void;
  detachInstance: (appId: string, instanceId: string) => void;
  resetSimulation: () => void;
  incrementKubectlCommandCount: () => void;
}

let instanceCounter = 0;

const createInstance = (typeId: InstanceTypeId = 't3.micro', provisionSeconds = 0, label?: number, scaledBy: Instance['scaledBy'] = 'manual'): Instance => {
  instanceCounter++;
  const num = label ?? instanceCounter;
  return {
    id: `inst-${instanceCounter}-${Date.now().toString(36)}`,
    name: `Server ${num}`,
    typeId,
    status: provisionSeconds > 0 ? 'provisioning' : 'running',
    cpu: 5,
    memory: 20,
    currentRps: 0,
    provisionTimer: provisionSeconds,
    memoryLeakFactor: 0,
    scaledBy,
    roleId: 'role-readonly',
    assignedAppId: null, // Not assigned to any app initially
    pods: [], // Start with no pods - will be scheduled when attached to an app
  };
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
  const checkPermission = (action: string, resource: string = '*'): boolean => {
    const { managedPolicies, customPolicies, roles, currentUserRoleId } = useIAMStore.getState();
    const role = roles.find(r => r.id === currentUserRoleId);
    if (!role) return false;
    
    const allAvailable = [...managedPolicies, ...customPolicies];
    const userPolicies = allAvailable.filter(p => role.attachedPolicyIds.includes(p.id));
    
    const result = evaluatePermission(userPolicies, action, resource);
    if (result === 'Deny') {
      toast.error(`Access Denied: ${action} is not allowed by any attached policies.`, {
        description: `Resource: ${resource}`,
        duration: 5000,
      });
      return false;
    }
    return true;
  };

  return {
    isRunning: false,
    tick: 0,
    score: 0,
    scoreHistory: [],
    pendingPods: [],
    applications: [{
      id: 'app-main',
      name: 'Frontend Web App',
      activeVersion: 'v1',
      assignedInstances: [], // No instances assigned by default
      deployments: [
        { id: 'dep-main-v1', version: 'v1', replicas: 1 }
      ]
    }],
    scenario: 'Production Load',
    totalCost: 0,

    instances: [createInstance('t3.micro', 0)],
    hasLoadBalancer: true,
    asg: {
      enabled: true,
      minInstances: 1,
      maxInstances: 5,
      targetCpuUp: 75,
      targetCpuDown: 30,
      instanceType: 't3.micro',
    },
    hpa: {
      enabled: false,
      minReplicas: 1,
      maxReplicas: 6,
      targetCpuPercent: 70,
      scaleUpCooldownTicks: 10,
      scaleDownCooldownTicks: 30,
      lastScaleTick: 0,
    },
    vpa: {
      enabled: false,
      mode: 'Off',
      minInstanceType: 't3.micro',
      maxInstanceType: 'm5.large',
    },

    traffic: 50,
    targetTraffic: 50,
    cpuAvg: 5,
    errorRate: 0,
    latencyAvg: 45,
    metricsHistory: [],
    alerts: [],
    tutorialStep: 0,
    tutorialComplete: false,
    kubectlCommandCount: 0,

    advanceTutorial: () => set(s => ({ tutorialStep: s.tutorialStep + 1 })),
    completeTutorial: () => set({ tutorialComplete: true }),

    toggleSimulation: () => set(s => ({ isRunning: !s.isRunning })),

    addInstance: async (typeId = 't3.micro', roleId = 'role-readonly') => {
      if (!checkPermission('cloudsim:RunInstances')) return;
      
      const maxNum = get().instances.reduce((max, inst) => {
        const match = inst.name.match(/Server (\d+)/);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      
      const newInst = createInstance(typeId, 8, maxNum + 1);
      newInst.roleId = roleId;

      // Try to save to backend first before adding to local store
      try {
        await apiClient.createInstance({
          ...newInst,
          type: newInst.typeId
        });
        
        // Only add to store if backend succeeds
        set(s => ({ instances: [...s.instances, newInst] }));
      } catch (error: any) {
        console.error('Failed to create instance in backend:', error);
        
        // Check if this is an upgrade required error
        if (error.statusCode === 403 && error.data?.isPro === false) {
          // Trigger upgrade modal
          usePaymentStore.getState().openUpgradeModal(
            'instance',
            error.data?.current || 0,
            error.data?.limit || 1,
            error.data?.upgradeUrl || '/pricing',
            false
          );
        }
        // Don't add instance to store on error
      }
    },

    createApplication: async (name, config) => {
      const id = `app-${Date.now()}`;
      const newApp = { 
        id, 
        name, 
        activeVersion: 'v1', 
        deployments: [{ id: `dep-${id}-v1`, version: 'v1', replicas: config?.deployments?.[0]?.replicas || 1 }],
        assignedInstances: [],
        ...config
      };
      
      // Try to save to backend first before adding to local store
      try {
        await apiClient.createApplication(newApp);
        
        // Only add to store if backend succeeds
        set(s => ({
          applications: [...s.applications, newApp]
        }));
      } catch (error: any) {
        console.error('Failed to create application in backend:', error);
        
        // Check if this is an upgrade required error
        if (error.statusCode === 403 && error.data?.isPro === false) {
          // Trigger upgrade modal
          usePaymentStore.getState().openUpgradeModal(
            'application',
            error.data?.current || 0,
            error.data?.limit || 1,
            error.data?.upgradeUrl || '/pricing',
            false
          );
        }
        // Don't add application to store on error
      }
    },
    createDeployment: (appId, version, replicas) => set(s => ({
      applications: s.applications.map(app => 
        app.id === appId ? { ...app, deployments: [...app.deployments, { id: `dep-${appId}-${version}`, version, replicas }] } : app
      )
    })),
    scaleDeployment: (appId, version, replicas) => {
      console.log(`[Deployment Controller] Scaling ${appId}/${version} to ${replicas} replicas`);
      
      set(s => ({
        applications: s.applications.map(app => 
          app.id === appId ? { 
            ...app, 
            deployments: app.deployments.map(d => d.version === version ? { ...d, replicas } : d) 
          } : app
        )
      }));

      // Immediately reconcile after scaling
      setTimeout(() => {
        console.log('[Deployment Controller] Triggering immediate reconciliation after scale');
        get().reconcileDeployments();
      }, 0);
    },
    
    setActiveVersion: (appId, version) => {
      const s = get();
      const app = s.applications.find(a => a.id === appId);
      
      if (!app) {
        toast.error('Application not found');
        return;
      }

      const targetDeployment = app.deployments.find(d => d.version === version);
      
      if (!targetDeployment) {
        toast.error('Deployment version not found');
        return;
      }

      // Check if target deployment has any desired replicas
      if (targetDeployment.replicas === 0) {
        toast.error('Cannot switch traffic to deployment with 0 replicas', {
          description: 'Scale up the deployment before switching traffic.',
          duration: 5000,
        });
        return;
      }

      // Count running pods for target deployment
      let runningPods = 0;
      s.instances.forEach(inst => {
        inst.pods.forEach(p => {
          if (p.appId === appId && p.version === version && p.status === 'running') {
            runningPods++;
          }
        });
      });

      // Check if target deployment has running pods
      if (runningPods === 0) {
        toast.error('No running pods in target deployment', {
          description: `Deployment ${version} has no running pods yet. Wait for pods to be scheduled and become ready before switching traffic.`,
          duration: 6000,
        });
        return;
      }

      // Count pending pods
      const pendingPods = s.pendingPods.filter(p => p.appId === appId && p.version === version).length;

      // Warn if rollout is still in progress
      if (pendingPods > 0 || runningPods < targetDeployment.replicas) {
        toast.warning('Deployment rollout in progress', {
          description: `${runningPods}/${targetDeployment.replicas} pods running. Traffic will switch, but some pods are still starting.`,
          duration: 5000,
        });
      }

      // Switch traffic
      set(s => ({
        applications: s.applications.map(app2 => 
          app2.id === appId ? { ...app2, activeVersion: version } : app2
        )
      }));

      toast.success(`Traffic switched to ${version}`, {
        description: `${runningPods} pods now receiving requests`,
        duration: 3000,
      });

      useSchedulerStore.getState().addEvent(
        'traffic_switched', 
        `Traffic switched to ${app.name}/${version}`, 
        `${runningPods} running pods ready`
      );
    },
    deletePod: (id) => set(s => ({
      instances: s.instances.map(inst => ({
        ...inst,
        pods: inst.pods.filter(p => p.id !== id)
      }))
    })),
    restartPod: (id) => set(s => ({
      instances: s.instances.map(inst => ({
        ...inst,
        pods: inst.pods.map(p => p.id === id ? { ...p, status: 'running', currentRps: 0, cpu: 0, memory: 0 } : p)
      }))
    })),

    attachInstance: (appId, instanceId) => {
      console.log(`[Instance Binding] Attaching instance ${instanceId} to app ${appId}`);
      
      set(s => {
        const app = s.applications.find(a => a.id === appId);
        const instance = s.instances.find(i => i.id === instanceId);
        
        if (!app || !instance) {
          console.error(`[Instance Binding] App or instance not found`);
          return s;
        }

        // Check if already assigned
        if (instance.assignedAppId === appId) {
          console.log(`[Instance Binding] Instance already assigned to this app`);
          return s;
        }

        // Detach from previous app if assigned
        const newApplications = s.applications.map(a => {
          if (a.assignedInstances.includes(instanceId)) {
            return {
              ...a,
              assignedInstances: a.assignedInstances.filter(id => id !== instanceId)
            };
          }
          return a;
        });

        // Attach to new app
        const updatedApplications = newApplications.map(a =>
          a.id === appId
            ? { ...a, assignedInstances: [...a.assignedInstances, instanceId] }
            : a
        );

        const updatedInstances = s.instances.map(i =>
          i.id === instanceId
            ? { ...i, assignedAppId: appId, pods: [] } // Clear pods when reassigning
            : i
        );

        useSchedulerStore.getState().addEvent(
          'instance_attached',
          `${instance.name} attached to ${app.name}`,
          `Instance is now dedicated to this application`
        );

        console.log(`[Instance Binding] ✓ ${instance.name} attached to ${app.name}`);

        // Trigger reconciliation to schedule pending pods to newly attached instance
        setTimeout(() => {
          const state = useGameStore.getState();
          const appPendingPods = state.pendingPods.filter(p => p.appId === appId);
          if (appPendingPods.length > 0) {
            console.log(`[Instance Binding] Triggering scheduler for ${appPendingPods.length} pending pod(s)`);
            useGameStore.getState().schedulePendingPods();
          }
        }, 100);

        return {
          applications: updatedApplications,
          instances: updatedInstances
        };
      });
    },

    detachInstance: (appId, instanceId) => {
      console.log(`[Instance Binding] Detaching instance ${instanceId} from app ${appId}`);
      
      set(s => {
        const app = s.applications.find(a => a.id === appId);
        const instance = s.instances.find(i => i.id === instanceId);
        
        if (!app || !instance) {
          console.error(`[Instance Binding] App or instance not found`);
          return s;
        }

        const updatedApplications = s.applications.map(a =>
          a.id === appId
            ? { ...a, assignedInstances: a.assignedInstances.filter(id => id !== instanceId) }
            : a
        );

        const updatedInstances = s.instances.map(i =>
          i.id === instanceId
            ? { ...i, assignedAppId: null, pods: [] } // Clear pods when detaching
            : i
        );

        useSchedulerStore.getState().addEvent(
          'instance_detached',
          `${instance.name} detached from ${app.name}`,
          `${instance.pods.length} pod(s) removed`
        );

        console.log(`[Instance Binding] ✓ ${instance.name} detached from ${app.name}`);

        return {
          applications: updatedApplications,
          instances: updatedInstances
        };
      });
    },

    removeInstance: async (id) => {
      if (!checkPermission('cloudsim:TerminateInstances', `${ARN_PREFIX}:instance/${id}`)) return;
      set(s => ({
        instances: s.instances.filter(i => i.id !== id),
      }));
      
      // Delete from backend
      try {
        await apiClient.deleteInstance(id);
      } catch (error) {
        console.error('Failed to delete instance from backend:', error);
      }
    },

    restartInstance: (id) => {
      if (!checkPermission('cloudsim:RebootInstances', `${ARN_PREFIX}:instance/${id}`)) return;
      set(s => {
        const event: ScoreEvent = { action: 'reboot_crashed', delta: SCORE_ACTIONS.reboot_crashed.points, timestamp: Date.now() };
        return {
          instances: s.instances.map(i => i.id === id
            ? { ...i, status: 'booting' as const, provisionTimer: 4, cpu: 5, memory: 20, memoryLeakFactor: 0 }
            : i
          ),
          score: s.score + event.delta,
          scoreHistory: [...s.scoreHistory.slice(-50), event],
        };
      });
      toast.success('Instance restarting', { description: 'Will be ready in a few seconds' });
    },

    stopInstance: (id) => {
      if (!checkPermission('cloudsim:StopInstances', `${ARN_PREFIX}:instance/${id}`)) return;
      set(s => ({
        instances: s.instances.map(i => i.id === id
          ? { ...i, status: 'stopped' as const, cpu: 0, memory: 0, currentRps: 0, pods: [] }
          : i
        ),
      }));
      toast.info('Instance stopped', { description: 'All pods terminated' });
      useSchedulerStore.getState().addEvent('instance_stopped', `Instance ${id} stopped`, 'Manual stop');
    },

    startInstance: (id) => {
      if (!checkPermission('cloudsim:StartInstances', `${ARN_PREFIX}:instance/${id}`)) return;
      set(s => ({
        instances: s.instances.map(i => i.id === id
          ? { ...i, status: 'booting' as const, provisionTimer: 5 }
          : i
        ),
      }));
      toast.success('Instance starting', { description: 'Will be ready in ~5 seconds' });
      useSchedulerStore.getState().addEvent('instance_started', `Instance ${id} starting`, 'Manual start');
    },

    setTraffic: (val) => set({ traffic: val, targetTraffic: val }),
    setTargetTraffic: (val) => set({ targetTraffic: val }),

    toggleLoadBalancer: () => {
      const s = get();
      const action = s.hasLoadBalancer ? 'cloudsim:DeleteLoadBalancer' : 'cloudsim:CreateLoadBalancer';
      if (!checkPermission(action)) return;
      
      set(s => {
        const enabling = !s.hasLoadBalancer;
        if (enabling) {
          const event: ScoreEvent = { action: 'enable_lb', delta: SCORE_ACTIONS.enable_lb.points, timestamp: Date.now() };
          return {
            hasLoadBalancer: true,
            score: s.score + event.delta,
            scoreHistory: [...s.scoreHistory.slice(-50), event],
            alerts: ([...s.alerts, { id: `alert-lb-${Date.now()}`, type: 'success' as const, message: 'Load Balancer enabled! Traffic will be distributed evenly.', emoji: '⚖️', timestamp: Date.now(), dismissed: false }]).slice(-20),
          };
        }
        return { hasLoadBalancer: false };
      });
    },

    updateASG: (config) => {
      if (!checkPermission('cloudsim:UpdateASG')) return;
      set(s => {
        const wasEnabled = s.asg.enabled;
        const newAsg = { ...s.asg, ...config };
        if (!wasEnabled && newAsg.enabled) {
          // Reward for enabling ASG
        }
        
        // Save to backend (debounced)
        saveGameStateToBackend({ ...s, asg: newAsg });
        
        return { asg: newAsg };
      });
    },

    updateHPA: (config) => {
      if (!checkPermission('cloudsim:UpdateHPA')) return;
      set(s => {
        const wasEnabled = s.hpa.enabled;
        const newHpa = { ...s.hpa, ...config };
        if (!wasEnabled && newHpa.enabled) {
          const event: ScoreEvent = { action: 'enable_hpa', delta: SCORE_ACTIONS.enable_hpa.points, timestamp: Date.now() };
          
          // Save to backend (debounced)
          const newState = {
            ...s,
            hpa: newHpa,
            score: s.score + event.delta,
            scoreHistory: [...s.scoreHistory.slice(-50), event],
            alerts: ([...s.alerts, { id: `alert-hpa-${Date.now()}`, type: 'success' as const, message: 'Horizontal Pod Autoscaler enabled!', emoji: '🤖', timestamp: Date.now(), dismissed: false }]).slice(-20)
          };
          saveGameStateToBackend(newState);
          
          return {
            hpa: newHpa,
            score: s.score + event.delta,
            scoreHistory: [...s.scoreHistory.slice(-50), event],
            alerts: ([...s.alerts, { id: `alert-hpa-${Date.now()}`, type: 'success' as const, message: 'HPA enabled! Kubernetes will auto-scale pods based on CPU.', emoji: '🤖', timestamp: Date.now(), dismissed: false }]).slice(-20),
          };
        }
        return { hpa: newHpa };
      });
    },

    updateVPA: (config) => {
      if (!checkPermission('cloudsim:UpdateVPA')) return;
      set(s => {
        const wasEnabled = s.vpa.enabled;
        const newVpa = { ...s.vpa, ...config };
        if (!wasEnabled && newVpa.enabled) {
          const event: ScoreEvent = { action: 'enable_vpa', delta: SCORE_ACTIONS.enable_vpa.points, timestamp: Date.now() };
          return {
            vpa: newVpa,
            score: s.score + event.delta,
            scoreHistory: [...s.scoreHistory.slice(-50), event],
            alerts: ([...s.alerts, { id: `alert-vpa-${Date.now()}`, type: 'success' as const, message: 'VPA enabled! Instance types will be upgraded automatically under load.', emoji: '📦', timestamp: Date.now(), dismissed: false }]).slice(-20),
          };
        }
        return { vpa: newVpa };
      });
    },

    dismissAlert: (id) => set(s => ({
      alerts: s.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a),
    })),

    changeInstanceType: (id, typeId) => {
      if (!checkPermission('cloudsim:ModifyInstanceAttribute', `${ARN_PREFIX}:instance/${id}`)) return;
      set(s => ({
        instances: s.instances.map(i => i.id === id
          ? { ...i, typeId, status: 'provisioning', provisionTimer: 5, cpu: 5, memory: 20 }
          : i
        ),
      }));
    },

    setInstanceRole: (id, roleId) => {
      if (!checkPermission('cloudsim:ModifyInstanceAttribute', `${ARN_PREFIX}:instance/${id}`)) return;
      set(s => ({
        instances: s.instances.map(i => i.id === id ? { ...i, roleId } : i)
      }));
    },

    instanceAccessStorage: (id, actionName) => {
      const s = get();
      const instance = s.instances.find(i => i.id === id);
      if (!instance) return;

      const iamAction = actionName === 'write' ? 's3:WriteObject' : actionName === 'delete' ? 's3:DeleteObject' : 's3:ReadObject';

      const { managedPolicies, customPolicies, roles } = useIAMStore.getState();
      const role = roles.find(r => r.id === instance.roleId);
      
      let allowed = false;
      if (role) {
        const allAvailable = [...managedPolicies, ...customPolicies];
        const rolePolicies = allAvailable.filter(p => role.attachedPolicyIds.includes(p.id));
        allowed = evaluatePermission(rolePolicies, iamAction, '*') !== 'Deny';
      }

      if (!allowed) {
        toast.error(`Instance Access Denied: ${instance.name} lacks permission for ${iamAction}.`, {
          description: `Hint: Ensure the instance role '${role?.name || 'None'}' has the required policies attached.`,
          duration: 6000,
        });
        set(state => ({
          alerts: [...state.alerts, { id: `alert-iam-${Date.now()}`, type: 'warning' as const, message: `IAM Deny: ${instance.name} failed to ${actionName} storage.`, emoji: '🔒', timestamp: Date.now(), dismissed: false }].slice(-20)
        }));
      } else {
        toast.success(`Success: ${instance.name} performed storage ${actionName}.`, {
          description: `Role '${role?.name}' authorized the action.`,
        });
        get().addScore('healthy_tick');
      }
    },

    addScore: (action) => set(s => {
      const delta = SCORE_ACTIONS[action].points;
      const event: ScoreEvent = { action, delta, timestamp: Date.now() };
      return {
        score: Math.max(0, s.score + delta),
        scoreHistory: [...s.scoreHistory.slice(-50), event],
      };
    }),

    // ============================================================================
    // DEPLOYMENT RECONCILIATION - Ensures desired state matches actual state
    // ============================================================================
    reconcileDeployments: () => {
      const s = get();
      console.log('[Deployment Controller] Starting reconciliation cycle');
      
      let newPendingPods = [...s.pendingPods];
      let newInstances = [...s.instances];
      const newApplications = [...s.applications];

      // For each application and deployment, reconcile desired vs actual state
      newApplications.forEach(app => {
        app.deployments.forEach(dep => {
          // Count current pods (pending + running + crashed)
          let currentPodCount = newPendingPods.filter(
            p => p.appId === app.id && p.version === dep.version
          ).length;
          
          newInstances.forEach(inst => {
            inst.pods.forEach(p => {
              if (p.appId === app.id && p.version === dep.version && p.status !== 'crashed') {
                currentPodCount++;
              }
            });
          });

          const desiredReplicas = dep.replicas;
          const deficit = desiredReplicas - currentPodCount;

          console.log(`[Deployment Controller] ${app.name}/${dep.version}: desired=${desiredReplicas}, current=${currentPodCount}, deficit=${deficit}`);

          // Need to create pods
          if (deficit > 0) {
            console.log(`[Deployment Controller] Creating ${deficit} pod(s) for ${app.name}/${dep.version}`);
            for (let i = 0; i < deficit; i++) {
              newPendingPods.push({ appId: app.id, version: dep.version });
              console.log(`[Deployment Controller] ✓ Created pending pod ${i + 1}/${deficit} for ${app.name}/${dep.version}`);
            }
            useSchedulerStore.getState().addEvent(
              'pod_pending',
              `Created ${deficit} pending pod(s) for ${app.name}/${dep.version}`,
              `Deployment desires ${desiredReplicas} replicas, had ${currentPodCount}`
            );
          }
          // Need to remove pods
          else if (deficit < 0) {
            let toRemove = -deficit;
            console.log(`[Deployment Controller] Removing ${toRemove} pod(s) from ${app.name}/${dep.version}`);
            
            // First remove pending pods
            while (toRemove > 0) {
              const pIdx = newPendingPods.findIndex(
                p => p.appId === app.id && p.version === dep.version
              );
              if (pIdx >= 0) {
                newPendingPods.splice(pIdx, 1);
                toRemove--;
                console.log(`[Deployment Controller] ✓ Removed pending pod (${toRemove} remaining)`);
              } else {
                break;
              }
            }

            // Then remove running pods if needed
            if (toRemove > 0) {
              newInstances.forEach(inst => {
                while (toRemove > 0) {
                  const pIdx = inst.pods.findIndex(
                    p => p.appId === app.id && p.version === dep.version && p.status === 'running'
                  );
                  if (pIdx >= 0) {
                    const removedPod = inst.pods[pIdx];
                    inst.pods.splice(pIdx, 1);
                    toRemove--;
                    console.log(`[Deployment Controller] ✓ Removed running pod ${removedPod.id} from ${inst.name}`);
                  } else {
                    break;
                  }
                }
              });
            }
          } else {
            console.log(`[Deployment Controller] ${app.name}/${dep.version} is in sync (${currentPodCount} pods)`);
          }
        });
      });

      // Update state with reconciled pods
      set({ pendingPods: newPendingPods, instances: newInstances });
      
      // If there are pending pods, try to schedule them immediately
      if (newPendingPods.length > 0) {
        console.log(`[Scheduler] ${newPendingPods.length} pending pods need scheduling`);
        setTimeout(() => get().schedulePendingPods(), 10);
      }
    },

    // ============================================================================
    // POD SCHEDULER - Assigns pending pods to available instances
    // ============================================================================
    schedulePendingPods: () => {
      const s = get();
      let newPendingPods = [...s.pendingPods];
      let newInstances = [...s.instances];
      
      if (newPendingPods.length === 0) {
        console.log('[Scheduler] No pending pods to schedule');
        return;
      }

      console.log(`[Scheduler] Attempting to schedule ${newPendingPods.length} pending pod(s)`);
      
      let scheduledCount = 0;
      const timestamp = Date.now();

      // Try to schedule each pending pod
      for (let i = 0; i < newPendingPods.length; i++) {
        const pendingPod = newPendingPods[i];
        let scheduled = false;

        // Find an available instance assigned to this app
        for (const inst of newInstances) {
          // CRITICAL: Only schedule to instances assigned to this app
          if (inst.status === 'running' && inst.assignedAppId === pendingPod.appId) {
            const maxPods = INSTANCE_TYPES[inst.typeId].maxPods;
            const currentPods = inst.pods.length;

            if (currentPods < maxPods) {
              // Schedule pod to this instance
              const podId = `pod-${timestamp}-${Math.random().toString(36).substr(2, 6)}`;
              inst.pods.push({
                id: podId,
                appId: pendingPod.appId,
                version: pendingPod.version,
                cpu: 0,
                memory: 20,
                currentRps: 0,
                status: 'running',
              });

              console.log(`[Scheduler] ✓ Scheduled pod ${podId} to ${inst.name} (${currentPods + 1}/${maxPods} capacity)`);
              
              useSchedulerStore.getState().addEvent(
                'pod_scheduled',
                `Pod ${podId} → ${inst.name}`,
                `App: ${pendingPod.appId}/${pendingPod.version}`
              );

              scheduled = true;
              scheduledCount++;
              break;
            } else {
              console.log(`[Scheduler] Instance ${inst.name} at capacity (${currentPods}/${maxPods})`);
            }
          }
        }

        if (!scheduled) {
          console.log(`[Scheduler] ⚠ No capacity available for pod (appId: ${pendingPod.appId}, version: ${pendingPod.version})`);
        }
      }

      // Remove scheduled pods from pending list
      newPendingPods = newPendingPods.slice(scheduledCount);

      console.log(`[Scheduler] Scheduled ${scheduledCount} pods, ${newPendingPods.length} remaining pending`);

      if (newPendingPods.length > 0) {
        const s = get();
        const nonCrashedInstances = s.instances.filter(i => i.status !== 'crashed').length;
        const provisioningInstances = s.instances.filter(i => i.status === 'provisioning').length;
        
        if (s.asg.enabled && nonCrashedInstances < s.asg.maxInstances) {
          console.log(`[Scheduler] ⚠ No capacity - ${newPendingPods.length} pod(s) pending. Cluster Autoscaler will provision new instance soon.`);
          if (provisioningInstances > 0) {
            console.log(`[Scheduler] ${provisioningInstances} instance(s) currently provisioning...`);
          }
        } else {
          console.log(`[Scheduler] ⚠ No capacity and autoscaler at max (${s.asg.maxInstances} instances). ${newPendingPods.length} pod(s) will remain pending.`);
        }
        
        useSchedulerStore.getState().addEvent(
          'scheduler_blocked',
          `${newPendingPods.length} pod(s) waiting for capacity`,
          provisioningInstances > 0 
            ? `${provisioningInstances} instance(s) provisioning` 
            : 'Cluster Autoscaler will add capacity if enabled'
        );
      }

      // Update state
      set({ pendingPods: newPendingPods, instances: newInstances });
    },

    triggerIncident: (type) => set(s => {
      const running = s.instances.filter(i => i.status === 'running');
      if (running.length === 0) return s;

      let newInstances = [...s.instances];
      const target = running[Math.floor(Math.random() * running.length)];
      const newAlerts = [...s.alerts];

      if (type === 'crash') {
        newInstances = newInstances.map(i => i.id === target.id ? { ...i, status: 'crashed' } : i);
        newAlerts.push({ id: `alert-inc-${Date.now()}`, type: 'critical', message: `Kernel Panic: ${target.name} spontaneously crashed!`, emoji: '💥', timestamp: Date.now(), dismissed: false });
      } else if (type === 'leak') {
        newInstances = newInstances.map(i => i.id === target.id ? { ...i, memoryLeakFactor: 2.5 } : i);
        newAlerts.push({ id: `alert-inc-${Date.now()}`, type: 'warning', message: `Memory Leak Detected on ${target.name}. Watch the memory grow!`, emoji: '🧠', timestamp: Date.now(), dismissed: false });
      } else if (type === 'spike') {
        newAlerts.push({ id: `alert-inc-${Date.now()}`, type: 'warning', message: `Sudden Virality! Incoming traffic spike +3000 RPS.`, emoji: '🔥', timestamp: Date.now(), dismissed: false });
        return { targetTraffic: Math.min(5000, s.traffic + 3000), alerts: newAlerts.slice(-20) };
      }
      return { instances: newInstances, alerts: newAlerts.slice(-20) };
    }),

    simulationTick: () => {
      const s = get();
      if (!s.isRunning) return;

      let newTraffic = s.traffic;
      if (s.traffic < s.targetTraffic) newTraffic = Math.min(s.targetTraffic, s.traffic + Math.max(10, (s.targetTraffic - s.traffic) * 0.1));
      else if (s.traffic > s.targetTraffic) newTraffic = Math.max(s.targetTraffic, s.traffic - Math.max(10, (s.traffic - s.targetTraffic) * 0.1));

      let newInstances = [...s.instances];
      const newAlerts = [...s.alerts];
      let scoreBonus = 0;
      const newScoreHistory = [...s.scoreHistory];

      // Cost per tick
      let tickCost = 0;
      newInstances.forEach(inst => {
        tickCost += INSTANCE_TYPES[inst.typeId].costPerHour / 3600;
      });

      // Distribute Traffic across active Pods that belong to active deployments
      const appVersionMap = new Map(s.applications.map(app => [app.id, app.activeVersion]));

      const runningInstances = newInstances.filter(i => i.status === 'running');
      let activePods: { instId: string; podIdx: number; pod: Pod; }[] = [];
      runningInstances.forEach(inst => {
        inst.pods.forEach((p, podIdx) => {
          if (p.status === 'running' && p.version === appVersionMap.get(p.appId)) {
            activePods.push({ instId: inst.id, podIdx, pod: p });
          }
        });
      });

      if (s.hasLoadBalancer && activePods.length > 0) {
        const rpsPerPod = newTraffic / activePods.length;
        activePods.forEach(p => p.pod.currentRps = rpsPerPod);
      } else if (!s.hasLoadBalancer && activePods.length > 0) {
        activePods.forEach(p => p.pod.currentRps = 0);
        const unlucky = activePods[0];
        unlucky.pod.currentRps = newTraffic * 0.95;
        activePods.forEach(p => {
          if (p !== unlucky) p.pod.currentRps = (newTraffic * 0.05) / Math.max(1, activePods.length - 1);
        });
      }

      let totalErrors = 0;
      let totalCpu = 0;
      let totalLatency = 0;
      const POD_MAX_RPS = 50;

      newInstances = newInstances.map(inst => {
        if (inst.status === 'crashed' || inst.status === 'stopped') return inst;

        if (inst.status === 'provisioning' || inst.status === 'booting') {
          const timer = inst.provisionTimer - 1;
          if (timer <= 0) {
            console.log(`[Cluster Autoscaler] ${inst.name} ${inst.status} complete, status: running`);
            // Trigger scheduler to assign pending pods to newly available instance
            setTimeout(() => {
              const pendingCount = useGameStore.getState().pendingPods.length;
              if (pendingCount > 0) {
                console.log(`[Cluster Autoscaler] New node ready, triggering scheduler for ${pendingCount} pending pod(s)`);
                useGameStore.getState().schedulePendingPods();
              }
            }, 100);
            return { ...inst, status: 'running', provisionTimer: 0 };
          }
          return { ...inst, provisionTimer: timer };
        }

        const spec = INSTANCE_TYPES[inst.typeId];
        let instMem = 5; let instCpu = 1;
        let crashed = false;

        const newPods = inst.pods.map(p => {
          if (p.status === 'crashed' || p.status === 'terminating') return p;
          const loadRatio = p.currentRps / POD_MAX_RPS;

          let mem = p.memory;
          if (inst.memoryLeakFactor > 0) mem = Math.min(100, mem + inst.memoryLeakFactor);
          else mem = Math.max(20, Math.min(95, loadRatio * 70 + 20));

          let cpu = Math.min(100, Math.max(2, loadRatio * 90 + (Math.random() * 5)));
          totalCpu += cpu;

          if (loadRatio > 1) totalErrors += (loadRatio - 1) * POD_MAX_RPS;
          const latency = loadRatio < 0.8 ? 45 + (Math.random() * 10) : 45 + (loadRatio * 200);
          totalLatency += latency;

          let podCrashed = false;
          if (mem >= 100 || cpu >= 100) podCrashed = Math.random() < (cpu >= 100 ? 0.05 : 0.01);
          
          if (podCrashed) return { ...p, status: 'crashed' as const, cpu: 0, currentRps: 0 };
          return { ...p, cpu, memory: mem };
        });

        const alivePods = newPods.filter(p => p.status === 'running');
        if (alivePods.length > 0) {
          instCpu = newPods.reduce((a, b) => a + b.cpu, 0) / spec.maxPods;
          instMem = newPods.reduce((a, b) => a + b.memory, 0) / spec.maxPods;
        }
        
        if (instCpu >= 100) crashed = Math.random() < 0.02;

        if (crashed) {
          newAlerts.push({ id: `alert-${Date.now()}-${inst.id}`, type: 'critical', message: `CPU Exhaustion: ${inst.name} overloaded and crashed!`, emoji: '💥', timestamp: Date.now(), dismissed: false });
          scoreBonus -= SCORE_ACTIONS.crash_penalty.points * -1;
          newScoreHistory.push({ action: 'crash_penalty', delta: SCORE_ACTIONS.crash_penalty.points, timestamp: Date.now() });
          return { ...inst, status: 'crashed', cpu: 0, currentRps: 0, pods: newPods.map(p => ({...p, status: 'crashed' as const})) };
        }

        return { ...inst, cpu: instCpu, memory: instMem, pods: newPods };
      });

      const activeNowPods = [];
      newInstances.forEach(inst => {
        if (inst.status === 'running') {
          inst.pods.forEach(p => { if (p.status === 'running') activeNowPods.push(p); });
        }
      });

      const cpuAvg = activeNowPods.length > 0 ? totalCpu / activeNowPods.length : 100;
      const latencyAvg = activeNowPods.length > 0 ? totalLatency / activeNowPods.length : 0;
      const errorRate = newTraffic > 0 ? Math.min(100, (totalErrors / newTraffic) * 100) : 0;

      if (activeNowPods.length > 0 && cpuAvg < 70 && errorRate < 1) {
        scoreBonus += SCORE_ACTIONS.healthy_tick.points;
        newScoreHistory.push({ action: 'healthy_tick', delta: 1, timestamp: Date.now() });
      }
      if (errorRate > 10) {
        scoreBonus += SCORE_ACTIONS.high_error_penalty.points;
        newScoreHistory.push({ action: 'high_error_penalty', delta: SCORE_ACTIONS.high_error_penalty.points, timestamp: Date.now() });
      }

      let newPendingPods = [...s.pendingPods];
      let newApplications = [...s.applications];

      // --- HPA Logic ---
      if (s.hpa.enabled && newApplications.length > 0) {
        const defaultApp = newApplications[0];
        const activeDepIdx = defaultApp.deployments.findIndex(d => d.version === defaultApp.activeVersion);
        
        if (activeDepIdx >= 0) {
          const activeDep = defaultApp.deployments[activeDepIdx];
          const cooldownOk = (s.tick - s.hpa.lastScaleTick) >= Math.min(s.hpa.scaleUpCooldownTicks, s.hpa.scaleDownCooldownTicks);
          const currentTotalPods = activeDep.replicas;
          if (cooldownOk && cpuAvg > s.hpa.targetCpuPercent && currentTotalPods < s.hpa.maxReplicas) {
             newApplications[0].deployments[activeDepIdx] = { ...activeDep, replicas: currentTotalPods + 1 };
             set(s2 => ({ hpa: { ...s2.hpa, lastScaleTick: s2.tick } }));
             newAlerts.push({ id: `alert-hpa-${s.tick}`, type: 'info', message: `HPA: CPU ${cpuAvg.toFixed(0)}% > ${s.hpa.targetCpuPercent}% — scaling out a pod replica`, emoji: '🤖', timestamp: Date.now(), dismissed: false });
             scoreBonus += SCORE_ACTIONS.asg_scale_out.points;
             newScoreHistory.push({ action: 'asg_scale_out', delta: SCORE_ACTIONS.asg_scale_out.points, timestamp: Date.now() });
             useSchedulerStore.getState().addEvent('hpa_trigger', `HPA scaled ${defaultApp.name}/${activeDep.version} from ${currentTotalPods} → ${currentTotalPods + 1} replicas`, `CPU ${cpuAvg.toFixed(0)}% exceeded target ${s.hpa.targetCpuPercent}%`);
          } else if (cooldownOk && cpuAvg < s.hpa.targetCpuPercent * 0.5 && currentTotalPods > s.hpa.minReplicas) {
             newApplications[0].deployments[activeDepIdx] = { ...activeDep, replicas: currentTotalPods - 1 };
             set(s2 => ({ hpa: { ...s2.hpa, lastScaleTick: s2.tick } }));
             newAlerts.push({ id: `alert-hpa-down-${s.tick}`, type: 'info', message: `HPA: CPU healthy — scaled in 1 pod`, emoji: '📉', timestamp: Date.now(), dismissed: false });
          }
        }
      }

      // --- Kubernetes Deployment Controller ---
      newApplications.forEach(app => {
        app.deployments.forEach(dep => {
          let currentCount = newPendingPods.filter(p => p.appId === app.id && p.version === dep.version).length;
          newInstances.forEach(inst => {
            inst.pods.forEach(p => {
              if (p.appId === app.id && p.version === dep.version && p.status !== 'crashed') currentCount++;
            });
          });
          
          if (currentCount < dep.replicas) {
            for (let i = 0; i < dep.replicas - currentCount; i++) {
               newPendingPods.push({ appId: app.id, version: dep.version });
               useSchedulerStore.getState().addEvent('pod_pending', `Pod pending for ${app.name}/${dep.version}`, `Deployment desires ${dep.replicas} replicas, current: ${currentCount}`);
            }
          } else if (currentCount > dep.replicas) {
            let toRemove = currentCount - dep.replicas;
            while (toRemove > 0) {
              const pIdx = newPendingPods.findIndex(p => p.appId === app.id && p.version === dep.version);
              if (pIdx >= 0) { newPendingPods.splice(pIdx, 1); toRemove--; } else break;
            }
            if (toRemove > 0) {
              newInstances.forEach(inst => {
                while (toRemove > 0) {
                  const pIdx = inst.pods.findIndex(p => p.appId === app.id && p.version === dep.version && p.status === 'running');
                  if (pIdx >= 0) { inst.pods.splice(pIdx, 1); toRemove--; } else break;
                }
              });
            }
          }
        });
      });

      // --- Pod Scheduler Logic ---
      if (newPendingPods.length > 0) {
        let scheduledCount = 0;
        newInstances.forEach(inst => {
          if (inst.status === 'running' && scheduledCount < newPendingPods.length) {
            const max = INSTANCE_TYPES[inst.typeId].maxPods;
            if (inst.pods.length < max) {
              const p = newPendingPods[scheduledCount];
              const podId = `pod-${s.tick}-${Math.random().toString(36).substr(2, 5)}`;
              inst.pods.push({ id: podId, appId: p.appId, version: p.version, cpu: 0, memory: 0, currentRps: 0, status: 'running' });
              useSchedulerStore.getState().addEvent('pod_scheduled', `${podId} → ${inst.name}`, `App: ${p.appId} v${p.version}`);
              scheduledCount++;
            }
          }
        });
        newPendingPods = newPendingPods.slice(scheduledCount);
      }

      // --- Cluster Autoscaler Logic ---
      if (s.asg.enabled) {
        const nonCrashed = newInstances.filter(i => i.status !== 'crashed');
        if (newPendingPods.length > 0 && nonCrashed.length < s.asg.maxInstances && s.tick % 5 === 0) {
          // Determine which app needs capacity (first one with pending pods)
          const pendingPod = newPendingPods[0];
          const targetApp = newApplications.find(a => a.id === pendingPod.appId);
          
          const maxNum = newInstances.reduce((max, inst) => {
             const match = inst.name.match(/Server (\d+)/);
             return match ? Math.max(max, Number(match[1])) : max;
          }, 0);
          // Random 2-5 second provisioning delay to simulate real-world behavior
          const provisionDelay = Math.floor(Math.random() * 4) + 2; // 2-5 seconds
          const newInstance = createInstance(s.asg.instanceType, provisionDelay, maxNum + 1, 'asg');
          
          // Auto-assign to the app that needs capacity
          if (targetApp) {
            newInstance.assignedAppId = targetApp.id;
            targetApp.assignedInstances.push(newInstance.id);
            console.log(`[Cluster Autoscaler] Auto-assigning ${newInstance.name} to ${targetApp.name}`);
          }
          
          newInstances.push(newInstance);
          const newNodeName = `Server ${maxNum + 1}`;
          console.log(`[Cluster Autoscaler] Triggering scale-out: ${newPendingPods.length} pod(s) pending, adding ${newNodeName} (${provisionDelay}s provision time)`);
          newAlerts.push({ id: `alert-asg-up-${s.tick}`, type: 'info', message: `Cluster Autoscaler: Pending Pods detected. Provisioning Node ${s.asg.instanceType}`, emoji: '📈', timestamp: Date.now(), dismissed: false });
          useSchedulerStore.getState().addEvent('instance_added', `Cluster Autoscaler added ${newNodeName} (${s.asg.instanceType})`, `${newPendingPods.length} pods pending, cluster needed new Node`);
          scoreBonus += SCORE_ACTIONS.asg_scale_out.points;
          newScoreHistory.push({ action: 'asg_scale_out', delta: SCORE_ACTIONS.asg_scale_out.points, timestamp: Date.now() });
        } else if (newPendingPods.length === 0 && nonCrashed.length > s.asg.minInstances && s.tick % 5 === 0) {
           const sumNodeCpu = nonCrashed.reduce((sum, inst) => sum + inst.cpu, 0);
           const avgNodeCpu = nonCrashed.length > 0 ? sumNodeCpu / nonCrashed.length : 0;
           if (avgNodeCpu < s.asg.targetCpuDown) {
              const running = nonCrashed.filter(i => i.status === 'running');
              if (running.length > s.asg.minInstances) {
                const removed = running[running.length - 1];
                newInstances = newInstances.filter(i => i.id !== removed.id);
                newAlerts.push({ id: `alert-asg-down-${s.tick}`, type: 'info', message: `Cluster Autoscaler: Node underutilized. Terminated ${removed.name}`, emoji: '📉', timestamp: Date.now(), dismissed: false });
              }
           }
        }
      }

      // --- VPA Logic (Vertical Pod Autoscaler) ---
      if (s.vpa.enabled && s.vpa.mode === 'Auto' && s.tick % 15 === 0) {
        const typeOrder: InstanceTypeId[] = ['t3.micro', 't3.small', 'm5.large', 'c5.xlarge'];
        const minIdx = typeOrder.indexOf(s.vpa.minInstanceType);
        const maxIdx = typeOrder.indexOf(s.vpa.maxInstanceType);
        newInstances = newInstances.map(inst => {
          if (inst.status !== 'running') return inst;
          const curIdx = typeOrder.indexOf(inst.typeId);
          // Upgrade if CPU > 80%
          if (inst.cpu > 80 && curIdx < maxIdx) {
            const newType = typeOrder[curIdx + 1];
            newAlerts.push({ id: `alert-vpa-${Date.now()}-${inst.id}`, type: 'info' as const, message: `VPA: Upgraded ${inst.name} from ${inst.typeId} → ${newType}`, emoji: '📦', timestamp: Date.now(), dismissed: false });
            return { ...inst, typeId: newType, status: 'provisioning' as const, provisionTimer: 5, scaledBy: 'vpa' as const, pods: [] };
          }
          // Downgrade if CPU < 20% and we're not at minimum
          if (inst.cpu < 20 && curIdx > minIdx) {
            const newType = typeOrder[curIdx - 1];
            newAlerts.push({ id: `alert-vpa-down-${Date.now()}-${inst.id}`, type: 'info' as const, message: `VPA: Right-sized ${inst.name} from ${inst.typeId} → ${newType}`, emoji: '📦', timestamp: Date.now(), dismissed: false });
            return { ...inst, typeId: newType, status: 'provisioning' as const, provisionTimer: 5, scaledBy: 'vpa' as const, pods: [] };
          }
          return inst;
        });
      }

      const historyEntry = { tick: s.tick + 1, rps: newTraffic, cpu: cpuAvg, errors: errorRate, latency: latencyAvg };
      const history = [...s.metricsHistory, historyEntry].slice(-50);

      set({
        tick: s.tick + 1,
        instances: newInstances,
        traffic: newTraffic,
        cpuAvg,
        errorRate,
        latencyAvg,
        metricsHistory: history,
        alerts: newAlerts.slice(-20),
        totalCost: s.totalCost + tickCost,
        score: Math.max(0, s.score + scoreBonus),
        scoreHistory: newScoreHistory.slice(-50),
        pendingPods: newPendingPods,
        applications: newApplications,
      });

      // Check scenario objectives after state update
      try {
        useScenarioStore.getState().checkObjectives();
      } catch (e) {
        // Scenario store not yet initialized
      }

      // Check alert rules for real-time monitoring
      try {
        useAlertStore.getState().checkRules({
          instances: newInstances,
          applications: newApplications,
          pendingPods: newPendingPods,
          traffic: newTraffic,
          cpuAvg,
          errorRate,
          latencyAvg,
          hasLoadBalancer: s.hasLoadBalancer,
          asg: s.asg,
          hpa: s.hpa,
          isRunning: s.isRunning,
          INSTANCE_TYPES,
        });
      } catch (e) {
        // Alert store not yet initialized or error checking rules
        console.error('Error checking alert rules:', e);
      }

      // Periodically save game state and instances to database (every 10 ticks = ~10 seconds)
      if (s.tick % 10 === 0) {
        const currentState = get();
        saveGameStateToBackend(currentState);
        
        // Also save instances with their current state (pods, CPU, memory)
        currentState.instances.forEach(async (instance) => {
          try {
            await apiClient.updateInstance(instance.id, {
              status: instance.status,
              cpu: instance.cpu,
              memory: instance.memory,
              currentRps: instance.currentRps,
              provisionTimer: instance.provisionTimer,
              memoryLeakFactor: instance.memoryLeakFactor,
              scaledBy: instance.scaledBy,
              roleId: instance.roleId,
              assignedAppId: instance.assignedAppId,
              pods: instance.pods
            });
          } catch (error) {
            // Silent fail - don't spam console
          }
        });

        // Save applications with their deployment state
        currentState.applications.forEach(async (app) => {
          try {
            await apiClient.updateApplication(app.id, {
              deployments: app.deployments,
              assignedInstances: app.assignedInstances,
              activeVersion: app.activeVersion
            });
          } catch (error) {
            // Silent fail
          }
        });
      }
    },

    resetSimulation: () => {
      // Clear localStorage
      localStorage.removeItem('cloudops-game-store');
      // Reload page to reinitialize
      window.location.reload();
    },

    incrementKubectlCommandCount: () => {
      set(s => {
        const newCount = s.kubectlCommandCount + 1;
        saveGameStateToBackend({ ...s, kubectlCommandCount: newCount });
        return { kubectlCommandCount: newCount };
      });
    },
  };
},
{
  name: 'cloudops-game-store',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    // Core state that should be persisted
    instances: state.instances,
    applications: state.applications,
    pendingPods: state.pendingPods,
    hasLoadBalancer: state.hasLoadBalancer,
    hpa: state.hpa,
    asg: state.asg,
    vpa: state.vpa,
    traffic: state.traffic,
    targetTraffic: state.targetTraffic,
    totalCost: state.totalCost,
    score: state.score,
    tutorialStep: state.tutorialStep,
    tutorialComplete: state.tutorialComplete,
    kubectlCommandCount: state.kubectlCommandCount,
    // Don't persist runtime state
    // isRunning, tick, cpuAvg, errorRate, latencyAvg, metricsHistory, alerts, scoreHistory
  }),
  onRehydrateStorage: () => {
    return (state, error) => {
      if (error) {
        console.error('Failed to restore state:', error);
        // Don't show error toast on every refresh, just log it
      } else if (state) {
        console.log('✅ State restored from localStorage');
        // Don't show success toast on every refresh - it's annoying for users
        // Only log to console for debugging
      }
    };
  },
}
  )
);

// ============================================================================
// HELPER FUNCTIONS FOR DEPLOYMENT LIFECYCLE
// ============================================================================

/**
 * Check if a deployment is ready to receive traffic
 * Returns { ready: boolean, reason: string, runningPods: number, desiredReplicas: number }
 */
export function checkDeploymentReadiness(appId: string, version: string): {
  ready: boolean;
  reason: string;
  runningPods: number;
  desiredReplicas: number;
  pendingPods: number;
} {
  const state = useGameStore.getState();
  const app = state.applications.find(a => a.id === appId);

  if (!app) {
    return { ready: false, reason: 'Application not found', runningPods: 0, desiredReplicas: 0, pendingPods: 0 };
  }

  const deployment = app.deployments.find(d => d.version === version);

  if (!deployment) {
    return { ready: false, reason: 'Deployment not found', runningPods: 0, desiredReplicas: 0, pendingPods: 0 };
  }

  if (deployment.replicas === 0) {
    return { 
      ready: false, 
      reason: 'No replicas configured. Scale deployment to at least 1 replica.', 
      runningPods: 0, 
      desiredReplicas: 0,
      pendingPods: 0
    };
  }

  // Count running pods
  let runningPods = 0;
  state.instances.forEach(inst => {
    inst.pods.forEach(p => {
      if (p.appId === appId && p.version === version && p.status === 'running') {
        runningPods++;
      }
    });
  });

  // Count pending pods
  const pendingPods = state.pendingPods.filter(p => p.appId === appId && p.version === version).length;

  if (runningPods === 0) {
    if (pendingPods > 0) {
      return {
        ready: false,
        reason: `Rollout in progress: ${pendingPods} pods pending. Wait for pods to start.`,
        runningPods: 0,
        desiredReplicas: deployment.replicas,
        pendingPods
      };
    }
    return {
      ready: false,
      reason: 'No running pods. Deployment may need time to schedule pods.',
      runningPods: 0,
      desiredReplicas: deployment.replicas,
      pendingPods: 0
    };
  }

  // Deployment has at least some running pods
  if (runningPods < deployment.replicas) {
    return {
      ready: true, // Allow switch, but warn
      reason: `Partial rollout: ${runningPods}/${deployment.replicas} pods ready. Traffic can switch but full capacity not available.`,
      runningPods,
      desiredReplicas: deployment.replicas,
      pendingPods
    };
  }

  // All replicas running
  return {
    ready: true,
    reason: 'All pods running and ready',
    runningPods,
    desiredReplicas: deployment.replicas,
    pendingPods: 0
  };
}

/**
 * Get deployment status for UI display
 * Returns 'idle' | 'rolling-out' | 'ready' | 'degraded'
 */
export function getDeploymentStatus(appId: string, version: string): {
  status: 'idle' | 'rolling-out' | 'ready' | 'degraded';
  label: string;
} {
  const state = useGameStore.getState();
  const app = state.applications.find(a => a.id === appId);

  if (!app) {
    return { status: 'idle', label: 'Unknown' };
  }

  const deployment = app.deployments.find(d => d.version === version);

  if (!deployment || deployment.replicas === 0) {
    return { status: 'idle', label: 'Idle (0 replicas)' };
  }

  let runningPods = 0;
  let crashedPods = 0;

  state.instances.forEach(inst => {
    inst.pods.forEach(p => {
      if (p.appId === appId && p.version === version) {
        if (p.status === 'running') runningPods++;
        if (p.status === 'crashed') crashedPods++;
      }
    });
  });

  const pendingPods = state.pendingPods.filter(p => p.appId === appId && p.version === version).length;

  // Degraded: has crashed pods
  if (crashedPods > 0) {
    return { status: 'degraded', label: `Degraded (${crashedPods} crashed)` };
  }

  // Rolling out: pending pods or not all running yet
  if (pendingPods > 0 || runningPods < deployment.replicas) {
    return { status: 'rolling-out', label: `Rolling out (${runningPods}/${deployment.replicas})` };
  }

  // Ready: all replicas running
  if (runningPods === deployment.replicas) {
    return { status: 'ready', label: 'Ready' };
  }

  return { status: 'idle', label: 'Idle' };
}
