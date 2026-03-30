import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore, getSchedulerIcon } from '@/store/schedulerStore';
import { Terminal, Trash2 } from 'lucide-react';

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const TYPE_COLOR: Record<string, string> = {
  pod_scheduled:    'text-success',
  pod_pending:      'text-warning',
  pod_failed:       'text-destructive',
  instance_added:   'text-blue-400',
  instance_removed: 'text-orange-400',
  deployment_scaled:'text-purple-400',
  traffic_switched: 'text-cyan-400',
  hpa_trigger:      'text-primary',
  asg_trigger:      'text-indigo-400',
};

export function SchedulerPanel() {
  const { events, clearLog } = useSchedulerStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/50 shrink-0">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Terminal className="w-4 h-4 text-primary" />
          Scheduler Activity
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded font-mono">
            {events.length}
          </span>
        </div>
        <button
          onClick={clearLog}
          className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-10 px-4 text-center">
            <Terminal className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">Waiting for events…</p>
            <p className="text-[11px] opacity-60">Start the simulation and scale up replicas to see scheduler decisions appear here in real-time.</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            <AnimatePresence initial={false}>
              {events.map((evt) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 py-1.5 px-2 hover:bg-secondary/40 rounded-md transition-colors group"
                >
                  <span className="shrink-0 mt-0.5">{getSchedulerIcon(evt.type)}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold ${TYPE_COLOR[evt.type] ?? 'text-foreground'}`}>
                      {evt.message}
                    </span>
                    {evt.detail && (
                      <p className="text-muted-foreground text-[10px] mt-0.5 truncate">{evt.detail}</p>
                    )}
                  </div>
                  <span className="text-muted-foreground/60 text-[10px] shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors">
                    {timeAgo(evt.timestamp)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
