import { useState } from 'react';
import { useCICDStore, type Environment, type DeploymentStrategy } from '@/store/cicdStore';
import { GitCommit, Play, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface PipelineTriggerProps {
  onLearnMore?: (sectionId: LearningSectionId) => void;
}

export const PipelineTrigger = ({ onLearnMore }: PipelineTriggerProps) => {
  const { isRunning, triggerPipeline } = useCICDStore();
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [environment, setEnvironment] = useState<Environment>('dev');
  const [strategy, setStrategy] = useState<DeploymentStrategy>('rolling');

  const handleTrigger = () => {
    if (!commitMessage.trim()) {
      return;
    }
    
    triggerPipeline(commitMessage, branch, environment, strategy);
    setCommitMessage('');
  };

  const branchOptions = [
    { value: 'main', label: 'main', icon: '🌳', color: 'text-green-400' },
    { value: 'develop', label: 'develop', icon: '🔧', color: 'text-blue-400' },
    { value: 'feature/new-auth', label: 'feature/new-auth', icon: '✨', color: 'text-purple-400' },
    { value: 'hotfix/security', label: 'hotfix/security', icon: '🔥', color: 'text-red-400' },
  ];

  const environmentOptions = [
    { value: 'dev', label: 'Development', icon: '🧪', description: 'Fast, minimal checks' },
    { value: 'staging', label: 'Staging', icon: '🎭', description: 'Pre-production testing' },
    { value: 'production', label: 'Production', icon: '🚀', description: 'Live environment' },
  ];

  const strategyOptions = [
    { value: 'rolling', label: 'Rolling Update', icon: '🔄', description: 'Gradual pod replacement' },
    { value: 'blue-green', label: 'Blue/Green', icon: '🔵🟢', description: 'Zero-downtime switch' },
    { value: 'canary', label: 'Canary', icon: '🐦', description: 'Gradual traffic shift' },
  ];

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-2xl p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <GitCommit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Trigger Pipeline</h2>
            <p className="text-sm text-gray-400">Simulate code push to start CI/CD flow</p>
          </div>
        </div>
        {onLearnMore && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLearnMore('ci_pipeline')}
            className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Learn</span>
          </Button>
        )}
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Commit Message */}
        <div className="space-y-2">
          <Label htmlFor="commit" className="text-gray-300 font-medium text-sm">
            Commit Message
          </Label>
          <Input
            id="commit"
            placeholder="feat: add user authentication"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            disabled={isRunning}
            className="font-mono bg-[#1e293b] border-gray-600 text-white placeholder:text-gray-500 focus:border-primary h-11 text-base"
            onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleTrigger()}
          />
          <p className="text-xs text-gray-500">💡 Use conventional commits: feat, fix, docs, refactor</p>
        </div>

        {/* Branch */}
        <div className="space-y-2">
          <Label htmlFor="branch" className="text-gray-300 font-medium text-sm">
            Branch
          </Label>
          <Select value={branch} onValueChange={setBranch} disabled={isRunning}>
            <SelectTrigger id="branch" className="h-11 bg-[#1e293b] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branchOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <span className={`font-mono ${opt.color}`}>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Environment */}
        <div className="space-y-2">
          <Label htmlFor="env" className="text-gray-300 font-medium text-sm">
            Target Environment
          </Label>
          <Select value={environment} onValueChange={(v: Environment) => setEnvironment(v)} disabled={isRunning}>
            <SelectTrigger id="env" className="h-11 bg-[#1e293b] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {environmentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.description}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deployment Strategy */}
        <div className="space-y-2">
          <Label htmlFor="strategy" className="text-gray-300 font-medium text-sm">
            Deployment Strategy
          </Label>
          <Select value={strategy} onValueChange={(v: DeploymentStrategy) => setStrategy(v)} disabled={isRunning}>
            <SelectTrigger id="strategy" className="h-11 bg-[#1e293b] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {strategyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.description}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trigger Button */}
        <Button
          onClick={handleTrigger}
          disabled={!commitMessage.trim() || isRunning}
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-base gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Pipeline Running...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Push Code & Deploy
            </>
          )}
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-gray-300 mb-2">
          ⚡ This will trigger a full CI/CD pipeline including build, test, Docker image creation, and deployment.
        </p>
        <p className="text-xs text-gray-400">
          Watch the stages execute in real-time below!
        </p>
      </div>
    </div>
  );
};
