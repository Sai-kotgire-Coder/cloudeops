import { useState } from 'react';
import { PipelineTrigger } from '@/components/cicd/PipelineTrigger';
import { PipelineVisualization } from '@/components/cicd/PipelineVisualization';
import { PipelineHistory } from '@/components/cicd/PipelineHistory';
import { LearningPanel } from '@/components/container/LearningPanel';
import { GitBranch, BookOpen, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LearningSectionId } from '@/data/dockerLearningContent';

export default function CICDPage() {
  const [learningPanelOpen, setLearningPanelOpen] = useState(false);
  const [learningSectionId, setLearningSectionId] = useState<LearningSectionId | null>(null);

  const openLearningPanel = (sectionId: LearningSectionId) => {
    setLearningSectionId(sectionId);
    setLearningPanelOpen(true);
  };

  const closeLearningPanel = () => {
    setLearningPanelOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg sm:text-xl">CI/CD Pipeline</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Continuous Integration & Continuous Deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm">0</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">pts</span>
          </div>

          {/* Learn Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => openLearningPanel('ci_pipeline')}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Learn More</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* Explainer Banner */}
          <div className="bg-[#111827] border-2 border-green-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <GitBranch className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Welcome to the CI/CD Lab</h2>
                <p className="text-base text-gray-300 mb-3">
                  Experience a real-world DevOps pipeline! Push code changes and watch as they flow through automated build, test, containerization, and deployment stages.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                    ⚡ Automated Testing
                  </span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                    🐳 Docker Integration
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                    🚀 Kubernetes Deploy
                  </span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                    🔄 Rollback Support
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Trigger & History */}
            <div className="lg:col-span-1 space-y-6">
              <PipelineTrigger onLearnMore={openLearningPanel} />
              <PipelineHistory />
            </div>

            {/* Right: Pipeline Visualization */}
            <div className="lg:col-span-2">
              <PipelineVisualization />
            </div>
          </div>

          {/* Learning Resources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => openLearningPanel('build_stage')}
              className="bg-[#0f172a] border-2 border-gray-700 hover:border-blue-500/50 rounded-xl p-5 text-left transition-all group"
            >
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                🔨 Build Stage
              </h3>
              <p className="text-sm text-gray-400">
                Learn how code is compiled and prepared for deployment
              </p>
            </button>

            <button
              onClick={() => openLearningPanel('test_stage')}
              className="bg-[#0f172a] border-2 border-gray-700 hover:border-green-500/50 rounded-xl p-5 text-left transition-all group"
            >
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-green-400 transition-colors">
                🧪 Testing
              </h3>
              <p className="text-sm text-gray-400">
                Why automated tests are critical before deployment
              </p>
            </button>

            <button
              onClick={() => openLearningPanel('deployment_strategies')}
              className="bg-[#0f172a] border-2 border-gray-700 hover:border-purple-500/50 rounded-xl p-5 text-left transition-all group"
            >
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                🚀 Deployment Strategies
              </h3>
              <p className="text-sm text-gray-400">
                Rolling, Blue/Green, and Canary deployments explained
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Learning Panel */}
      <LearningPanel
        isOpen={learningPanelOpen}
        sectionId={learningSectionId}
        onClose={closeLearningPanel}
      />
    </div>
  );
}
