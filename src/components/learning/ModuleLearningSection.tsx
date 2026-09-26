import { useEffect } from 'react';
import { useProgressStore } from '@/store/progressStore';
import { ModuleCurriculum } from './ModuleCurriculum';
import { ModuleMilestoneBanner } from './ModuleMilestoneBanner';

interface ModuleLearningSectionProps {
  moduleId: string;
  moduleLabel: string;
}

// One-line drop-in for a lab page: the milestone/quiz banner (only shows
// once the threshold is reached and no certificate yet) plus the
// curriculum checklist (always visible, tracks progress toward it).
// Fetches progress itself, so no page-level wiring beyond these two props.
export const ModuleLearningSection = ({ moduleId, moduleLabel }: ModuleLearningSectionProps) => {
  const { summary, fetchSummary } = useProgressStore();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const entry = summary.find((s) => s.module === moduleId);

  return (
    <div className="space-y-3">
      <ModuleMilestoneBanner moduleId={moduleId} moduleLabel={moduleLabel} />
      <ModuleCurriculum moduleId={moduleId} current={entry?.current ?? 0} target={entry?.target ?? 1} />
    </div>
  );
};
