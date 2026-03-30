import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';
import { Server, Activity, Cpu, HardDrive, TrendingUp, AlertCircle, Plus, Layers, BarChart3 } from 'lucide-react';
import { InstanceCard } from '@/components/instances/InstanceCard';
import { AIDevOpsMentor } from '@/components/instances/AIDevOpsMentor';
import { InstanceLearningModal } from '@/components/instances/InstanceLearningModal';
import { Instance } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const LiveInstancesPage = () => {
  const {
    instances,
    traffic,
    cpuAvg,
    errorRate,
    metricsHistory,
    simulationTick,
    isRunning,
    startInstance,
    stopInstance,
    restartInstance,
    addInstance,
  } = useGameStore();

  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [showLearning, setShowLearning] = useState(false);

  // Real-time updates
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(simulationTick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, simulationTick]);

  const running = instances.filter(i => i.status === 'running');
  const stopped = instances.filter(i => i.status === 'stopped');
  const crashed = instances.filter(i => i.status === 'crashed');
  const booting = instances.filter(i => i.status === 'booting' || i.status === 'provisioning');

  const totalPods = instances.reduce((sum, inst) => sum + inst.pods.filter(p => p.status === 'running').length, 0);
  const totalCapacity = instances.reduce((sum, inst) => {
    const spec = useGameStore.getState().instances.find(i => i.id === inst.id);
    return sum + (spec ? 100 : 0); // Simplified capacity calculation
  }, 0);

  const handleLearnMore = (instance: Instance) => {
    setSelectedInstance(instance);
    setShowLearning(true);
  };

  // Simple sparkline data for performance visualization
  const recentMetrics = metricsHistory.slice(-20);
  const maxCpu = Math.max(...recentMetrics.map(m => m.cpu), 100);
  const maxRps = Math.max(...recentMetrics.map(m => m.rps), 100);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            Live Instances Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time infrastructure control & monitoring
          </p>
        </div>
        <Button onClick={() => addInstance()} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Instance
        </Button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Traffic</p>
          </div>
          <p className="text-lg sm:text-2xl font-mono font-bold text-blue-500">
            {traffic.toFixed(0)} <span className="text-xs font-normal text-muted-foreground">RPS</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`panel p-3 sm:p-4 ${cpuAvg > 80 ? 'border-red-500/50' : cpuAvg > 60 ? 'border-yellow-500/50' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-muted-foreground">Avg CPU</p>
          </div>
          <p className={`text-lg sm:text-2xl font-mono font-bold ${cpuAvg > 80 ? 'text-red-500' : cpuAvg > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
            {cpuAvg.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-500" />
            <p className="text-xs text-muted-foreground">Running</p>
          </div>
          <p className="text-lg sm:text-2xl font-mono font-bold text-green-500">
            {running.length}/{instances.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`panel p-3 sm:p-4 ${errorRate > 10 ? 'border-red-500/50' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-muted-foreground">Error Rate</p>
          </div>
          <p className={`text-lg sm:text-2xl font-mono font-bold ${errorRate > 10 ? 'text-red-500' : errorRate > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
            {errorRate.toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* Status Summary */}
      {(crashed.length > 0 || booting.length > 0 || stopped.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {crashed.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/30">
              <AlertCircle className="w-3 h-3" />
              <span>{crashed.length} crashed</span>
            </div>
          )}
          {booting.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>{booting.length} booting</span>
            </div>
          )}
          {stopped.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-500/10 text-gray-500 border border-gray-500/30">
              <Server className="w-3 h-3" />
              <span>{stopped.length} stopped</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left: Instance Cards */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Live Performance Chart */}
          {recentMetrics.length > 0 && (
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Performance Over Time</h3>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* CPU Sparkline */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">CPU Usage</span>
                    <span className="text-xs font-semibold text-blue-500">{cpuAvg.toFixed(1)}%</span>
                  </div>
                  <svg className="w-full h-16" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 0 ${64 - (recentMetrics[0]?.cpu || 0) * 0.64} ${recentMetrics.map((m, i) => 
                        `L ${(i / (recentMetrics.length - 1)) * 100}% ${64 - (m.cpu * 0.64)}`
                      ).join(' ')} L 100% 64 L 0 64 Z`}
                      fill="url(#cpuGradient)"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                {/* Traffic Sparkline */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Traffic (RPS)</span>
                    <span className="text-xs font-semibold text-green-500">{traffic.toFixed(0)}</span>
                  </div>
                  <svg className="w-full h-16" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 0 ${64 - ((recentMetrics[0]?.rps || 0) / maxRps) * 64} ${recentMetrics.map((m, i) => 
                        `L ${(i / (recentMetrics.length - 1)) * 100}% ${64 - ((m.rps / maxRps) * 64)}`
                      ).join(' ')} L 100% 64 L 0 64 Z`}
                      fill="url(#trafficGradient)"
                      stroke="rgb(34, 197, 94)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Last {recentMetrics.length} ticks • Real-time performance trends
              </p>
            </div>
          )}

          {/* Instances Grid */}
          {instances.length === 0 ? (
            <div className="panel p-12 text-center">
              <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg mb-2">No Instances Running</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Start your first instance to begin handling traffic and monitoring your infrastructure.
              </p>
              <Button onClick={() => addInstance()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Instance
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {instances.map((instance) => (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  traffic={traffic}
                  onStart={startInstance}
                  onStop={stopInstance}
                  onRestart={restartInstance}
                  onLearnMore={handleLearnMore}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: AI Mentor & Stats */}
        <div className="lg:col-span-4 space-y-4">
          <AIDevOpsMentor />

          {/* Quick Stats */}
          <div className="panel p-4 space-y-3">
            <h3 className="font-semibold text-sm">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pods:</span>
                <span className="font-semibold">{totalPods}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Instances:</span>
                <span className="font-semibold text-green-500">{running.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offline:</span>
                <span className="font-semibold text-gray-500">{stopped.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed:</span>
                <span className="font-semibold text-red-500">{crashed.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booting:</span>
                <span className="font-semibold text-yellow-500">{booting.length}</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="panel p-4">
            <h3 className="font-semibold text-sm mb-3">System Health</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Overall Load</span>
                  <span className={cpuAvg > 80 ? 'text-red-500' : cpuAvg > 60 ? 'text-yellow-500' : 'text-green-500'}>
                    {cpuAvg > 80 ? 'Critical' : cpuAvg > 60 ? 'High' : 'Normal'}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${cpuAvg > 80 ? 'bg-red-500' : cpuAvg > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(cpuAvg, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-border/50 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${crashed.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-muted-foreground">
                    {crashed.length > 0 ? 'System degraded' : 'All systems operational'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Modal */}
      <InstanceLearningModal
        instance={selectedInstance}
        open={showLearning}
        onClose={() => {
          setShowLearning(false);
          setSelectedInstance(null);
        }}
      />
    </div>
  );
};

export default LiveInstancesPage;
