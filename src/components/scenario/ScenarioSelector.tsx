import { motion } from 'framer-motion';
import { Target, Trophy, Star, Lock, Play, CheckCircle2 } from 'lucide-react';
import { useScenarioStore, SCENARIOS } from '@/store/scenarioStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ScenarioSelector = () => {
  const { completedScenarios, totalXP, startScenario, activeScenario } = useScenarioStore();

  const scenarioList = Object.values(SCENARIOS);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'intermediate': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'advanced': return 'text-red-500 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const isCompleted = (id: string) => completedScenarios.includes(id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Guided Scenarios
            </h2>
            <p className="text-sm text-muted-foreground">
              Learn DevOps by completing real-world challenges
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{totalXP}</span>
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {completedScenarios.length} / {scenarioList.length} completed
            </p>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarioList.map((scenario, index) => {
          const completed = isCompleted(scenario.id);
          const locked = index > 0 && !isCompleted(scenarioList[index - 1].id);

          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "panel p-5 relative overflow-hidden transition-all",
                locked && "opacity-50 cursor-not-allowed",
                completed && "border-green-500/50 bg-green-500/5"
              )}
            >
              {/* Completed Badge */}
              {completed && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              )}

              {/* Locked Overlay */}
              {locked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Complete previous scenario
                    </p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-xs font-bold uppercase px-2 py-1 rounded border",
                      getDifficultyColor(scenario.difficulty)
                    )}>
                      {scenario.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{scenario.rewards.xp} XP</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">{scenario.name}</h3>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {scenario.description}
                </p>

                {/* Objectives Count */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="w-3 h-3" />
                  <span>{scenario.objectives.length} objectives</span>
                  <span>•</span>
                  <span>{scenario.hints.length} hints available</span>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => startScenario(scenario)}
                  disabled={locked || activeScenario?.id === scenario.id}
                  className="w-full gap-2"
                  variant={completed ? "outline" : "default"}
                >
                  <Play className="w-4 h-4" />
                  {activeScenario?.id === scenario.id 
                    ? 'Active' 
                    : completed 
                      ? 'Replay' 
                      : 'Start Scenario'}
                </Button>

                {/* Badge */}
                {scenario.rewards.badge && (
                  <div className="text-xs text-center text-muted-foreground">
                    🏆 <span className="font-semibold">{scenario.rewards.badge}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
