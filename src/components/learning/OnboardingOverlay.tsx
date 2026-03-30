import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, X, Check } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  route?: string;
  checkComplete: () => boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to CloudSimulator! 🎉',
    description: 'Learn DevOps by managing a simulated cloud infrastructure. We\'ll guide you through the basics.',
    icon: '👋',
    action: 'Get Started',
    checkComplete: () => true
  },
  {
    id: 'start-sim',
    title: 'Start Your Cloud',
    description: 'First, start the simulation by clicking the Play button in the top navigation.',
    icon: '▶️',
    action: 'Start Simulation',
    checkComplete: () => useGameStore.getState().isRunning
  },
  {
    id: 'create-instance',
    title: 'Create a Server',
    description: 'Add your first instance (server) to host your applications. Think of it as renting a computer in the cloud.',
    icon: '🖥️',
    action: 'Go to Instances',
    route: '/instances',
    checkComplete: () => useGameStore.getState().instances.length > 0
  },
  {
    id: 'deploy-app',
    title: 'Deploy an Application',
    description: 'Now deploy your first application. This creates pods (containers) that run on your servers.',
    icon: '📦',
    action: 'Go to Applications',
    route: '/apps',
    checkComplete: () => useGameStore.getState().applications.length > 0
  },
  {
    id: 'scale-up',
    title: 'Scale Your App',
    description: 'Increase replicas to run multiple copies of your app for better availability and performance.',
    icon: '📈',
    action: 'Scale Application',
    route: '/apps',
    checkComplete: () => {
      const apps = useGameStore.getState().applications;
      return apps.some(app => 
        app.deployments.some(dep => dep.replicas >= 2)
      );
    }
  },
  {
    id: 'enable-lb',
    title: 'Enable Load Balancer',
    description: 'Distribute traffic evenly across your pods to prevent overload on a single instance.',
    icon: '⚖️',
    action: 'Enable Load Balancer',
    checkComplete: () => useGameStore.getState().hasLoadBalancer
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🚀',
    description: 'Great job! You\'ve learned the basics. Now try scenarios to master advanced DevOps patterns.',
    icon: '🎓',
    action: 'Explore Scenarios',
    route: '/scenarios',
    checkComplete: () => true
  }
];

export const OnboardingOverlay = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem('onboarding_completed') === 'true';
  });
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthStore();

  // Double-check localStorage on mount to prevent flickering
  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed') === 'true';
    if (completed && !hasSeenOnboarding) {
      setHasSeenOnboarding(true);
    }
  }, [hasSeenOnboarding]);

  useEffect(() => {
    // Auto-advance when step is complete
    const interval = setInterval(() => {
      const step = ONBOARDING_STEPS[currentStep];
      if (step && step.checkComplete() && currentStep < ONBOARDING_STEPS.length - 1) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, 1000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Don't show overlay while auth is loading or if user has seen it
  if (authLoading || hasSeenOnboarding || dismissed) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isComplete = step?.checkComplete();
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (step.route) {
      navigate(step.route);
    }
    
    if (currentStep === 1 && !useGameStore.getState().isRunning) {
      useGameStore.getState().toggleSimulation();
    }

    if (currentStep === 5 && !useGameStore.getState().hasLoadBalancer) {
      useGameStore.getState().toggleLoadBalancer();
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setHasSeenOnboarding(true);
    setDismissed(true);
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setHasSeenOnboarding(true);
    navigate('/scenarios');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="panel p-8 max-w-2xl w-full mx-4 relative"
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= currentStep ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center space-y-4 mb-8">
            <div className="text-6xl mb-4">{step.icon}</div>
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
              {step.description}
            </p>
          </div>

          {/* Status */}
          {isComplete && currentStep > 0 && currentStep < ONBOARDING_STEPS.length - 1 && (
            <div className="flex items-center justify-center gap-2 mb-6 text-green-500">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Step Completed!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="gap-2"
            >
              Skip Tutorial
            </Button>
            
            <Button
              onClick={handleNext}
              className="gap-2"
              size="lg"
            >
              {step.action}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
