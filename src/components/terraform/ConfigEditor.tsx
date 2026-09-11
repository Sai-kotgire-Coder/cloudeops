import { useMemo, useState } from 'react';
import { FileCode, Plus, Trash2, BookOpen, Cloud, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useTerraformStore,
  RESOURCE_CATALOG,
  PROVIDER_LABELS,
  getResourceDef,
  resourceTypeString,
  type ResourceCategory,
  type Provider,
} from '@/store/terraformStore';
import type { LearningSectionId } from '@/data/dockerLearningContent';
import { getTerraformSnippet } from '@/data/terraformSnippets';
import { getTerraformVariables, getTerraformOutputs } from '@/data/terraformVariablesOutputs';
import { HclCodeBlock } from './HclCodeBlock';

interface ConfigEditorProps {
  onLearnMore: (sectionId: LearningSectionId) => void;
}

export const ConfigEditor = ({ onLearnMore }: ConfigEditorProps) => {
  const { config, addResource, updateResourceAttr, removeResource } = useTerraformStore();
  const [category, setCategory] = useState<ResourceCategory>('cloud_infra');
  const [provider, setProvider] = useState<Provider>('aws');
  const [typeId, setTypeId] = useState('compute_instance');
  const [name, setName] = useState('');

  const optionsForCategory = useMemo(
    () => RESOURCE_CATALOG.filter((r) => r.category === category),
    [category]
  );

  const handleCategoryChange = (next: ResourceCategory) => {
    setCategory(next);
    const firstOption = RESOURCE_CATALOG.find((r) => r.category === next);
    if (firstOption) setTypeId(firstOption.id);
  };

  const handleAdd = () => {
    addResource(typeId, name, category === 'cloud_infra' ? provider : undefined);
    setName('');
  };

  const selectedDef = optionsForCategory.find((r) => r.id === typeId);
  const activeProvider = category === 'cloud_infra' ? provider : undefined;
  const snippet = getTerraformSnippet(typeId, activeProvider);
  const variablesSnippet = getTerraformVariables(typeId, activeProvider);
  const outputsSnippet = getTerraformOutputs(typeId, activeProvider);

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <FileCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Configuration</h3>
            <p className="text-sm text-gray-400">The infrastructure you want (main.tf)</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onLearnMore('terraformResource')}
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-3 bg-[#1e293b]/60 border border-gray-700 rounded-lg p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          What are you configuring?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCategoryChange('cloud_infra')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              category === 'cloud_infra'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#0f172a] border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Cloud Infrastructure
          </button>
          <button
            onClick={() => handleCategoryChange('github_ci')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              category === 'github_ci'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#0f172a] border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            GitHub / CI Config
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {category === 'cloud_infra' && (
            <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
              <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white sm:w-40 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                  <SelectItem key={p} value={p}>{PROVIDER_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={typeId} onValueChange={setTypeId}>
            <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white sm:flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {optionsForCategory.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDef && (
          <p className="text-xs text-gray-400 leading-relaxed pt-0.5">{selectedDef.description}</p>
        )}

        {snippet && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Real Terraform for {selectedDef?.label}
              {category === 'cloud_infra' && <> on {PROVIDER_LABELS[provider]}</>}
              {' '}— a complete, minimally-structured module
            </p>
            <HclCodeBlock code={snippet} filename="main.tf" />
            {variablesSnippet && <HclCodeBlock code={variablesSnippet} filename="variables.tf" />}
            {outputsSnippet && <HclCodeBlock code={outputsSnippet} filename="outputs.tf" />}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="resource name (e.g. web_server)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-[#1e293b] border-gray-700 text-white flex-1"
          />
          <Button onClick={handleAdd} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Add Block
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {config.length === 0 && (
          <p className="text-sm text-gray-500 italic py-4 text-center">
            No resource blocks yet — add one above to start writing your configuration.
          </p>
        )}
        {config.map((resource) => {
          const def = getResourceDef(resource.typeId);
          return (
            <div key={resource.id} className="bg-[#1e293b] border border-gray-700 rounded-lg p-3 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-400">
                  resource "{resourceTypeString(resource)}" "{resource.name}"
                </span>
                <div className="flex items-center gap-2">
                  {resource.provider && (
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-gray-500 bg-[#0f172a] border border-gray-700 rounded px-1.5 py-0.5">
                      {PROVIDER_LABELS[resource.provider]}
                    </span>
                  )}
                  <button
                    onClick={() => removeResource(resource.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${resource.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {def && (
                <p className="text-[11px] font-sans text-gray-500 pl-4 mb-1.5">
                  {def.label} — {def.description}
                </p>
              )}
              <div className="pl-4 space-y-1">
                {Object.entries(resource.attrs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-500">{key}</span>
                    <span className="text-gray-500">=</span>
                    <Input
                      value={value}
                      onChange={(e) => updateResourceAttr(resource.id, key, e.target.value)}
                      className="h-7 bg-[#0f172a] border-gray-700 text-green-400 font-mono text-sm w-40"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
