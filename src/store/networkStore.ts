import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

// Helper to save network state to backend (debounced)
let saveNetworkStateTimeout: ReturnType<typeof setTimeout> | null = null;
const saveNetworkStateToBackend = (state: any) => {
  if (saveNetworkStateTimeout) {
    clearTimeout(saveNetworkStateTimeout);
  }
  saveNetworkStateTimeout = setTimeout(async () => {
    try {
      await apiClient.updateNetworking({
        ingressCount: state.ingresses.length,
        serviceCount: state.services.length,
        podCount: state.pods.length,
        traffic: state.globalTraffic,
        bandwidth: state.globalTraffic * 0.001, // Simple bandwidth calculation
        configurations: {
          pods: state.pods,
          services: state.services,
          loadBalancers: state.loadBalancers,
          ingresses: state.ingresses,
          trafficFlows: state.trafficFlows
        }
      });
    } catch (error) {
      console.error('Failed to save network state:', error);
    }
  }, 500); // Debounce 500ms
};

// ============================================
// TYPE DEFINITIONS
// ============================================

export type LoadBalancerAlgorithm = 'round-robin' | 'least-connections';
export type ServiceType = 'ClusterIP' | 'NodePort' | 'LoadBalancer';
export type PodStatus = 'pending' | 'running' | 'failed' | 'terminating';
export type IngressStatus = 'active' | 'inactive' | 'misconfigured';

export interface NetworkPod {
  id: string;
  name: string;
  labels: Record<string, string>;
  status: PodStatus;
  currentRps: number;
  maxRps: number;
  cpu: number; // 0-100%
  memory: number; // 0-100%
  createdAt: number;
  lastHealthCheck: number;
  restartCount: number;
}

export interface Service {
  id: string;
  name: string;
  selector: Record<string, string>; // Match pods by labels
  type: ServiceType;
  port: number;
  targetPort: number;
  createdAt: number;
  endpoints: string[]; // Connected pod IDs
}

export interface LoadBalancer {
  id: string;
  serviceId: string;
  algorithm: LoadBalancerAlgorithm;
  enabled: boolean;
  totalRps: number;
  distributedRps: Record<string, number>; // podId -> RPS
  healthCheckInterval: number; // seconds
}

export interface Ingress {
  id: string;
  domain: string;
  serviceId: string | null;
  status: IngressStatus;
  rules: {
    path: string;
    serviceId: string;
    port: number;
  }[];
  totalTraffic: number;
  createdAt: number;
}

export interface TrafficFlow {
  id: string;
  source: string; // component ID
  target: string; // component ID
  rps: number;
  animated: boolean;
}

export interface NetworkAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
  componentId?: string;
}

// ============================================
// STORE INTERFACE
// ============================================

interface NetworkState {
  // Data
  pods: NetworkPod[];
  services: Service[];
  loadBalancers: LoadBalancer[];
  ingresses: Ingress[];
  trafficFlows: TrafficFlow[];
  alerts: NetworkAlert[];
  
  // Simulation state
  isSimulationRunning: boolean;
  globalTraffic: number; // RPS coming from external
  tickCount: number;
  score: number;
  
  // Tutorial state
  tutorialStep: number;
  hintsEnabled: boolean;
  
  // Pod actions
  createPod: (name: string, labels: Record<string, string>, maxRps: number) => void;
  deletePod: (podId: string) => void;
  updatePodStatus: (podId: string, status: PodStatus) => void;
  crashPod: (podId: string) => void;
  
  // Service actions
  createService: (
    name: string,
    selector: Record<string, string>,
    type: ServiceType,
    port: number,
    targetPort: number
  ) => void;
  deleteService: (serviceId: string) => void;
  updateServiceEndpoints: (serviceId: string) => void;
  
  // Load Balancer actions
  createLoadBalancer: (serviceId: string, algorithm: LoadBalancerAlgorithm) => void;
  deleteLoadBalancer: (loadBalancerId: string) => void;
  toggleLoadBalancer: (loadBalancerId: string) => void;
  setLoadBalancerAlgorithm: (loadBalancerId: string, algorithm: LoadBalancerAlgorithm) => void;
  
  // Ingress actions
  createIngress: (domain: string, serviceId: string | null) => void;
  deleteIngress: (ingressId: string) => void;
  updateIngressService: (ingressId: string, serviceId: string) => void;
  
  // Traffic control
  setGlobalTraffic: (rps: number) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  
  // Simulation
  simulationTick: () => void;
  
  // Alerts
  addAlert: (alert: Omit<NetworkAlert, 'id' | 'timestamp'>) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  
  // Tutorial
  advanceTutorial: () => void;
  resetTutorial: () => void;
  toggleHints: () => void;
  
  // Reset
  resetSimulation: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

let podCounter = 0;
let serviceCounter = 0;
let lbCounter = 0;
let ingressCounter = 0;
let alertCounter = 0;
let flowCounter = 0;

const matchesSelector = (podLabels: Record<string, string>, selector: Record<string, string>): boolean => {
  return Object.entries(selector).every(([key, value]) => podLabels[key] === value);
};

const distributeTrafficRoundRobin = (totalRps: number, pods: NetworkPod[]): Record<string, number> => {
  const distribution: Record<string, number> = {};
  if (pods.length === 0) return distribution;
  
  const rpsPerPod = totalRps / pods.length;
  pods.forEach(pod => {
    distribution[pod.id] = Math.min(rpsPerPod, pod.maxRps);
  });
  
  return distribution;
};

const distributeTrafficLeastConnections = (totalRps: number, pods: NetworkPod[]): Record<string, number> => {
  const distribution: Record<string, number> = {};
  if (pods.length === 0) return distribution;
  
  // Sort pods by current RPS (ascending)
  const sortedPods = [...pods].sort((a, b) => a.currentRps - b.currentRps);
  
  let remainingRps = totalRps;
  sortedPods.forEach(pod => {
    const availableCapacity = Math.max(0, pod.maxRps - pod.currentRps);
    const allocatedRps = Math.min(availableCapacity, remainingRps / sortedPods.length);
    distribution[pod.id] = allocatedRps;
    remainingRps -= allocatedRps;
  });
  
  return distribution;
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      // Initial state
      pods: [],
      services: [],
      loadBalancers: [],
      ingresses: [],
      trafficFlows: [],
      alerts: [],
      isSimulationRunning: false,
      globalTraffic: 0,
      tickCount: 0,
      score: 0,
      tutorialStep: 0,
      hintsEnabled: true,
      
      // ============================================
      // POD ACTIONS
      // ============================================
      
      createPod: (name, labels, maxRps) => {
        podCounter++;
        const newPod: NetworkPod = {
          id: `pod-${podCounter}-${Date.now()}`,
          name: name || `pod-${podCounter}`,
          labels,
          status: 'pending',
          currentRps: 0,
          maxRps,
          cpu: 0,
          memory: 0,
          createdAt: Date.now(),
          lastHealthCheck: Date.now(),
          restartCount: 0,
        };
        
        set(state => ({
          pods: [...state.pods, newPod]
        }));
        
        // Transition to running after a delay
        setTimeout(() => {
          get().updatePodStatus(newPod.id, 'running');
          get().addAlert({
            type: 'success',
            title: 'Pod Ready',
            message: `${newPod.name} is now running`,
            dismissed: false,
          });
        }, 2000);
        
        toast.success('Pod created', {
          description: `${newPod.name} is starting...`
        });
        
        // Update all service endpoints
        get().services.forEach(service => {
          get().updateServiceEndpoints(service.id);
        });
      },
      
      deletePod: (podId) => {
        const pod = get().pods.find(p => p.id === podId);
        if (!pod) return;
        
        set(state => ({
          pods: state.pods.filter(p => p.id !== podId)
        }));
        
        toast.info('Pod deleted', {
          description: `${pod.name} has been removed`
        });
        
        // Update all service endpoints
        get().services.forEach(service => {
          get().updateServiceEndpoints(service.id);
        });
      },
      
      updatePodStatus: (podId, status) => {
        set(state => ({
          pods: state.pods.map(pod =>
            pod.id === podId ? { ...pod, status } : pod
          )
        }));
      },
      
      crashPod: (podId) => {
        const pod = get().pods.find(p => p.id === podId);
        if (!pod) return;
        
        set(state => ({
          pods: state.pods.map(p =>
            p.id === podId
              ? { ...p, status: 'failed', restartCount: p.restartCount + 1, currentRps: 0 }
              : p
          )
        }));
        
        get().addAlert({
          type: 'error',
          title: 'Pod Crashed',
          message: `${pod.name} has failed and needs to be restarted`,
          dismissed: false,
          componentId: podId,
        });
        
        // Update service endpoints
        get().services.forEach(service => {
          get().updateServiceEndpoints(service.id);
        });
      },
      
      // ============================================
      // SERVICE ACTIONS
      // ============================================
      
      createService: (name, selector, type, port, targetPort) => {
        serviceCounter++;
        const newService: Service = {
          id: `svc-${serviceCounter}-${Date.now()}`,
          name: name || `service-${serviceCounter}`,
          selector,
          type,
          port,
          targetPort,
          createdAt: Date.now(),
          endpoints: [],
        };
        
        set(state => ({
          services: [...state.services, newService]
        }));
        
        // Update endpoints immediately
        get().updateServiceEndpoints(newService.id);
        
        toast.success('Service created', {
          description: `${newService.name} is active`
        });
      },
      
      deleteService: (serviceId) => {
        const service = get().services.find(s => s.id === serviceId);
        if (!service) return;
        
        // Delete associated load balancers
        const lbsToDelete = get().loadBalancers.filter(lb => lb.serviceId === serviceId);
        lbsToDelete.forEach(lb => get().deleteLoadBalancer(lb.id));
        
        // Update ingresses
        set(state => ({
          services: state.services.filter(s => s.id !== serviceId),
          ingresses: state.ingresses.map(ing =>
            ing.serviceId === serviceId
              ? { ...ing, serviceId: null, status: 'misconfigured' as IngressStatus }
              : ing
          )
        }));
        
        toast.info('Service deleted', {
          description: `${service.name} has been removed`
        });
      },
      
      updateServiceEndpoints: (serviceId) => {
        const service = get().services.find(s => s.id === serviceId);
        if (!service) return;
        
        // Find all running pods that match the selector
        const matchingPods = get().pods.filter(pod =>
          pod.status === 'running' && matchesSelector(pod.labels, service.selector)
        );
        
        const oldEndpointCount = service.endpoints.length;
        const newEndpointCount = matchingPods.length;
        
        set(state => ({
          services: state.services.map(s =>
            s.id === serviceId
              ? { ...s, endpoints: matchingPods.map(p => p.id) }
              : s
          )
        }));
        
        // Alert if no endpoints
        if (newEndpointCount === 0 && oldEndpointCount > 0) {
          get().addAlert({
            type: 'warning',
            title: 'Service has no endpoints',
            message: `${service.name} is not connected to any running pods`,
            dismissed: false,
            componentId: serviceId,
          });
        }
        
        // Alert if endpoints restored
        if (newEndpointCount > 0 && oldEndpointCount === 0) {
          get().addAlert({
            type: 'success',
            title: 'Service endpoints restored',
            message: `${service.name} is now connected to ${newEndpointCount} pod(s)`,
            dismissed: false,
            componentId: serviceId,
          });
        }
      },
      
      // ============================================
      // LOAD BALANCER ACTIONS
      // ============================================
      
      createLoadBalancer: (serviceId, algorithm) => {
        lbCounter++;
        const newLb: LoadBalancer = {
          id: `lb-${lbCounter}-${Date.now()}`,
          serviceId,
          algorithm,
          enabled: true,
          totalRps: 0,
          distributedRps: {},
          healthCheckInterval: 10,
        };
        
        set(state => ({
          loadBalancers: [...state.loadBalancers, newLb]
        }));
        
        toast.success('Load Balancer created', {
          description: `Using ${algorithm} algorithm`
        });
      },
      
      deleteLoadBalancer: (loadBalancerId) => {
        set(state => ({
          loadBalancers: state.loadBalancers.filter(lb => lb.id !== loadBalancerId)
        }));
        
        toast.info('Load Balancer deleted');
      },
      
      toggleLoadBalancer: (loadBalancerId) => {
        set(state => ({
          loadBalancers: state.loadBalancers.map(lb =>
            lb.id === loadBalancerId ? { ...lb, enabled: !lb.enabled } : lb
          )
        }));
      },
      
      setLoadBalancerAlgorithm: (loadBalancerId, algorithm) => {
        set(state => ({
          loadBalancers: state.loadBalancers.map(lb =>
            lb.id === loadBalancerId ? { ...lb, algorithm } : lb
          )
        }));
        
        toast.success('Load balancer updated', {
          description: `Now using ${algorithm} algorithm`
        });
      },
      
      // ============================================
      // INGRESS ACTIONS
      // ============================================
      
      createIngress: (domain, serviceId) => {
        ingressCounter++;
        const newIngress: Ingress = {
          id: `ing-${ingressCounter}-${Date.now()}`,
          domain,
          serviceId,
          status: serviceId ? 'active' : 'inactive',
          rules: serviceId ? [{
            path: '/',
            serviceId,
            port: 80,
          }] : [],
          totalTraffic: 0,
          createdAt: Date.now(),
        };
        
        set(state => ({
          ingresses: [...state.ingresses, newIngress]
        }));
        
        toast.success('Ingress created', {
          description: `Domain: ${domain}`
        });
      },
      
      deleteIngress: (ingressId) => {
        const ingress = get().ingresses.find(i => i.id === ingressId);
        if (!ingress) return;
        
        set(state => ({
          ingresses: state.ingresses.filter(i => i.id !== ingressId)
        }));
        
        toast.info('Ingress deleted', {
          description: ingress.domain
        });
      },
      
      updateIngressService: (ingressId, serviceId) => {
        set(state => ({
          ingresses: state.ingresses.map(ing =>
            ing.id === ingressId
              ? {
                  ...ing,
                  serviceId,
                  status: 'active' as IngressStatus,
                  rules: [{
                    path: '/',
                    serviceId,
                    port: 80,
                  }]
                }
              : ing
          )
        }));
        
        toast.success('Ingress updated', {
          description: 'Service connected successfully'
        });
      },
      
      // ============================================
      // TRAFFIC CONTROL
      // ============================================
      
      setGlobalTraffic: (rps) => {
        set({ globalTraffic: Math.max(0, rps) });
      },
      
      startSimulation: () => {
        set({ isSimulationRunning: true });
        toast.success('Simulation started');
      },
      
      stopSimulation: () => {
        set({ isSimulationRunning: false });
        toast.info('Simulation stopped');
      },
      
      // ============================================
      // SIMULATION TICK
      // ============================================
      
      simulationTick: () => {
        const state = get();
        if (!state.isSimulationRunning) return;
        
        const newFlows: TrafficFlow[] = [];
        flowCounter = 0;
        
        // Step 1: Distribute traffic from ingresses to services
        state.ingresses.forEach(ingress => {
          if (ingress.status !== 'active' || !ingress.serviceId) return;
          
          const service = state.services.find(s => s.id === ingress.serviceId);
          if (!service) return;
          
          // Create flow: Ingress -> Service
          newFlows.push({
            id: `flow-${flowCounter++}`,
            source: ingress.id,
            target: service.id,
            rps: state.globalTraffic,
            animated: true,
          });
          
          // Update ingress traffic
          set(s => ({
            ingresses: s.ingresses.map(i =>
              i.id === ingress.id ? { ...i, totalTraffic: state.globalTraffic } : i
            )
          }));
        });
        
        // Step 2: Distribute traffic from services to pods via load balancers
        state.services.forEach(service => {
          const lb = state.loadBalancers.find(l => l.serviceId === service.id && l.enabled);
          const ingressTraffic = state.ingresses
            .filter(i => i.serviceId === service.id && i.status === 'active')
            .reduce((sum, i) => sum + i.totalTraffic, 0);
          
          if (ingressTraffic === 0) return;
          
          // Get connected pods
          const connectedPods = state.pods.filter(p =>
            service.endpoints.includes(p.id) && p.status === 'running'
          );
          
          if (connectedPods.length === 0) {
            // No backend available
            get().addAlert({
              type: 'error',
              title: 'No backend available',
              message: `Service ${service.name} has no healthy pods`,
              dismissed: false,
              componentId: service.id,
            });
            return;
          }
          
          // Distribute traffic
          let distribution: Record<string, number> = {};
          if (lb) {
            if (lb.algorithm === 'round-robin') {
              distribution = distributeTrafficRoundRobin(ingressTraffic, connectedPods);
            } else {
              distribution = distributeTrafficLeastConnections(ingressTraffic, connectedPods);
            }
            
            // Update LB state
            set(s => ({
              loadBalancers: s.loadBalancers.map(l =>
                l.id === lb.id
                  ? { ...l, totalRps: ingressTraffic, distributedRps: distribution }
                  : l
              )
            }));
          } else {
            // No load balancer, distribute evenly
            distribution = distributeTrafficRoundRobin(ingressTraffic, connectedPods);
          }
          
          // Create flows: Service -> Pods
          connectedPods.forEach(pod => {
            const podRps = distribution[pod.id] || 0;
            if (podRps > 0) {
              newFlows.push({
                id: `flow-${flowCounter++}`,
                source: service.id,
                target: pod.id,
                rps: podRps,
                animated: true,
              });
            }
          });
          
          // Update pod metrics
          set(s => ({
            pods: s.pods.map(pod => {
              const allocatedRps = distribution[pod.id] || 0;
              if (allocatedRps === 0) return pod;
              
              const cpuLoad = Math.min(100, (allocatedRps / pod.maxRps) * 100);
              const memoryLoad = Math.min(100, cpuLoad * 0.8); // Memory correlates with CPU
              
              // Check for overload
              if (allocatedRps > pod.maxRps) {
                setTimeout(() => {
                  get().addAlert({
                    type: 'warning',
                    title: 'Pod overloaded',
                    message: `${pod.name} is receiving more traffic than it can handle`,
                    dismissed: false,
                    componentId: pod.id,
                  });
                }, 0);
              }
              
              return {
                ...pod,
                currentRps: allocatedRps,
                cpu: cpuLoad,
                memory: memoryLoad,
                lastHealthCheck: Date.now(),
              };
            })
          }));
        });
        
        // Update traffic flows
        set(s => ({
          trafficFlows: newFlows,
          tickCount: s.tickCount + 1,
        }));
        
        // Random pod failures (low probability)
        if (Math.random() < 0.01) {
          const runningPods = state.pods.filter(p => p.status === 'running');
          if (runningPods.length > 0) {
            const randomPod = runningPods[Math.floor(Math.random() * runningPods.length)];
            get().crashPod(randomPod.id);
          }
        }
      },
      
      // ============================================
      // ALERTS
      // ============================================
      
      addAlert: (alert) => {
        alertCounter++;
        const newAlert: NetworkAlert = {
          ...alert,
          id: `alert-${alertCounter}-${Date.now()}`,
          timestamp: Date.now(),
        };
        
        set(state => ({
          alerts: [...state.alerts, newAlert]
        }));
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          get().dismissAlert(newAlert.id);
        }, 10000);
      },
      
      dismissAlert: (alertId) => {
        set(state => ({
          alerts: state.alerts.filter(a => a.id !== alertId)
        }));
      },
      
      clearAlerts: () => {
        set({ alerts: [] });
      },
      
      // ============================================
      // TUTORIAL
      // ============================================
      
      advanceTutorial: () => {
        set(state => ({
          tutorialStep: state.tutorialStep + 1
        }));
      },
      
      resetTutorial: () => {
        set({ tutorialStep: 0 });
      },
      
      toggleHints: () => {
        set(state => ({
          hintsEnabled: !state.hintsEnabled
        }));
      },
      
      // ============================================
      // RESET
      // ============================================
      
      resetSimulation: () => {
        set({
          pods: [],
          services: [],
          loadBalancers: [],
          ingresses: [],
          trafficFlows: [],
          alerts: [],
          isSimulationRunning: false,
          globalTraffic: 0,
          tickCount: 0,
          score: 0,
        });
        
        podCounter = 0;
        serviceCounter = 0;
        lbCounter = 0;
        ingressCounter = 0;
        alertCounter = 0;
        flowCounter = 0;
        
        toast.success('Simulation reset');
      },
    }),
    {
      name: 'network-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// Subscribe to state changes and save to backend
useNetworkStore.subscribe((state) => {
  saveNetworkStateToBackend(state);
});
