import { useState, useRef, useEffect } from 'react';
import { Lightbulb, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CommandResultType = 'success' | 'error' | 'info';

export interface CommandResult {
  type: CommandResultType;
  output: string;
  learningTip?: string;
  timestamp: number;
}

interface HistoryEntry {
  cmd: string;
  result: CommandResult;
}

interface TerminalShellProps {
  welcomeMessage: string;
  executeCommand: (cmd: string) => CommandResult;
  getAutocompleteSuggestions: (input: string) => string[];
  placeholder?: string;
}

// The generic terminal chrome shared by every CLI-style lab in the app --
// history rendering, input handling, arrow-key history, and tab-autocomplete.
// Each lab supplies its own command engine; this component only renders it.
export const TerminalShell = ({
  welcomeMessage,
  executeCommand,
  getAutocompleteSuggestions,
  placeholder = "Type a command (or 'help')...",
}: TerminalShellProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { cmd: '', result: { type: 'info', output: welcomeMessage, timestamp: Date.now() } },
  ]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const result = executeCommand(trimmed);

    if (result.output === '__CLEAR__') {
      setHistory([]);
      setInput('');
      setHistoryIndex(-1);
      return;
    }

    setHistory((prev) => [...prev, { cmd: trimmed, result }]);
    setInput('');
    setHistoryIndex(-1);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      handleCommand(input);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const s = getAutocompleteSuggestions(input);
      if (s.length === 1) {
        setInput(s[0]);
        setShowSuggestions(false);
      } else if (s.length > 1) {
        setSuggestions(s);
        setShowSuggestions(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commandHistory = history.filter((h) => h.cmd).map((h) => h.cmd);
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex + 1;
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const commandHistory = history.filter((h) => h.cmd).map((h) => h.cmd);
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (value.trim()) {
      const s = getAutocompleteSuggestions(value);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: CommandResultType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getResultColor = (type: CommandResultType) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <>
      <div
        ref={terminalRef}
        className="flex-1 panel bg-black/90 font-mono text-sm overflow-auto p-4 space-y-3 relative"
      >
        {history.map((entry, i) => (
          <div key={i} className="space-y-1.5">
            {entry.cmd && (
              <div className="flex items-center gap-2">
                <span className="text-green-400">$</span>
                <span className="text-gray-200">{entry.cmd}</span>
              </div>
            )}
            {entry.result.output && (
              <div className="pl-4">
                <div className={cn('flex items-start gap-2', getResultColor(entry.result.type))}>
                  {getResultIcon(entry.result.type)}
                  <pre className="whitespace-pre-wrap flex-1 leading-relaxed">{entry.result.output}</pre>
                </div>
              </div>
            )}
            {entry.result.learningTip && (
              <div className="pl-4 mt-2">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2.5 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-yellow-100/90 text-xs leading-relaxed">{entry.result.learningTip}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <span className="text-gray-400 animate-pulse">_</span>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="panel bg-background border-primary/30 p-2 max-h-32 overflow-auto">
          <p className="text-xs text-muted-foreground mb-1.5">Suggestions:</p>
          <div className="space-y-0.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-2 py-1 text-sm font-mono rounded hover:bg-secondary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 font-mono panel bg-black/90 p-3">
        <span className="text-green-400 text-sm font-bold">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-600"
          placeholder={placeholder}
          autoFocus
        />
      </div>
    </>
  );
};
