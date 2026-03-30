import { useGameStore } from '@/store/gameStore';

export interface GuidanceSuggestion {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  actionCallback?: () => void;
  learnMoreTopic?: string;
  icon: string;
}

export const getGuidanceSuggestions = (): GuidanceSuggestion[] => {
  const state = useGameStore.getState();
  const suggestions: GuidanceSuggestion[] = [];

  const {
    instances,
    applications,
    pendingPods,
    hasLoadBalancer,
    hpa,
    asg,
    isRunning,
    traffic,
    cpuAvg,
    errorRate
  } = state;

  const runningInstances = instances.filter(i => i.status === 'running');
  const crashedInstances = instances.filter(i => i.status === 'crashed');
  const allPods = instances.flatMap(i => i.pods);
  const runningPods = allPods.filter(p => p.status === 'running');

  // CRITICAL: Simulation not running
  if (!isRunning) {
    suggestions.push({
      id: 'start-simulation',
      priority: 'critical',
      title: '▶️ Start the Simulation',
      description: 'Your cloud environment is paused. Click Play to begin.',
      action: 'Click the Play button in the top navigation',
      actionCallback: () => useGameStore.getState().toggleSimulation(),
      icon: '▶️'
    });
  }

  // CRITICAL: No instances
  if (instances.length === 0) {
    suggestions.push({
      id: 'create-instance',
      priority: 'critical',
      title: '🖥️ Create Your First Server',
      description: 'You need at least one instance (server) to run applications.',
      action: 'Go to Instances page and click "Add Instance"',
      learnMoreTopic: 'instances',
      icon: '🖥️'
    });
  }

  // CRITICAL: No applications
  if (applications.length === 0 && instances.length > 0) {
    suggestions.push({
      id: 'create-app',
      priority: 'critical',
      title: '📦 Deploy Your First Application',
      description: 'You have servers ready, now deploy an application to them.',
      action: 'Go to Applications page and click "New Application"',
      learnMoreTopic: 'deployments',
      icon: '📦'
    });
  }

  // HIGH: Pending pods
  if (pendingPods.length > 0) {
    suggestions.push({
      id: 'pending-pods',
      priority: 'high',
      title: '🟡 Pods Waiting for Capacity',
      description: `${pendingPods.length} pod(s) can't start because there's no server capacity available.`,
      action: 'Add more instances or enable Cluster Autoscaler',
      actionCallback: runningInstances.length === 0 
        ? undefined 
        : () => useGameStore.getState().updateASG({ enabled: true }),
      learnMoreTopic: 'pods',
      icon: '🟡'
    });
  }

  // HIGH: Crashed instances
  if (crashedInstances.length > 0) {
    suggestions.push({
      id: 'crashed-instances',
      priority: 'high',
      title: '💥 Servers Have Crashed',
      description: `${crashedInstances.length} instance(s) overloaded and crashed. Your app may be down!`,
      action: 'Add more capacity or reduce traffic',
      learnMoreTopic: 'instances',
      icon: '💥'
    });
  }

  // HIGH: No load balancer with traffic
  if (!hasLoadBalancer && traffic > 50 && runningPods.length > 1) {
    suggestions.push({
      id: 'enable-lb',
      priority: 'high',
      title: '⚖️ Enable Load Balancer',
      description: 'Without a load balancer, all traffic hits one pod causing overload.',
      action: 'Enable Load Balancer in Control Panel',
      actionCallback: () => useGameStore.getState().toggleLoadBalancer(),
      learnMoreTopic: 'load_balancer',
      icon: '⚖️'
    });
  }

  // MEDIUM: High CPU
  if (cpuAvg > 70 && runningPods.length > 0) {
    suggestions.push({
      id: 'high-cpu',
      priority: 'medium',
      title: '🔥 High CPU Usage Detected',
      description: `Average CPU is ${cpuAvg.toFixed(0)}%. Consider scaling your application.`,
      action: 'Enable HPA or add more replicas',
      actionCallback: !hpa.enabled 
        ? () => useGameStore.getState().updateHPA({ enabled: true })
        : undefined,
      learnMoreTopic: 'auto_scaling',
      icon: '🔥'
    });
  }

  // MEDIUM: High error rate
  if (errorRate > 5) {
    suggestions.push({
      id: 'high-errors',
      priority: 'medium',
      title: '⚠️ High Error Rate',
      description: `${errorRate.toFixed(1)}% of requests are failing. Your app is overloaded.`,
      action: 'Scale up to handle more traffic',
      learnMoreTopic: 'errors',
      icon: '⚠️'
    });
  }

  // MEDIUM: No autoscaling enabled
  if (applications.length > 0 && !hpa.enabled && !asg.enabled) {
    suggestions.push({
      id: 'enable-autoscaling',
      priority: 'medium',
      title: '🤖 Enable Auto-Scaling',
      description: 'Manual scaling is tedious. Let the system scale automatically based on demand.',
      action: 'Enable HPA (pods) and Cluster Autoscaler (nodes)',
      learnMoreTopic: 'auto_scaling',
      icon: '🤖'
    });
  }

  // LOW: Low replicas
  if (applications.length > 0 && runningPods.length < 2 && traffic > 100) {
    suggestions.push({
      id: 'increase-replicas',
      priority: 'low',
      title: '📈 Consider More Replicas',
      description: 'Running only 1-2 pods? Increase replicas for better availability.',
      action: 'Increase replica count in Applications page',
      learnMoreTopic: 'deployments',
      icon: '📈'
    });
  }

  // LOW: Good state!
  if (
    isRunning &&
    instances.length > 0 &&
    applications.length > 0 &&
    pendingPods.length === 0 &&
    crashedInstances.length === 0 &&
    cpuAvg < 70 &&
    errorRate < 2
  ) {
    suggestions.push({
      id: 'healthy',
      priority: 'low',
      title: '✅ System Running Smoothly',
      description: 'All systems operational. Great job managing your infrastructure!',
      action: 'Try scenarios to learn advanced patterns',
      icon: '✅'
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};
