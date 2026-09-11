import { Terminal, Lightbulb } from 'lucide-react';
import { executeCommand, getAutocompleteSuggestions } from '@/lib/cliEngine';
import { TerminalShell } from '@/components/cli/TerminalShell';

const WELCOME = `CloudOps AWS CLI Simulator v1.0
Welcome! Type 'help' to see available commands.

💡 This CLI simulates real AWS commands and teaches you DevOps workflows.
Try: aws ec2 describe-instances`;

const CLIPage = () => {
  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Terminal className="w-6 h-6 text-primary" /> AWS CLI Simulator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive command-line interface for cloud operations
        </p>
      </div>

      <div className="panel bg-blue-500/10 border-blue-500/20 p-3">
        <div className="flex items-start gap-2 text-sm">
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-foreground font-medium">Quick Start:</p>
            <p className="text-muted-foreground">
              • Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">↑</kbd> / <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">↓</kbd> for command history
              • Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Tab</kbd> for autocomplete
              • Try: <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">help</code> or <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">cloudops status</code>
            </p>
          </div>
        </div>
      </div>

      <TerminalShell
        welcomeMessage={WELCOME}
        executeCommand={executeCommand}
        getAutocompleteSuggestions={getAutocompleteSuggestions}
      />
    </div>
  );
};

export default CLIPage;
