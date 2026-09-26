import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { MODULE_CATALOG } from '@/data/moduleCatalog';
import type { ModuleRecommendation } from '@/store/progressStore';

const REASON_TEXT: Record<ModuleRecommendation['reason'], string> = {
  closest_to_completion: "You're closest to finishing this one",
  not_started: "You haven't tried this one yet",
};

export const RecommendationCard = ({ recommendation }: { recommendation: ModuleRecommendation | null }) => {
  if (!recommendation) return null;
  const mod = MODULE_CATALOG.find((m) => m.id === recommendation.module);
  if (!mod) return null;

  return (
    <Link
      to={mod.url}
      className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:border-primary/50 transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
        <Compass className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">What to learn next</p>
        <p className="text-sm font-semibold mt-0.5">{mod.title}</p>
        <p className="text-xs text-muted-foreground">{REASON_TEXT[recommendation.reason]}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
};
