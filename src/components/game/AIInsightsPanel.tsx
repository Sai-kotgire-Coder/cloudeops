import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Info, CheckCircle2, Zap, ChevronRight, Sparkles } from 'lucide-react';
import { generateInsights, calculateHealthScore } from '@/utils/aiInsights';
import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useLearningStore } from '@/store/learningStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const AIInsightsPanel = () => {
  const [insights, setInsights] = useState(generateInsights());
  const [healthScore, setHealthScore] = useState(calculateHealthScore());
  const [expanded, setExpanded] = useState(true);
  const tick = useGameStore(s => s.tick);
  const openTopic = useLearningStore(s => s.openTopic);

  useEffect(() => {
    setInsights(generateInsights());
    setHealthScore(calculateHealthScore());
  }, [tick]);

  const topInsight = insights[0];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <Info className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Sparkles className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'success': return 'bg-green-500/10 border-green-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Health Score */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/30"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">System Health Score</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 px-2"
          >
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform",
              expanded && "rotate-90"
            )} />
          </Button>
        </div>
        
        <div className="flex items-baseline gap-3">
          <span className={cn("text-5xl font-bold tabular-nums", healthScore.color)}>
            {healthScore.score}
          </span>
          <div>
            <span className={cn("text-3xl font-bold", healthScore.color)}>
              {healthScore.grade}
            </span>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>
        
        <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              healthScore.score >= 80 ? 'bg-green-500' :
              healthScore.score >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${healthScore.score}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Top Insight */}
      <AnimatePresence mode="wait">
        {topInsight && (
          <motion.div
            key={topInsight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn("panel p-4 border", getInsightColor(topInsight.type))}
          >
            <div className="flex items-start gap-3 mb-3">
              {getInsightIcon(topInsight.type)}
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">{topInsight.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {topInsight.message}
                </p>
              </div>
            </div>

            {topInsight.suggestedActions.length > 0 && (
              <div className="space-y-2 ml-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Suggested Actions:
                </p>
                {topInsight.suggestedActions.map((action, i) => (
                  <Button
                    key={i}
                    onClick={() => {
                      action.action();
                      if (action.learnMore) {
                        openTopic(action.learnMore as any);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full justify-start gap-2 text-xs"
                  >
                    <Zap className="w-3 h-3" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Insights (Expandable) */}
      <AnimatePresence>
        {expanded && insights.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-xs font-semibold text-muted-foreground px-2">
              Other Insights ({insights.length - 1})
            </p>
            {insights.slice(1, 4).map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("panel p-3 border", getInsightColor(insight.type))}
              >
                <div className="flex items-start gap-2">
                  <div className="scale-75">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-xs mb-0.5">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{insight.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
