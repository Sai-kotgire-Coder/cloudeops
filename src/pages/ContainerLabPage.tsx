import { useEffect, useState } from 'react';
import { useContainerStore } from '@/store/containerStore';
import { ImageBuilder } from '@/components/container/ImageBuilder';
import { ImageLibrary } from '@/components/container/ImageLibrary';
import { ContainerCard } from '@/components/container/ContainerCard';
import { TrafficSimulator } from '@/components/container/TrafficSimulator';
import { TrafficDistributionPanel } from '@/components/container/TrafficDistributionPanel';
import { LearningPanel } from '@/components/container/LearningPanel';
import { Container, Layers, Trophy, RefreshCw, Lightbulb, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearningStore } from '@/store/learningStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

const TUTORIAL_STEPS = [
  {
    id: 0,
    title: 'Build Your First Docker Image',
    description: 'Use the image builder to create a Docker image from a base image like nginx or node.',
    hint: 'Try building an nginx image called "my-web-app"',
  },
  {
    id: 1,
    title: 'Run a Container',
    description: 'Click "Run Container" on your built image to deploy it.',
    hint: 'Containers are running instances of images',
  },
  {
    id: 2,
    title: 'Send Traffic',
    description: 'Use the traffic simulator to send requests to your container.',
    hint: 'Start with 50-100 RPS and gradually increase',
  },
  {
    id: 3,
    title: 'Observe Container Crash',
    description: 'Increase traffic beyond container capacity to see a failure.',
    hint: 'Each container has limited capacity (shown in the card)',
  },
  {
    id: 4,
    title: 'Enable Auto-Scaling',
    description: 'Turn on HPA (Horizontal Pod Autoscaler) to automatically scale containers.',
    hint: 'Auto-scaling adds containers when CPU is high',
  },
  {
    id: 5,
    title: 'Master Complete!',
    description: 'You now understand Docker containers and Kubernetes scaling!',
    hint: 'Try the challenges to test your skills',
  },
];

export default function ContainerLabPage() {
  const {
    containers,
    runContainer,
    simulationTick,
    isTrafficRunning,
    score,
    tutorialStep,
    resetSimulation,
    images,
  } = useContainerStore();

  const { openTopic } = useLearningStore();
  const [showTutorial, setShowTutorial] = useState(true);
  const [learningPanelOpen, setLearningPanelOpen] = useState(false);
  const [learningSectionId, setLearningSectionId] = useState<LearningSectionId | null>(null);

  const openLearningPanel = (sectionId: LearningSectionId) => {
    setLearningSectionId(sectionId);
    setLearningPanelOpen(true);
  };

  const closeLearningPanel = () => {
    setLearningPanelOpen(false);
  };

  // Simulation loop
  useEffect(() => {
    if (!isTrafficRunning) return;
    const interval = setInterval(simulationTick, 1000);
    return () => clearInterval(interval);
  }, [isTrafficRunning, simulationTick]);

  // Handle drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const imageId = e.dataTransfer.getData('imageId');
    if (imageId) {
      runContainer(imageId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const currentTutorial = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1];
  const tutorialComplete = tutorialStep >= TUTORIAL_STEPS.length - 1;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Container className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg sm:text-xl">Container Lab</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Learn Docker, Containers & Kubernetes Pods
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm">{score}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">pts</span>
          </div>

          {/* Learn Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => openTopic('containers')}
            className="gap-2 hidden sm:flex"
          >
            <BookOpen className="w-4 h-4" />
            Learn More
          </Button>

          {/* Reset */}
          <Button
            size="sm"
            variant="outline"
            onClick={resetSimulation}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </header>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && !tutorialComplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 sm:mx-6 mt-4 panel p-4 bg-primary/5 border-primary/30 relative overflow-hidden"
          >
            <button
              onClick={() => setShowTutorial(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">
                    Step {tutorialStep + 1} / {TUTORIAL_STEPS.length}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1">{currentTutorial.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {currentTutorial.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded w-fit">
                  <span>💡</span>
                  <span>{currentTutorial.hint}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-full h-1 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* Top Row: Image Builder + Traffic Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Image Builder & Library */}
            <div className="lg:col-span-2 space-y-6">
              <ImageBuilder onLearnMore={openLearningPanel} />
              <ImageLibrary />
            </div>

            {/* Right: Traffic Controls */}
            <div className="lg:col-span-1">
              <TrafficSimulator onLearnMore={openLearningPanel} />
            </div>
          </div>

          {/* Center: Traffic Distribution (MAIN FOCUS) */}
          <TrafficDistributionPanel onLearnMore={openLearningPanel} />

          {/* Bottom: Running Containers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Running Containers</h2>
                  <p className="text-sm text-gray-400">
                    {containers.length} active {containers.length === 1 ? 'instance' : 'instances'}
                  </p>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`min-h-[300px] p-6 rounded-2xl border-2 border-dashed transition-all ${
                containers.length === 0
                  ? 'border-cyan-500/30 bg-cyan-500/5'
                  : 'border-gray-700 bg-[#0f172a]'
              }`}
            >
              {containers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <Container className="w-20 h-20 text-gray-600 mb-4 opacity-30" />
                  <h3 className="text-xl font-bold text-white mb-2">Deploy Your First Container</h3>
                  <p className="text-base text-gray-400 max-w-md mb-4">
                    Drag an image from above or click "Run Container" to deploy
                  </p>
                  <div className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-500/10 px-4 py-2 rounded-lg">
                    <span>💡</span>
                    <span>Containers are running instances of Docker images</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {containers.map((container) => (
                      <ContainerCard key={container.id} containerId={container.id} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Complete Modal */}
      <AnimatePresence>
        {tutorialComplete && showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="panel p-8 max-w-md text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Tutorial Complete! 🎉</h2>
              <p className="text-muted-foreground mb-6">
                You've mastered Docker containers and Kubernetes scaling fundamentals.
                You earned <span className="font-bold text-primary">{score} points</span>!
              </p>
              <div className="space-y-2">
                <Button onClick={() => setShowTutorial(false)} className="w-full">
                  Continue Exploring
                </Button>
                <Button
                  onClick={() => openTopic('containers')}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Learn More Advanced Topics
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Learning Panel */}
      <LearningPanel
        isOpen={learningPanelOpen}
        sectionId={learningSectionId}
        onClose={closeLearningPanel}
      />
    </div>
  );
}
