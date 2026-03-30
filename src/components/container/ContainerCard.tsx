import { useContainerStore } from '@/store/containerStore';
import { Play, Square, RotateCcw, Trash2, Activity, Cpu, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export const ContainerCard = ({ containerId }: { containerId: string }) => {
  const container = useContainerStore((s) => s.containers.find((c) => c.id === containerId));
  const { stopContainer, restartContainer, removeContainer } = useContainerStore();

  if (!container) return null;

  const statusColors = {
    starting: 'border-yellow-500 bg-yellow-500/10 shadow-yellow-500/20',
    running: 'border-green-500 bg-green-500/5 shadow-green-500/20',
    crashed: 'border-red-500 bg-red-500/10 shadow-red-500/20',
    stopped: 'border-gray-500 bg-gray-500/10 shadow-gray-500/20',
  };

  const statusIcons = {
    starting: <Play className="w-4 h-4 text-yellow-500 animate-pulse" />,
    running: <Activity className="w-4 h-4 text-green-500" />,
    crashed: <Zap className="w-4 h-4 text-red-500" />,
    stopped: <Square className="w-4 h-4 text-gray-500" />,
  };

  const loadRatio = container.currentRps / container.capacity;
  const isOverloaded = loadRatio > 0.9;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`bg-[#0f172a] p-4 space-y-3 ${statusColors[container.status]} border-2 rounded-xl transition-all shadow-lg`}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcons[container.status]}
          <span className="font-bold font-mono text-base text-white">{container.imageName}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-400">
            {container.uptime}s uptime
          </span>
          {container.restarts > 0 && (
            <span className="text-sm text-yellow-500">({container.restarts} restarts)</span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2.5">
        {/* CPU */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-300 font-medium">
              <Cpu className="w-4 h-4" />
              CPU Usage
            </span>
            <span className="font-mono font-bold text-white">{container.cpuUsage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#1e293b] rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                container.cpuUsage > 85
                  ? 'bg-red-500'
                  : container.cpuUsage > 60
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              animate={{ width: `${Math.min(100, container.cpuUsage)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Traffic */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-300 font-medium">Traffic (RPS)</span>
          <span className={`font-mono font-bold ${isOverloaded ? 'text-red-500' : 'text-white'}`}>
            {container.currentRps.toFixed(0)} / {container.capacity}
            {isOverloaded && ' ⚠️'}
          </span>
        </div>

        {/* Memory */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-300 font-medium">Memory</span>
          <span className="font-mono text-white">{container.memoryUsage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Status Message */}
      {container.status === 'crashed' && (
        <div className="text-sm text-red-400 bg-red-500/20 p-3 rounded-lg border border-red-500/40">
          💥 Container crashed due to overload!
        </div>
      )}

      {isOverloaded && container.status === 'running' && (
        <div className="text-sm text-yellow-400 bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/40">
          ⚠️ Container is overloaded and may crash!
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {container.status === 'running' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => stopContainer(container.id)}
            className="flex-1 text-xs h-8"
          >
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
        )}
        {(container.status === 'crashed' || container.status === 'stopped') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => restartContainer(container.id)}
            className="flex-1 text-xs h-8 border-green-500/30 text-green-500 hover:bg-green-500/10"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Restart
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => removeContainer(container.id)}
          className="text-xs h-8 border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Container ID */}
      <div className="text-[10px] text-gray-500 font-mono truncate">
        {container.id}
      </div>
    </motion.div>
  );
};
