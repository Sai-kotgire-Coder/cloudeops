import { useState } from 'react';
import { Variable, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTerraformStore } from '@/store/terraformStore';

// Shared across both workspaces (dev and prod both resolve "var.<name>"
// against this same set) -- same mental model as referencing the same
// variables.tf from either environment.
export const VariablesPanel = () => {
  const { variables, setVariable, removeVariable } = useTerraformStore();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    setVariable(name, value);
    setName('');
    setValue('');
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Variable className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">Variables</h3>
          <p className="text-sm text-gray-400">Reference one as <code className="text-cyan-400">var.&lt;name&gt;</code> in any resource attribute</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="name (e.g. instance_size)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="bg-[#1e293b] border-gray-700 text-white font-mono sm:w-56"
        />
        <Input
          placeholder="value (e.g. t3.large)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="bg-[#1e293b] border-gray-700 text-white font-mono flex-1"
        />
        <Button onClick={handleAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Set
        </Button>
      </div>

      {Object.keys(variables).length > 0 && (
        <div className="space-y-1.5">
          {Object.entries(variables).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-1.5 font-mono text-sm">
              <span className="text-sky-300">var.{key}</span>
              <span className="text-gray-500">=</span>
              <span className="text-green-400 flex-1">{val}</span>
              <button
                onClick={() => removeVariable(key)}
                className="text-gray-500 hover:text-red-400 transition-colors"
                aria-label={`Remove var.${key}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
