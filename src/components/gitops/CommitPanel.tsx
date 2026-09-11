import { useState } from 'react';
import { GitCommit as GitCommitIcon, Upload, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGitOpsStore, latestCommit } from '@/store/gitopsStore';
import { buildArgoAppManifest, buildDeploymentManifest } from '@/data/gitopsSnippets';
import { HclCodeBlock } from '@/components/terraform/HclCodeBlock';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface CommitPanelProps {
  appId: string | null;
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const CommitPanel = ({ appId, onLearnMore }: CommitPanelProps) => {
  const { apps, commits, commit } = useGitOpsStore();
  const app = apps.find((a) => a.id === appId);
  const currentCommit = app ? latestCommit(commits, app.id) : undefined;

  const [message, setMessage] = useState('');
  const [version, setVersion] = useState('v1');
  const [replicas, setReplicas] = useState(3);

  if (!app) {
    return (
      <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 shadow-lg">
        <p className="text-sm text-gray-500 italic text-center py-6">
          Select a GitOps Application on the left to commit a change to it.
        </p>
      </div>
    );
  }

  const previewCommit = { ...currentCommit, version: version.trim() || 'v1', replicas } as any;

  const handleCommit = () => {
    commit(app.id, message, version, replicas);
    setMessage('');
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <GitCommitIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Commit a Change</h3>
            <p className="text-sm text-gray-400">Editing {app.path} on {app.targetRevision}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('gitopsDesiredState')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {app.path}/deployment.yaml — desired state
        </p>
        <HclCodeBlock code={buildDeploymentManifest(app, previewCommit)} filename="deployment.yaml" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="version (e.g. v2)"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="bg-[#1e293b] border-gray-700 text-white font-mono"
        />
        <Input
          type="number"
          min={1}
          placeholder="replicas"
          value={replicas}
          onChange={(e) => setReplicas(Math.max(1, Number(e.target.value) || 1))}
          className="bg-[#1e293b] border-gray-700 text-white font-mono"
        />
      </div>
      <Input
        placeholder="Commit message (e.g. Bump checkout-service to v2)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
        className="bg-[#1e293b] border-gray-700 text-white"
      />
      <Button onClick={handleCommit} className="gap-2 w-full">
        <Upload className="w-4 h-4" />
        git commit && git push
      </Button>

      <div className="space-y-2 pt-2 border-t border-gray-800">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          argocd/apps/{app.name}.yaml — Application definition
        </p>
        <HclCodeBlock code={buildArgoAppManifest(app)} filename={`${app.name}.yaml`} />
      </div>
    </div>
  );
};
