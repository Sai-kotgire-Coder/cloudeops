import { useState } from 'react';
import { FileCode, BookOpen, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTerraformStore } from '@/store/terraformStore';
import { useLearningStore } from '@/store/learningStore';
import { ConfigEditor } from '@/components/terraform/ConfigEditor';
import { PlanPanel } from '@/components/terraform/PlanPanel';
import { StatePanel } from '@/components/terraform/StatePanel';
import { LearningPanel } from '@/components/container/LearningPanel';
import type { LearningSectionId } from '@/data/dockerLearningContent';

export default function TerraformLabPage() {
  const { config, state, appliedCount } = useTerraformStore();
  const { openTopic } = useLearningStore();
  const [learningPanelOpen, setLearningPanelOpen] = useState(false);
  const [learningSectionId, setLearningSectionId] = useState<LearningSectionId | null>(null);

  const openLearningPanel = (sectionId: LearningSectionId) => {
    setLearningSectionId(sectionId);
    setLearningPanelOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <FileCode className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg sm:text-xl">Terraform Lab</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Learn Infrastructure as Code: plan, apply, state &amp; drift
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Boxes className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm">{state.length}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">applied</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => openTopic('iac')}
            className="gap-2 hidden sm:flex"
          >
            <BookOpen className="w-4 h-4" />
            Learn More
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConfigEditor onLearnMore={openLearningPanel} />
            <div className="space-y-6">
              <PlanPanel onLearnMore={openLearningPanel} />
              <StatePanel onLearnMore={openLearningPanel} />
            </div>
          </div>

          {config.length === 0 && appliedCount === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              New here? Add a resource block on the left, click <span className="font-semibold">Plan</span> to preview it,
              then <span className="font-semibold">Apply</span> to provision it.
            </div>
          )}
        </div>
      </div>

      <LearningPanel
        isOpen={learningPanelOpen}
        sectionId={learningSectionId}
        onClose={() => setLearningPanelOpen(false)}
      />
    </div>
  );
}
