import { useGameStore, INSTANCE_TYPES, InstanceTypeId, SCORE_ACTIONS } from '@/store/gameStore';
import { Plus, RotateCcw, Gauge, Settings, ShieldAlert, Server, Activity, Minus, Lightbulb, Scale, Layers, ArrowUpDown, Trophy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HintButton } from './HintButton';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ControlPanel = () => {
  const {
    instances, addInstance, removeInstance, restartInstance,
    traffic, setTraffic, setTargetTraffic,
    asg, updateASG,
    hpa, updateHPA,
    vpa, updateVPA,
    hasLoadBalancer, toggleLoadBalancer,
    triggerIncident,
    score, scoreHistory,
    resetSimulation,
  } = useGameStore();

  const [selectedType, setSelectedType] = useState<InstanceTypeId>('t3.micro');
  const [showScore, setShowScore] = useState(false);
  const crashedInstances = instances.filter(i => i.status === 'crashed');
  const running = instances.filter(i => i.status === 'running');

  const getAdvice = () => {
    if (running.length === 0 && crashedInstances.length > 0)
      return { text: '🔴 All servers crashed! Reboot them below or provision new ones.', urgent: true };
    if (running.length === 0)
      return { text: '⚠️ No active servers. Click + to launch an instance.', urgent: true };
    const totalCapacity = running.reduce((acc, inst) => acc + INSTANCE_TYPES[inst.typeId].maxRps, 0);
    if (traffic > totalCapacity)
      return { text: `🔴 Traffic (${traffic} RPS) exceeds capacity (${totalCapacity} RPS)! Add servers, upgrade types, or enable HPA.`, urgent: true };
    if (!hasLoadBalancer && running.length > 1 && traffic > 50)
      return { text: '⚠️ No Load Balancer! Traffic is hammering a single node. Enable it now.', urgent: true };
    if (crashedInstances.length > 0)
      return { text: '⚠️ Crashed servers are reducing your capacity. Reboot them!', urgent: true };
    if (traffic === 0)
      return { text: '💤 System idle. Use the traffic generator to simulate load.', urgent: false };
    if (traffic < totalCapacity * 0.2 && running.length > 1 && !asg.enabled)
      return { text: '💰 Over-provisioned! You\'re wasting money. Terminate extra instances.', urgent: false };
    return { text: '✅ System balanced. Architecture is healthy.', urgent: false };
  };

  const advice = getAdvice();

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">System Controls</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Score mini badge */}
            <div className="relative">
              <button
                onClick={() => setShowScore(!showScore)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                <Trophy className="w-3 h-3" /> {score} pts
              </button>
              <AnimatePresence>
                {showScore && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowScore(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 top-8 z-50 w-72 panel p-3 shadow-xl"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">Score Rules</p>
                      <div className="space-y-1.5">
                        {(Object.entries(SCORE_ACTIONS) as [string, { points: number; label: string; emoji: string }][]).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{val.emoji} {val.label}</span>
                            <span className={`font-mono font-bold ${val.points > 0 ? 'text-success' : 'text-destructive'}`}>
                              {val.points > 0 ? '+' : ''}{val.points}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-bold text-muted-foreground mb-1">Recent Events</p>
                        {scoreHistory.slice(-5).reverse().map((e, i) => (
                          <div key={i} className="flex justify-between text-[10px] font-mono">
                            <span className="text-muted-foreground">{SCORE_ACTIONS[e.action]?.emoji} {SCORE_ACTIONS[e.action]?.label}</span>
                            <span className={e.delta > 0 ? 'text-success' : 'text-destructive'}>{e.delta > 0 ? '+' : ''}{e.delta}</span>
                          </div>
                        ))}
                        {scoreHistory.length === 0 && <p className="text-[10px] text-muted-foreground">Start the simulation to earn points.</p>}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <HintButton hint="Master control plane. Manage traffic, load balancing, ASG, HPA (Horizontal Pod Autoscaler), and VPA (Vertical Pod Autoscaler). Score points by making correct scaling decisions." />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-auto custom-scrollbar">

        {/* DevOps Advisor */}
        <div className={`p-3 rounded-lg border-2 text-sm font-medium leading-snug ${advice.urgent ? 'bg-primary/10 border-primary text-primary' : 'bg-success/10 border-success/40 text-success'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> DevOps Advisor
          </p>
          {advice.text}
        </div>

        {/* Hardware Provisioning */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase flex items-center gap-2">
            <Server className="w-3.5 h-3.5" /> Hardware Provisioning
            <HintButton topicId="instances" hint="Launch new EC2-like instances. Each type has different CPU/RAM capacity and cost. t3.micro = cheapest, c5.xlarge = most powerful. Horizontal scaling." />
          </p>
          <div className="p-3 bg-secondary/10 border border-border rounded-lg space-y-2">
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as InstanceTypeId)}
                className="flex-1 bg-background border border-input rounded-md text-sm px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none"
              >
                {Object.keys(INSTANCE_TYPES).map(t => (
                  <option key={t} value={t}>{t} · {INSTANCE_TYPES[t as InstanceTypeId].maxRps} RPS · ${INSTANCE_TYPES[t as InstanceTypeId].costPerHour.toFixed(4)}/hr</option>
                ))}
              </select>
              <button
                onClick={() => addInstance(selectedType)}
                className="flex items-center justify-center w-10 h-10 shrink-0 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Launch Instance"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {instances.length > 1 && (
              <button
                onClick={() => removeInstance(instances[instances.length - 1].id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors"
              >
                <Minus className="w-3 h-3" /> Terminate Newest
              </button>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Load Balancer
                <HintButton topicId="load_balancer" hint="Distributes incoming traffic evenly across all instances. Without it, one server takes 95% of traffic (Chaos Mode). ALWAYS enable this in production. +40 pts when enabled." />
              </div>
              <button
                onClick={toggleLoadBalancer}
                className={`relative w-10 h-5 rounded-full transition-colors ${hasLoadBalancer ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-all ${hasLoadBalancer ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Traffic Simulation */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5" /> Traffic Generator
            <HintButton topicId="traffic" hint="Simulates incoming HTTP requests per second (RPS). If traffic exceeds total instance capacity, CPU spikes and requests fail. Use presets to simulate real-world events like viral spikes." />
          </p>
          <div className="p-3 bg-secondary/10 border border-border rounded-lg space-y-3">
            <div>
              <input
                type="range" min={10} max={5000} step={10} value={traffic}
                onChange={e => setTraffic(Number(e.target.value))}
                className="w-full accent-primary h-1.5 rounded-full appearance-none bg-secondary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>10</span>
                <span className="text-primary font-bold">{traffic} RPS</span>
                <span>5000</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTargetTraffic(100)} className="text-[10px] py-1.5 bg-secondary/50 hover:bg-secondary rounded border border-border">Normal Load</button>
              <button onClick={() => setTargetTraffic(500)} className="text-[10px] py-1.5 bg-secondary/50 hover:bg-secondary rounded border border-border">Gradual Growth</button>
            </div>
            <button onClick={() => setTraffic(traffic + 2000)} className="w-full text-[10px] py-1.5 bg-warning/10 text-warning hover:bg-warning/20 border border-warning/30 rounded font-bold">
              💥 Viral Spike (+2000 RPS)
            </button>
          </div>
        </div>

        {/* ASG */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-3.5 h-3.5 text-orange-400" />
            <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Auto-Scaling Group (ASG)</p>
            <HintButton topicId="auto_scaling" hint="AWS Auto Scaling Group — automatically adds/removes instances based on CPU thresholds. Best for EC2-based workloads. Define min/max fleet size and CPU triggers." />
          </div>
          <button
            type="button"
            onClick={() => updateASG({ enabled: !asg.enabled })}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
              asg.enabled
                ? 'bg-orange-500/20 border-orange-400 text-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.3)]'
                : 'bg-secondary/30 border-border text-muted-foreground hover:border-orange-400/50 hover:text-orange-400'
            }`}
          >
            <Scale className="w-4 h-4" />
            {asg.enabled ? '✅ ASG Enabled — Click to Disable' : 'Enable ASG'}
          </button>
          <AnimatePresence>
            {asg.enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-3 bg-secondary/10 border border-border rounded-lg space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Min / Max Instances</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="number" value={asg.minInstances} min={1} max={10} onChange={e => updateASG({ minInstances: Number(e.target.value) })} className="w-12 bg-background border border-input rounded px-1.5 py-0.5 text-center" />
                      <span>—</span>
                      <input type="number" value={asg.maxInstances} min={1} max={20} onChange={e => updateASG({ maxInstances: Number(e.target.value) })} className="w-12 bg-background border border-input rounded px-1.5 py-0.5 text-center" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Scale Out CPU &gt;</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="number" value={asg.targetCpuUp} min={10} max={95} onChange={e => updateASG({ targetCpuUp: Number(e.target.value) })} className="w-16 bg-background border border-input rounded px-1.5 py-0.5 text-center text-destructive" /> %
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Scale In CPU &lt;</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="number" value={asg.targetCpuDown} min={5} max={60} onChange={e => updateASG({ targetCpuDown: Number(e.target.value) })} className="w-16 bg-background border border-input rounded px-1.5 py-0.5 text-center text-success" /> %
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Instance Type</span>
                    <select value={asg.instanceType} onChange={e => updateASG({ instanceType: e.target.value as InstanceTypeId })} className="bg-background border border-input rounded text-xs px-2 py-0.5 focus:outline-none">
                      {Object.keys(INSTANCE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* HPA */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">HPA (Horizontal Pod Autoscaler)</p>
            <HintButton topicId="pods" hint="Kubernetes HPA — automatically scales the number of pod replicas based on CPU utilization. Adds/removes servers when CPU crosses your threshold. +60 pts for enabling." />
          </div>
          <button
            type="button"
            onClick={() => updateHPA({ enabled: !hpa.enabled })}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
              hpa.enabled
                ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                : 'bg-secondary/30 border-border text-muted-foreground hover:border-blue-400/50 hover:text-blue-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            {hpa.enabled ? '✅ HPA Enabled — Click to Disable' : '🤖 Enable HPA'}
          </button>
          <AnimatePresence>
            {hpa.enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2.5 text-xs">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider">spec.metrics.cpu.targetAverageUtilization</div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Min / Max Pods</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="number" value={hpa.minReplicas} min={1} max={10} onChange={e => updateHPA({ minReplicas: Number(e.target.value) })} className="w-12 bg-background border border-input rounded px-1.5 py-0.5 text-center" />
                      <span>—</span>
                      <input type="number" value={hpa.maxReplicas} min={1} max={60} onChange={e => updateHPA({ maxReplicas: Number(e.target.value) })} className="w-12 bg-background border border-input rounded px-1.5 py-0.5 text-center" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Target CPU%</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="number" value={hpa.targetCpuPercent} min={10} max={95} onChange={e => updateHPA({ targetCpuPercent: Number(e.target.value) })} className="w-16 bg-background border border-input rounded px-1.5 py-0.5 text-center text-primary" /> %
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Scale-up Cooldown</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="number" value={hpa.scaleUpCooldownTicks} min={3} max={60} onChange={e => updateHPA({ scaleUpCooldownTicks: Number(e.target.value) })} className="w-16 bg-background border border-input rounded px-1.5 py-0.5 text-center" /> ticks
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* VPA */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
            <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">VPA (Vertical Pod Autoscaler)</p>
            <HintButton hint="Kubernetes VPA — automatically upgrades or downgrades instance hardware based on CPU. Auto mode: upgrades if CPU > 80%, downgrades if CPU < 20%. +40 pts for enabling." />
          </div>
          <button
            type="button"
            onClick={() => updateVPA({ enabled: !vpa.enabled, mode: !vpa.enabled ? 'Auto' : 'Off' })}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
              vpa.enabled
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-secondary/30 border-border text-muted-foreground hover:border-purple-400/50 hover:text-purple-400'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            {vpa.enabled ? '✅ VPA Enabled (Auto) — Click to Disable' : '📦 Enable VPA'}
          </button>
          <AnimatePresence>
            {vpa.enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg space-y-2.5 text-xs">
                  <div className="text-[10px] text-accent font-bold uppercase tracking-wider">spec.updatePolicy.updateMode: {vpa.mode}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Mode</span>
                    <select value={vpa.mode} onChange={e => updateVPA({ mode: e.target.value as 'Off' | 'Initial' | 'Auto' })} className="bg-background border border-input rounded text-xs px-2 py-0.5 focus:outline-none">
                      <option value="Off">Off</option>
                      <option value="Initial">Initial (one-time)</option>
                      <option value="Auto">Auto (continuous)</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Min Type</span>
                    <select value={vpa.minInstanceType} onChange={e => updateVPA({ minInstanceType: e.target.value as InstanceTypeId })} className="bg-background border border-input rounded text-xs px-2 py-0.5 focus:outline-none">
                      {Object.keys(INSTANCE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Max Type</span>
                    <select value={vpa.maxInstanceType} onChange={e => updateVPA({ maxInstanceType: e.target.value as InstanceTypeId })} className="bg-background border border-input rounded text-xs px-2 py-0.5 focus:outline-none">
                      {Object.keys(INSTANCE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Auto mode: upgrades if CPU &gt; 80%, downgrades if CPU &lt; 20% (checks every 15 ticks)</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chaos Engineering */}
        <div className="space-y-2">
          <p className="text-[10px] text-destructive font-bold tracking-wider uppercase flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Chaos Engineering
            <HintButton hint="Inject real-world failure scenarios. Use these to test your architecture's resilience. Can your HPA recover from a crash? Can VPA handle a memory leak? Points are deducted for uncaught crashes." />
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerIncident('crash')}
              disabled={running.length === 0}
              className="px-2 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 text-[10px] font-bold transition-colors disabled:opacity-50"
            >
              💥 Kill Random Node
            </button>
            <button
              onClick={() => triggerIncident('leak')}
              disabled={running.length === 0}
              className="px-2 py-2 rounded-lg bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20 text-[10px] font-bold transition-colors disabled:opacity-50"
            >
              🧠 Memory Leak
            </button>
            <button
              onClick={() => triggerIncident('spike')}
              className="col-span-2 px-2 py-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-[10px] font-bold transition-colors"
            >
              🔥 Traffic Spike (+3000 RPS)
            </button>
          </div>
        </div>

        {/* Crashed — Action Required */}
        <AnimatePresence>
          {crashedInstances.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="pt-1">
              <p className="text-xs text-destructive mb-2 font-medium">⚠️ Action Required: Crashes</p>
              <div className="space-y-1.5">
                {crashedInstances.map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => restartInstance(inst.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-warning/30 bg-warning/10 text-warning text-sm hover:bg-warning/20 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span className="font-mono text-xs">{inst.name}</span>
                    <span className="text-[10px] ml-auto font-bold uppercase tracking-wider">+50 pts · Reboot</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Reset Simulation */}
      <div className="mt-auto pt-4 border-t border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium">
              <RefreshCw className="w-4 h-4" />
              Reset Simulation
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Simulation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all progress and restart the simulation from scratch.
                You will lose:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All instances and applications</li>
                  <li>Your score ({score} points)</li>
                  <li>Saved configurations</li>
                  <li>Learning progress (scenarios remain)</li>
                </ul>
                <p className="mt-3 font-semibold">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={resetSimulation}
                className="bg-destructive hover:bg-destructive/90"
              >
                Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
