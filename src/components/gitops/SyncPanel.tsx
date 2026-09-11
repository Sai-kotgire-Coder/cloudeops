import { RefreshCw, Zap, History, BookOpen, CheckCircle2, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGitOpsStore, getSyncStatus, latestCommit } from '@/store/gitopsStore';
import { useGameStore } from '@/store/gameStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface SyncPanelProps {
  appId: string | null;
  onLearnMore: (sectionId: LearningSectionId) => void;
}

const STATUS_STYLE = {
  Synced: { icon: CheckCircle2, className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  OutOfSync: { icon: AlertCircle, className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  Progressing: { icon: Loader2, className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  Unknown: { icon: HelpCircle, className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
} as const;

export const SyncPanel = ({ appId, onLearnMore }: SyncPanelProps) => {
  const { apps, commits, history, sync, simulateDrift } = useGitOpsStore();
  // getSyncStatus reads gameStore.getState() internally, so this component
  // must also re-render whenever gameStore's applications change (e.g. a
  // manual "kubectl scale" via Simulate Drift, or the self-heal reconciler).
  useGameStore((s) => s.applications);

  const app = apps.find((a) => a.id === appId);

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Sync Status</h3>
            <p className="text-sm text-gray-400">Live cluster vs. desired state in Git</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('gitopsSyncStatus')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      {!app ? (
        <p className="text-sm text-gray-500 italic text-center py-6">
          Select a GitOps Application to see its sync status.
        </p>
      ) : (
        <>
          {(() => {
            const rawStatus = getSyncStatus(app, commits);
            const status = rawStatus === 'OutOfSync' && app.pendingSync ? 'Progressing' : rawStatus;
            const style = STATUS_STYLE[status];
            const Icon = style.icon;
            const desired = latestCommit(commits, app.id);
            return (
              <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{app.name}</span>
                  <Badge variant="outline" className={`gap-1.5 ${style.className}`}>
                    <Icon className={`w-3.5 h-3.5 ${status === 'Progressing' ? 'animate-spin' : ''}`} />
                    {status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">
                  Desired: <span className="text-cyan-400">{desired ? `${desired.version} × ${desired.replicas} replicas` : 'no commits yet'}</span>
                </p>
                {status === 'Progressing' && (
                  <p className="text-[11px] text-blue-400 italic">
                    Rolling out — waiting for the target Application to have running pods for this version.
                    Make sure an instance is attached to it; this will finish automatically once it does.
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => sync(app.id)}
                    disabled={!desired}
                    size="sm"
                    className="gap-2 flex-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Now
                  </Button>
                  <Button
                    onClick={() => simulateDrift(app.id)}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                    title="Simulate someone running kubectl scale by hand, outside Git"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Simulate Drift
                  </Button>
                </div>
                {!app.autoSync && (
                  <p className="text-[11px] text-gray-500 italic">
                    Auto-Sync is off for this app — new commits wait here until you click Sync Now.
                  </p>
                )}
                {app.selfHeal && (
                  <p className="text-[11px] text-gray-500 italic">
                    Self-Heal is on — drift on this app corrects itself automatically within a couple seconds, on any page.
                  </p>
                )}
              </div>
            );
          })()}
        </>
      )}

      {history.length > 0 && (
        <div className="pt-2 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <History className="w-3.5 h-3.5" />
            Recent activity
          </div>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((event) => (
              <li key={event.id} className="text-xs text-gray-400 flex items-start gap-2">
                <span
                  className={
                    event.kind === 'sync'
                      ? 'text-green-400'
                      : event.kind === 'drift'
                      ? 'text-orange-400'
                      : event.kind === 'selfheal'
                      ? 'text-cyan-400'
                      : 'text-gray-400'
                  }
                >
                  ●
                </span>
                <span>{event.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
