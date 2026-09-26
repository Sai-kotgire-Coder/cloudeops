import { CheckCircle2, Circle } from 'lucide-react';
import { MODULE_CURRICULA } from '@/data/moduleCurricula';

interface ModuleCurriculumProps {
  moduleId: string;
  current: number;
  target: number;
}

export const ModuleCurriculum = ({ moduleId, current, target }: ModuleCurriculumProps) => {
  const steps = MODULE_CURRICULA[moduleId];
  if (!steps) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your learning path</p>
      <div className="space-y-2.5">
        {steps.map((step, i) => {
          const done = target > 0 && current / target >= step.atFraction;
          return (
            <div key={i} className="flex items-start gap-3">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
