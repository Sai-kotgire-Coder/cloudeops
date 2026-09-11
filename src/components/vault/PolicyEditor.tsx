import { useState } from 'react';
import { ShieldCheck, Plus, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVaultStore, type Capability } from '@/store/vaultStore';
import { HclCodeBlock } from '@/components/terraform/HclCodeBlock';
import type { LearningSectionId } from '@/data/dockerLearningContent';

interface PolicyEditorProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

const ALL_CAPABILITIES: Capability[] = ['read', 'list', 'create', 'update', 'delete'];

export const PolicyEditor = ({ onLearnMore }: PolicyEditorProps) => {
  const { policies, addPolicy, removePolicy } = useVaultStore();
  const [name, setName] = useState('');
  const [pathPattern, setPathPattern] = useState('secret/data/myapp/*');
  const [capabilities, setCapabilities] = useState<Capability[]>(['read', 'list']);

  const toggleCap = (cap: Capability) => {
    setCapabilities((c) => (c.includes(cap) ? c.filter((x) => x !== cap) : [...c, cap]));
  };

  const handleAdd = () => {
    if (capabilities.length === 0) return;
    addPolicy(name, pathPattern, capabilities);
    setName('');
  };

  const snippet = `path "${pathPattern}" {
  capabilities = [${capabilities.map((c) => `"${c}"`).join(', ')}]
}`;

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Policies</h3>
            <p className="text-sm text-gray-400">Least-privilege access control, per path</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('vaultPolicies')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <Input
        placeholder="policy name (e.g. myapp-readonly)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-[#1e293b] border-gray-700 text-white"
      />
      <Input
        placeholder="path pattern (e.g. secret/data/myapp/*)"
        value={pathPattern}
        onChange={(e) => setPathPattern(e.target.value)}
        className="bg-[#1e293b] border-gray-700 text-white font-mono"
      />

      <div className="flex flex-wrap gap-2">
        {ALL_CAPABILITIES.map((cap) => (
          <button
            key={cap}
            onClick={() => toggleCap(cap)}
            className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${
              capabilities.includes(cap)
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#1e293b] border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            {cap}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Real Vault policy HCL
        </p>
        <HclCodeBlock code={snippet} filename="policy.hcl" />
      </div>

      <Button onClick={handleAdd} disabled={capabilities.length === 0} className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Create Policy
      </Button>

      <div className="space-y-1.5 pt-2 border-t border-gray-800">
        {policies.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2 text-center">No policies yet.</p>
        )}
        {policies.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
            <div>
              <span className="font-mono text-sm text-cyan-400">{p.name}</span>
              <p className="text-xs text-gray-500 font-mono">{p.pathPattern} [{p.capabilities.join(', ')}]</p>
            </div>
            <button
              onClick={() => removePolicy(p.id)}
              className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
              aria-label={`Remove ${p.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
