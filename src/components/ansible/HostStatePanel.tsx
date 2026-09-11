import { Database, Zap, BookOpen, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnsibleStore } from '@/store/ansibleStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface HostStatePanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const HostStatePanel = ({ onLearnMore }: HostStatePanelProps) => {
  const { inventory, playbook, hostState, history, simulateDrift } = useAnsibleStore();

  const hostsWithState = inventory.filter((h) => hostState[h.id] && Object.keys(hostState[h.id]).length > 0);

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Converged State</h3>
            <p className="text-sm text-gray-400">What's actually configured, per host</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('ansibleDrift')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      {hostsWithState.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-4 text-center">
          Nothing converged yet — run the playbook to configure your hosts.
        </p>
      ) : (
        <div className="space-y-2">
          {hostsWithState.map((host) => {
            const taskIds = Object.keys(hostState[host.id]);
            return (
              <div key={host.id} className="bg-[#1e293b] border border-gray-700 rounded-lg p-3 space-y-2">
                <p className="font-mono text-sm text-cyan-400">{host.hostname}</p>
                {taskIds.map((taskId) => {
                  const task = playbook.find((t) => t.id === taskId);
                  return (
                    <div key={taskId} className="flex items-center justify-between pl-3">
                      <span className="text-xs text-gray-400 font-mono">
                        {task?.name ?? '(removed task)'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => simulateDrift(host.id, taskId)}
                        className="gap-1.5 text-xs h-7 border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                        title="Simulate a manual, out-of-band change on this host"
                      >
                        <Zap className="w-3 h-3" />
                        Simulate Drift
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-2 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <History className="w-3.5 h-3.5" />
            Recent activity
          </div>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {history.map((event) => (
              <li key={event.id} className="text-xs text-gray-400 flex items-start gap-2">
                <span className={event.kind === 'run' ? 'text-green-400' : 'text-orange-400'}>●</span>
                <span>{event.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
