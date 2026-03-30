import { useGameStore } from '@/store/gameStore';
import { Network, Server, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { HintButton } from './HintButton';

export const InfraPanel = () => {
  const { instances, hasLoadBalancer, toggleLoadBalancer, traffic } = useGameStore();

  const runningCount = instances.filter(i => i.status === 'running').length;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Infrastructure</span>
        </div>
        <HintButton hint="Build your infrastructure here. Add a Load Balancer and servers to handle traffic." />
      </div>

      <div className="flex-1 p-4 grid-bg overflow-auto">
        {/* Traffic Source */}
        <div className="flex flex-col items-center mb-4">
          <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-xs font-mono text-primary">
            🌐 Traffic: {traffic} RPS
          </div>
          <div className="w-px h-6 bg-primary/30 overflow-hidden relative">
            <div className="traffic-flow w-full h-full" />
          </div>
        </div>

        {/* Load Balancer */}
        <div className="flex flex-col items-center mb-4">
          <button
            onClick={toggleLoadBalancer}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
              hasLoadBalancer
                ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                : 'bg-secondary border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            <Network className="w-4 h-4" />
            Load Balancer {hasLoadBalancer ? '✓' : '(click to add)'}
            <HintButton topicId="load_balancer" hint="A Load Balancer distributes incoming traffic across all running instances to prevent any single server from being overwhelmed." />
          </button>
          {hasLoadBalancer && (
            <div className="flex gap-2 mt-2">
              {instances.map((_, i) => (
                <div key={i} className="w-px h-4 bg-primary/30" />
              ))}
            </div>
          )}
        </div>

        {/* Instances */}
        <div className="space-y-2">
          {instances.map((inst, i) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs ${
                inst.status === 'running'
                  ? 'bg-success/5 border-success/20'
                  : 'bg-destructive/5 border-destructive/20'
              }`}
            >
              <Server className={`w-4 h-4 ${inst.status === 'running' ? 'text-success' : 'text-destructive'}`} />
              <span className="font-mono flex-1">{inst.name}</span>
              <div className={inst.status === 'running' ? 'status-running' : 'status-crashed'} />
              <span className="text-muted-foreground">{inst.cpu.toFixed(0)}%</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <span className="text-[10px] text-muted-foreground font-mono">
            {runningCount}/{instances.length} instances active
          </span>
        </div>
      </div>
    </div>
  );
};
