import { useContainerStore } from '@/store/containerStore';
import { Activity, ArrowRight, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface TrafficDistributionPanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const TrafficDistributionPanel = ({ onLearnMore }: TrafficDistributionPanelProps) => {
  const {
    traffic,
    hasLoadBalancer,
    containers,
    isTrafficRunning,
  } = useContainerStore();

  const runningContainers = containers.filter((c) => c.status === 'running');
  const totalCapacity = runningContainers.reduce((sum, c) => c.capacity, 0);
  const isOverCapacity = traffic > totalCapacity;

  // If no traffic, show placeholder
  if (!isTrafficRunning || runningContainers.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-[#0f172a] border-2 border-gray-700 rounded-2xl p-8 text-center">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold text-white mb-2">Traffic Distribution Visualization</h3>
          <p className="text-gray-400 mb-4">
            {runningContainers.length === 0 
              ? 'Deploy containers and start traffic to see how load is distributed'
              : 'Start traffic from the control panel to visualize load distribution'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLearnMore('loadBalancer')}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Learn About Load Balancing
          </Button>
        </div>
      </div>
    );
  }

  // Calculate per-container load
  const rpsPerContainer = hasLoadBalancer 
    ? traffic / runningContainers.length 
    : runningContainers.length > 0 ? traffic * 0.95 : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Live Traffic Distribution</h2>
            <p className="text-sm text-gray-400">
              {hasLoadBalancer ? 'Load balancer is distributing traffic evenly' : 'No load balancer - traffic goes to one container'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('traffic')}
          className="gap-2 text-gray-300 hover:text-white"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      {/* Main Visualization */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111827] border-2 border-blue-500/30 rounded-2xl p-8"
        >
          {/* Traffic Flow Diagram */}
          <div className="space-y-6">
            {/* Source Flow */}
            <div className="flex items-center justify-center gap-4">
              <motion.div 
                className="w-48 bg-[#111827] border-2 border-blue-500/40 rounded-xl px-6 py-4"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-sm font-semibold text-center text-purple-300 mb-1">
                  Incoming Traffic
                </p>
                <p className="text-3xl font-mono font-bold text-center text-white">
                  {traffic.toFixed(0)}
                </p>
                <p className="text-xs text-center text-gray-400">requests/second</p>
              </motion.div>

              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-8 h-8 text-blue-400" />
              </motion.div>

              <motion.div 
                className={`w-48 border-2 rounded-xl px-6 py-4 shadow-lg ${
                  hasLoadBalancer 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/40' 
                    : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/40'
                }`}
              >
                <p className="text-sm font-semibold text-center text-green-300 mb-1">
                  {hasLoadBalancer ? '⚖️ Load Balancer' : '❌ No Load Balancer'}
                </p>
                <p className="text-xl font-mono font-bold text-center text-white">
                  {hasLoadBalancer ? 'ACTIVE' : 'OFF'}
                </p>
                <p className="text-xs text-center text-gray-400">
                  {hasLoadBalancer ? 'Distributing evenly' : 'Enable in controls →'}
                </p>
              </motion.div>

              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                <ArrowRight className="w-8 h-8 text-green-400" />
              </motion.div>

              <div className="w-48 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/40 rounded-xl px-6 py-4 shadow-lg">
                <p className="text-sm font-semibold text-center text-cyan-300 mb-1">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Containers
                </p>
                <p className="text-3xl font-mono font-bold text-center text-white">
                  {runningContainers.length}
                </p>
                <p className="text-xs text-center text-gray-400">
                  Total capacity: {totalCapacity} RPS
                </p>
              </div>
            </div>

            {/* Capacity Warning */}
            {isOverCapacity && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border-2 border-red-500/40 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-base font-semibold text-red-400">⚠️ System Overloaded</p>
                  <p className="text-sm text-gray-300">
                    Traffic ({traffic.toFixed(0)} RPS) exceeds total capacity ({totalCapacity} RPS). Containers may crash!
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLearnMore('containerCrash')}
                  className="shrink-0 border-red-500/40 text-red-400 hover:bg-red-500/10"
                >
                  Why?
                </Button>
              </motion.div>
            )}

            {/* Per-Container Distribution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Container Load Distribution
                </h3>
                <p className="text-sm text-gray-400">
                  {hasLoadBalancer 
                    ? `~${rpsPerContainer.toFixed(0)} RPS per container`
                    : 'Unbalanced - one container handles most traffic'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {runningContainers.map((container, idx) => {
                  const containerRps = hasLoadBalancer 
                    ? rpsPerContainer 
                    : idx === 0 ? traffic * 0.95 : (traffic * 0.05) / Math.max(1, runningContainers.length - 1);
                  const loadPercent = (containerRps / container.capacity) * 100;
                  const isOverloaded = loadPercent > 90;
                  const isWarning = loadPercent > 70 && loadPercent <= 90;
                  
                  return (
                    <motion.div
                      key={container.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-[#1e293b] rounded-xl p-4 border-2 ${
                        isOverloaded 
                          ? 'border-red-500/50 shadow-red-500/20' 
                          : isWarning 
                          ? 'border-yellow-500/50 shadow-yellow-500/20' 
                          : 'border-green-500/50 shadow-green-500/20'
                      } shadow-lg`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {container.imageName}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          isOverloaded 
                            ? 'bg-red-500/20 text-red-400' 
                            : isWarning 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {container.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Traffic Load</span>
                          <span className="text-lg font-mono font-bold text-white">
                            {containerRps.toFixed(0)}
                            <span className="text-xs text-gray-400"> / {container.capacity} RPS</span>
                          </span>
                        </div>

                        <div className="w-full h-3 bg-[#0f172a] rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              loadPercent > 90 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : loadPercent > 70 
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                                : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            animate={{ width: `${Math.min(100, loadPercent)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Capacity Usage</span>
                          <span className={`text-sm font-mono font-bold ${
                            isOverloaded ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {loadPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="bg-[#1e293b] rounded-xl p-4 border border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Traffic</p>
                    <p className="text-2xl font-mono font-bold text-white">{traffic.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">requests/second</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Avg Per Container</p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {(traffic / runningContainers.length).toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">RPS each</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Capacity Usage</p>
                    <p className={`text-2xl font-mono font-bold ${
                      isOverCapacity ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {((traffic / totalCapacity) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">of total capacity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
