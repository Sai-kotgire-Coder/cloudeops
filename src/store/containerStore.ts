import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

export interface DockerImage {
  id: string;
  name: string;
  baseImage: 'nginx' | 'node' | 'python' | 'redis';
  port: number;
  size: number; // MB
  status: 'building' | 'ready' | 'failed';
  buildProgress: number;
  createdAt: number;
}

export interface Container {
  id: string;
  imageId: string;
  imageName: string;
  status: 'starting' | 'running' | 'crashed' | 'stopped';
  cpuUsage: number;
  memoryUsage: number;
  currentRps: number;
  capacity: number; // Max RPS this container can handle
  uptime: number; // seconds
  restarts: number;
  position?: { x: number; y: number };
}

export interface Pod {
  id: string;
  name: string;
  containers: Container[];
  status: 'pending' | 'running' | 'failed';
  nodeId?: string;
  createdAt: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetRps: number;
  maxContainers: number;
  maxCost: number;
  completed: boolean;
}

interface ContainerState {
  images: DockerImage[];
  containers: Container[];
  pods: Pod[];
  traffic: number;
  targetTraffic: number;
  isTrafficRunning: boolean;
  hasLoadBalancer: boolean;
  autoScaleEnabled: boolean;
  autoScaleThreshold: number;
  score: number;
  challenges: Challenge[];
  tutorialStep: number;
  
  // Actions
  buildImage: (name: string, baseImage: DockerImage['baseImage'], port: number) => void;
  runContainer: (imageId: string, position?: { x: number; y: number }) => void;
  stopContainer: (containerId: string) => void;
  restartContainer: (containerId: string) => void;
  removeContainer: (containerId: string) => void;
  setTraffic: (value: number) => void;
  toggleTraffic: () => void;
  toggleLoadBalancer: () => void;
  toggleAutoScale: () => void;
  createPod: (containerIds: string[]) => void;
  removePod: (podId: string) => void;
  simulationTick: () => void;
  advanceTutorial: () => void;
  resetSimulation: () => void;
}

const BASE_IMAGE_INFO = {
  nginx: { size: 142, capacity: 100, description: 'High performance web server' },
  node: { size: 180, capacity: 80, description: 'JavaScript runtime for backends' },
  python: { size: 200, capacity: 60, description: 'General-purpose development' },
  redis: { size: 90, capacity: 150, description: 'In-memory data store' },
};

let imageCounter = 0;
let containerCounter = 0;
let podCounter = 0;

export const useContainerStore = create<ContainerState>((set, get) => ({
  images: [],
  containers: [],
  pods: [],
  traffic: 0,
  targetTraffic: 0,
  isTrafficRunning: false,
  hasLoadBalancer: false,
  autoScaleEnabled: false,
  autoScaleThreshold: 70,
  score: 0,
  tutorialStep: 0,
  challenges: [
    {
      id: 'challenge-1',
      title: 'First Steps',
      description: 'Build an image and run a container',
      targetRps: 50,
      maxContainers: 1,
      maxCost: 10,
      completed: false,
    },
    {
      id: 'challenge-2',
      title: 'Scale Up',
      description: 'Handle 500 RPS using multiple containers',
      targetRps: 500,
      maxContainers: 6,
      maxCost: 50,
      completed: false,
    },
    {
      id: 'challenge-3',
      title: 'Cost Optimization',
      description: 'Handle 1000 RPS efficiently with auto-scaling',
      targetRps: 1000,
      maxContainers: 10,
      maxCost: 100,
      completed: false,
    },
  ],

  buildImage: (name, baseImage, port) => {
    imageCounter++;
    const newImage: DockerImage = {
      id: `img-${imageCounter}-${Date.now()}`,
      name,
      baseImage,
      port,
      size: BASE_IMAGE_INFO[baseImage].size,
      status: 'building',
      buildProgress: 0,
      createdAt: Date.now(),
    };

    set((s) => ({ images: [...s.images, newImage] }));

    // Simulate build process
    const buildSteps = [
      { progress: 20, message: `Pulling base image ${baseImage}...` },
      { progress: 40, message: 'Copying application code...' },
      { progress: 60, message: 'Installing dependencies...' },
      { progress: 80, message: 'Building layers...' },
      { progress: 100, message: 'Build complete!' },
    ];

    buildSteps.forEach((step, idx) => {
      setTimeout(() => {
        set((s) => ({
          images: s.images.map((img) =>
            img.id === newImage.id
              ? { ...img, buildProgress: step.progress, status: step.progress === 100 ? 'ready' : 'building' }
              : img
          ),
        }));
        
        if (step.progress === 100) {
          toast.success('Image built successfully!', {
            description: `${name} is ready to run`,
          });
          
          // Save to backend
          apiClient.createImage({
            name,
            baseImage,
            tag: 'latest',
            port,
            size: BASE_IMAGE_INFO[baseImage].size,
            status: 'ready',
            buildProgress: 100
          }).catch(err => console.error('Failed to save image:', err));
          
          if (get().tutorialStep === 0) {
            get().advanceTutorial();
          }
        } else {
          toast.info(step.message);
        }
      }, (idx + 1) * 800);
    });
  },

  runContainer: (imageId, position) => {
    const image = get().images.find((img) => img.id === imageId);
    if (!image || image.status !== 'ready') {
      toast.error('Image not ready yet');
      return;
    }

    containerCounter++;
    const newContainer: Container = {
      id: `cont-${containerCounter}-${Date.now()}`,
      imageId: image.id,
      imageName: image.name,
      status: 'starting',
      cpuUsage: 5,
      memoryUsage: 20,
      currentRps: 0,
      capacity: BASE_IMAGE_INFO[image.baseImage].capacity,
      uptime: 0,
      restarts: 0,
      position,
    };

    set((s) => ({ containers: [...s.containers, newContainer] }));

    // Container starts after brief delay
    setTimeout(() => {
      set((s) => ({
        containers: s.containers.map((c) =>
          c.id === newContainer.id ? { ...c, status: 'running' } : c
        ),
      }));
      toast.success('Container started!', {
        description: `${image.name} is now running`,
      });

      // Save to backend
      apiClient.createContainer({
        name: newContainer.imageName,
        imageId: image.id,
        imageName: image.name,
        image: `${image.name}:latest`,
        status: 'running',
        port: image.port.toString(),
        cpuUsage: 5,
        memoryUsage: 20,
        currentRps: 0,
        capacity: newContainer.capacity,
        uptime: 0,
        restarts: 0,
        position
      }).catch(err => console.error('Failed to save container:', err));

      if (get().tutorialStep === 1) {
        get().advanceTutorial();
      }
    }, 1000);
  },

  stopContainer: (containerId) => {
    const container = get().containers.find(c => c.id === containerId);
    set((s) => ({
      containers: s.containers.map((c) =>
        c.id === containerId ? { ...c, status: 'stopped', currentRps: 0 } : c
      ),
    }));
    toast.info('Container stopped');
    
    // Update backend
    if (container) {
      apiClient.updateContainer(containerId, {
        status: 'stopped',
        currentRps: 0,
        cpuUsage: 0,
        memoryUsage: 0
      }).catch(err => console.error('Failed to update container:', err));
    }
  },

  restartContainer: (containerId) => {
    const container = get().containers.find(c => c.id === containerId);
    set((s) => ({
      containers: s.containers.map((c) =>
        c.id === containerId
          ? { ...c, status: 'starting', restarts: c.restarts + 1, cpuUsage: 5, memoryUsage: 20 }
          : c
      ),
    }));

    setTimeout(() => {
      set((s) => ({
        containers: s.containers.map((c) =>
          c.id === containerId && c.status === 'starting' ? { ...c, status: 'running' } : c
        ),
      }));
      toast.success('Container restarted');
      
      // Update backend
      if (container) {
        apiClient.updateContainer(containerId, {
          status: 'running',
          restarts: container.restarts + 1,
          cpuUsage: 5,
          memoryUsage: 20
        }).catch(err => console.error('Failed to update container:', err));
      }
    }, 1000);
  },

  removeContainer: (containerId) => {
    set((s) => ({
      containers: s.containers.filter((c) => c.id !== containerId),
    }));
    toast.info('Container removed');
    
    // Delete from backend
    apiClient.deleteContainer(containerId).catch(err => console.error('Failed to delete container:', err));
  },

  setTraffic: (value) => {
    set({ targetTraffic: value });
  },

  toggleTraffic: () => {
    set((s) => {
      const newState = !s.isTrafficRunning;
      if (newState && s.containers.filter((c) => c.status === 'running').length === 0) {
        toast.error('No running containers to handle traffic');
        return s;
      }
      return { isTrafficRunning: newState };
    });
  },

  toggleLoadBalancer: () => {
    set((s) => {
      const enabled = !s.hasLoadBalancer;
      toast.success(enabled ? 'Load Balancer enabled' : 'Load Balancer disabled', {
        description: enabled
          ? 'Traffic will be distributed evenly across containers'
          : 'All traffic will go to one container',
      });
      return { hasLoadBalancer: enabled };
    });
  },

  toggleAutoScale: () => {
    set((s) => {
      const enabled = !s.autoScaleEnabled;
      toast.success(enabled ? 'Auto-scaling enabled' : 'Auto-scaling disabled', {
        description: enabled
          ? `Will scale when CPU > ${s.autoScaleThreshold}%`
          : 'Manual scaling only',
      });
      return { autoScaleEnabled: enabled };
    });
  },

  createPod: (containerIds) => {
    podCounter++;
    const containers = get().containers.filter((c) => containerIds.includes(c.id));
    
    if (containers.length === 0) {
      toast.error('No containers selected');
      return;
    }

    const newPod: Pod = {
      id: `pod-${podCounter}-${Date.now()}`,
      name: `pod-${podCounter}`,
      containers,
      status: 'running',
      createdAt: Date.now(),
    };

    set((s) => ({
      pods: [...s.pods, newPod],
      containers: s.containers.filter((c) => !containerIds.includes(c.id)),
    }));

    toast.success('Pod created!', {
      description: `Grouped ${containers.length} container(s) into a pod`,
    });
  },

  removePod: (podId) => {
    const pod = get().pods.find((p) => p.id === podId);
    if (!pod) return;

    set((s) => ({
      pods: s.pods.filter((p) => p.id !== podId),
      containers: [...s.containers, ...pod.containers],
    }));

    toast.info('Pod removed, containers restored');
  },

  simulationTick: () => {
    const state = get();
    if (!state.isTrafficRunning) return;

    // Gradually adjust traffic to target
    let newTraffic = state.traffic;
    if (state.traffic < state.targetTraffic) {
      newTraffic = Math.min(state.targetTraffic, state.traffic + Math.max(10, (state.targetTraffic - state.traffic) * 0.1));
    } else if (state.traffic > state.targetTraffic) {
      newTraffic = Math.max(state.targetTraffic, state.traffic - Math.max(10, (state.traffic - state.targetTraffic) * 0.1));
    }

    const runningContainers = state.containers.filter((c) => c.status === 'running');
    let newContainers = [...state.containers];
    let scoreBonus = 0;

    if (runningContainers.length > 0) {
      // Distribute traffic
      if (state.hasLoadBalancer) {
        const rpsPerContainer = newTraffic / runningContainers.length;
        newContainers = newContainers.map((c) => {
          if (c.status !== 'running') return c;
          
          const loadRatio = rpsPerContainer / c.capacity;
          const cpu = Math.min(100, Math.max(5, loadRatio * 90 + (Math.random() * 10)));
          const memory = Math.min(95, Math.max(20, loadRatio * 70 + 20));
          
          // Container crashes if overloaded
          if (loadRatio > 1.2 && Math.random() < 0.1) {
            toast.error(`Container ${c.imageName} crashed!`, {
              description: `Overloaded by traffic (${rpsPerContainer.toFixed(0)} RPS > ${c.capacity} capacity)`,
            });
            
            if (state.tutorialStep === 3) {
              get().advanceTutorial();
            }
            
            return { ...c, status: 'crashed' as const, cpuUsage: 0, currentRps: 0 };
          }
          
          return { ...c, currentRps: rpsPerContainer, cpuUsage: cpu, memoryUsage: memory, uptime: c.uptime + 1 };
        });
      } else {
        // Without LB, one container gets most traffic
        const luckyIndex = 0;
        newContainers = newContainers.map((c, idx) => {
          if (c.status !== 'running') return c;
          
          const assignedRps = idx === luckyIndex ? newTraffic * 0.95 : (newTraffic * 0.05) / Math.max(1, runningContainers.length - 1);
          const loadRatio = assignedRps / c.capacity;
          const cpu = Math.min(100, Math.max(5, loadRatio * 90));
          
          if (loadRatio > 1.2 && Math.random() < 0.15) {
            toast.error(`Container ${c.imageName} crashed!`, {
              description: 'Uneven traffic distribution without load balancer',
            });
            return { ...c, status: 'crashed' as const, cpuUsage: 0, currentRps: 0 };
          }
          
          return { ...c, currentRps: assignedRps, cpuUsage: cpu, uptime: c.uptime + 1 };
        });
      }

      // Auto-scaling logic
      if (state.autoScaleEnabled && runningContainers.length > 0) {
        const currentRunningContainers = newContainers.filter((c) => c.status === 'running');
        
        if (currentRunningContainers.length > 0) {
          const avgCpu = currentRunningContainers.reduce((sum, c) => sum + c.cpuUsage, 0) / currentRunningContainers.length;

          if (avgCpu > state.autoScaleThreshold && currentRunningContainers.length < 10) {
            // Scale up - find most common image and run another container
            const imageCount = new Map<string, number>();
            currentRunningContainers.forEach((c) => {
              imageCount.set(c.imageId, (imageCount.get(c.imageId) || 0) + 1);
            });
            
            const sortedImages = Array.from(imageCount.entries()).sort((a, b) => b[1] - a[1]);
            const [mostUsedImageId] = sortedImages[0] || [];
            
            if (mostUsedImageId && state.images.find((img) => img.id === mostUsedImageId)) {
              toast.info('🚀 Auto-scaling triggered!', {
                description: `Avg CPU ${avgCpu.toFixed(1)}% > ${state.autoScaleThreshold}% threshold. Spawning new container...`,
                duration: 3000,
              });
              
              // Run the scale-up in the next tick to avoid state conflicts
              setTimeout(() => {
                get().runContainer(mostUsedImageId);
              }, 100);
              
              scoreBonus += 10;
              
              if (state.tutorialStep === 4) {
                get().advanceTutorial();
              }
            }
          }
        }
      }

      // Score points for healthy operation
      const activeCpu = newContainers.filter((c) => c.status === 'running').reduce((sum, c) => sum + c.cpuUsage, 0) / Math.max(1, runningContainers.length);
      const hasCrashed = newContainers.some((c) => c.status === 'crashed');
      
      if (!hasCrashed && activeCpu < 80 && newTraffic > 100) {
        scoreBonus += 1;
      }
    }

    set({ containers: newContainers, traffic: newTraffic, score: state.score + scoreBonus });
  },

  advanceTutorial: () => {
    set((s) => ({ tutorialStep: s.tutorialStep + 1 }));
  },

  resetSimulation: () => {
    set({
      containers: [],
      pods: [],
      traffic: 0,
      targetTraffic: 0,
      isTrafficRunning: false,
      hasLoadBalancer: false,
      autoScaleEnabled: false,
      score: 0,
      tutorialStep: 0,
    });
    toast.success('Simulation reset');
  },
}));
