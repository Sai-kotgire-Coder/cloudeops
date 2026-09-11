import { useState } from 'react';
import { GitMerge, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGitOpsStore } from '@/store/gitopsStore';
import { useLearningStore } from '@/store/learningStore';
import { AppsPanel } from '@/components/gitops/AppsPanel';
import { CommitPanel } from '@/components/gitops/CommitPanel';
import { SyncPanel } from '@/components/gitops/SyncPanel';
import { LearningPanel } from '@/components/container/LearningPanel';
import type { LearningSectionId } from '@/data/dockerLearningContent';

export default function GitOpsLabPage() {
  const { apps } = useGitOpsStore();
  const { openTopic } = useLearningStore();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
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
          <GitMerge className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg sm:text-xl">GitOps Lab</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Learn continuous deployment: commit, sync &amp; self-heal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <GitMerge className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm">{apps.length}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">apps</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => openTopic('gitops')}
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
            <AppsPanel
              selectedAppId={selectedAppId}
              onSelectApp={setSelectedAppId}
              onLearnMore={openLearningPanel}
            />
            <div className="space-y-6">
              <CommitPanel appId={selectedAppId} onLearnMore={openLearningPanel} />
              <SyncPanel appId={selectedAppId} onLearnMore={openLearningPanel} />
            </div>
          </div>

          {apps.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              New here? Create a GitOps Application on the left linking a Git repo to a real deployed app,
              then <span className="font-semibold">commit</span> a change and watch it <span className="font-semibold">sync</span>.
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
