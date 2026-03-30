import { useGameStore } from '@/store/gameStore';
import { useAlertStore } from '@/store/alertStore';
import { Brain, Sparkles, AlertTriangle, TrendingUp, CheckCircle2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function EnhancedAIMentor() {
  const {
    instances,
    cpuAvg,
    traffic,
    errorRate,
    pendingPods,
    hasLoadBalancer,
    hpa,
    asg,
    isRunning,
  } = useGameStore();

  const criticalAlerts = useAlertStore(s => s.getCriticalCount());
  const [currentInsight, setCurrentInsight] = useState(0);
  const [insights, setInsights] = useState<Array<{
    id: string;
    type: 'critical' | 'warning' | 'success' | 'info';
    message: string;
    action?: string;
  }>>([]);

  useEffect(() => {
    const newInsights = [];

    // Critical insights
    if (criticalAlerts > 0) {
      newInsights.push({
        id: 'critical-alerts',
        type: 'critical' as const,
        message: `🚨 You have ${criticalAlerts} critical alert${criticalAlerts > 1 ? 's' : ''}! Immediate action required.`,
        action: 'View Alerts',
      });
    }

    const runningInstances = instances.filter(i => i.status === 'running');
    if (runningInstances.length === 0 && instances.length > 0) {
      newInsights.push({
        id: 'no-running',
        type: 'critical' as const,
        message: '💥 All instances are down! Your service is completely unavailable.',
        action: 'Restart Instances',
      });
    }

    // Warning insights
    if (cpuAvg > 80 && !hpa.enabled) {
      newInsights.push({
        id: 'high-cpu-no-hpa',
        type: 'warning' as const,
        message: `⚠️ CPU usage at ${cpuAvg.toFixed(0)}%. Enable HPA to auto-scale pods.`,
        action: 'Enable HPA',
      });
    }

    if (traffic > 200 && !hasLoadBalancer && runningInstances.length > 1) {
      newInsights.push({
        id: 'no-lb',
        type: 'warning' as const,
        message: '⚠️ High traffic without load balancing. Traffic is not distributed evenly.',
        action: 'Enable Load Balancer',
      });
    }

    if (pendingPods.length > 0 && !asg.enabled) {
      newInsights.push({
        id: 'pending-no-asg',
        type: 'warning' as const,
        message: `⚠️ ${pendingPods.length} pod(s) pending. Enable ASG to auto-provision instances.`,
        action: 'Enable ASG',
      });
    }

    if (errorRate > 10) {
      newInsights.push({
        id: 'high-errors',
        type: 'warning' as const,
        message: `⚠️ Error rate at ${errorRate.toFixed(1)}%. Users are experiencing failures.`,
        action: 'Scale Resources',
      });
    }

    // Success insights
    if (cpuAvg < 30 && runningInstances.length > 1 && traffic < 100) {
      newInsights.push({
        id: 'over-provisioned',
        type: 'success' as const,
        message: '✅ System is over-provisioned. CPU is low. Consider scaling down to save costs.',
      });
    }

    if (hpa.enabled && asg.enabled && hasLoadBalancer && errorRate < 5) {
      newInsights.push({
        id: 'well-configured',
        type: 'success' as const,
        message: '🎉 Excellent! Auto-scaling enabled, load balanced, and low error rate.',
      });
    }

    // Info insights
    if (!isRunning) {
      newInsights.push({
        id: 'not-running',
        type: 'info' as const,
        message: '▶️ Start the simulation to see real-time insights and recommendations.',
      });
    } else if (traffic < 50) {
      newInsights.push({
        id: 'low-traffic',
        type: 'info' as const,
        message: '📊 Traffic is low. Increase load to test system resilience.',
        action: 'Increase Traffic',
      });
    }

    if (newInsights.length === 0) {
      newInsights.push({
        id: 'all-good',
        type: 'success' as const,
        message: '✨ System is healthy and running smoothly. Great job!',
      });
    }

    setInsights(newInsights);
  }, [instances, cpuAvg, traffic, errorRate, pendingPods, hasLoadBalancer, hpa, asg, isRunning, criticalAlerts]);

  useEffect(() => {
    if (insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentInsight((prev) => (prev + 1) % insights.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [insights.length]);

  const currentInsightData = insights[currentInsight];

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
        };
      default:
        return {
          icon: Lightbulb,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
        };
    }
  };

  if (!currentInsightData) return null;

  const config = getTypeConfig(currentInsightData.type);
  const Icon = config.icon;

  return (
    <div className="panel p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          AI DevOps Mentor
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Dynamic system insights
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentInsightData.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground/90">
                {currentInsightData.message}
              </p>
              {currentInsightData.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                >
                  {currentInsightData.action} →
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Insight Counter */}
      {insights.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {insights.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentInsight(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentInsight
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-primary/30'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {currentInsight + 1} / {insights.length}
          </p>
        </div>
      )}

      {/* Powered by AI badge */}
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Sparkles className="w-3 h-3" />
        <span>Powered by AI Analysis</span>
      </div>
    </div>
  );
}
