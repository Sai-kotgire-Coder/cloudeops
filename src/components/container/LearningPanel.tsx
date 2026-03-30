import { X, BookOpen, Lightbulb, Zap, Target, Rocket, Activity, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { dockerLearningContent, type LearningSectionId } from '@/data/dockerLearningContent';

interface LearningPanelProps {
  isOpen: boolean;
  sectionId: LearningSectionId | null;
  onClose: () => void;
}

// Map topic IDs to their module names for breadcrumb
const getModuleForTopic = (topicId: LearningSectionId): string => {
  const cicdTopics = ['ci_pipeline', 'build_stage', 'test_stage', 'docker_build', 'image_push', 'deployment', 'rollback', 'deployment_strategies', 'pipeline_monitoring'];
  const dockerTopics = ['dockerImage', 'container', 'traffic', 'loadBalancer', 'autoScaling', 'containerCrash', 'buildProcess', 'baseImages', 'ports'];
  
  if (cicdTopics.includes(topicId)) return 'CI/CD Pipeline';
  if (dockerTopics.includes(topicId)) return 'Container Lab';
  return 'Learning';
};

interface LearningPanelProps {
  isOpen: boolean;
  sectionId: LearningSectionId | null;
  onClose: () => void;
}

export const LearningPanel = ({ isOpen, sectionId, onClose }: LearningPanelProps) => {
  if (!sectionId) return null;

  const content = dockerLearningContent[sectionId];
  if (!content) return null;

  const moduleName = getModuleForTopic(sectionId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-[#0f172a] border-l-2 border-gray-700 z-50 shadow-2xl"
          >
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Header with Breadcrumb */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Learning</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className="text-blue-400 font-medium">{moduleName}</span>
                    </div>
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-start gap-2">
                      <span className="text-3xl">{content.icon}</span>
                      <span className="flex-1">{content.title}</span>
                    </h2>
                  </div>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-gray-800 shrink-0 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Definition */}
                <div className="bg-[#111827] border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white text-lg">Definition</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-base">
                    {content.definition}
                  </p>
                </div>

                {/* How It Works */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-semibold text-white text-lg">How It Works</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {content.howItWorks.map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 bg-[#1e293b] border border-gray-700 rounded-lg p-3"
                      >
                        <span className="text-yellow-400 font-bold shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <span className="text-gray-300 text-base leading-relaxed">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Why We Use It */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white text-lg">Why We Use It</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {content.whyWeUseIt.map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 + 0.2 }}
                        className="flex items-start gap-3 bg-[#1e293b] border border-gray-700 rounded-lg p-3"
                      >
                        <span className="text-green-400 text-lg shrink-0">✓</span>
                        <span className="text-gray-300 text-base leading-relaxed">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Real-World Example */}
                <div className="bg-[#111827] border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white text-lg">Real-World Example</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-base italic">
                    {content.realWorldExample}
                  </p>
                </div>

                {/* In Your Simulation */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-semibold text-white text-lg">In Your Simulation</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-base">
                    {content.inYourSimulation}
                  </p>
                </div>

                {/* Additional Tips */}
                {content.additionalTips && content.additionalTips.length > 0 && (
                  <div className="bg-[#1e293b] border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      <h3 className="font-semibold text-white text-lg">Pro Tips</h3>
                    </div>
                    <ul className="space-y-2">
                      {content.additionalTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300 text-base">
                          <span className="text-yellow-400 shrink-0">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Close Button */}
                <Button
                  onClick={onClose}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-base transition-colors"
                >
                  Got it! Close Learning Panel
                </Button>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
