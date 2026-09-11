import { useState } from 'react';
import { GitBranch, Plus, Trash2, BookOpen, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGitOpsStore } from '@/store/gitopsStore';
import { useGameStore } from '@/store/gameStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface AppsPanelProps {
  selectedAppId: string | null;
  onSelectApp: (id: string) => void;
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const AppsPanel = ({ selectedAppId, onSelectApp, onLearnMore }: AppsPanelProps) => {
  const { apps, createApp, removeApp, toggleAutoSync, toggleSelfHeal } = useGitOpsStore();
  const applications = useGameStore((s) => s.applications);

  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [path, setPath] = useState('');
  const [destinationAppId, setDestinationAppId] = useState('');

  const linkedAppIds = new Set(apps.map((a) => a.destinationAppId));
  const linkableApps = applications.filter((a) => !linkedAppIds.has(a.id));

  const handleCreate = () => {
    if (!destinationAppId) return;
    createApp(name, repoUrl, path, destinationAppId, true, false);
    onSelectApp(destinationAppId);
    setName('');
    setRepoUrl('');
    setPath('');
    setDestinationAppId('');
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">GitOps Applications</h3>
            <p className="text-sm text-gray-400">Link a Git repo path to a real deployed app</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('gitopsApplication')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-3 bg-[#1e293b]/60 border border-gray-700 rounded-lg p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">New Application</p>

        {linkableApps.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            {applications.length === 0
              ? 'Create an Application first (Applications page) before linking it to GitOps.'
              : 'Every existing application is already linked to a GitOps Application.'}
          </p>
        ) : (
          <>
            <Select value={destinationAppId} onValueChange={setDestinationAppId}>
              <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white">
                <SelectValue placeholder="Deploy target (an Application from your simulator)" />
              </SelectTrigger>
              <SelectContent>
                {linkableApps.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Application name (e.g. checkout-service)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1e293b] border-gray-700 text-white"
            />
            <Input
              placeholder="Repo URL (e.g. https://github.com/acme/gitops-config.git)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="bg-[#1e293b] border-gray-700 text-white"
            />
            <Input
              placeholder="Path within repo (e.g. manifests/production)"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="bg-[#1e293b] border-gray-700 text-white"
            />
            <Button onClick={handleCreate} disabled={!destinationAppId} className="gap-2 w-full">
              <Plus className="w-4 h-4" />
              Create GitOps Application
            </Button>
          </>
        )}
      </div>

      <div className="space-y-2">
        {apps.length === 0 && (
          <p className="text-sm text-gray-500 italic py-4 text-center">
            No GitOps Applications yet — create one above to start deploying from Git.
          </p>
        )}
        {apps.map((app) => {
          const destApp = applications.find((a) => a.id === app.destinationAppId);
          const isSelected = app.id === selectedAppId;
          return (
            <div
              key={app.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectApp(app.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectApp(app.id)}
              className={`w-full text-left bg-[#1e293b] border rounded-lg p-3 transition-colors cursor-pointer ${
                isSelected ? 'border-primary ring-1 ring-primary/50' : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-white truncate">{app.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {app.repoUrl} @ {app.targetRevision} · {app.path}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    → deploys to <span className="text-cyan-400">{destApp?.name ?? 'unknown app'}</span>
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeApp(app.id);
                  }}
                  className="text-gray-500 hover:text-red-400 transition-colors shrink-0 ml-2"
                  aria-label={`Remove ${app.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-800">
                <label
                  className="flex items-center gap-1.5 text-xs text-gray-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch checked={app.autoSync} onCheckedChange={() => toggleAutoSync(app.id)} />
                  <RefreshCw className="w-3 h-3" />
                  Auto-Sync
                </label>
                <label
                  className="flex items-center gap-1.5 text-xs text-gray-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch checked={app.selfHeal} onCheckedChange={() => toggleSelfHeal(app.id)} />
                  <ShieldCheck className="w-3 h-3" />
                  Self-Heal
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
