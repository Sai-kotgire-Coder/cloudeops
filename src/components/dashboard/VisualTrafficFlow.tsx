import { useGameStore } from '@/store/gameStore';
import { Users, Globe, Cloud, Layers, Box, Server, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Node info content
const nodeInfo: Record<string, { title: string; description: string; realWorld: string }> = {
  users: {
    title: 'Users / Clients',
    description: 'External users making HTTP requests to your application. Traffic is measured in Requests Per Second (RPS).',
    realWorld: 'Like visitors to a website or mobile app users making API calls.',
  },
  ingress: {
    title: 'Ingress Controller',
    description: 'Entry point for external traffic into the Kubernetes cluster. Routes requests based on rules (paths, domains).',
    realWorld: 'Similar to NGINX Ingress, AWS ALB Ingress, or Traefik. Handles SSL termination and routing.',
  },
  loadbalancer: {
    title: 'Load Balancer',
    description: 'Distributes incoming traffic evenly across multiple pods to prevent overload on any single instance.',
    realWorld: 'Like AWS ELB, HAProxy, or built-in Kubernetes Service load balancing.',
  },
  service: {
    title: 'Kubernetes Service',
    description: 'Abstraction layer that provides a stable endpoint for accessing pods. Handles pod discovery and health checks.',
    realWorld: 'ClusterIP/NodePort/LoadBalancer Service types in Kubernetes.',
  },
  pods: {
    title: 'Pods (Application Instances)',
    description: 'Smallest deployable units in Kubernetes. Each pod runs your application container and handles a portion of traffic.',
    realWorld: 'Docker containers running your Node.js, Python, Java, etc. application code.',
  },
  nodes: {
    title: 'Nodes (Servers)',
    description: 'Physical or virtual machines that host pods. Provides CPU, memory, and network resources.',
    realWorld: 'EC2 instances, VMs, or bare metal servers in your cluster.',
  },
};

interface NodeComponentProps {
  id: string;
  icon: React.ElementType;
  label: string;
  detail?: string;
  color: string;
  bgColor: string;
  status?: 'active' | 'warning' | 'inactive';
  delay?: number;
  onClick?: () => void;
  pulse?: boolean;
}

function NodeComponent({ id, icon: Icon, label, detail, color, bgColor, status = 'active', delay = 0, onClick, pulse }: NodeComponentProps) {
  const [showPopover, setShowPopover] = useState(false);
  const info = nodeInfo[id];

  const statusIndicator = status === 'active' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      <PopoverTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={onClick}
          className="relative cursor-pointer group"
        >
          <div className={`w-20 h-20 rounded-xl ${bgColor} border-2 ${color.replace('text-', 'border-')} flex items-center justify-center relative transition-transform group-hover:scale-110`}>
            <Icon className={`w-10 h-10 ${color}`} />
            
            {/* Status indicator */}
            <motion.div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusIndicator}`}
              animate={pulse ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Pulse effect for active nodes */}
            {pulse && (
              <motion.div
                className={`absolute inset-0 rounded-xl border-2 ${color.replace('text-', 'border-')}`}
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
          </div>

          <div className="text-center mt-2">
            <p className="text-xs font-semibold">{label}</p>
            {detail && (
              <p className={`text-[10px] ${color} font-mono font-semibold`}>{detail}</p>
            )}
          </div>
        </motion.div>
      </PopoverTrigger>
      
      {info && (
        <PopoverContent className="w-80" align="center">
          <div className="space-y-2">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              {info.title}
            </h4>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {info.description}
            </p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Real-World Example</p>
              <p className="text-xs text-muted-foreground">
                {info.realWorld}
              </p>
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

interface FlowLineProps {
  width: number;
  delay?: number;
  speed?: number;
  color?: string;
  active?: boolean;
}

function FlowLine({ width, delay = 0, speed = 2, color = 'rgb(59 130 246)', active = true }: FlowLineProps) {
  if (!active) {
    return (
      <div style={{ width: `${width}px` }} className="flex items-center justify-center">
        <div className="h-0.5 bg-border/30 w-full" />
      </div>
    );
  }

  return (
    <div style={{ width: `${width}px` }} className="relative flex items-center">
      <svg className="w-full h-1" preserveAspectRatio="none">
        <line 
          x1="0" 
          y1="2" 
          x2="100%" 
          y2="2" 
          stroke={color} 
          strokeWidth="2" 
          strokeDasharray="4 4" 
        />
        {/* Animated traffic dots */}
        <motion.circle
          cx="0"
          cy="2"
          r="3"
          fill={color}
          animate={{
            cx: ['0%', '100%'],
          }}
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: "linear",
            delay,
          }}
        />
      </svg>
      
      {/* Arrow */}
      <div className="absolute right-0 -translate-x-1">
        <div style={{ 
          width: 0,
          height: 0,
          borderLeft: `6px solid ${color}`,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
        }} />
      </div>
    </div>
  );
}

export function VisualTrafficFlow() {
  const { instances, traffic, hasLoadBalancer, isRunning } = useGameStore();

  const runningInstances = instances.filter(i => i.status === 'running');
  
  // Get all running pods across instances
  const allPods = runningInstances.flatMap(inst => 
    inst.pods.filter(p => p.status === 'running').map(p => ({
      ...p,
      instanceName: inst.name,
      instanceId: inst.id,
    }))
  );

  const totalPods = allPods.length;
  const trafficPerPod = totalPods > 0 && hasLoadBalancer ? traffic / totalPods : traffic;
  const avgCpu = allPods.length > 0 
    ? allPods.reduce((sum, p) => sum + p.cpu, 0) / allPods.length 
    : 0;

  // Show only top 3 pods for clarity
  const displayPods = allPods.slice(0, 3);
  const hasMorePods = allPods.length > 3;

  // Empty state
  if (!isRunning || runningInstances.length === 0) {
    return (
      <div className="panel p-6 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="font-semibold text-sm">Traffic Flow Architecture</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kubernetes request routing visualization
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
          <Layers className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-sm font-semibold">No Active Traffic Flow</p>
          <p className="text-xs mt-2 max-w-xs">
            {!isRunning 
              ? 'Start the simulation to see real-time traffic routing through the system'
              : 'Add instances and start receiving traffic to visualize the flow'
            }
          </p>
        </div>
      </div>
    );
  }

  const flowSpeed = Math.max(1, 3 - (traffic / 200)); // Faster with more traffic

  return (
    <div className="panel p-6 space-y-6 h-full overflow-auto">
      <div>
        <h3 className="font-semibold text-sm">Traffic Flow Architecture</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Click nodes to learn more • {traffic.toFixed(0)} RPS flowing through system
        </p>
      </div>

      {/* Main Horizontal Flow - Centered */}
      <div className="flex flex-col items-center justify-center py-4">
        
        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:flex items-center gap-4">
          {/* 1. Users */}
          <NodeComponent
            id="users"
            icon={Users}
            label="Users"
            detail={`${traffic.toFixed(0)} RPS`}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            status="active"
            pulse={traffic > 0}
          />

          <FlowLine width={60} active={traffic > 0} speed={flowSpeed} color="rgb(59 130 246)" />

          {/* 2. Ingress */}
          <NodeComponent
            id="ingress"
            icon={Globe}
            label="Ingress"
            detail="Entry"
            color="text-cyan-500"
            bgColor="bg-cyan-500/10"
            status={traffic > 0 ? 'active' : 'inactive'}
          />

          <FlowLine width={60} active={traffic > 0} speed={flowSpeed} color="rgb(6 182 212)" />

          {/* 3. Load Balancer */}
          <NodeComponent
            id="loadbalancer"
            icon={Cloud}
            label="Load Balancer"
            detail={hasLoadBalancer ? 'Active' : 'Disabled'}
            color={hasLoadBalancer ? 'text-purple-500' : 'text-red-500'}
            bgColor={hasLoadBalancer ? 'bg-purple-500/10' : 'bg-red-500/10'}
            status={hasLoadBalancer ? 'active' : 'warning'}
          />

          <FlowLine width={60} active={traffic > 0 && hasLoadBalancer} speed={flowSpeed} color="rgb(168 85 247)" />

          {/* 4. Service */}
          <NodeComponent
            id="service"
            icon={Layers}
            label="Service"
            detail={`${totalPods} Pod${totalPods !== 1 ? 's' : ''}`}
            color="text-green-500"
            bgColor="bg-green-500/10"
            status={totalPods > 0 ? 'active' : 'warning'}
          />
        </div>

        {/* Mobile: Vertical Layout */}
        <div className="flex md:hidden flex-col items-center gap-3">
          <NodeComponent
            id="users"
            icon={Users}
            label="Users"
            detail={`${traffic.toFixed(0)} RPS`}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            status="active"
            pulse={traffic > 0}
          />
          <div className="h-8 w-0.5 bg-blue-500" />
          
          <NodeComponent
            id="ingress"
            icon={Globe}
            label="Ingress"
            color="text-cyan-500"
            bgColor="bg-cyan-500/10"
            status={traffic > 0 ? 'active' : 'inactive'}
          />
          <div className="h-8 w-0.5 bg-cyan-500" />
          
          <NodeComponent
            id="loadbalancer"
            icon={Cloud}
            label="Load Balancer"
            detail={hasLoadBalancer ? 'On' : 'Off'}
            color={hasLoadBalancer ? 'text-purple-500' : 'text-red-500'}
            bgColor={hasLoadBalancer ? 'bg-purple-500/10' : 'bg-red-500/10'}
            status={hasLoadBalancer ? 'active' : 'warning'}
          />
          <div className="h-8 w-0.5 bg-purple-500" />
          
          <NodeComponent
            id="service"
            icon={Layers}
            label="Service"
            detail={`${totalPods} Pods`}
            color="text-green-500"
            bgColor="bg-green-500/10"
            status={totalPods > 0 ? 'active' : 'warning'}
          />
        </div>

        {/* Pods Layer (Below Service) */}
        {displayPods.length > 0 && (
          <div className="mt-8 w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="h-8 w-0.5 bg-green-500" />
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              {displayPods.map((pod, idx) => {
                const isCritical = pod.cpu > 80;
                return (
                  <motion.div
                    key={pod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className={`relative w-16 h-16 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                          isCritical
                            ? 'bg-red-500/10 border-red-500'
                            : 'bg-green-500/10 border-green-500'
                        }`}>
                          <Box className={`w-8 h-8 ${isCritical ? 'text-red-500' : 'text-green-500'}`} />
                          
                          {isCritical && (
                            <motion.div
                              className="absolute -top-1 -right-1"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            >
                              <AlertCircle className="w-3 h-3 text-red-500 fill-red-500/20" />
                            </motion.div>
                          )}

                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-background border text-[8px] font-bold whitespace-nowrap">
                            {trafficPerPod.toFixed(0)} RPS
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="center">
                        <div className="space-y-2">
                          <h4 className="font-bold text-sm">Pod Details</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ID:</span>
                              <span className="font-mono">{pod.id.slice(0, 12)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CPU:</span>
                              <span className={`font-semibold ${pod.cpu > 80 ? 'text-red-500' : 'text-green-500'}`}>
                                {pod.cpu.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Memory:</span>
                              <span className="font-semibold">{pod.memory.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Traffic:</span>
                              <span className="font-semibold">{trafficPerPod.toFixed(0)} RPS</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Node:</span>
                              <span className="font-semibold">{pod.instanceName}</span>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <p className="text-[10px] text-center mt-2 font-mono text-muted-foreground">
                      Pod {idx + 1}
                    </p>
                  </motion.div>
                );
              })}
              
              {hasMorePods && (
                <div className="text-xs text-muted-foreground text-center">
                  + {allPods.length - 3} more pods
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nodes Layer (Below Pods) */}
        {runningInstances.length > 0 && displayPods.length > 0 && (
          <div className="mt-8 w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="h-8 w-0.5 bg-gray-500" />
            </div>

            <div className="flex items-center justify-center">
              <NodeComponent
                id="nodes"
                icon={Server}
                label={`Node${runningInstances.length > 1 ? 's' : ''}`}
                detail={`${runningInstances.length} Active`}
                color="text-gray-500"
                bgColor="bg-gray-500/10"
                status="active"
                delay={0.8}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border/50">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Traffic</p>
          <p className="text-sm font-bold text-blue-500">{traffic.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Pods</p>
          <p className="text-sm font-bold text-green-500">{totalPods}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Avg CPU</p>
          <p className={`text-sm font-bold ${avgCpu > 80 ? 'text-red-500' : avgCpu > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
            {avgCpu.toFixed(0)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Nodes</p>
          <p className="text-sm font-bold text-gray-500">{runningInstances.length}</p>
        </div>
      </div>
    </div>
  );
}
