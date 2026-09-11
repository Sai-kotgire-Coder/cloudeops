import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Clock, Lightbulb, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useScenarioStore } from '@/store/scenarioStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// checkObjectives() polling lives in ScenarioObjectiveWatcher, mounted once at
// the App level -- this component only renders the active scenario's state.
export const ScenarioBanner = () => {
  const {
    activeScenario,
    scenarioStartTime,
    currentHintIndex,
    exitScenario,
    showNextHint,
  } = useScenarioStore();

  if (!activeScenario) return null;

  const completedCount = activeScenario.objectives.filter(o => o.completed).length;
  const totalCount = activeScenario.objectives.length;
  const progress = (completedCount / totalCount) * 100;

  const elapsed = scenarioStartTime ? Date.now() - scenarioStartTime : 0;
  const elapsedMinutes = Math.floor(elapsed / 60000);
  const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

  const difficultyColor = {
    beginner: 'text-green-400 bg-green-500/20',
    intermediate: 'text-yellow-400 bg-yellow-500/20',
    advanced: 'text-red-400 bg-red-500/20'
  }[activeScenario.difficulty];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600/95 to-purple-600/95 backdrop-blur-xl border-b-2 border-blue-400/30 shadow-2xl"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Scenario Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-bold text-white">{activeScenario.name}</h2>
                </div>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${difficultyColor}`}>
                  {activeScenario.difficulty}
                </span>
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{elapsedMinutes}:{elapsedSeconds.toString().padStart(2, '0')}</span>
                </div>
              </div>
              <p className="text-sm text-white/90 mb-3">{activeScenario.description}</p>
              
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Objectives: {completedCount}/{totalCount}</span>
                  <span className="text-white font-mono">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/20" />
              </div>
            </div>

            {/* Middle: Objectives */}
            <div className="flex-1 space-y-2">
              {activeScenario.objectives.map((obj) => (
                <div 
                  key={obj.id} 
                  className={`flex items-start gap-2 text-sm p-2 rounded ${
                    obj.completed ? 'bg-green-500/20 border border-green-400/30' : 'bg-white/10 border border-white/20'
                  }`}
                >
                  {obj.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                  )}
                  <span className={obj.completed ? 'text-white line-through' : 'text-white'}>
                    {obj.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={showNextHint}
                disabled={currentHintIndex >= activeScenario.hints.length - 1}
                size="sm"
                variant="secondary"
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Lightbulb className="w-4 h-4" />
                {currentHintIndex < 0 ? 'Show Hint' : `Hint ${currentHintIndex + 2}/${activeScenario.hints.length}`}
              </Button>
              <Button
                onClick={exitScenario}
                size="sm"
                variant="ghost"
                className="gap-2 text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
                Exit Scenario
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
