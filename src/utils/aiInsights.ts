import { useGameStore } from '@/store/gameStore';

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical';
  title: string;
  message: string;
  suggestedActions: Array<{
    label: string;
    action: () => void;
    learnMore?: string;
  }>;
  priority: number;
}

export function generateInsights(): Insight[] {
  const insights: Insight[] = [];
  const state = useGameStore.getState();
  
  // Check for pending pods
  if (state.pendingPods.length > 0) {
    const hasNoInstances = state.instances.length === 0;
    const provisioningCount = state.instances.filter(i => i.status === 'provisioning').length;
    
    insights.push({
      id: 'pending-pods',
      type: 'warning',
      title: 'Pods Waiting for Capacity',
      message: hasNoInstances 
        ? `${state.pendingPods.length} pod(s) can't be scheduled. No compute nodes available.`
        : provisioningCount > 0
        ? `${state.pendingPods.length} pod(s) pending. ${provisioningCount} instance(s) booting...`
        : `${state.pendingPods.length} pod(s) pending. All instances at capacity.`,
      suggestedActions: hasNoInstances ? [
        {
          label: 'Add Instance',
          action: () => window.location.href = '/instances'
        },
        {
          label: 'Learn About Instances',
          action: () => {},
          learnMore: 'instances'
        }
      ] : [
        {
          label: 'Enable Autoscaler',
          action: () => state.updateASG({ enabled: true })
        }
      ],
      priority: 100
    });
  }

  // Check CPU usage
  const avgCpu = state.instances.reduce((sum, i) => sum + i.cpu, 0) / Math.max(1, state.instances.length);
  if (avgCpu > 80) {
    insights.push({
      id: 'high-cpu',
      type: 'critical',
      title: 'High CPU Load Detected',
      message: `Average CPU usage is ${avgCpu.toFixed(0)}%. Instances are struggling under load.`,
      suggestedActions: [
        {
          label: 'Scale Deployments',
          action: () => window.location.href = '/apps'
        },
        {
          label: 'Enable Autoscaler',
          action: () => state.updateASG({ enabled: true })
        },
        {
          label: 'Learn About Scaling',
          action: () => {},
          learnMore: 'auto_scaling'
        }
      ],
      priority: 90
    });
  } else if (avgCpu > 60) {
    insights.push({
      id: 'moderate-cpu',
      type: 'warning',
      title: 'CPU Usage Elevated',
      message: `CPU at ${avgCpu.toFixed(0)}%. Consider scaling before reaching critical levels.`,
      suggestedActions: [
        {
          label: 'Review Metrics',
          action: () => {}
        }
      ],
      priority: 50
    });
  }

  // Check error rate
  if (state.errorRate > 10) {
    insights.push({
      id: 'high-errors',
      type: 'critical',
      title: 'System Unstable',
      message: `Error rate is ${state.errorRate.toFixed(1)}%. Users experiencing failures.`,
      suggestedActions: [
        {
          label: 'Check Pods',
          action: () => window.location.href = '/apps'
        },
        {
          label: 'Restart Failed Pods',
          action: () => {}
        }
      ],
      priority: 95
    });
  } else if (state.errorRate > 5) {
    insights.push({
      id: 'moderate-errors',
      type: 'warning',
      title: 'Errors Increasing',
      message: `Error rate at ${state.errorRate.toFixed(1)}%. Monitor closely.`,
      suggestedActions: [],
      priority: 60
    });
  }

  // Check for crashed instances
  const crashedInstances = state.instances.filter(i => i.status === 'crashed');
  if (crashedInstances.length > 0) {
    insights.push({
      id: 'crashed-instances',
      type: 'critical',
      title: 'Instance Failure',
      message: `${crashedInstances.length} instance(s) crashed. Pods lost.`,
      suggestedActions: [
        {
          label: 'Restart Instances',
          action: () => {
            crashedInstances.forEach(i => state.restartInstance(i.id));
          }
        },
        {
          label: 'View Instances',
          action: () => window.location.href = '/instances'
        }
      ],
      priority: 100
    });
  }

  // Check if load balancer is disabled with high traffic
  if (!state.hasLoadBalancer && state.traffic > 50) {
    insights.push({
      id: 'no-lb',
      type: 'warning',
      title: 'Load Balancer Disabled',
      message: 'Traffic is not balanced across pods. Single point of failure!',
      suggestedActions: [
        {
          label: 'Enable Load Balancer',
          action: () => state.toggleLoadBalancer()
        },
        {
          label: 'Learn Why This Matters',
          action: () => {},
          learnMore: 'load_balancer'
        }
      ],
      priority: 70
    });
  }

  // No autoscaler with growing load
  if (!state.asg.enabled && avgCpu > 70 && state.instances.length < 3) {
    insights.push({
      id: 'no-asg',
      type: 'info',
      title: 'Autoscaler Not Enabled',
      message: 'Cluster Autoscaler can automatically add capacity when needed.',
      suggestedActions: [
        {
          label: 'Enable Autoscaler',
          action: () => state.updateASG({ enabled: true })
        },
        {
          label: 'Learn About ASG',
          action: () => {},
          learnMore: 'auto_scaling'
        }
      ],
      priority: 40
    });
  }

  // Positive insights
  if (state.errorRate < 1 && avgCpu < 60 && state.pendingPods.length === 0 && crashedInstances.length === 0) {
    insights.push({
      id: 'healthy',
      type: 'success',
      title: 'System Healthy',
      message: 'All metrics looking good. Everything running smoothly!',
      suggestedActions: [],
      priority: 10
    });
  }

  // Sort by priority (highest first)
  return insights.sort((a, b) => b.priority - a.priority);
}

export function calculateHealthScore(): { score: number; grade: string; color: string } {
  const state = useGameStore.getState();
  
  let score = 100;
  
  // Deduct for high CPU
  const avgCpu = state.instances.reduce((sum, i) => sum + i.cpu, 0) / Math.max(1, state.instances.length);
  if (avgCpu > 80) score -= 30;
  else if (avgCpu > 60) score -= 15;
  
  // Deduct for errors
  if (state.errorRate > 10) score -= 40;
  else if (state.errorRate > 5) score -= 20;
  else if (state.errorRate > 1) score -= 10;
  
  // Deduct for pending pods
  score -= Math.min(state.pendingPods.length * 5, 20);
  
  // Deduct for crashed instances
  const crashedCount = state.instances.filter(i => i.status === 'crashed').length;
  score -= crashedCount * 25;
  
  score = Math.max(0, Math.min(100, score));
  
  let grade = 'F';
  let color = 'text-red-500';
  
  if (score >= 90) { grade = 'A'; color = 'text-green-500'; }
  else if (score >= 80) { grade = 'B'; color = 'text-blue-500'; }
  else if (score >= 70) { grade = 'C'; color = 'text-yellow-500'; }
  else if (score >= 60) { grade = 'D'; color = 'text-orange-500'; }
  
  return { score, grade, color };
}
