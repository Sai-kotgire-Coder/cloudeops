import { useGameStore } from '@/store/gameStore';
import { useAlertStore } from '@/store/alertStore';
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export function SmartHealthScore() {
  const {
    instances,
    cpuAvg,
    errorRate,
    pendingPods,
    applications,
  } = useGameStore();

  const criticalAlerts = useAlertStore(s => s.getCriticalCount());
  const highAlerts = useAlertStore(s => s.getHighCount());

  // Calculate health score components
  const runningInstances = instances.filter(i => i.status === 'running');
  const totalInstances = instances.length;
  
  // Instance health (0-25 points)
  const instanceScore = totalInstances > 0 
    ? Math.round((runningInstances.length / totalInstances) * 25)
    : 0;

  // CPU health (0-25 points) - lower CPU is better
  const cpuScore = Math.max(0, Math.round((100 - cpuAvg) / 100 * 25));

  // Error health (0-25 points) - lower errors is better
  const errorScore = Math.max(0, Math.round((100 - errorRate) / 100 * 25));

  // Alert health (0-25 points) - fewer alerts is better
  const alertPenalty = (criticalAlerts * 5) + (highAlerts * 2);
  const alertScore = Math.max(0, 25 - alertPenalty);

  // Total score
  const totalScore = instanceScore + cpuScore + errorScore + alertScore;

  // Health grade
  const getGrade = (score: number) => {
    if (score >= 90) return { letter: 'A', label: 'Excellent', color: 'text-green-500' };
    if (score >= 75) return { letter: 'B', label: 'Good', color: 'text-blue-500' };
    if (score >= 60) return { letter: 'C', label: 'Fair', color: 'text-yellow-500' };
    if (score >= 40) return { letter: 'D', label: 'Poor', color: 'text-orange-500' };
    return { letter: 'F', label: 'Critical', color: 'text-red-500' };
  };

  const grade = getGrade(totalScore);

  // Health factors
  const factors = [
    {
      label: 'Instances',
      score: instanceScore,
      max: 25,
      status: instanceScore > 20 ? 'good' : instanceScore > 10 ? 'fair' : 'poor',
      detail: `${runningInstances.length}/${totalInstances} running`,
    },
    {
      label: 'CPU Usage',
      score: cpuScore,
      max: 25,
      status: cpuScore > 20 ? 'good' : cpuScore > 10 ? 'fair' : 'poor',
      detail: `${cpuAvg.toFixed(0)}% average`,
    },
    {
      label: 'Error Rate',
      score: errorScore,
      max: 25,
      status: errorScore > 20 ? 'good' : errorScore > 10 ? 'fair' : 'poor',
      detail: `${errorRate.toFixed(1)}% errors`,
    },
    {
      label: 'Alerts',
      score: alertScore,
      max: 25,
      status: alertScore > 20 ? 'good' : alertScore > 10 ? 'fair' : 'poor',
      detail: `${criticalAlerts + highAlerts} urgent`,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'fair':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
    }
  };

  return (
    <div className="panel p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          System Health Score
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          AI-calculated infrastructure grade
        </p>
      </div>

      {/* Main Score Display */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative p-6 rounded-xl bg-[#111827] border border-green-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl font-bold ${grade.color}`}>
                {grade.letter}
              </span>
              <div>
                <p className={`text-2xl font-bold ${grade.color}`}>
                  {totalScore}
                </p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {grade.label} Health
            </p>
          </div>

          {totalScore >= 75 ? (
            <TrendingUp className="w-12 h-12 text-green-500/50" />
          ) : (
            <TrendingDown className="w-12 h-12 text-orange-500/50" />
          )}
        </div>

        <Progress value={totalScore} className="h-2" />
      </motion.div>

      {/* Health Factors Breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Health Factors</p>
        {factors.map((factor, idx) => (
          <motion.div
            key={factor.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-2 p-2 rounded bg-secondary/30"
          >
            {getStatusIcon(factor.status)}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{factor.label}</span>
                <span className="text-xs text-muted-foreground">
                  {factor.score}/{factor.max}
                </span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    factor.status === 'good' ? 'bg-green-500' :
                    factor.status === 'fair' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(factor.score / factor.max) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {factor.detail}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
        <p className="text-xs font-medium mb-2">💡 Quick Tip</p>
        <p className="text-xs text-muted-foreground">
          {totalScore >= 90 && "Excellent! System is running optimally."}
          {totalScore >= 75 && totalScore < 90 && "Good performance. Monitor for any degradation."}
          {totalScore >= 60 && totalScore < 75 && "System needs attention. Check alerts and metrics."}
          {totalScore >= 40 && totalScore < 60 && "Performance issues detected. Take action soon."}
          {totalScore < 40 && "Critical state! Immediate action required."}
        </p>
      </div>
    </div>
  );
}
