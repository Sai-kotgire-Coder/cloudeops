import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type TicketType = 'incident' | 'alert' | 'task' | 'change_request';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'cpu' | 'memory' | 'scaling' | 'deployment' | 'network' | 'pod' | 'service' | 'container' | 'load_balancer';

export interface TicketActivity {
  id: string;
  ticketId: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  category?: TicketCategory;
  affectedService?: string;
  sourceEvent?: string;
  metricsSnapshot?: any;
  suggestedFix?: string;
  actionTaken?: string;
  assignedTo?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  activities?: TicketActivity[];
}

export interface TicketTrigger {
  id: string;
  condition: (state: any) => boolean;
  createTicket: (state: any) => Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'status'>;
  cooldown: number; // milliseconds before can trigger again
  lastTriggered?: number;
}

// ============================================
// STORE INTERFACE
// ============================================

interface TicketState {
  // Data
  tickets: Ticket[];
  selectedTicketId: string | null;
  autoGenerationEnabled: boolean;
  
  // Triggers
  triggers: TicketTrigger[];
  
  // Actions
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'status'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;
  markInProgress: (id: string) => void;
  markResolved: (id: string, actionTaken: string) => void;
  markClosed: (id: string) => void;
  selectTicket: (id: string | null) => void;
  addActivity: (ticketId: string, activity: Omit<TicketActivity, 'id' | 'ticketId' | 'createdAt'>) => void;
  
  // Auto-generation
  toggleAutoGeneration: () => void;
  registerTrigger: (trigger: TicketTrigger) => void;
  checkTriggers: (systemState: any) => void;
  
  // Helpers
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  getTicketsByPriority: (priority: TicketPriority) => Ticket[];
  getCriticalCount: () => number;
  getOpenCount: () => number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

let ticketCounter = 0;
let activityCounter = 0;

const generateTicketNumber = (): string => {
  ticketCounter++;
  return `TK-${ticketCounter.toString().padStart(4, '0')}`;
};

const generateActivityId = (): string => {
  activityCounter++;
  return `ACT-${activityCounter}`;
};

// ============================================
// DEFAULT TRIGGERS
// ============================================

const DEFAULT_TRIGGERS: TicketTrigger[] = [
  // High CPU Alert
  {
    id: 'high-cpu-alert',
    condition: (state: any) => {
      const instances = state.gameStore?.instances || [];
      return instances.some((inst: any) => inst.status === 'running' && inst.cpu > 80);
    },
    createTicket: (state: any) => {
      const instances = state.gameStore?.instances || [];
      const highCpuInstances = instances.filter((inst: any) => inst.cpu > 80);
      const avgCpu = highCpuInstances.reduce((sum: number, inst: any) => sum + inst.cpu, 0) / highCpuInstances.length;
      
      return {
        title: '🔴 Critical: High CPU Usage Detected',
        description: `${highCpuInstances.length} instance(s) experiencing high CPU utilization (>80%). Average CPU: ${avgCpu.toFixed(1)}%.\n\nAffected instances:\n${highCpuInstances.map((i: any) => `- ${i.name}: ${i.cpu}%`).join('\n')}`,
        type: 'incident',
        priority: avgCpu > 95 ? 'critical' : 'high',
        category: 'cpu',
        affectedService: highCpuInstances.map((i: any) => i.name).join(', '),
        metricsSnapshot: { instances: highCpuInstances.length, avgCpu },
        suggestedFix: avgCpu > 95 
          ? '1. Enable Auto-Scaling Group (ASG) to add more instances\n2. Enable Horizontal Pod Autoscaler (HPA) to distribute load\n3. Reduce incoming traffic temporarily'
          : '1. Monitor for 5 more minutes\n2. Check if traffic spike is temporary\n3. Consider enabling HPA if sustained',
      };
    },
    cooldown: 300000, // 5 minutes
  },
  
  // Memory Pressure
  {
    id: 'high-memory-alert',
    condition: (state: any) => {
      const instances = state.gameStore?.instances || [];
      return instances.some((inst: any) => inst.status === 'running' && inst.memory > 85);
    },
    createTicket: (state: any) => {
      const instances = state.gameStore?.instances || [];
      const highMemInstances = instances.filter((inst: any) => inst.memory > 85);
      
      return {
        title: '⚠️ High: Memory Pressure Detected',
        description: `${highMemInstances.length} instance(s) running low on memory (>85%).\n\nAffected instances:\n${highMemInstances.map((i: any) => `- ${i.name}: ${i.memory.toFixed(1)}%`).join('\n')}\n\nThis could lead to OOM (Out of Memory) crashes.`,
        type: 'incident',
        priority: 'high',
        category: 'memory',
        affectedService: highMemInstances.map((i: any) => i.name).join(', '),
        suggestedFix: '1. Check for memory leaks in application code\n2. Enable Vertical Pod Autoscaler (VPA) to allocate more memory\n3. Restart affected instances if memory leak suspected\n4. Scale horizontally to distribute load',
      };
    },
    cooldown: 300000,
  },
  
  // Pod Crash
  {
    id: 'pod-crash-alert',
    condition: (state: any) => {
      const pods = state.gameStore?.instances?.flatMap((i: any) => i.pods || []) || [];
      const networkPods = state.networkStore?.pods || [];
      const allPods = [...pods, ...networkPods];
      return allPods.some((pod: any) => pod.status === 'crashed' || pod.status === 'failed');
    },
    createTicket: (state: any) => {
      const pods = state.gameStore?.instances?.flatMap((i: any) => i.pods || []) || [];
      const networkPods = state.networkStore?.pods || [];
      const allPods = [...pods, ...networkPods];
      const crashedPods = allPods.filter((pod: any) => pod.status === 'crashed' || pod.status === 'failed');
      
      return {
        title: '🔴 Critical: Pod Failure Detected',
        description: `${crashedPods.length} pod(s) have crashed and are not responding.\n\nAffected pods:\n${crashedPods.map((p: any) => `- ${p.name || p.id}`).join('\n')}\n\nThis may impact service availability.`,
        type: 'incident',
        priority: 'critical',
        category: 'pod',
        affectedService: 'kubernetes-cluster',
        suggestedFix: '1. Check pod logs for error messages\n2. Verify resource limits (CPU/Memory) are not exceeded\n3. Restart crashed pods\n4. Check if application code has bugs\n5. Review health check configurations',
      };
    },
    cooldown: 180000, // 3 minutes
  },
  
  // Cluster Capacity
  {
    id: 'cluster-capacity-alert',
    condition: (state: any) => {
      const instances = state.gameStore?.instances || [];
      const totalPods = instances.reduce((sum: number, inst: any) => sum + (inst.pods?.length || 0), 0);
      const maxPods = instances.reduce((sum: number, inst: any) => {
        const type = state.gameStore?.INSTANCE_TYPES?.[inst.typeId];
        return sum + (type?.maxPods || 0);
      }, 0);
      const usage = maxPods > 0 ? (totalPods / maxPods) * 100 : 0;
      return usage > 85;
    },
    createTicket: (state: any) => {
      const instances = state.gameStore?.instances || [];
      const totalPods = instances.reduce((sum: number, inst: any) => sum + (inst.pods?.length || 0), 0);
      const maxPods = instances.reduce((sum: number, inst: any) => {
        const type = state.gameStore?.INSTANCE_TYPES?.[inst.typeId];
        return sum + (type?.maxPods || 0);
      }, 0);
      const usage = ((totalPods / maxPods) * 100).toFixed(1);
      
      return {
        title: '⚠️ High: Cluster Capacity Exhausted',
        description: `Cluster is at ${usage}% capacity (${totalPods}/${maxPods} pods).\n\nNew pod scheduling may fail soon.`,
        type: 'alert',
        priority: 'high',
        category: 'scaling',
        affectedService: 'kubernetes-cluster',
        suggestedFix: '1. Enable Auto-Scaling Group (ASG) to provision new nodes\n2. Remove unused pods\n3. Optimize pod resource requests\n4. Consider larger instance types',
      };
    },
    cooldown: 600000, // 10 minutes
  },
  
  // Instance Crash
  {
    id: 'instance-crash-alert',
    condition: (state: any) => {
      const instances = state.gameStore?.instances || [];
      return instances.some((inst: any) => inst.status === 'crashed');
    },
    createTicket: (state: any) => {
      const instances = state.gameStore?.instances || [];
      const crashed = instances.filter((i: any) => i.status === 'crashed');
      
      return {
        title: '🔴 Critical: Instance Failure',
        description: `${crashed.length} instance(s) have crashed.\n\nAffected:\n${crashed.map((i: any) => `- ${i.name}`).join('\n')}\n\nAll pods on these instances are down.`,
        type: 'incident',
        priority: 'critical',
        category: 'pod',
        affectedService: crashed.map((i: any) => i.name).join(', '),
        suggestedFix: '1. Investigate crash reason (OOM, hardware failure)\n2. Replace failed instances\n3. Pods will reschedule to healthy nodes\n4. Enable ASG for automatic recovery',
      };
    },
    cooldown: 120000,
  },
  
  // Network Service Down
  {
    id: 'service-no-endpoints',
    condition: (state: any) => {
      const services = state.networkStore?.services || [];
      return services.some((svc: any) => svc.endpoints?.length === 0);
    },
    createTicket: (state: any) => {
      const services = state.networkStore?.services || [];
      const noEndpoints = services.filter((svc: any) => svc.endpoints?.length === 0);
      
      return {
        title: '⚠️ High: Service Has No Backend',
        description: `${noEndpoints.length} service(s) have no healthy pods.\n\nAffected services:\n${noEndpoints.map((s: any) => `- ${s.name}`).join('\n')}\n\nTraffic cannot be routed.`,
        type: 'incident',
        priority: 'high',
        category: 'service',
        affectedService: noEndpoints.map((s: any) => s.name).join(', '),
        suggestedFix: '1. Create pods with matching labels\n2. Check pod selector configuration\n3. Verify pods are in Running state\n4. Review service YAML for errors',
      };
    },
    cooldown: 300000,
  },
  
  // Pipeline Failure
  {
    id: 'pipeline-failure',
    condition: (state: any) => {
      const pipelines = state.cicdStore?.pipelines || [];
      return pipelines.some((p: any) => p.status === 'failed');
    },
    createTicket: (state: any) => {
      const pipelines = state.cicdStore?.pipelines || [];
      const failed = pipelines.filter((p: any) => p.status === 'failed');
      
      return {
        title: '⚠️ Medium: CI/CD Pipeline Failure',
        description: `${failed.length} pipeline(s) failed during execution.\n\nFailed pipelines:\n${failed.map((p: any) => `- ${p.name || p.id}: ${p.lastRun?.error || 'Unknown error'}`).join('\n')}`,
        type: 'alert',
        priority: 'medium',
        category: 'deployment',
        affectedService: 'cicd-system',
        suggestedFix: '1. Check pipeline logs for errors\n2. Verify build dependencies\n3. Check test failures\n4. Review recent code changes\n5. Retry pipeline if transient error',
      };
    },
    cooldown: 180000,
  },
  
  // Container Overload
  {
    id: 'container-overload',
    condition: (state: any) => {
      const containers = state.containerStore?.containers || [];
      return containers.some((c: any) => c.status === 'running' && c.cpuUsage > 90);
    },
    createTicket: (state: any) => {
      const containers = state.containerStore?.containers || [];
      const overloaded = containers.filter((c: any) => c.cpuUsage > 90);
      
      return {
        title: '⚠️ High: Container Overload',
        description: `${overloaded.length} container(s) experiencing extreme CPU load (>90%).\n\nAffected containers:\n${overloaded.map((c: any) => `- ${c.imageName}: ${c.cpuUsage}%`).join('\n')}`,
        type: 'alert',
        priority: 'high',
        category: 'container',
        affectedService: 'docker-containers',
        suggestedFix: '1. Scale container replicas\n2. Enable load balancer\n3. Reduce traffic\n4. Optimize application code\n5. Check for infinite loops or deadlocks',
      };
    },
    cooldown: 240000,
  },
];

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      // Initial state
      tickets: [],
      selectedTicketId: null,
      autoGenerationEnabled: true,
      triggers: DEFAULT_TRIGGERS,
      
      // ============================================
      // BASIC ACTIONS
      // ============================================
      
      setTickets: (tickets) => set({ tickets }),
      
      addTicket: async (ticketData) => {
        const newTicket: Ticket = {
          ...ticketData,
          id: `ticket-${Date.now()}-${Math.random()}`,
          ticketNumber: generateTicketNumber(),
          status: 'open',
          assignedTo: 'You',
          createdAt: new Date(),
          updatedAt: new Date(),
          activities: [{
            id: generateActivityId(),
            ticketId: '',
            action: 'created',
            description: 'Ticket created',
            createdAt: new Date(),
          }],
        };
        
        newTicket.activities![0].ticketId = newTicket.id;
        
        set(state => ({
          tickets: [newTicket, ...state.tickets]
        }));
        
        // Save to backend
        try {
          await apiClient.createTicket({
            ticketNumber: newTicket.ticketNumber,
            title: newTicket.title,
            description: newTicket.description,
            type: newTicket.type,
            priority: newTicket.priority,
            status: 'open',
            category: newTicket.category,
            affectedService: newTicket.affectedService,
            sourceEvent: newTicket.sourceEvent,
            metricsSnapshot: newTicket.metricsSnapshot,
            suggestedFix: newTicket.suggestedFix
          });
        } catch (error) {
          console.error('Failed to save ticket:', error);
        }
        
        toast.error(`New ${newTicket.priority} priority ticket: ${newTicket.title}`, {
          description: newTicket.ticketNumber,
          duration: 5000,
        });
        
        return newTicket;
      },
      
      updateTicket: async (id, updates) => {
        set(state => ({
          tickets: state.tickets.map(ticket =>
            ticket.id === id
              ? { ...ticket, ...updates, updatedAt: new Date() }
              : ticket
          )
        }));
        
        // Update backend
        try {
          await apiClient.updateTicket(id, updates);
        } catch (error) {
          console.error('Failed to update ticket:', error);
        }
      },
      
      deleteTicket: async (id) => {
        set(state => ({
          tickets: state.tickets.filter(t => t.id !== id),
          selectedTicketId: state.selectedTicketId === id ? null : state.selectedTicketId,
        }));
        
        // Delete from backend
        try {
          await apiClient.deleteTicket(id);
        } catch (error) {
          console.error('Failed to delete ticket:', error);
        }
        
        toast.success('Ticket deleted');
      },
      
      markInProgress: (id) => {
        const ticket = get().tickets.find(t => t.id === id);
        if (!ticket) return;
        
        get().updateTicket(id, { status: 'in_progress' });
        get().addActivity(id, {
          action: 'status_changed',
          description: 'Ticket marked as in progress',
          metadata: { previousStatus: ticket.status, newStatus: 'in_progress' },
        });
        
        toast.info('Ticket is now in progress');
      },
      
      markResolved: (id, actionTaken) => {
        const ticket = get().tickets.find(t => t.id === id);
        if (!ticket) return;
        
        get().updateTicket(id, {
          status: 'resolved',
          resolvedAt: new Date(),
          actionTaken,
        });
        
        get().addActivity(id, {
          action: 'resolved',
          description: 'Ticket resolved',
          metadata: { actionTaken },
        });
        
        toast.success('✓ Ticket resolved!', {
          description: ticket.title,
        });
      },
      
      markClosed: (id) => {
        get().updateTicket(id, {
          status: 'closed',
          closedAt: new Date(),
        });
        
        get().addActivity(id, {
          action: 'closed',
          description: 'Ticket closed',
        });
        
        toast.info('Ticket closed');
      },
      
      selectTicket: (id) => set({ selectedTicketId: id }),
      
      addActivity: (ticketId, activity) => {
        const newActivity: TicketActivity = {
          ...activity,
          id: generateActivityId(),
          ticketId,
          createdAt: new Date(),
        };
        
        set(state => ({
          tickets: state.tickets.map(ticket =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  activities: [newActivity, ...(ticket.activities || [])],
                  updatedAt: new Date(),
                }
              : ticket
          )
        }));
      },
      
      // ============================================
      // AUTO-GENERATION
      // ============================================
      
      toggleAutoGeneration: () => {
        set(state => {
          const newValue = !state.autoGenerationEnabled;
          toast.info(`Auto-ticket generation ${newValue ? 'enabled' : 'disabled'}`);
          return { autoGenerationEnabled: newValue };
        });
      },
      
      registerTrigger: (trigger) => {
        set(state => ({
          triggers: [...state.triggers, trigger]
        }));
      },
      
      checkTriggers: (systemState) => {
        const state = get();
        if (!state.autoGenerationEnabled) return;
        
        const now = Date.now();
        
        state.triggers.forEach(trigger => {
          // Check cooldown
          if (trigger.lastTriggered && (now - trigger.lastTriggered) < trigger.cooldown) {
            return;
          }
          
          // Check condition
          try {
            if (trigger.condition(systemState)) {
              // Check if similar ticket already exists
              const existingOpenTicket = state.tickets.find(
                t => t.category === trigger.createTicket(systemState).category &&
                     (t.status === 'open' || t.status === 'in_progress')
              );
              
              if (!existingOpenTicket) {
                const ticketData = trigger.createTicket(systemState);
                state.addTicket(ticketData);
                
                // Update trigger last triggered time
                set(s => ({
                  triggers: s.triggers.map(t =>
                    t.id === trigger.id ? { ...t, lastTriggered: now } : t
                  )
                }));
              }
            }
          } catch (error) {
            console.error(`Error checking trigger ${trigger.id}:`, error);
          }
        });
      },
      
      // ============================================
      // HELPERS
      // ============================================
      
      getTicketsByStatus: (status) => {
        return get().tickets.filter(t => t.status === status);
      },
      
      getTicketsByPriority: (priority) => {
        return get().tickets.filter(t => t.priority === priority);
      },
      
      getCriticalCount: () => {
        return get().tickets.filter(
          t => t.priority === 'critical' && (t.status === 'open' || t.status === 'in_progress')
        ).length;
      },
      
      getOpenCount: () => {
        return get().tickets.filter(
          t => t.status === 'open' || t.status === 'in_progress'
        ).length;
      },
    }),
    {
      name: 'ticket-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
