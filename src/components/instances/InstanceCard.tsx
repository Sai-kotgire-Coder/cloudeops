import { Instance } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Server, Cpu, HardDrive, Activity, Zap, Play, Square, RotateCw, AlertCircle, Clock, Box, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { INSTANCE_TYPES } from '@/store/gameStore';

interface InstanceCardProps {
  instance: Instance;
  traffic: number;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onLearnMore: (instance: Instance) => void;
}

const statusConfig = {
  running: { color: 'bg-green-500', icon: Activity, label: 'Running', badge: 'default' },
  stopped: { color: 'bg-gray-500', icon: Square, label: 'Stopped', badge: 'secondary' },
  crashed: { color: 'bg-red-500', icon: AlertCircle, label: 'Crashed', badge: 'destructive' },
  booting: { color: 'bg-yellow-500', icon: Clock, label: 'Booting', badge: 'outline' },
  provisioning: { color: 'bg-blue-500', icon: Clock, label: 'Provisioning', badge: 'outline' },
} as const;

export function InstanceCard({ instance, traffic, onStart, onStop, onRestart, onLearnMore }: InstanceCardProps) {
  const config = statusConfig[instance.status];
  const StatusIcon = config.icon;
  const spec = INSTANCE_TYPES[instance.typeId];
  
  const runningPods = instance.pods.filter(p => p.status === 'running');
  const isCritical = instance.cpu > 80;
  const isWarning = instance.cpu > 60;
  const isHealthy = instance.status === 'running' && instance.cpu < 60;
  
  const cpuBarColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500';
  const memBarColor = instance.memory > 80 ? 'bg-red-500' : instance.memory > 60 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`panel overflow-hidden transition-all ${
        isCritical ? 'border-red-500/50' : isWarning ? 'border-yellow-500/50' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg ${config.color}/10 border-2 ${config.color.replace('bg-', 'border-')} flex items-center justify-center relative`}>
            <Server className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
            
            {/* Pulse animation for active states */}
            {(instance.status === 'running' || instance.status === 'booting') && (
              <motion.div
                className={`absolute inset-0 rounded-lg border-2 ${config.color.replace('bg-', 'border-')}`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            )}

            {/* Status indicator dot */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${config.color}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{instance.name}</h3>
              <Badge variant={config.badge as any} className="text-xs">
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {spec.name} • {spec.vcpu} vCPU • {spec.ramGib}GB RAM
            </p>
          </div>
        </div>

        {/* Learn More */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLearnMore(instance)}
          className="text-xs"
        >
          Learn More
        </Button>
      </div>

      {/* Metrics Section */}
      <div className="p-4 space-y-4">
        
        {/* Status Message */}
        {instance.status === 'booting' && (
          <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 p-2 rounded">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Booting... Ready in ~{instance.provisionTimer}s</span>
          </div>
        )}
        {instance.status === 'provisioning' && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 p-2 rounded">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Provisioning... Ready in ~{instance.provisionTimer}s</span>
          </div>
        )}
        {instance.status === 'crashed' && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>Instance crashed due to overload. Restart required.</span>
          </div>
        )}
        {instance.status === 'stopped' && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-500/10 p-2 rounded">
            <Square className="w-3 h-3" />
            <span>Instance stopped. No traffic handled.</span>
          </div>
        )}

        {/* Live Metrics */}
        {instance.status !== 'stopped' && (
          <div className="grid grid-cols-2 gap-3">
            {/* CPU Usage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">CPU</span>
                </div>
                <span className={`text-xs font-bold ${isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-green-500'}`}>
                  {instance.cpu.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${cpuBarColor}`}
                  style={{ width: `${Math.min(instance.cpu, 100)}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Memory</span>
                </div>
                <span className="text-xs font-bold text-blue-500">
                  {instance.memory.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${memBarColor}`}
                  style={{ width: `${Math.min(instance.memory, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Traffic & Pods */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Traffic</p>
            <p className="text-sm font-bold text-primary">{instance.currentRps.toFixed(0)} RPS</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Box className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Pods</p>
            <p className="text-sm font-bold text-green-500">{runningPods.length}/{instance.pods.length}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Capacity</p>
            <p className="text-sm font-bold">{spec.maxRps} RPS</p>
          </div>
        </div>

        {/* Pod Details Popover */}
        {runningPods.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full text-xs text-primary hover:underline cursor-pointer">
                View {runningPods.length} Pod{runningPods.length > 1 ? 's' : ''} →
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Running Pods</h4>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {runningPods.map((pod, idx) => (
                    <div key={pod.id} className="p-2 bg-muted/50 rounded-md text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>Pod {idx + 1}</span>
                        <span className={pod.cpu > 80 ? 'text-red-500' : 'text-green-500'}>
                          {pod.cpu.toFixed(0)}% CPU
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Traffic:</span>
                        <span>{pod.currentRps.toFixed(0)} RPS</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Memory:</span>
                        <span>{pod.memory.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Version:</span>
                        <span className="font-mono">{pod.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Action Controls */}
      <div className="p-3 border-t border-border/50 flex items-center gap-2 bg-muted/30">
        {instance.status === 'stopped' && (
          <Button
            onClick={() => onStart(instance.id)}
            size="sm"
            className="flex-1"
            variant="default"
          >
            <Play className="w-3 h-3 mr-1.5" />
            Start
          </Button>
        )}
        
        {instance.status === 'running' && (
          <>
            <Button
              onClick={() => onStop(instance.id)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Square className="w-3 h-3 mr-1.5" />
              Stop
            </Button>
            <Button
              onClick={() => onRestart(instance.id)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <RotateCw className="w-3 h-3 mr-1.5" />
              Restart
            </Button>
          </>
        )}

        {instance.status === 'crashed' && (
          <Button
            onClick={() => onRestart(instance.id)}
            size="sm"
            className="flex-1"
            variant="destructive"
          >
            <RotateCw className="w-3 h-3 mr-1.5" />
            Restart Now
          </Button>
        )}

        {(instance.status === 'booting' || instance.status === 'provisioning') && (
          <Button
            size="sm"
            className="flex-1"
            variant="outline"
            disabled
          >
            <Clock className="w-3 h-3 mr-1.5 animate-spin" />
            Starting...
          </Button>
        )}
      </div>
    </motion.div>
  );
}
