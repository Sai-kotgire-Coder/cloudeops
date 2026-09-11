import { useState } from 'react';
import { KeySquare, Plus, Trash2, BookOpen, Terminal, CheckCircle2, XCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVaultStore, fullSecretPath } from '@/store/vaultStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface TokenAccessPanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const TokenAccessPanel = ({ onLearnMore }: TokenAccessPanelProps) => {
  const { tokens, policies, secrets, engines, addToken, removeToken, attemptAccess, lastAccess, history } = useVaultStore();
  const [name, setName] = useState('');
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [accessTokenId, setAccessTokenId] = useState('');
  const [accessSecretId, setAccessSecretId] = useState('');

  const togglePolicy = (id: string) => {
    setSelectedPolicyIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const handleCreate = () => {
    addToken(name, selectedPolicyIds);
    setName('');
    setSelectedPolicyIds([]);
  };

  const handleAttempt = () => {
    if (!accessTokenId || !accessSecretId) return;
    attemptAccess(accessTokenId, accessSecretId);
  };

  const accessSecret = secrets.find((s) => s.id === accessSecretId);
  const accessEngine = accessSecret ? engines.find((e) => e.id === accessSecret.engineId) : undefined;
  const previewPath = accessEngine && accessSecret ? fullSecretPath(accessEngine, accessSecret) : '';

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <KeySquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Tokens &amp; Access</h3>
            <p className="text-sm text-gray-400">Attach policies to a token, then test it</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('vaultTokens')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="token name (e.g. myapp-service)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#1e293b] border-gray-700 text-white"
        />
        <div className="flex flex-wrap gap-2">
          {policies.length === 0 && (
            <p className="text-xs text-gray-500 italic">Create a policy first to attach one.</p>
          )}
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePolicy(p.id)}
              className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${
                selectedPolicyIds.includes(p.id)
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-[#1e293b] border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <Button onClick={handleCreate} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Create Token
        </Button>
      </div>

      {tokens.length > 0 && (
        <div className="space-y-1.5">
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
              <div>
                <span className="font-mono text-sm text-cyan-400">{t.name}</span>
                <p className="text-xs text-gray-500">
                  {t.policyIds.length === 0 ? 'no policies attached' : t.policyIds.map((id) => policies.find((p) => p.id === id)?.name).filter(Boolean).join(', ')}
                </p>
              </div>
              <button
                onClick={() => removeToken(t.id)}
                className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                aria-label={`Remove ${t.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-gray-800 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Simulate a read</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={accessTokenId} onValueChange={setAccessTokenId}>
            <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white flex-1">
              <SelectValue placeholder="as token..." />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={accessSecretId} onValueChange={setAccessSecretId}>
            <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white flex-1">
              <SelectValue placeholder="read secret..." />
            </SelectTrigger>
            <SelectContent>
              {secrets.map((s) => {
                const engine = engines.find((e) => e.id === s.engineId);
                return <SelectItem key={s.id} value={s.id}>{engine ? fullSecretPath(engine, s) : s.path}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAttempt} disabled={!accessTokenId || !accessSecretId} variant="outline" className="w-full gap-2">
          <Terminal className="w-4 h-4" />
          Attempt Read
        </Button>
      </div>

      {lastAccess && (
        <div className="bg-black/40 border border-gray-800 rounded-lg p-3 font-mono text-xs space-y-1.5">
          <p className="text-gray-500">$ vault kv get {lastAccess.fullPath}</p>
          {lastAccess.allowed ? (
            <>
              <div className="flex items-center gap-1.5 text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success — allowed by policy "{lastAccess.matchedPolicy}"</span>
              </div>
              {(() => {
                const secret = secrets.find((s) => s.id === lastAccess.secretId);
                const current = secret?.versions[secret.versions.length - 1];
                return current ? Object.entries(current.kv).map(([k, v]) => (
                  <p key={k} className="text-gray-300 pl-5">
                    <span className="text-sky-300">{k}</span> = <span className="text-green-400">{v}</span>
                  </p>
                )) : null;
              })()}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              <span>Error: permission denied</span>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-2 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <History className="w-3.5 h-3.5" />
            Recent activity
          </div>
          <ul className="space-y-1.5 max-h-32 overflow-y-auto">
            {history.map((event) => (
              <li key={event.id} className="text-xs text-gray-400 flex items-start gap-2">
                <span className={event.kind === 'allow' ? 'text-green-400' : event.kind === 'deny' ? 'text-red-400' : 'text-cyan-400'}>●</span>
                <span>{event.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
