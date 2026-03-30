import { useContainerStore } from '@/store/containerStore';
import { Activity, Play, Pause, BarChart3, TrendingUp, AlertTriangle, Info, ArrowRight, BookOpen } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface TrafficSimulatorProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const TrafficSimulator = ({ onLearnMore }: TrafficSimulatorProps) => {
  const {
    traffic,
    targetTraffic,
    isTrafficRunning,
    hasLoadBalancer,
    autoScaleEnabled,
    containers,
    setTraffic,
    toggleTraffic,
    toggleLoadBalancer,
    toggleAutoScale,
  } = useContainerStore();

  const runningContainers = containers.filter((c) => c.status === 'running');
  const totalCapacity = runningContainers.reduce((sum, c) => c.capacity, 0);
  const avgCpu = runningContainers.length > 0
    ? runningContainers.reduce((sum, c) => sum + c.cpuUsage, 0) / runningContainers.length
    : 0;

  const isOverCapacity = traffic > totalCapacity;
  const capacityRatio = totalCapacity > 0 ? (traffic / totalCapacity) * 100 : 0;

  return (
    <TooltipProvider>
    <div className="space-y-4 h-full">
      {/* Traffic Control */}
      <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Traffic Controls</h3>
              <p className="text-sm text-gray-400">Simulate real-world load</p>
            </div>
          </div>
        </div>

        {/* Start/Stop Button */}
        <Button
          onClick={toggleTraffic}
          variant={isTrafficRunning ? 'destructive' : 'default'}
          size="lg"
          className="w-full gap-2 h-12 text-base font-semibold"
        >
          {isTrafficRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Stop Traffic
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Traffic
            </>
          )}
        </Button>

        {/* Traffic Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-gray-300 font-medium">Target Traffic</Label>
            <span className="text-base font-mono font-bold text-white">
              {targetTraffic} RPS
            </span>
          </div>
          <Slider
            value={[targetTraffic]}
            onValueChange={(v) => setTraffic(v[0])}
            max={2000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 RPS</span>
            <span>2000 RPS</span>
          </div>
        </div>

        {/* Current Traffic Visual */}
        <div className="bg-[#1e293b] p-4 rounded-lg border border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 font-medium">Current Traffic</span>
            <span className="text-3xl font-mono font-bold text-primary">
              {traffic.toFixed(0)}
            </span>
          </div>
          <p className="text-xs text-gray-500">requests per second</p>

          {/* Capacity Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">Capacity Usage</span>
              <span className={`font-mono font-bold ${isOverCapacity ? 'text-red-400' : 'text-white'}`}>
                {capacityRatio.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#0f172a] rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  capacityRatio > 100
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : capacityRatio > 80
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                animate={{ width: `${Math.min(100, capacityRatio)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{traffic.toFixed(0)} / {totalCapacity} RPS</span>
              {isOverCapacity && (
                <span className="text-red-400 font-bold">⚠️ Overloaded!</span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1e293b] p-3 rounded-lg border border-gray-700 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl font-mono font-bold text-white block">
              {avgCpu.toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400 block mt-1">Avg CPU</span>
          </div>

          <div className="bg-[#1e293b] p-3 rounded-lg border border-gray-700 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-2xl font-mono font-bold text-white block">
              {runningContainers.length}
            </span>
            <span className="text-xs text-gray-400 block mt-1">Active</span>
          </div>

          <div className="bg-[#1e293b] p-3 rounded-lg border border-gray-700 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-mono font-bold text-white block">
              {totalCapacity}
            </span>
            <span className="text-xs text-gray-400 block mt-1">Capacity</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-5 space-y-4 shadow-lg">
        <h4 className="font-semibold text-base text-white mb-3">System Settings</h4>

        {/* Load Balancer */}
        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="lb-toggle" className="font-semibold text-gray-100">Load Balancer</Label>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Distribute traffic evenly across containers
            </p>
            <Button
              size="sm"
              variant="link"
              onClick={() => onLearnMore('loadBalancer')}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80 mt-1"
            >
              Learn how load balancing works →
            </Button>
          </div>
          <Switch
            id="lb-toggle"
            checked={hasLoadBalancer}
            onCheckedChange={toggleLoadBalancer}
          />
        </div>

        {/* Auto-Scaling */}
        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="autoscale-toggle" className="font-semibold text-gray-100">Auto-Scaling (HPA)</Label>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Automatically scale containers when CPU {'>'} 70%
            </p>
            <Button
              size="sm"
              variant="link"
              onClick={() => onLearnMore('autoScaling')}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80 mt-1"
            >
              Learn about auto-scaling →
            </Button>
          </div>
          <Switch
            id="autoscale-toggle"
            checked={autoScaleEnabled}
            onCheckedChange={toggleAutoScale}
          />
        </div>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {isOverCapacity && isTrafficRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0f172a] border-2 border-red-500/50 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-base font-semibold text-red-500 mb-1">⚠️ Your containers cannot handle this traffic</p>
                <p className="text-sm text-gray-300 mb-2">
                  Traffic exceeds container capacity. Your containers may crash!
                </p>
                <div className="bg-red-500/10 rounded-lg p-3 space-y-1.5">
                  <p className="text-sm text-gray-300 font-medium">💡 Suggestions:</p>
                  <p className="text-sm text-gray-400">
                    {!hasLoadBalancer && '• Enable load balancer to distribute traffic evenly'}
                  </p>
                  <p className=" text-sm text-gray-400">
                    {!autoScaleEnabled && '• Enable auto-scaling to spawn more containers automatically'}
                  </p>
                  <p className="text-sm text-gray-400">• Add more containers manually</p>
                </div>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => onLearnMore('containerCrash')}
                  className="mt-2 h-auto p-0 text-sm text-red-400 hover:text-red-300"
                >
                  Learn why containers crash →
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {runningContainers.length === 0 && isTrafficRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0f172a] border-2 border-yellow-500/50 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-base font-semibold text-yellow-500 mb-1">No Active Containers</p>
                <p className="text-sm text-gray-300">
                  Deploy containers from your images to handle the traffic.
                </p>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => onLearnMore('container')}
                  className="mt-2 h-auto p-0 text-sm text-yellow-400 hover:text-yellow-300"
                >
                  Learn about containers →
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>
  );
};
