import { useState } from 'react';
import { Layers, Plus, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVaultStore, SECRETS_ENGINE_CATALOG, getEngineDef } from '@/store/vaultStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface EnginesPanelProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const EnginesPanel = ({ onLearnMore }: EnginesPanelProps) => {
  const { engines, enableEngine, disableEngine } = useVaultStore();
  const [typeId, setTypeId] = useState('kv');
  const [path, setPath] = useState('secret');

  const selectedDef = getEngineDef(typeId);

  const handleEnable = () => {
    enableEngine(typeId, path);
    setPath(getEngineDef(typeId)?.defaultPath ?? '');
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Secrets Engines</h3>
            <p className="text-sm text-gray-400">What kind of secrets Vault manages here</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('vaultSecretsEngine')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <Select value={typeId} onValueChange={(v) => { setTypeId(v); setPath(getEngineDef(v)?.defaultPath ?? ''); }}>
        <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {SECRETS_ENGINE_CATALOG.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedDef && <p className="text-xs text-gray-400 leading-relaxed">{selectedDef.description}</p>}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-1.5 bg-[#1e293b] border border-gray-700 rounded-md px-3 flex-1">
          <span className="text-gray-500 font-mono text-sm">mount path:</span>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="bg-transparent border-0 text-white font-mono px-0 h-9 focus-visible:ring-0"
          />
        </div>
        <Button onClick={handleEnable} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Enable
        </Button>
      </div>

      {engines.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-2 text-center">
          No secrets engines enabled yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {engines.map((engine) => {
            const def = getEngineDef(engine.typeId);
            return (
              <div key={engine.id} className="flex items-center justify-between bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
                <span className="font-mono text-sm text-cyan-400">{engine.path}/</span>
                <span className="text-xs text-gray-400">{def?.label}</span>
                <button
                  onClick={() => disableEngine(engine.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  aria-label={`Disable ${engine.path}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
