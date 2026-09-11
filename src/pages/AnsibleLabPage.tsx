import { useState } from 'react';
import { ScrollText, BookOpen, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnsibleStore } from '@/store/ansibleStore';
import { useLearningStore } from '@/store/learningStore';
import { InventoryPanel } from '@/components/ansible/InventoryPanel';
import { PlaybookEditor } from '@/components/ansible/PlaybookEditor';
import { RunPanel } from '@/components/ansible/RunPanel';
import { HostStatePanel } from '@/components/ansible/HostStatePanel';
import { LearningPanel } from '@/components/container/LearningPanel';
import type { LearningSectionId } from '@/data/dockerLearningContent';

export default function AnsibleLabPage() {
  const { inventory, playbook, runCount } = useAnsibleStore();
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
          <ScrollText className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg sm:text-xl">Ansible Lab</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Learn Configuration Management: inventory, playbooks &amp; idempotency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Server className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm">{inventory.length}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">hosts</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => openTopic('config_management')}
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
            <div className="space-y-6">
              <InventoryPanel onLearnMore={openLearningPanel} />
              <PlaybookEditor onLearnMore={openLearningPanel} />
            </div>
            <div className="space-y-6">
              <RunPanel onLearnMore={openLearningPanel} />
              <HostStatePanel onLearnMore={openLearningPanel} />
            </div>
          </div>

          {inventory.length === 0 && playbook.length === 0 && runCount === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              New here? Add a host to your inventory, add a task to your playbook, then click{' '}
              <span className="font-semibold">--check</span> to preview it and{' '}
              <span className="font-semibold">Run Playbook</span> to converge it for real.
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
