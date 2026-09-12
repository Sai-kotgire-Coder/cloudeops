import { useState } from 'react';
import { LayoutDashboard, Plus, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonitoringStore, METRIC_LABELS, type MetricKey } from '@/store/monitoringStore';
import { useGameStore } from '@/store/gameStore';

const METRIC_KEYS = Object.keys(METRIC_LABELS) as MetricKey[];

export const PanelsPanel = ({ onLearnMore }: { onLearnMore: () => void }) => {
  const { panels, createPanel, removePanel } = useMonitoringStore();
  const traffic = useGameStore((s) => s.traffic);
  const cpuAvg = useGameStore((s) => s.cpuAvg);
  const errorRate = useGameStore((s) => s.errorRate);
  const latencyAvg = useGameStore((s) => s.latencyAvg);

  const liveValues: Record<MetricKey, number> = { traffic, cpuAvg, errorRate, latencyAvg };

  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState<MetricKey>('traffic');

  const handleCreate = () => {
    createPanel(title, metric);
    setTitle('');
  };

  return (
    <div className="bg-[#0f172a] border-2 border-gray-700 rounded-xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Dashboard Panels</h3>
            <p className="text-sm text-gray-400">Chart your simulator's own live metrics</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onLearnMore} className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800">
          <BookOpen className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      <div className="space-y-3 bg-[#1e293b]/60 border border-gray-700 rounded-lg p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">New Panel</p>
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
        <Input
          placeholder="Panel title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#1e293b] border-gray-700 text-white"
        />
        <Button size="sm" className="w-full gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Panel
        </Button>
      </div>

      {panels.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No panels yet -- add one above to start charting a metric.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {panels.map((p) => (
            <div key={p.id} className="bg-[#1e293b] border border-gray-700 rounded-lg p-4 relative">
              <button
                onClick={() => removePanel(p.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-destructive"
                title="Remove panel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <p className="text-xs text-gray-400 mb-1">{p.title}</p>
              <p className="text-2xl font-bold font-mono text-white tabular-nums">
                {liveValues[p.metric].toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
