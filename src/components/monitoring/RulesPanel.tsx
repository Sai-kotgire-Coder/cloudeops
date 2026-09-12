import { useState } from 'react';
import { BellRing, Plus, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonitoringStore, METRIC_LABELS, type MetricKey, type Operator } from '@/store/monitoringStore';

const METRIC_KEYS = Object.keys(METRIC_LABELS) as MetricKey[];
const OPERATORS: Operator[] = ['>', '>=', '<', '<='];

export const RulesPanel = ({ onLearnMore }: { onLearnMore: () => void }) => {
  const { rules, activeBreaches, createRule, removeRule, toggleRule } = useMonitoringStore();

  const [name, setName] = useState('');
  const [metric, setMetric] = useState<MetricKey>('errorRate');
  const [operator, setOperator] = useState<Operator>('>');
  const [threshold, setThreshold] = useState('5');

  const handleCreate = () => {
    const value = parseFloat(threshold);
    if (isNaN(value)) return;
    createRule(name, metric, operator, value);
    setName('');
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <BellRing className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Alert Rules</h3>
            <p className="text-sm text-gray-400">Fire a real alert when a metric crosses a threshold</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onLearnMore} className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800">
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-3 bg-[#1e293b]/60 border border-gray-700 rounded-lg p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">New Alert Rule</p>
        <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
          <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRIC_KEYS.map((m) => (
              <SelectItem key={m} value={m}>{METRIC_LABELS[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={operator} onValueChange={(v) => setOperator(v as Operator)}>
            <SelectTrigger className="bg-[#1e293b] border-gray-700 text-white w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op} value={op}>{op}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Threshold"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="bg-[#1e293b] border-gray-700 text-white"
          />
        </div>
        <Input
          placeholder="Rule name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#1e293b] border-gray-700 text-white"
        />
        <Button size="sm" className="w-full gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No alert rules yet -- create one above.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => {
            const breached = r.id in activeBreaches;
            return (
              <div key={r.id} className="flex items-center justify-between bg-[#1e293b] border border-gray-700 rounded-lg p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{r.name}</p>
                    {breached && <Badge variant="destructive" className="text-[10px]">Firing</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    {METRIC_LABELS[r.metric]} {r.operator} {r.threshold}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch checked={r.enabled} onCheckedChange={() => toggleRule(r.id)} />
                  <button onClick={() => removeRule(r.id)} className="text-gray-500 hover:text-destructive" title="Remove rule">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
