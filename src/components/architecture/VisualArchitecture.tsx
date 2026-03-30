import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Server, Cloud, Users, AlertCircle, Activity, Zap, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VisualArchitecture = () => {
  const { instances, traffic, hasLoadBalancer, hpa, asg, applications, pendingPods } = useGameStore();

  const runningInstances = instances.filter(i => i.status === 'running');
  const crashedInstances = instances.filter(i => i.status === 'crashed');
  const totalPods = instances.reduce((sum, inst) => sum + inst.pods.filter(p => p.status === 'running').length, 0);

  const avgCpu = instances.length > 0 
    ? instances.reduce((sum, i) => sum + i.cpu, 0) / instances.length 
    : 0;

  const cpuColor = avgCpu > 80 ? 'text-red-500' : avgCpu > 60 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="panel p-6 space-y-6">
      <h3 className="text-lg font-bold">System Architecture</h3>

      {/* Architecture Diagram */}
      <div className="relative min-h-[400px] bg-secondary/20 rounded-lg p-6">
        {/* Users Layer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 left-6"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold">Users</p>
              <p className="text-xs text-muted-foreground">{traffic.toFixed(0)} RPS</p>
            </div>
          </div>
        </motion.div>

        {/* Arrow from Users to Load Balancer */}
        {hasLoadBalancer && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute top-[60px] left-[110px] w-24 h-0.5 bg-blue-400 origin-left"
          >
            <motion.div
              animate={{ x: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute right-0 top-[-3px] w-2 h-2 bg-blue-400 rounded-full"
            />
          </motion.div>
        )}

        {/* Load Balancer */}
        {hasLoadBalancer ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-6 left-[250px]"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-lg bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                <Cloud className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Load Balancer</p>
                <p className="text-xs text-green-500">✓ Active</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="absolute top-6 left-[250px]"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-lg bg-red-500/20 border-2 border-red-500 border-dashed flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-red-500">No Load Balancer</p>
                <p className="text-xs text-muted-foreground">Traffic unbalanced!</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Arrow from LB to Instances */}
        {hasLoadBalancer && runningInstances.length > 0 && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute top-[60px] left-[334px] w-24 h-0.5 bg-purple-400 origin-left"
          >
            <motion.div
              animate={{ x: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute right-0 top-[-3px] w-2 h-2 bg-purple-400 rounded-full"
            />
          </motion.div>
        )}

        {/* Instances Cluster */}
        <div className="absolute top-6 left-[480px] space-y-3">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold">Compute Instances</p>
            <p className={cn("text-xs font-mono", cpuColor)}>
              {runningInstances.length} running • {avgCpu.toFixed(0)}% CPU
            </p>
          </div>

          {/* Show first 4 instances */}
          {runningInstances.slice(0, 4).map((instance, i) => (
            <motion.div
              key={instance.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border"
            >
              <div className={cn(
                "w-10 h-10 rounded flex items-center justify-center",
                instance.cpu > 80 ? 'bg-red-500/20' : instance.cpu > 60 ? 'bg-yellow-500/20' : 'bg-green-500/20'
              )}>
                <Server className={cn(
                  "w-5 h-5",
                  instance.cpu > 80 ? 'text-red-500' : instance.cpu > 60 ? 'text-yellow-500' : 'text-green-500'
                )} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">{instance.name}</p>
                <p className="text-xs text-muted-foreground">
                  {instance.pods.filter(p => p.status === 'running').length} pods • {instance.cpu.toFixed(0)}% CPU
                </p>
              </div>
            </motion.div>
          ))}

          {runningInstances.length > 4 && (
            <div className="text-center text-xs text-muted-foreground">
              +{runningInstances.length - 4} more...
            </div>
          )}

          {crashedInstances.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4" />
              {crashedInstances.length} crashed
            </div>
          )}
        </div>

        {/* Autoscaling Info (bottom) */}
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex flex-wrap gap-3">
            {/* HPA Info */}
            {hpa.enabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2"
              >
                <Activity className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-blue-500">HPA Active</p>
                  <p className="text-xs text-muted-foreground">
                    {hpa.minReplicas}-{hpa.maxReplicas} replicas • Target: {hpa.targetCpuPercent}%
                  </p>
                </div>
              </motion.div>
            )}

            {/* ASG Info */}
            {asg.enabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2"
              >
                <Zap className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs font-semibold text-green-500">Cluster Autoscaler</p>
                  <p className="text-xs text-muted-foreground">
                    {asg.minInstances}-{asg.maxInstances} nodes • {asg.instanceType}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Applications */}
            {applications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2"
              >
                <Database className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs font-semibold text-purple-500">Applications</p>
                  <p className="text-xs text-muted-foreground">
                    {totalPods} pods running • {pendingPods.length} pending
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
