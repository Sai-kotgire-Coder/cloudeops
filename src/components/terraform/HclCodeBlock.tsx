import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface HclCodeBlockProps {
  code: string;
  filename?: string;
}

function highlightLine(line: string, key: number) {
  const resourceMatch = line.match(/^(resource)\s+"([^"]+)"\s+"([^"]+)"\s*(\{?)$/);
  if (resourceMatch) {
    const [, kw, resType, resName, brace] = resourceMatch;
    return (
      <div key={key}>
        <span className="text-purple-400">{kw}</span>{' '}
        <span className="text-green-400">"{resType}"</span>{' '}
        <span className="text-cyan-300">"{resName}"</span>{' '}
        {brace && <span className="text-gray-500">{brace}</span>}
      </div>
    );
  }

  const blockMatch = line.match(/^(\s*)([\w]+)\s*(\{)$/);
  if (blockMatch) {
    const [, indent, name, brace] = blockMatch;
    return (
      <div key={key}>
        {indent}<span className="text-purple-300">{name}</span>{' '}
        <span className="text-gray-500">{brace}</span>
      </div>
    );
  }

  // YAML: "- name: Install nginx" / "- key: value"
  const yamlListKvMatch = line.match(/^(\s*)-\s+([\w.]+):(\s*)(.*)$/);
  if (yamlListKvMatch) {
    const [, indent, key1, sep, value] = yamlListKvMatch;
    return (
      <div key={key}>
        {indent}<span className="text-gray-500">- </span>
        <span className="text-sky-300">{key1}</span>
        <span className="text-gray-500">:</span>{sep}
        <span className="text-amber-200">{value}</span>
      </div>
    );
  }

  // YAML: "key: value" (module params, notify:, register:, etc.)
  const yamlKvMatch = line.match(/^(\s*)([\w.]+):(\s*)(.*)$/);
  if (yamlKvMatch) {
    const [, indent, key1, sep, value] = yamlKvMatch;
    return (
      <div key={key}>
        {indent}<span className="text-sky-300">{key1}</span>
        <span className="text-gray-500">:</span>{sep}
        <span className="text-amber-200">{value}</span>
      </div>
    );
  }

  // YAML: plain list item, e.g. ports: - "80:80"
  const yamlPlainListMatch = line.match(/^(\s*)-\s+(.+)$/);
  if (yamlPlainListMatch) {
    const [, indent, value] = yamlPlainListMatch;
    return (
      <div key={key}>
        {indent}<span className="text-gray-500">- </span>
        <span className="text-amber-200">{value}</span>
      </div>
    );
  }

  const kvMatch = line.match(/^(\s*)([\w.\[\]0-9]+)(\s*=\s*)(.+)$/);
  if (kvMatch) {
    const [, indent, key1, eq, value] = kvMatch;
    return (
      <div key={key}>
        {indent}<span className="text-sky-300">{key1}</span>
        <span className="text-gray-500">{eq}</span>
        <span className="text-amber-200">{value}</span>
      </div>
    );
  }

  if (line.trim().startsWith('#')) {
    return <div key={key} className="text-gray-500 italic">{line}</div>;
  }

  return <div key={key} className="text-gray-400">{line || ' '}</div>;
}

export const HclCodeBlock = ({ code, filename = 'main.tf' }: HclCodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy — select and copy manually');
    }
  };

  return (
    <div className="bg-black/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-white/5">
        <span className="text-[11px] font-mono text-gray-500">{filename}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-relaxed font-mono">
        {code.split('\n').map((line, i) => highlightLine(line, i))}
      </pre>
    </div>
  );
};
