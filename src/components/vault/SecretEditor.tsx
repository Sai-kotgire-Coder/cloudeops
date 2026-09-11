import { useState } from 'react';
import { KeyRound, Plus, Trash2, BookOpen, History, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVaultStore, getEngineDef, fullSecretPath } from '@/store/vaultStore';
import { HclCodeBlock } from '@/components/terraform/HclCodeBlock';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface SecretEditorProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const SecretEditor = ({ onLearnMore }: SecretEditorProps) => {
  const { engines, secrets, writeSecret, rollbackSecret, removeSecret } = useVaultStore();
  const [engineId, setEngineId] = useState('');
  const [path, setPath] = useState('myapp/config');
  const [rows, setRows] = useState<{ key: string; value: string }[]>([{ key: 'username', value: 'admin' }]);
  const [openVersions, setOpenVersions] = useState<string | null>(null);

  const activeEngineId = engineId || engines[0]?.id || '';
  const activeEngine = engines.find((e) => e.id === activeEngineId);

  const updateRow = (i: number, field: 'key' | 'value', value: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };
  const addRow = () => setRows((r) => [...r, { key: '', value: '' }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const handleWrite = () => {
    if (!activeEngineId) return;
    const kv: Record<string, string> = {};
    rows.forEach((r) => { if (r.key.trim()) kv[r.key.trim()] = r.value; });
    writeSecret(activeEngineId, path, kv);
  };

  const kvArgs = rows.filter((r) => r.key.trim()).map((r) => `${r.key}=${r.value}`).join(' ');
  const snippet = activeEngine
    ? `vault kv put ${activeEngine.path}/${path.replace(/^\/+/, '') || 'secret'} ${kvArgs}`
    : '';

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Secrets</h3>
            <p className="text-sm text-gray-400">Write versioned key/value secrets</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('vaultKvVersioning')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      {engines.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-4 text-center">
          Enable a secrets engine first — a KV engine is the usual place to start.
        </p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={activeEngineId} onValueChange={setEngineId}>
              <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white sm:w-48 shrink-0">
                <SelectValue placeholder="engine" />
              </SelectTrigger>
              <SelectContent>
                {engines.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.path}/ ({getEngineDef(e.typeId)?.label})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="secret path (e.g. myapp/config)"
              value={path}
              onChange={(ev) => setPath(ev.target.value)}
              className="bg-[#1e293b] border-gray-700 text-white flex-1 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="key"
                  value={row.key}
                  onChange={(ev) => updateRow(i, 'key', ev.target.value)}
                  className="bg-[#1e293b] border-gray-700 text-sky-300 font-mono h-9"
                />
                <span className="text-gray-500">=</span>
                <Input
                  placeholder="value"
                  value={row.value}
                  onChange={(ev) => updateRow(i, 'value', ev.target.value)}
                  className="bg-[#1e293b] border-gray-700 text-green-400 font-mono h-9"
                />
                <button onClick={() => removeRow(i)} className="text-gray-500 hover:text-red-400 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addRow} className="gap-2">
              <Plus className="w-3.5 h-3.5" />
              Add field
            </Button>
          </div>

          {snippet && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Real Vault CLI — this is what you'd actually run
              </p>
              <HclCodeBlock code={snippet} filename="shell" />
            </div>
          )}

          <Button onClick={handleWrite} className="w-full gap-2">
            <KeyRound className="w-4 h-4" />
            Write Secret
          </Button>
        </>
      )}

      <div className="space-y-2 pt-2 border-t border-gray-800">
        {secrets.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2 text-center">No secrets written yet.</p>
        )}
        {secrets.map((secret) => {
          const engine = engines.find((e) => e.id === secret.engineId);
          const current = secret.versions[secret.versions.length - 1];
          return (
            <div key={secret.id} className="bg-[#1e293b] border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-cyan-400">
                  {engine ? fullSecretPath(engine, secret) : secret.path}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-[#0f172a] border border-gray-700 rounded px-1.5 py-0.5">
                    v{current.version}
                  </span>
                  <button
                    onClick={() => setOpenVersions(openVersions === secret.id ? null : secret.id)}
                    className="text-gray-500 hover:text-white transition-colors"
                    title="Version history"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeSecret(secret.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${secret.path}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="pl-2 mt-1.5 space-y-0.5">
                {Object.entries(current.kv).map(([k, v]) => (
                  <p key={k} className="text-xs font-mono text-gray-400">
                    <span className="text-sky-300">{k}</span> = <span className="text-green-400">{v}</span>
                  </p>
                ))}
              </div>
              {openVersions === secret.id && secret.versions.length > 1 && (
                <div className="mt-2 pt-2 border-t border-gray-800 space-y-1">
                  {[...secret.versions].reverse().map((v) => (
                    <div key={v.version} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-mono">
                        v{v.version} — {Object.entries(v.kv).map(([k, val]) => `${k}=${val}`).join(', ')}
                      </span>
                      {v.version !== current.version && (
                        <button
                          onClick={() => rollbackSecret(secret.id, v.version)}
                          className="flex items-center gap-1 text-orange-400 hover:text-orange-300"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Rollback
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
