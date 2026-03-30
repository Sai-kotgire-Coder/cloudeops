import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';

interface AIInsight {
  type: 'suggestion' | 'warning' | 'success' | 'info';
  message: string;
  action?: string;
  icon: React.ElementType;
  color: string;
}

function getAIInsights(
  instances: any[],
  traffic: number,
  cpuAvg: number,
  hasLoadBalancer: boolean,
  hpaEnabled: boolean,
  asgEnabled: boolean
): AIInsight[] {
  const insights: AIInsight[] = [];
  const running = instances.filter(i => i.status === 'running');
  const stopped = instances.filter(i => i.status === 'stopped');
  const crashed = instances.filter(i => i.status === 'crashed');
  const highLoadInstances = running.filter(i => i.cpu > 80);

  // Critical issues first
  if (crashed.length > 0) {
    insights.push({
      type: 'warning',
      message: `${crashed.length} instance${crashed.length > 1 ? 's' : ''} crashed! Restart immediately to restore capacity.`,
      action: 'Restart crashed instances',
      icon: AlertTriangle,
      color: 'text-red-500',
    });
  }

  if (highLoadInstances.length > 0 && !asgEnabled && !hpaEnabled) {
    insights.push({
      type: 'warning',
      message: `${highLoadInstances.length} instance${highLoadInstances.length > 1 ? 's have' : ' has'} CPU >80%. Enable auto-scaling or add instances manually.`,
      action: 'Enable HPA or add instances',
      icon: TrendingUp,
      color: 'text-orange-500',
    });
  }

  if (running.length > 1 && !hasLoadBalancer) {
    insights.push({
      type: 'suggestion',
      message: 'You have multiple instances but no load balancer. Traffic is not distributed evenly.',
      action: 'Enable Load Balancer',
      icon: Lightbulb,
      color: 'text-yellow-500',
    });
  }

  // Scaling suggestions
  if (traffic > 0 && cpuAvg < 30 && running.length > 2) {
    insights.push({
      type: 'suggestion',
      message: `Low CPU usage (${cpuAvg.toFixed(0)}%) across ${running.length} instances. Consider scaling down to save costs.`,
      action: 'Scale down to reduce costs',
      icon: TrendingDown,
      color: 'text-blue-500',
    });
  }

  if (traffic === 0 && stopped.length > 0) {
    insights.push({
      type: 'info',
      message: `${stopped.length} instance${stopped.length > 1 ? 's are' : ' is'} stopped. Start them when you receive traffic.`,
      action: 'Wait for traffic or start instances',
      icon: CheckCircle,
      color: 'text-gray-500',
    });
  }

  if (cpuAvg > 70 && cpuAvg < 85 && asgEnabled) {
    insights.push({
      type: 'success',
      message: 'ASG is monitoring the load. It will auto-scale when needed.',
      icon: CheckCircle,
      color: 'text-green-500',
    });
  }

  if (running.length === 0 && traffic > 0) {
    insights.push({
      type: 'warning',
      message: 'No running instances! Add or start instances to handle traffic.',
      action: 'Start instances immediately',
      icon: AlertTriangle,
      color: 'text-red-500',
    });
  }

  // Efficiency praise
  if (cpuAvg > 50 && cpuAvg < 75 && running.length > 0 && hasLoadBalancer) {
    insights.push({
      type: 'success',
      message: 'System is well-balanced! CPU usage is optimal and load balancer is distributing traffic.',
      icon: CheckCircle,
      color: 'text-green-500',
    });
  }

  return insights.slice(0, 3); // Show top 3 insights
}

export function AIDevOpsMentor() {
  const { instances, traffic, cpuAvg, hasLoadBalancer, hpa, asg } = useGameStore();
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  
  const insights = getAIInsights(
    instances,
    traffic,
    cpuAvg,
    hasLoadBalancer,
    hpa.enabled,
    asg.enabled
  );

  useEffect(() => {
    if (insights.length === 0) return;
    const interval = setInterval(() => {
      setCurrentInsightIndex(prev => (prev + 1) % insights.length);
    }, 6000); // Rotate every 6 seconds
    return () => clearInterval(interval);
  }, [insights.length]);

  if (insights.length === 0) {
    return (
      <div className="panel p-6 text-center">
        <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          All systems nominal. No recommendations at this time.
        </p>
      </div>
    );
  }

  const currentInsight = insights[currentInsightIndex];
  const Icon = currentInsight.icon;

  return (
    <div className="panel overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">AI DevOps Mentor</h3>
        <div className="ml-auto flex gap-1">
          {insights.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentInsightIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 min-h-[140px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInsightIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${currentInsight.color.replace('text-', 'bg-')}/10 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${currentInsight.color}`} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${currentInsight.color}`}>
                    {currentInsight.type}
                  </span>
                </div>
                
                <p className="text-sm leading-relaxed">
                  {currentInsight.message}
                </p>

                {currentInsight.action && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    {currentInsight.action}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-4 text-xs text-muted-foreground">
        Insight {currentInsightIndex + 1} of {insights.length} • Updates every 6s
      </div>
    </div>
  );
}
