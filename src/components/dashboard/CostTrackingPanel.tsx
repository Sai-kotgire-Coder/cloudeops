import { useGameStore, INSTANCE_TYPES } from '@/store/gameStore';
import { DollarSign, TrendingUp, TrendingDown, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export function CostTrackingPanel() {
  const { instances, totalCost, tick } = useGameStore();

  const runningInstances = instances.filter(i => i.status === 'running');
  
  // Calculate cost breakdown by instance type
  const costBreakdown = runningInstances.reduce((acc, inst) => {
    const type = inst.typeId;
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        costPerHour: INSTANCE_TYPES[type].costPerHour,
        total: 0,
      };
    }
    acc[type].count++;
    acc[type].total += INSTANCE_TYPES[type].costPerHour;
    return acc;
  }, {} as Record<string, { count: number; costPerHour: number; total: number }>);

  const hourlyRate = runningInstances.reduce((sum, inst) => {
    return sum + INSTANCE_TYPES[inst.typeId].costPerHour;
  }, 0);

  const dailyProjection = hourlyRate * 24;
  const monthlyProjection = dailyProjection * 30;

  return (
    <div className="panel p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          Cost Tracking
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Infrastructure spend monitoring
        </p>
      </div>

      {/* Total Spend */}
      <div className="p-4 rounded-lg bg-[#111827] border border-green-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Total Spent</span>
          <span className="text-xs text-green-500 font-medium">Simulated</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-500">
            ${totalCost.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">since start</span>
        </div>
      </div>

      {/* Hourly Rate */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">Hourly</span>
          </div>
          <p className="text-lg font-bold">${hourlyRate.toFixed(3)}</p>
        </div>

        <div className="p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">Daily</span>
          </div>
          <p className="text-lg font-bold">${dailyProjection.toFixed(2)}</p>
        </div>
      </div>

      {/* Monthly Projection */}
      <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Monthly Projection</p>
            <p className="text-xl font-bold text-orange-500">
              ${monthlyProjection.toFixed(2)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-orange-500/50" />
        </div>
      </div>

      {/* Instance Breakdown */}
      {Object.keys(costBreakdown).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Cost Breakdown</p>
          {Object.entries(costBreakdown).map(([type, data]) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-2 rounded bg-secondary/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold">{data.count}</span>
                </div>
                <span className="text-xs font-mono">{type}</span>
              </div>
              <span className="text-xs font-semibold">
                ${data.total.toFixed(4)}/hr
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {runningInstances.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No running instances</p>
          <p className="text-xs">Cost: $0.00/hr</p>
        </div>
      )}
    </div>
  );
}
