import { useGameStore } from '@/store/gameStore';
import { Server, RotateCcw, Trash2, Eye, Plus, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AddInstanceWizard } from '@/components/instances/AddInstanceWizard';
import { Button } from '@/components/ui/button';

const InstancesPage = () => {
  const { instances, removeInstance, restartInstance } = useGameStore();
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-auto h-full relative w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Instance Manager</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">View, manage, and scale your cloud infrastructure instances</p>
        </div>
        <Button 
          onClick={() => setShowWizard(true)} 
          className="gap-2 shrink-0 min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Instance
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 pt-2">
        {instances.map((inst, i) => (
          <motion.div
            key={inst.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`panel p-5 space-y-5 relative overflow-hidden ${
              inst.status === 'crashed'
                ? 'border-destructive/30 bg-destructive/5'
                : inst.status === 'provisioning'
                ? 'border-warning/40 border-dashed'
                : inst.scaledBy === 'hpa'
                ? 'border-blue-400/40 bg-blue-400/5'
                : inst.scaledBy === 'vpa'
                ? 'border-purple-400/40 bg-purple-400/5'
                : inst.scaledBy === 'asg'
                ? 'border-orange-400/40 bg-orange-400/5'
                : 'border-success/20 hover:border-success/30 transition-colors'
            }`}
          >
            {/* Autoscaler origin badge */}
            {inst.scaledBy && inst.scaledBy !== 'manual' && (
              <div className={`absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-bl-lg ${
                inst.scaledBy === 'hpa' ? 'bg-blue-500/20 text-blue-400' :
                inst.scaledBy === 'vpa' ? 'bg-purple-500/20 text-purple-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {inst.scaledBy === 'hpa' ? '🤖 HPA' : inst.scaledBy === 'vpa' ? '📦 VPA' : '📈 ASG'} Managed
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${
                  inst.status === 'running' ? 'bg-success/10 text-success'
                  : inst.status === 'provisioning' ? 'bg-warning/10 text-warning'
                  : 'bg-destructive/10 text-destructive'
                }`}>
                  {inst.status === 'provisioning' ? <RotateCcw className="w-5 h-5 animate-spin-slow" /> : <Server className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-mono font-bold text-lg leading-tight flex items-center gap-2">
                    {inst.name}
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-widest">{inst.typeId}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {inst.id}</p>
                </div>
              </div>
              <div className={inst.status === 'running' ? 'status-running relative scale-125 mr-2' : inst.status === 'crashed' ? 'status-crashed scale-125 mr-2' : 'w-2 h-2 rounded-full bg-warning animate-pulse mr-2'} />
            </div>

            <div className="space-y-4 bg-secondary/10 p-4 rounded-lg border border-border/50">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium">CPU Usage</span>
                  <span className="font-mono font-bold text-foreground">{inst.cpu.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      inst.cpu > 85 ? 'bg-destructive' : inst.cpu > 60 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(100, inst.cpu)}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Memory Usage</span>
                  <span className="font-mono font-bold text-foreground">{inst.memory.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${Math.min(100, inst.memory)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-1">
              <button
                onClick={() => navigate('/instances/' + inst.id)}
                className="flex-[2] flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors shadow-sm min-h-[44px]"
              >
                <Eye className="w-4 h-4" /> Manage
              </button>
              {inst.status === 'crashed' ? (
                <button
                  onClick={() => restartInstance(inst.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold border border-warning/20 bg-warning/5 text-warning hover:bg-warning/10 active:bg-warning/15 transition-colors shadow-sm min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" /> Restart
                </button>
              ) : (
                <button
                  onClick={() => removeInstance(inst.id)}
                  disabled={instances.length <= 1}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 active:bg-destructive/15 transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>

            {/* Associated Resources */}
            <div className="border-t border-border pt-4 mt-2">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3 h-3" /> Scheduled Pods ({inst.pods.length})
                </p>
              </div>
              <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                {inst.pods.map(pod => (
                  <div key={pod.id} className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1.5 rounded-md bg-secondary/50 text-foreground font-mono border border-border flex-1 truncate flex items-center justify-between">
                      <span className="truncate mr-2">{pod.id}</span>
                      <span className={`text-[10px] shrink-0 font-bold ${pod.cpu > 80 ? 'text-destructive' : 'text-muted-foreground'}`}>{pod.cpu.toFixed(0)}% CPU</span>
                    </span>
                    <span className={`px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      pod.status === 'running' ? 'bg-success/10 text-success border border-success/20' : pod.status === 'crashed' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-warning/10 text-warning border border-warning/20'
                    }`}>
                      {pod.status}
                    </span>
                  </div>
                ))}
                {inst.pods.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2 italic">No pods scheduled</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AddInstanceWizard open={showWizard} onOpenChange={setShowWizard} />
    </div>
  );
};

export default InstancesPage;
