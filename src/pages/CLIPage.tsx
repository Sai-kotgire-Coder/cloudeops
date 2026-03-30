import { Terminal, Lightbulb, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { executeCommand, getAutocompleteSuggestions, CommandResult } from '@/lib/cliEngine';
import { cn } from '@/lib/utils';

interface HistoryEntry {
  cmd: string;
  result: CommandResult;
}

const CLIPage = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      cmd: '',
      result: {
        type: 'info',
        output: `CloudOps AWS CLI Simulator v1.0
Welcome! Type 'help' to see available commands.

💡 This CLI simulates real AWS commands and teaches you DevOps workflows.
Try: aws ec2 describe-instances`,
        timestamp: Date.now(),
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    
    if (!trimmed) return;

    const result = executeCommand(trimmed);

    // Handle clear command specially
    if (result.output === '__CLEAR__') {
      setHistory([]);
      setInput('');
      setHistoryIndex(-1);
      return;
    }

    setHistory(prev => [...prev, { cmd: trimmed, result }]);
    setInput('');
    setHistoryIndex(-1);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter: Execute command
    if (e.key === 'Enter' && input.trim()) {
      handleCommand(input);
      return;
    }

    // Tab: Autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      const suggestions = getAutocompleteSuggestions(input);
      if (suggestions.length === 1) {
        setInput(suggestions[0]);
        setShowSuggestions(false);
      } else if (suggestions.length > 1) {
        setSuggestions(suggestions);
        setShowSuggestions(true);
      }
      return;
    }

    // Escape: Clear suggestions
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    // Arrow Up: Previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commandHistory = history.filter(h => h.cmd).map(h => h.cmd);
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex + 1;
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
      return;
    }

    // Arrow Down: Next command
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const commandHistory = history.filter(h => h.cmd).map(h => h.cmd);
      
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
    
    // Update suggestions on input change
    if (value.trim()) {
      const newSuggestions = getAutocompleteSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: CommandResult['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getResultColor = (type: CommandResult['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Terminal className="w-6 h-6 text-primary" /> AWS CLI Simulator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive command-line interface for cloud operations
        </p>
      </div>

      {/* Quick Tips */}
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

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 panel bg-black/90 font-mono text-sm overflow-auto p-4 space-y-3 relative"
      >
        {history.map((entry, i) => (
          <div key={i} className="space-y-1.5">
            {/* Command */}
            {entry.cmd && (
              <div className="flex items-center gap-2">
                <span className="text-green-400">$</span>
                <span className="text-gray-200">{entry.cmd}</span>
              </div>
            )}

            {/* Output */}
            {entry.result.output && (
              <div className="pl-4">
                <div className={cn('flex items-start gap-2', getResultColor(entry.result.type))}>
                  {getResultIcon(entry.result.type)}
                  <pre className="whitespace-pre-wrap flex-1 leading-relaxed">
                    {entry.result.output}
                  </pre>
                </div>
              </div>
            )}

            {/* Learning Tip */}
            {entry.result.learningTip && (
              <div className="pl-4 mt-2">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2.5 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-yellow-100/90 text-xs leading-relaxed">
                    {entry.result.learningTip}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Cursor */}
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <span className="text-gray-400 animate-pulse">_</span>
        </div>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="panel bg-background border-primary/30 p-2 max-h-32 overflow-auto">
          <p className="text-xs text-muted-foreground mb-1.5">Suggestions:</p>
          <div className="space-y-0.5">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-2 py-1 text-sm font-mono rounded hover:bg-secondary transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Command Input */}
      <div className="flex items-center gap-2 font-mono panel bg-black/90 p-3">
        <span className="text-green-400 text-sm font-bold">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-600"
          placeholder="Type a command (or 'help')..."
          autoFocus
        />
      </div>
    </div>
  );
};

export default CLIPage;
