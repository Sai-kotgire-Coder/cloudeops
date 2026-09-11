import { useState } from 'react';
import { Lock, BookOpen, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVaultStore } from '@/store/vaultStore';
import { useLearningStore } from '@/store/learningStore';
import { EnginesPanel } from '@/components/vault/EnginesPanel';
import { SecretEditor } from '@/components/vault/SecretEditor';
import { PolicyEditor } from '@/components/vault/PolicyEditor';
import { TokenAccessPanel } from '@/components/vault/TokenAccessPanel';
import { LearningPanel } from '@/components/container/LearningPanel';
import type { LearningSectionId } from '@/data/dockerLearningContent';

export default function VaultLabPage() {
  const { engines, secrets, accessCount } = useVaultStore();
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
          <Lock className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg sm:text-xl">Vault Lab</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Learn Secrets Management: engines, policies &amp; access control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm">{accessCount}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">access checks</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => openTopic('secrets_management')}
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
              <EnginesPanel onLearnMore={openLearningPanel} />
              <SecretEditor onLearnMore={openLearningPanel} />
            </div>
            <div className="space-y-6">
              <PolicyEditor onLearnMore={openLearningPanel} />
              <TokenAccessPanel onLearnMore={openLearningPanel} />
            </div>
          </div>

          {engines.length === 0 && secrets.length === 0 && accessCount === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              New here? Enable a secrets engine, write a secret, write a policy, create a token with that
              policy, then <span className="font-semibold">Attempt Read</span> to see access control in action.
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
