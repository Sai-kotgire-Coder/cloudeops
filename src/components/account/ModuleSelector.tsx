import { Plus, Check } from 'lucide-react';
import { MODULE_CATALOG } from '@/data/moduleCatalog';

interface ModuleSelectorProps {
  selectedModules: string[];
  onToggle: (id: string) => void;
}

export const ModuleSelector = ({ selectedModules, onToggle }: ModuleSelectorProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{selectedModules.length}</span> of {MODULE_CATALOG.length} modules selected —
        only selected modules show up in your sidebar. Add or remove any of them any time.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MODULE_CATALOG.map((mod) => {
          const Icon = mod.icon;
          const isSelected = selectedModules.includes(mod.id);
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onToggle(mod.id)}
              className={`text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{mod.title}</p>
                <p className="text-xs text-muted-foreground leading-snug">{mod.description}</p>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
                aria-label={isSelected ? `Remove ${mod.title}` : `Add ${mod.title}`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
