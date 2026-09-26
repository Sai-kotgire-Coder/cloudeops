import { useState } from 'react';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgressStore } from '@/store/progressStore';
import { QuizModal } from './QuizModal';

interface ModuleMilestoneBannerProps {
  moduleId: string;
  moduleLabel: string;
}

// Reads from useProgressStore's already-fetched summary -- doesn't fetch
// it itself, since it's only ever rendered inside ModuleLearningSection,
// which owns that fetch (avoids two lab-page components independently
// firing the same GET on mount).
export const ModuleMilestoneBanner = ({ moduleId, moduleLabel }: ModuleMilestoneBannerProps) => {
  const { summary, fetchSummary } = useProgressStore();
  const [quizOpen, setQuizOpen] = useState(false);

  const entry = summary.find((s) => s.module === moduleId);
  if (!entry || !entry.completed || entry.certificateEarned) return null;

  return (
    <>
      <div className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm font-medium">Milestone reached! Take the quiz to earn your {moduleLabel} certificate.</p>
        </div>
        <Button size="sm" onClick={() => setQuizOpen(true)} className="shrink-0">Take quiz</Button>
      </div>
      <QuizModal
        moduleId={moduleId}
        moduleLabel={moduleLabel}
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onCertificateAwarded={fetchSummary}
      />
    </>
  );
};
