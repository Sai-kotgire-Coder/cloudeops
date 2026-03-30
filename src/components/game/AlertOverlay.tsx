import { useGameStore } from '@/store/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';

const icons = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const styles = {
  critical: 'border-destructive/40 bg-destructive/10 text-destructive shadow-sm',
  warning: 'border-warning/40 bg-warning/10 text-warning shadow-sm',
  info: 'border-primary/40 bg-primary/10 text-primary shadow-sm',
  success: 'border-success/50 bg-success/10 text-success',
};

export const AlertOverlay = () => {
  const { alerts, dismissAlert } = useGameStore();
  const active = alerts.filter(a => !a.dismissed).slice(-3);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {active.map(alert => {
          const Icon = icons[alert.type];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${styles[alert.type]}`}
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm flex-1">{alert.message}</p>
              <button onClick={() => dismissAlert(alert.id)} className="hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
