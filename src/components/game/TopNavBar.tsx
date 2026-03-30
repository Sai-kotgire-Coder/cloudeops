import { useGameStore, INSTANCE_TYPES, SCORE_ACTIONS } from '@/store/gameStore';
import { useLearningStore } from '@/store/learningStore';
import { useThemeStore } from '@/store/themeStore';
import { Bell, Pause, Play, Trophy, Moon, Sun, DollarSign, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { HintButton } from './HintButton';
import { InfoTooltip } from '@/components/learning/InfoTooltip';

export const TopNavBar = () => {
  const { score, scoreHistory, scenario, isRunning, toggleSimulation, alerts, totalCost, instances } = useGameStore();
  const { beginnerMode, toggleBeginnerMode } = useLearningStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const activeAlerts = alerts.filter(a => !a.dismissed);

  // Calculate live hourly cost based on active instances
  const currentHourlyCost = instances.reduce((acc, inst) => {
    return acc + INSTANCE_TYPES[inst.typeId].costPerHour;
  }, 0);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 relative z-50">
      <SidebarTrigger className="mr-1" />

      {/* Scenario */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
        <span className="text-muted-foreground">Scenario:</span>
        <span className="font-medium">{scenario}</span>
      </div>
      
      {/* Cost Tracker */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/20">
        <DollarSign className="w-4 h-4 text-warning" />
        <span className="font-mono font-bold text-warning text-sm">${totalCost.toFixed(4)} <span className="text-xs font-normal opacity-75">(${currentHourlyCost.toFixed(2)}/hr)</span></span>
        <HintButton hint="Your total accumulated cloud bill and the current hourly run-rate of all provisioned hardware." />
      </div>

      <div className="flex-1" />

      {/* Score */}
      <div className="relative">
        <button
          onClick={() => setShowScore(!showScore)}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-mono font-bold text-primary">{score}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:block">pts</span>
        </button>
        <AnimatePresence>
          {showScore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowScore(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-12 w-80 panel max-h-96 overflow-auto z-50 shadow-xl"
              >
                <div className="panel-header sticky top-0 bg-card z-10">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Score: {score} pts</span>
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">How to earn points</p>
                  {(Object.entries(SCORE_ACTIONS) as [string, { points: number; label: string; emoji: string }][]).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-muted-foreground">{val.emoji} {val.label}</span>
                      <span className={`font-mono font-bold ml-2 shrink-0 ${val.points > 0 ? 'text-success' : 'text-destructive'}`}>{val.points > 0 ? '+' : ''}{val.points}</span>
                    </div>
                  ))}
                </div>
                {scoreHistory.length > 0 && (
                  <div className="border-t border-border p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent Activity</p>
                    <div className="space-y-1">
                      {scoreHistory.slice(-8).reverse().map((e, i) => (
                        <div key={i} className="flex justify-between text-[10px] font-mono">
                          <span className="text-muted-foreground truncate">{SCORE_ACTIONS[e.action]?.emoji} {SCORE_ACTIONS[e.action]?.label}</span>
                          <span className={`ml-2 shrink-0 font-bold ${e.delta > 0 ? 'text-success' : 'text-destructive'}`}>{e.delta > 0 ? '+' : ''}{e.delta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-secondary active:bg-secondary/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
      </button>

      {/* Beginner Mode Toggle */}
      <InfoTooltip
        title="Beginner Mode"
        description="Shows step-by-step guidance, smart suggestions, and helpful tooltips throughout the app"
        actionHint={beginnerMode ? "Click to disable guidance" : "Click to enable guidance"}
      >
        <button
          onClick={toggleBeginnerMode}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs transition-all min-h-[44px] ${
            beginnerMode 
              ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' 
              : 'bg-secondary text-muted-foreground border border-border'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span className="hidden sm:inline">Guide</span>
        </button>
      </InfoTooltip>

      {/* Notifications */}
      <div className="relative">
        <button 
          onClick={() => setShowNotifs(!showNotifs)} 
          className="relative p-2 rounded-lg hover:bg-secondary active:bg-secondary/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {activeAlerts.length > 0 && (
            <motion.span
               key={activeAlerts.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold"
            >
              {activeAlerts.length}
            </motion.span>
          )}
        </button>
        <AnimatePresence>
          {showNotifs && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-12 w-72 panel max-h-64 overflow-auto z-50 shadow-xl"
            >
              <div className="panel-header sticky top-0 bg-card z-10">
                <span className="text-sm font-medium">System Alerts</span>
              </div>
              {activeAlerts.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">All systems operational ✅</p>
              ) : (
                activeAlerts.slice(-10).reverse().map(a => (
                  <div key={a.id} className={`px-4 py-3 border-b border-border text-sm flex gap-2 items-start ${a.type === 'critical' ? 'text-destructive bg-destructive/5' : a.type === 'warning' ? 'text-warning bg-warning/5' : 'text-muted-foreground'}`}>
                    <span className="mt-0.5">{a.emoji}</span>
                    <span>{a.message}</span>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Play/Pause */}
      <button
        onClick={toggleSimulation}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all min-h-[44px] ${
          isRunning ? 'bg-warning/15 text-warning border border-warning/30 active:bg-warning/20' : 'bg-success/15 text-success border border-success/30 active:bg-success/20'
        }`}
      >
        {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        <span className="hidden xs:inline">{isRunning ? 'Pause' : 'Start'}</span>
      </button>
    </header>
  );
};
