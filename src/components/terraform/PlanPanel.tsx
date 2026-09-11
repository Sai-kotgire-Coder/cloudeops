import { useEffect, useRef, useState } from 'react';
import { ClipboardList, Play, Rocket, BookOpen, Plus, Minus, Pencil, Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTerraformStore, resourceTypeString, type PlanAction } from '@/store/terraformStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface PlanPanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

const ACTION_STYLE = {
  create: { icon: Plus, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'to add' },
  update: { icon: Pencil, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'to change' },
  destroy: { icon: Minus, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'to destroy' },
} as const;

function PlanActionRow({ action }: { action: PlanAction }) {
  const style = ACTION_STYLE[action.kind];
  const Icon = style.icon;
  return (
    <div className={`rounded-lg border p-3 font-mono text-sm ${style.bg}`}>
      <div className={`flex items-center gap-2 ${style.color}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>
          {resourceTypeString(action.resource)}.{action.resource.name} ({style.label})
        </span>
      </div>
      {action.changes && action.changes.length > 0 && (
        <div className="pl-6 mt-1.5 space-y-0.5">
          {action.changes.map((c) => (
            <p key={c.key} className="text-xs text-gray-400">
              <span className="text-gray-500">{c.key}</span>
              {action.kind === 'create' ? (
                <> = <span className="text-green-400">{String(c.to)}</span></>
              ) : (
                <>
                  : <span className="text-red-400 line-through">{String(c.from)}</span>{' '}
                  → <span className="text-green-400">{String(c.to)}</span>
                </>
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export const PlanPanel = ({ onLearnMore }: PlanPanelProps) => {
  const { plan, runPlan, applyPlan, isApplying, applyLog } = useTerraformStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [applyLog]);

  const summary = plan
    ? {
        create: plan.filter((a) => a.kind === 'create').length,
        update: plan.filter((a) => a.kind === 'update').length,
        destroy: plan.filter((a) => a.kind === 'destroy').length,
      }
    : null;

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Plan &amp; Apply</h3>
            <p className="text-sm text-gray-400">Preview the diff, then make it real</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('terraformPlanApply')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={runPlan} disabled={isApplying} variant="outline" className="gap-2 flex-1">
          <Play className="w-4 h-4" />
          Plan
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!plan || plan.length === 0 || isApplying}
          className="gap-2 flex-1"
        >
          {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          Apply
        </Button>
      </div>

      {summary && (summary.create + summary.update + summary.destroy > 0) && (
        <p className="text-xs font-mono text-gray-400">
          Plan: <span className="text-green-400">{summary.create} to add</span>,{' '}
          <span className="text-yellow-400">{summary.update} to change</span>,{' '}
          <span className="text-red-400">{summary.destroy} to destroy</span>
        </p>
      )}

      <div className="space-y-2">
        {plan === null && !isApplying && (
          <p className="text-sm text-gray-500 italic py-4 text-center">
            Run Plan to see what Apply would do to your infrastructure.
          </p>
        )}
        {plan !== null && plan.length === 0 && (
          <p className="text-sm text-green-400 py-4 text-center">
            No changes. Infrastructure matches the configuration.
          </p>
        )}
        {plan?.map((action) => (
          <PlanActionRow key={`${action.kind}-${action.resource.id}`} action={action} />
        ))}
      </div>

      {(isApplying || applyLog.length > 0) && (
        <div
          ref={logRef}
          className="bg-black/40 border border-gray-800 rounded-lg p-3 font-mono text-xs text-gray-300 max-h-40 overflow-y-auto space-y-1"
        >
          {applyLog.map((line, i) => (
            <p key={i} className={line.includes('complete') ? 'text-green-400' : 'text-gray-400'}>
              {line}
            </p>
          ))}
          {isApplying && <p className="text-primary animate-pulse">Applying...</p>}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#0f172a] border-2 border-gray-700 text-white max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Do you want to perform these actions?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Terraform will perform the actions described above. Only "Yes, apply" will carry these out.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {summary && (
            <p className="text-xs font-mono text-gray-400">
              Plan: <span className="text-green-400">{summary.create} to add</span>,{' '}
              <span className="text-yellow-400">{summary.update} to change</span>,{' '}
              <span className="text-red-400">{summary.destroy} to destroy</span>
            </p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {plan?.map((action) => (
              <PlanActionRow key={`confirm-${action.kind}-${action.resource.id}`} action={action} />
            ))}
          </div>

          {summary && summary.destroy > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This will permanently destroy {summary.destroy} resource{summary.destroy === 1 ? '' : 's'}.
                Once applied, this cannot be undone by Terraform itself — you'd have to re-create it from
                configuration, and any data it held is gone.
              </span>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applyPlan()}
              className={summary && summary.destroy > 0 ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Yes, apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
