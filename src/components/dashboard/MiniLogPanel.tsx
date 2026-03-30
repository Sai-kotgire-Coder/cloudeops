import { useSchedulerStore } from '@/store/schedulerStore';
import { ScrollText, Info, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function MiniLogPanel() {
  const events = useSchedulerStore(s => s.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const recentEvents = events.slice(-10).reverse();

  const getEventIcon = (message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('crash') || lower.includes('fail')) {
      return <AlertOctagon className="w-3 h-3 text-red-500" />;
    }
    if (lower.includes('warn') || lower.includes('pending')) {
      return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    }
    if (lower.includes('success') || lower.includes('scheduled') || lower.includes('added')) {
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    }
    return <Info className="w-3 h-3 text-blue-500" />;
  };

  const getEventType = (message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('crash') || lower.includes('fail')) {
      return 'ERROR';
    }
    if (lower.includes('warn') || lower.includes('pending')) {
      return 'WARN';
    }
    if (lower.includes('success') || lower.includes('scheduled') || lower.includes('added')) {
      return 'INFO';
    }
    return 'INFO';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ERROR':
        return 'text-red-500';
      case 'WARN':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  if (recentEvents.length === 0) {
    return (
      <div className="panel p-4 h-full flex flex-col">
        <div className="mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-primary" />
            System Logs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time event stream
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No events yet. Start the simulation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" />
          System Logs
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Last {recentEvents.length} events
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto space-y-1 font-mono text-xs"
      >
        <AnimatePresence initial={false}>
          {recentEvents.map((event, idx) => {
            const type = getEventType(event.message);
            const timestamp = new Date(event.timestamp).toLocaleTimeString();

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 p-2 rounded hover:bg-secondary/50 transition-colors"
              >
                {getEventIcon(event.message)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {timestamp}
                    </span>
                    <span className={`text-[10px] font-bold ${getTypeColor(type)}`}>
                      [{type}]
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5 break-words">
                    {event.message}
                  </p>
                  {event.detail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {event.detail}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
