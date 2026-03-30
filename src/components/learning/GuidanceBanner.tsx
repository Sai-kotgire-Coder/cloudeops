import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, BookOpen, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getGuidanceSuggestions } from '@/utils/guidanceEngine';
import { useLearningStore } from '@/store/learningStore';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const GuidanceBanner = () => {
  const [suggestions, setSuggestions] = useState(getGuidanceSuggestions());
  const [dismissed, setDismissed] = useState<string[]>([]);
  const tick = useGameStore(s => s.tick);
  const beginnerMode = useLearningStore(s => s.beginnerMode);
  const openTopic = useLearningStore(s => s.openTopic);

  useEffect(() => {
    setSuggestions(getGuidanceSuggestions());
  }, [tick]);

  if (!beginnerMode) return null;

  const activeSuggestion = suggestions.find(s => !dismissed.includes(s.id));
  if (!activeSuggestion) return null;

  const priorityColors = {
    critical: 'from-red-500/20 to-orange-500/20 border-red-500/30',
    high: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    medium: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    low: 'from-green-500/20 to-emerald-500/20 border-green-500/30'
  };

  const handleDismiss = () => {
    setDismissed([...dismissed, activeSuggestion.id]);
  };

  const handleAction = () => {
    if (activeSuggestion.actionCallback) {
      activeSuggestion.actionCallback();
    }
    if (activeSuggestion.learnMoreTopic) {
      openTopic(activeSuggestion.learnMoreTopic as any);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSuggestion.id}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className={cn(
          "fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-full mx-4",
          "panel p-4 border-2 bg-[#111827]",
          priorityColors[activeSuggestion.priority]
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl mt-0.5">
            {activeSuggestion.icon}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm mb-1">
                  {activeSuggestion.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeSuggestion.description}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Lightbulb className="w-3 h-3 text-primary" />
              <p className="text-xs font-medium text-primary">
                {activeSuggestion.action}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {activeSuggestion.actionCallback && (
                <Button
                  size="sm"
                  onClick={activeSuggestion.actionCallback}
                  className="gap-2 h-7 text-xs"
                >
                  <Zap className="w-3 h-3" />
                  Quick Fix
                </Button>
              )}
              
              {activeSuggestion.learnMoreTopic && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAction}
                  className="gap-2 h-7 text-xs"
                >
                  <BookOpen className="w-3 h-3" />
                  Learn More
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-7 text-xs ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>

        {suggestions.length > 1 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {suggestions.length - 1} more suggestion(s) available
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
