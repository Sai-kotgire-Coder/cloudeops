import { useState } from 'react';
import { Terminal, Lightbulb, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { executeKubectlCommand, getKubectlAutocompleteSuggestions } from '@/lib/kubectlEngine';
import { TerminalShell } from '@/components/cli/TerminalShell';
import { useLearningStore } from '@/store/learningStore';
import { LearningPanel } from '@/components/container/LearningPanel';
import type { LearningSectionId } from '@/data/dockerLearningContent';

const WELCOME = `kubectl -- Kubernetes CLI Simulator v1.0
Running against your current cluster (the same instances & applications from the rest of the app).
Type 'help' to see every available command.

☸️ Try: kubectl get pods`;

const QUICK_TOPICS: { label: string; id: LearningSectionId }[] = [
  { label: 'Pods & Deployments', id: 'kubectlPodsAndDeployments' },
  { label: 'apply vs. create', id: 'kubectlDeclarativeVsImperative' },
  { label: 'Rollouts', id: 'kubectlRollouts' },
  { label: 'Troubleshooting', id: 'kubectlTroubleshooting' },
];

export default function KubectlLabPage() {
  const { openTopic } = useLearningStore();
  const [learningPanelOpen, setLearningPanelOpen] = useState(false);
  const [learningSectionId, setLearningSectionId] = useState<LearningSectionId | null>(null);

  const openDeepDive = (id: LearningSectionId) => {
    setLearningSectionId(id);
    setLearningPanelOpen(true);
  };

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" /> kubectl Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            A real kubectl terminal against your current simulated cluster
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => openTopic('kubectl_cli')} className="gap-2">
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="panel bg-blue-500/10 border-blue-500/20 p-3">
        <div className="flex items-start gap-2 text-sm">
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <p className="text-foreground font-medium">Quick Start:</p>
            <p className="text-muted-foreground">
              • Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">↑</kbd> / <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">↓</kbd> for command history
              • Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Tab</kbd> for autocomplete
              • Try: <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">kubectl get pods</code>, then <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">kubectl describe pod &lt;id&gt;</code>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TOPICS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openDeepDive(t.id)}
                  className="text-xs px-2 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TerminalShell
        welcomeMessage={WELCOME}
        executeCommand={executeKubectlCommand}
        getAutocompleteSuggestions={getKubectlAutocompleteSuggestions}
        placeholder="Type a kubectl command (or 'help')..."
      />

      <LearningPanel
        isOpen={learningPanelOpen}
        sectionId={learningSectionId}
        onClose={() => setLearningPanelOpen(false)}
      />
    </div>
  );
}
