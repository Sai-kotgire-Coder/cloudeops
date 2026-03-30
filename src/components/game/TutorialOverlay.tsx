import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const steps = [
  {
    title: 'Welcome to CloudOps Simulator! 🚀',
    desc: 'Learn DevOps by managing cloud infrastructure. Let\'s start with a quick tour.',
  },
  {
    title: 'Step 1: Your Infrastructure',
    desc: 'On the left, you can see your servers. You start with one instance. Think of it as a single computer running your app.',
  },
  {
    title: 'Step 2: Start the Simulation',
    desc: 'Click the green "Start" button in the top-right to begin. Traffic will start flowing to your servers.',
  },
  {
    title: 'Step 3: Watch the Metrics',
    desc: 'The center dashboard shows CPU usage, traffic, and errors in real-time. Green = good, Red = trouble!',
  },
  {
    title: 'Step 4: Scale Up!',
    desc: 'Use the "Add Instance" button on the right to add more servers when load increases. More servers = less CPU per server.',
  },
  {
    title: 'Step 5: Handle Incidents',
    desc: 'Servers can crash under heavy load! Watch for alerts and restart crashed instances quickly to keep your score high.',
  },
  {
    title: 'You\'re Ready! 🎮',
    desc: 'Experiment with traffic levels, auto-scaling, and load balancers. Have fun learning DevOps!',
  },
];

export const TutorialOverlay = () => {
  const { tutorialStep, tutorialComplete, advanceTutorial, completeTutorial } = useGameStore();
  const [hasDismissed, setHasDismissed] = useState(() => {
    return localStorage.getItem('tutorial_completed') === 'true';
  });

  useEffect(() => {
    // Check localStorage on mount to prevent showing if already completed
    const completed = localStorage.getItem('tutorial_completed') === 'true';
    if (completed && !tutorialComplete) {
      completeTutorial();
    }
  }, [tutorialComplete, completeTutorial]);

  const handleComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setHasDismissed(true);
    completeTutorial();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setHasDismissed(true);
    completeTutorial();
  };

  // Don't show if already dismissed, completed, or step is negative
  if (hasDismissed || tutorialComplete || tutorialStep < 0) return null;

  const step = steps[tutorialStep];
  if (!step) return null;

  const isLast = tutorialStep === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full panel p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold">{step.title}</h2>
            <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{step.desc}</p>

          {/* Progress */}
          <div className="flex gap-1 mb-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= tutorialStep ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
              Skip Tutorial
            </button>
            <button
              onClick={isLast ? handleComplete : advanceTutorial}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {isLast ? 'Start Playing' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
