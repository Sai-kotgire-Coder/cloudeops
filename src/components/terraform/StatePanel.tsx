import { Database, Zap, Trash2, BookOpen, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTerraformStore, resourceTypeString } from '@/store/terraformStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface StatePanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const StatePanel = ({ onLearnMore }: StatePanelProps) => {
  const { state, history, simulateDrift, destroyAll } = useTerraformStore();

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Applied State</h3>
            <p className="text-sm text-gray-400">What's actually running (terraform.tfstate)</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('terraformState')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-2">
        {state.length === 0 && (
          <p className="text-sm text-gray-500 italic py-4 text-center">
            Nothing applied yet — write a config and hit Plan, then Apply.
          </p>
        )}
        {state.map((resource) => (
          <div key={resource.id} className="bg-[#1e293b] border border-gray-700 rounded-lg p-3 flex items-center justify-between">
            <div className="font-mono text-sm text-gray-300">
              {resourceTypeString(resource)}.{resource.name}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateDrift(resource.id)}
              className="gap-1.5 text-xs h-7 border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
              title="Simulate a manual, out-of-band change to this resource"
            >
              <Zap className="w-3 h-3" />
              Simulate Drift
            </Button>
          </div>
        ))}
        {state.length > 0 && (
          <Button
            onClick={destroyAll}
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-2 border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
            Destroy All
          </Button>
        )}
      </div>

      {history.length > 0 && (
        <div className="pt-2 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <History className="w-3.5 h-3.5" />
            Recent activity
          </div>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {history.map((event) => (
              <li key={event.id} className="text-xs text-gray-400 flex items-start gap-2">
                <span
                  className={
                    event.kind === 'apply' ? 'text-green-400' : event.kind === 'destroy' ? 'text-red-400' : 'text-orange-400'
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
