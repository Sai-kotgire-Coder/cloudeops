import { useEffect } from 'react';
import { LineChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMonitoringStore } from '@/store/monitoringStore';
import { useLearningStore } from '@/store/learningStore';
import { PanelsPanel } from '@/components/monitoring/PanelsPanel';
import { RulesPanel } from '@/components/monitoring/RulesPanel';
import { HistoryPanel } from '@/components/monitoring/HistoryPanel';

const EVALUATION_INTERVAL_MS = 4000;

export default function MonitoringLabPage() {
  const { panels, rules, evaluateRules } = useMonitoringStore();
  const { openTopic } = useLearningStore();

  useEffect(() => {
    const interval = setInterval(() => useMonitoringStore.getState().evaluateRules(), EVALUATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <LineChart className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg sm:text-xl">Monitoring Lab</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Build dashboards and alert rules, Prometheus &amp; Grafana style
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <LineChart className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm">{panels.length}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">panels</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="font-mono font-bold text-sm">{rules.length}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">rules</span>
          </div>

          <Button size="sm" variant="outline" onClick={() => openTopic('monitoring')} className="gap-2 hidden sm:flex">
            <BookOpen className="w-4 h-4" />
            Learn More
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PanelsPanel onLearnMore={() => openTopic('monitoring')} />
            <div className="space-y-6">
              <RulesPanel onLearnMore={() => openTopic('monitoring')} />
              <HistoryPanel />
            </div>
          </div>

          {panels.length === 0 && rules.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              New here? Add a <span className="font-semibold">panel</span> on the left to chart a live metric,
              then create an <span className="font-semibold">alert rule</span> on the right and watch it fire
              when the metric crosses your threshold.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
