import { useEffect, useRef } from 'react';
import { PlayCircle, Rocket, BookOpen, CheckCircle2, Pencil, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnsibleStore } from '@/store/ansibleStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface RunPanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

const STATUS_STYLE = {
  ok: { icon: CheckCircle2, color: 'text-gray-400' },
  changed: { icon: Pencil, color: 'text-yellow-400' },
  failed: { icon: XCircle, color: 'text-red-400' },
} as const;

export const RunPanel = ({ onLearnMore }: RunPanelProps) => {
  const { dryRun, runPlaybook, isRunning, lastResults, runLog } = useAnsibleStore();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [runLog]);

  const summary = lastResults
    ? {
        ok: lastResults.filter((r) => r.status === 'ok').length,
        changed: lastResults.filter((r) => r.status === 'changed').length,
        failed: lastResults.filter((r) => r.status === 'failed').length,
      }
    : null;

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Run Playbook</h3>
            <p className="text-sm text-gray-400">Preview with --check, then converge for real</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('ansibleIdempotency')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={dryRun} disabled={isRunning} variant="outline" className="gap-2 flex-1">
          <PlayCircle className="w-4 h-4" />
          --check
        </Button>
        <Button onClick={runPlaybook} disabled={isRunning} className="gap-2 flex-1">
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          Run Playbook
        </Button>
      </div>

      {summary && (
        <p className="text-xs font-mono text-gray-400">
          <span className="text-gray-300">{summary.ok} ok</span>,{' '}
          <span className="text-yellow-400">{summary.changed} changed</span>,{' '}
          <span className="text-red-400">{summary.failed} failed</span>
        </p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {lastResults === null && !isRunning && (
          <p className="text-sm text-gray-500 italic py-4 text-center">
            Run --check to preview what each task would do on each host.
          </p>
        )}
        {lastResults?.map((r, i) => {
          const style = STATUS_STYLE[r.status];
          const Icon = style.icon;
          return (
            <div key={`${r.hostId}-${r.taskId}-${i}`} className="flex items-center gap-2 text-xs font-mono text-gray-300">
              <Icon className={`w-3.5 h-3.5 shrink-0 ${style.color}`} />
              <span className={style.color}>{r.status}:</span>
              <span>[{r.hostname}]</span>
              <span className="text-gray-500">— {r.taskName}</span>
            </div>
          );
        })}
      </div>

      {(isRunning || runLog.length > 0) && (
        <div
          ref={logRef}
          className="bg-black/40 border border-gray-800 rounded-lg p-3 font-mono text-xs text-gray-300 max-h-56 overflow-y-auto whitespace-pre-wrap"
        >
          {runLog.map((line, i) => (
            <p
              key={i}
              className={
                line.startsWith('changed') ? 'text-yellow-400'
                  : line.startsWith('ok') ? 'text-gray-400'
                  : line.startsWith('failed') ? 'text-red-400'
                  : line.startsWith('PLAY') ? 'text-purple-400 font-semibold'
                  : line.startsWith('TASK') ? 'text-cyan-400 font-semibold'
                  : 'text-gray-500'
              }
            >
              {line || ' '}
            </p>
          ))}
          {isRunning && <p className="text-primary animate-pulse">Running...</p>}
        </div>
      )}
    </div>
  );
};
