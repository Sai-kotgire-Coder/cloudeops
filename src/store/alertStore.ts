import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'investigating' | 'resolved';
export type AlertCategory = 'cpu' | 'memory' | 'pod' | 'deployment' | 'traffic' | 'network' | 'performance' | 'capacity';

export interface AlertAction {
  id: string;
  label: string;
  action: () => void;
  icon?: string;
}

export interface AlertInsight {
  why: string;
  impact: string;
  recommendation: string;
  learnMoreUrl?: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: AlertCategory;
  serviceId?: string;
  serviceName?: string;
  affectedResources?: string[];
  metrics?: Record<string, number | string>;
  insight?: AlertInsight;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  acknowledgedAt?: number;
  dismissedAt?: number;
  groupKey?: string; // For grouping similar alerts
  count?: number; // Number of similar alerts grouped
  ticketId?: string; // Associated ticket
}

export interface AlertRule {
  id: string;
  name: string;
  severity: AlertSeverity;
  category: AlertCategory;
  condition: (state: any) => boolean;
  createAlert: (state: any) => Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
  cooldown: number; // milliseconds before can trigger again
  lastTriggered?: number;
  enabled: boolean;
}

// ============================================
// STORE INTERFACE
// ============================================

interface AlertState {
  // Data
  alerts: Alert[];
  alertHistory: Alert[];
  rules: AlertRule[];
  selectedAlertId: string | null;
  autoDetectionEnabled: boolean;
  groupSimilar: boolean;
  
  // Actions
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Alert;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  acknowledgeAlert: (id: string) => void;
  investigateAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  selectAlert: (id: string | null) => void;
  
  // Rules Management
  registerRule: (rule: AlertRule) => void;
  updateRule: (id: string, updates: Partial<AlertRule>) => void;
  enableRule: (id: string) => void;
  disableRule: (id: string) => void;
  checkRules: (systemState: any) => void;
  
  // Settings
  toggleAutoDetection: () => void;
  toggleGroupSimilar: () => void;
  
  // Helpers
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];
  getAlertsByStatus: (status: AlertStatus) => Alert[];
  getActiveAlerts: () => Alert[];
  getCriticalCount: () => number;
  getHighCount: () => number;
  clearHistory: () => void;
  clearAllAlerts: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

let alertCounter = 0;

const generateAlertId = (): string => {
  alertCounter++;
  return `ALT-${Date.now()}-${alertCounter.toString().padStart(4, '0')}`;
};

const findSimilarAlert = (alerts: Alert[], newAlert: Pick<Alert, 'title' | 'category' | 'serviceName'>): Alert | undefined => {
  return alerts.find(a => 
    a.status === 'active' &&
    a.title === newAlert.title &&
    a.category === newAlert.category &&
    a.serviceName === newAlert.serviceName
  );
};

// ============================================
// DEFAULT ALERT RULES
// ============================================

const DEFAULT_RULES: AlertRule[] = [
  // ==================== CRITICAL ALERTS ====================
  {
    id: 'rule-pod-crash',
    name: 'Pod Crash Detection',
    severity: 'critical',
    category: 'pod',
    enabled: true,
    cooldown: 120000, // 2 minutes
    condition: (state: any) => {
      const instances = state.instances || [];
      const pods = instances.flatMap((i: any) => i.pods || []);
      return pods.some((pod: any) => pod.status === 'crashed');
    },
    createAlert: (state: any) => {
      const instances = state.instances || [];
      const crashedPods = instances.flatMap((i: any) => 
        (i.pods || []).filter((p: any) => p.status === 'crashed')
      );
      
      return {
        title: 'Pod Crashed',
        message: `${crashedPods.length} pod(s) have crashed and are not responding`,
        severity: 'critical',
        category: 'pod',
        affectedResources: crashedPods.map((p: any) => p.id),
        metrics: { crashedPods: crashedPods.length },
        insight: {
          why: 'Pods crashed due to resource exhaustion, application errors, or health check failures',
          impact: 'Service availability is degraded. Users may experience errors or downtime.',
          recommendation: 'Restart crashed pods immediately and investigate root cause (check logs, resource limits, health checks)',
        },
        groupKey: 'pod-crash',
      };
    },
  },
  
  {
    id: 'rule-no-pods-running',
    name: 'No Running Pods',
    severity: 'critical',
    category: 'deployment',
    enabled: true,
    cooldown: 60000, // 1 minute
    condition: (state: any) => {
      const instances = state.instances || [];
      const pods = instances.flatMap((i: any) => i.pods || []);
      const runningPods = pods.filter((p: any) => p.status === 'running');
      return pods.length > 0 && runningPods.length === 0;
    },
    createAlert: (state: any) => ({
      title: 'No Pods Running',
      message: 'All pods are down - service is completely unavailable',
      severity: 'critical',
      category: 'deployment',
      metrics: { runningPods: 0 },
      insight: {
        why: 'All pods have crashed or failed to start. This could be due to deployment failure, resource constraints, or application bugs.',
        impact: 'Complete service outage. All incoming requests will fail.',
        recommendation: 'URGENT: Check deployment status, review pod logs, verify resource availability, and rollback to last known good version if needed',
      },
      groupKey: 'no-pods',
    }),
  },
  
  {
    id: 'rule-deployment-failure',
    name: 'Deployment Failure',
    severity: 'critical',
    category: 'deployment',
    enabled: true,
    cooldown: 180000, // 3 minutes
    condition: (state: any) => {
      const apps = state.applications || [];
      return apps.some((app: any) => {
        const deployment = app.deployments?.find((d: any) => d.version === app.activeVersion);
        if (!deployment) return false;
        
        const instances = state.instances || [];
        const appPods = instances.flatMap((i: any) => 
          (i.pods || []).filter((p: any) => p.appId === app.id && p.version === app.activeVersion)
        );
        
        const runningPods = appPods.filter((p: any) => p.status === 'running').length;
        return deployment.replicas > 0 && runningPods === 0;
      });
    },
    createAlert: (state: any) => ({
      title: 'Deployment Failed',
      message: 'Application deployment failed - no replicas are running',
      severity: 'critical',
      category: 'deployment',
      insight: {
        why: 'The deployment specified replicas but none are running. Common causes: image pull errors, insufficient resources, or application startup failures.',
        impact: 'New deployment is not serving traffic. Service may be degraded or down.',
        recommendation: 'Check deployment logs, verify image availability, ensure sufficient cluster resources, and review application startup configurations',
      },
      groupKey: 'deployment-failure',
    }),
  },
  
  {
    id: 'rule-traffic-overload',
    name: 'System Overload',
    severity: 'critical',
    category: 'traffic',
    enabled: true,
    cooldown: 120000,
    condition: (state: any) => {
      const instances = state.instances || [];
      const totalCapacity = instances
        .filter((i: any) => i.status === 'running')
        .reduce((sum: number, i: any) => {
          const type = state.INSTANCE_TYPES?.[i.typeId];
          return sum + (type?.maxRps || 0);
        }, 0);
      
      const currentTraffic = state.traffic || 0;
      return currentTraffic > totalCapacity * 1.2; // 120% of capacity
    },
    createAlert: (state: any) => {
      const instances = state.instances || [];
      const totalCapacity = instances
        .filter((i: any) => i.status === 'running')
        .reduce((sum: number, i: any) => {
          const type = state.INSTANCE_TYPES?.[i.typeId];
          return sum + (type?.maxRps || 0);
        }, 0);
      
      return {
        title: 'System Overload',
        message: `Traffic (${state.traffic} RPS) exceeds system capacity (${totalCapacity} RPS)`,
        severity: 'critical',
        category: 'traffic',
        metrics: { 
          currentTraffic: state.traffic, 
          capacity: totalCapacity,
          overloadPercent: Math.round((state.traffic / totalCapacity - 1) * 100)
        },
        insight: {
          why: `Current traffic load of ${state.traffic} RPS exceeds infrastructure capacity of ${totalCapacity} RPS. Each running instance can handle a limited number of requests per second.`,
          impact: 'High error rates, increased latency, potential service crashes. Users experiencing slow responses or failures.',
          recommendation: 'Enable Auto-Scaling (ASG/HPA) immediately to add more capacity, or temporarily reduce incoming traffic via rate limiting',
        },
        groupKey: 'traffic-overload',
      };
    },
  },
  
  // ==================== HIGH SEVERITY ALERTS ====================
  {
    id: 'rule-high-cpu',
    name: 'High CPU Usage',
    severity: 'high',
    category: 'cpu',
    enabled: true,
    cooldown: 180000, // 3 minutes
    condition: (state: any) => {
      const instances = state.instances || [];
      const highCpuInstances = instances.filter((i: any) => i.status === 'running' && i.cpu > 80);
      return highCpuInstances.length > 0;
    },
    createAlert: (state: any) => {
      const instances = state.instances || [];
      const highCpuInstances = instances.filter((i: any) => i.status === 'running' && i.cpu > 80);
      const avgCpu = highCpuInstances.reduce((sum: number, i: any) => sum + i.cpu, 0) / highCpuInstances.length;
      
      return {
        title: 'High CPU Usage',
        message: `${highCpuInstances.length} instance(s) running at ${avgCpu.toFixed(0)}% CPU`,
        severity: 'high',
        category: 'cpu',
        affectedResources: highCpuInstances.map((i: any) => i.name),
        metrics: { 
          affectedInstances: highCpuInstances.length,
          avgCpu: Math.round(avgCpu),
          maxCpu: Math.max(...highCpuInstances.map((i: any) => i.cpu))
        },
        insight: {
          why: `High CPU usage indicates instances are processing heavy workloads. This could be due to traffic spikes, inefficient code, or insufficient capacity.`,
          impact: 'Performance degradation, increased latency, potential crashes if sustained.',
          recommendation: avgCpu > 90 
            ? 'URGENT: Enable HPA to scale out pods or ASG to add instances. CPU > 90% is critical.' 
            : 'Monitor for 5 minutes. If sustained, enable auto-scaling or optimize application performance.',
        },
        groupKey: 'high-cpu',
        count: highCpuInstances.length,
      };
    },
  },
  
  {
    id: 'rule-high-memory',
    name: 'High Memory Usage',
    severity: 'high',
    category: 'memory',
    enabled: true,
    cooldown: 180000,
    condition: (state: any) => {
      const instances = state.instances || [];
      return instances.some((i: any) => i.status === 'running' && i.memory > 85);
    },
    createAlert: (state: any) => {
      const instances = state.instances || [];
      const highMemInstances = instances.filter((i: any) => i.status === 'running' && i.memory > 85);
      const avgMem = highMemInstances.reduce((sum: number, i: any) => sum + i.memory, 0) / highMemInstances.length;
      
      return {
        title: 'High Memory Usage',
        message: `${highMemInstances.length} instance(s) running at ${avgMem.toFixed(0)}% memory`,
        severity: 'high',
        category: 'memory',
        affectedResources: highMemInstances.map((i: any) => i.name),
        metrics: { 
          affectedInstances: highMemInstances.length,
          avgMemory: Math.round(avgMem)
        },
        insight: {
          why: 'High memory usage could indicate memory leaks, caching issues, or insufficient resources for the workload.',
          impact: 'Risk of OOM (Out of Memory) kills, which will crash pods and cause service disruption.',
          recommendation: 'Enable VPA to allocate more memory, check for memory leaks in application code, or restart instances if leak suspected.',
        },
        groupKey: 'high-memory',
        count: highMemInstances.length,
      };
    },
  },
  
  {
    id: 'rule-high-error-rate',
    name: 'High Error Rate',
    severity: 'high',
    category: 'performance',
    enabled: true,
    cooldown: 120000,
    condition: (state: any) => {
      return (state.errorRate || 0) > 10; // > 10% error rate
    },
    createAlert: (state: any) => ({
      title: 'High Error Rate',
      message: `Error rate at ${state.errorRate.toFixed(1)}% - users experiencing failures`,
      severity: 'high',
      category: 'performance',
      metrics: { errorRate: state.errorRate },
      insight: {
        why: 'High error rates typically result from resource exhaustion, application bugs, or infrastructure issues.',
        impact: 'Poor user experience. Users are receiving errors instead of successful responses.',
        recommendation: 'Check application logs, verify sufficient capacity, review recent deployments for bugs, and consider rollback if errors started after deployment.',
      },
      groupKey: 'high-errors',
    }),
  },
  
  // ==================== MEDIUM SEVERITY ALERTS ====================
  {
    id: 'rule-pending-pods',
    name: 'Pending Pods',
    severity: 'medium',
    category: 'pod',
    enabled: true,
    cooldown: 240000, // 4 minutes
    condition: (state: any) => {
      const pendingPods = state.pendingPods || [];
      return pendingPods.length > 0;
    },
    createAlert: (state: any) => {
      const pendingPods = state.pendingPods || [];
      return {
        title: 'Pods Pending Scheduling',
        message: `${pendingPods.length} pod(s) waiting to be scheduled`,
        severity: 'medium',
        category: 'pod',
        metrics: { pendingPods: pendingPods.length },
        insight: {
          why: 'Pods are pending because there are no instances with sufficient resources to run them. This could be due to resource constraints or no instances assigned to the application.',
          impact: 'Desired replicas cannot start. Service capacity is lower than expected.',
          recommendation: 'Assign more instances to the application or enable ASG to provision additional instances automatically.',
        },
        groupKey: 'pending-pods',
      };
    },
  },
  
  {
    id: 'rule-slow-response',
    name: 'Slow Response Time',
    severity: 'medium',
    category: 'performance',
    enabled: true,
    cooldown: 300000,
    condition: (state: any) => {
      return (state.latencyAvg || 0) > 200; // > 200ms
    },
    createAlert: (state: any) => ({
      title: 'Slow Response Time',
      message: `Average latency at ${state.latencyAvg.toFixed(0)}ms - performance degraded`,
      severity: 'medium',
      category: 'performance',
      metrics: { latency: Math.round(state.latencyAvg) },
      insight: {
        why: 'Increased latency often results from high CPU/memory usage, insufficient capacity, or inefficient application code.',
        impact: 'Degraded user experience. Pages and API calls are taking longer to respond.',
        recommendation: 'Monitor resource usage, consider scaling if load is high, check for performance bottlenecks in application code.',
      },
      groupKey: 'slow-response',
    }),
  },
  
  {
    id: 'rule-instance-provisioning',
    name: 'Instance Provisioning',
    severity: 'medium',
    category: 'capacity',
    enabled: true,
    cooldown: 180000,
    condition: (state: any) => {
      const instances = state.instances || [];
      const provisioning = instances.filter((i: any) => i.status === 'provisioning');
      return provisioning.length > 2;
    },
    createAlert: (state: any) => {
      const instances = state.instances || [];
      const provisioning = instances.filter((i: any) => i.status === 'provisioning');
      return {
        title: 'Multiple Instances Provisioning',
        message: `${provisioning.length} instances are being provisioned`,
        severity: 'medium',
        category: 'capacity',
        metrics: { provisioningCount: provisioning.length },
        insight: {
          why: 'Multiple instances are being created (likely by ASG). This typically happens during scale-out events.',
          impact: 'Capacity is being added but not yet available. Current load must be handled by existing instances.',
          recommendation: 'Monitor progress. Instances typically take 30-60 seconds to become ready. Verify they start successfully.',
        },
        groupKey: 'provisioning',
      };
    },
  },
  
  // ==================== LOW SEVERITY ALERTS ====================
  {
    id: 'rule-no-load-balancer',
    name: 'Load Balancer Disabled',
    severity: 'low',
    category: 'network',
    enabled: true,
    cooldown: 600000, // 10 minutes
    condition: (state: any) => {
      const instances = state.instances || [];
      return instances.length > 1 && !state.hasLoadBalancer;
    },
    createAlert: (state: any) => ({
      title: 'Load Balancer Not Enabled',
      message: `${state.instances.length} instances running without load balancing`,
      severity: 'low',
      category: 'network',
      metrics: { instanceCount: state.instances.length },
      insight: {
        why: 'Multiple instances are running but load balancer is disabled. Traffic may not be distributed evenly.',
        impact: 'Inefficient resource usage. Some instances may be overloaded while others are idle.',
        recommendation: 'Enable the load balancer to distribute traffic evenly across all instances.',
      },
      groupKey: 'no-lb',
    }),
  },
  
  {
    id: 'rule-no-autoscaling',
    name: 'Auto-Scaling Disabled',
    severity: 'low',
    category: 'capacity',
    enabled: true,
    cooldown: 600000,
    condition: (state: any) => {
      const isRunning = state.isRunning;
      const hasASG = state.asg?.enabled;
      const hasHPA = state.hpa?.enabled;
      return isRunning && !hasASG && !hasHPA;
    },
    createAlert: (state: any) => ({
      title: 'Auto-Scaling Not Configured',
      message: 'Neither ASG nor HPA is enabled - system cannot auto-scale',
      severity: 'low',
      category: 'capacity',
      insight: {
        why: 'Auto-scaling is disabled. The system cannot automatically adjust capacity based on load.',
        impact: 'Manual intervention required during traffic spikes. Risk of overload or inefficiency.',
        recommendation: 'Enable ASG (instance-level scaling) or HPA (pod-level scaling) for production resilience.',
      },
      groupKey: 'no-autoscaling',
    }),
  },
];

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      // Initial State
      alerts: [],
      alertHistory: [],
      rules: DEFAULT_RULES,
      selectedAlertId: null,
      autoDetectionEnabled: true,
      groupSimilar: true,
      
      // Add Alert
      addAlert: (alertData) => {
        const state = get();
        const now = Date.now();
        
        // Check if grouping is enabled
        if (state.groupSimilar && alertData.groupKey) {
          const similar = findSimilarAlert(state.alerts, alertData);
          if (similar) {
            // Update existing alert
            set(s => ({
              alerts: s.alerts.map(a => 
                a.id === similar.id 
                  ? { ...a, count: (a.count || 1) + 1, updatedAt: now }
                  : a
              )
            }));
            
            // Update backend
            apiClient.updateAlert(similar.id, {
              count: (similar.count || 1) + 1,
            }).catch(err => console.error('Failed to update alert:', err));
            
            return similar;
          }
        }
        
        // Create new alert
        const newAlert: Alert = {
          ...alertData,
          id: generateAlertId(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
          count: 1,
        };
        
        set(s => ({
          alerts: [newAlert, ...s.alerts]
        }));
        
        // Save to backend
        apiClient.createAlert({
          type: alertData.category,
          severity: alertData.severity,
          message: alertData.message,
          source: alertData.serviceName,
          status: 'active',
          metadata: {
            title: alertData.title,
            affectedResources: alertData.affectedResources,
            metrics: alertData.metrics,
            insight: alertData.insight,
            groupKey: alertData.groupKey
          }
        }).catch(err => console.error('Failed to save alert:', err));
        
        // Show toast notification
        const severityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '⚪',
        };
        
        toast.error(`${severityEmoji[newAlert.severity]} ${newAlert.title}`, {
          description: newAlert.message,
          duration: newAlert.severity === 'critical' ? 10000 : 5000,
        });
        
        return newAlert;
      },
      
      // Update Alert
      updateAlert: (id, updates) => {
        set(s => ({
          alerts: s.alerts.map(a => 
            a.id === id 
              ? { ...a, ...updates, updatedAt: Date.now() }
              : a
          )
        }));
        
        // Update backend
        apiClient.updateAlert(id, updates).catch(err => console.error('Failed to update alert:', err));
      },
      
      // Acknowledge Alert
      acknowledgeAlert: (id) => {
        get().updateAlert(id, { acknowledgedAt: Date.now() });
        toast.success('Alert acknowledged');
      },
      
      // Investigate Alert
      investigateAlert: (id) => {
        get().updateAlert(id, { 
          status: 'investigating',
          acknowledgedAt: Date.now()
        });
        toast.info('Alert status: Investigating');
      },
      
      // Resolve Alert
      resolveAlert: (id) => {
        const alert = get().alerts.find(a => a.id === id);
        if (!alert) return;
        
        // Move to history
        set(s => ({
          alerts: s.alerts.filter(a => a.id !== id),
          alertHistory: [{
            ...alert,
            status: 'resolved',
            resolvedAt: Date.now(),
            updatedAt: Date.now(),
          }, ...s.alertHistory]
        }));
        
        toast.success('Alert resolved ✅');
      },
      
      // Dismiss Alert
      dismissAlert: (id) => {
        const alert = get().alerts.find(a => a.id === id);
        if (!alert) return;
        
        set(s => ({
          alerts: s.alerts.filter(a => a.id !== id),
          alertHistory: [{
            ...alert,
            status: 'resolved',
            dismissedAt: Date.now(),
            resolvedAt: Date.now(),
            updatedAt: Date.now(),
          }, ...s.alertHistory]
        }));
      },
      
      // Select Alert
      selectAlert: (id) => {
        set({ selectedAlertId: id });
      },
      
      // Register Rule
      registerRule: (rule) => {
        set(s => ({
          rules: [...s.rules.filter(r => r.id !== rule.id), rule]
        }));
      },
      
      // Update Rule
      updateRule: (id, updates) => {
        set(s => ({
          rules: s.rules.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
      },
      
      // Enable Rule
      enableRule: (id) => {
        get().updateRule(id, { enabled: true });
      },
      
      // Disable Rule
      disableRule: (id) => {
        get().updateRule(id, { enabled: false });
      },
      
      // Check Rules
      checkRules: (systemState) => {
        const state = get();
        if (!state.autoDetectionEnabled) return;
        
        const now = Date.now();
        
        state.rules.forEach(rule => {
          if (!rule.enabled) return;
          
          // Check cooldown
          if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
            return;
          }
          
          // Check condition
          try {
            if (rule.condition(systemState)) {
              const alertData = rule.createAlert(systemState);
              state.addAlert(alertData);
              
              // Update last triggered
              get().updateRule(rule.id, { lastTriggered: now });
            }
          } catch (error) {
            console.error(`Error checking rule ${rule.id}:`, error);
          }
        });
      },
      
      // Toggle Auto Detection
      toggleAutoDetection: () => {
        set(s => ({ 
          autoDetectionEnabled: !s.autoDetectionEnabled 
        }));
        toast.success(
          get().autoDetectionEnabled 
            ? 'Auto-detection enabled' 
            : 'Auto-detection disabled'
        );
      },
      
      // Toggle Group Similar
      toggleGroupSimilar: () => {
        set(s => ({ groupSimilar: !s.groupSimilar }));
      },
      
      // Get Alerts by Severity
      getAlertsBySeverity: (severity) => {
        return get().alerts.filter(a => a.severity === severity && a.status === 'active');
      },
      
      // Get Alerts by Status
      getAlertsByStatus: (status) => {
        return get().alerts.filter(a => a.status === status);
      },
      
      // Get Active Alerts
      getActiveAlerts: () => {
        return get().alerts.filter(a => a.status === 'active');
      },
      
      // Get Critical Count
      getCriticalCount: () => {
        return get().alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;
      },
      
      // Get High Count
      getHighCount: () => {
        return get().alerts.filter(a => a.status === 'active' && a.severity === 'high').length;
      },
      
      // Clear History
      clearHistory: () => {
        set({ alertHistory: [] });
        toast.success('Alert history cleared');
      },
      
      // Clear All Alerts
      clearAllAlerts: () => {
        set(s => ({
          alerts: [],
          alertHistory: [...s.alerts.map(a => ({
            ...a,
            status: 'resolved' as AlertStatus,
            resolvedAt: Date.now(),
            dismissedAt: Date.now(),
          })), ...s.alertHistory]
        }));
        toast.success('All alerts cleared');
      },
    }),
    {
      name: 'alert-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        alertHistory: state.alertHistory.slice(0, 100), // Keep last 100 in history
        autoDetectionEnabled: state.autoDetectionEnabled,
        groupSimilar: state.groupSimilar,
        rules: state.rules,
      }),
    }
  )
);
