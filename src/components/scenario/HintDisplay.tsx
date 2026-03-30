import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';
import { useScenarioStore } from '@/store/scenarioStore';
import { Button } from '@/components/ui/button';

export const HintDisplay = () => {
  const { activeScenario, currentHintIndex, showNextHint } = useScenarioStore();

  if (!activeScenario || currentHintIndex < 0) return null;

  const currentHint = activeScenario.hints[currentHintIndex];
  const hasMoreHints = currentHintIndex < activeScenario.hints.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-40 max-w-sm"
      >
        <div className="panel p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">
                    Hint {currentHintIndex + 1}/{activeScenario.hints.length}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {currentHint}
                </p>
              </div>

              {hasMoreHints && (
                <Button
                  onClick={showNextHint}
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-yellow-400/30 hover:bg-yellow-500/10"
                >
                  <Lightbulb className="w-3 h-3" />
                  Show Next Hint
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
