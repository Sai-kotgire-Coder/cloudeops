import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useGameStore } from '@/store/gameStore';
import { useAlertStore, type AlertCategory } from '@/store/alertStore';

export type MetricKey = 'traffic' | 'cpuAvg' | 'errorRate' | 'latencyAvg';
export type Operator = '>' | '>=' | '<' | '<=';

export const METRIC_LABELS: Record<MetricKey, string> = {
  traffic: 'Traffic (RPS)',
  cpuAvg: 'CPU Average (%)',
  errorRate: 'Error Rate (%)',
  latencyAvg: 'Latency Average (ms)'
};

// The Issues page's Alert taxonomy has no "monitoring" category of its
// own -- map each metric to whichever existing category it's closest to,
// so a fired rule shows up there with a sensible icon/label instead of
// inventing a parallel alert system.
const METRIC_ALERT_CATEGORY: Record<MetricKey, AlertCategory> = {
  traffic: 'traffic',
  cpuAvg: 'cpu',
  errorRate: 'performance',
  latencyAvg: 'performance'
};

export interface MonitoringPanel {
  id: string;
  title: string;
  metric: MetricKey;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: MetricKey;
  operator: Operator;
  threshold: number;
  enabled: boolean;
}

export interface MonitoringEvent {
  id: string;
  ruleId: string;
  kind: 'fired' | 'resolved';
  message: string;
  timestamp: number;
}

function readMetric(metric: MetricKey): number {
  const gs = useGameStore.getState();
  return gs[metric];
}

function isBreached(value: number, operator: Operator, threshold: number): boolean {
  switch (operator) {
    case '>': return value > threshold;
    case '>=': return value >= threshold;
    case '<': return value < threshold;
    case '<=': return value <= threshold;
  }
}

interface MonitoringState {
  panels: MonitoringPanel[];
  rules: AlertRule[];
  history: MonitoringEvent[];
  // ruleId -> the alertStore-side alert id created when it fired, so
  // resolving the rule later resolves that same alert rather than leaving
  // it active forever.
  activeBreaches: Record<string, string>;

  createPanel: (title: string, metric: MetricKey) => void;
  removePanel: (id: string) => void;
  createRule: (name: string, metric: MetricKey, operator: Operator, threshold: number) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  evaluateRules: () => void;
  hydrate: (data: { panels?: MonitoringPanel[]; rules?: AlertRule[]; history?: MonitoringEvent[] }) => void;
}

function syncToBackend(get: () => MonitoringState) {
  const { panels, rules, history } = get();
  apiClient
    .updateMonitoringWorkspace({ panelCount: panels.length, ruleCount: rules.length, panels, rules, history })
    .catch((err) => console.error('Failed to sync monitoring workspace:', err));
}

export const useMonitoringStore = create<MonitoringState>()((set, get) => ({
  panels: [],
  rules: [],
  history: [],
  activeBreaches: {},

  createPanel: (title, metric) => {
    const panel: MonitoringPanel = { id: crypto.randomUUID(), title: title.trim() || METRIC_LABELS[metric], metric };
    set((s) => ({ panels: [...s.panels, panel] }));
    toast.success(`Panel "${panel.title}" added to dashboard`);
    syncToBackend(get);
  },

  removePanel: (id) => {
    set((s) => ({ panels: s.panels.filter((p) => p.id !== id) }));
    syncToBackend(get);
  },

  createRule: (name, metric, operator, threshold) => {
    const rule: AlertRule = {
      id: crypto.randomUUID(),
      name: name.trim() || `${METRIC_LABELS[metric]} ${operator} ${threshold}`,
      metric,
      operator,
      threshold,
      enabled: true
    };
    set((s) => ({ rules: [...s.rules, rule] }));
    toast.success(`Alert rule "${rule.name}" created`);
    syncToBackend(get);
  },

  removeRule: (id) => {
    set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
    syncToBackend(get);
  },

  toggleRule: (id) => {
    set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) }));
    syncToBackend(get);
  },

  // Called on an interval by MonitoringLabPage while it's mounted (mirrors
  // ScenarioObjectiveWatcher's own independent interval, rather than tying
  // evaluation to the Dashboard's simulation tick).
  evaluateRules: () => {
    const { rules, activeBreaches, history } = get();
    const newEvents: MonitoringEvent[] = [];
    const nextActiveBreaches = { ...activeBreaches };
    let changed = false;

    rules.forEach((rule) => {
      if (!rule.enabled) return;
      const value = readMetric(rule.metric);
      const breached = isBreached(value, rule.operator, rule.threshold);
      const wasBreached = rule.id in activeBreaches;

      if (breached && !wasBreached) {
        changed = true;
        const message = `${rule.name}: ${METRIC_LABELS[rule.metric]} is ${value.toFixed(1)} (${rule.operator} ${rule.threshold})`;
        newEvents.push({ id: crypto.randomUUID(), ruleId: rule.id, kind: 'fired', message, timestamp: Date.now() });
        // addAlert both updates the Issues page's live list and persists a
        // real backend Alert row -- the same path any other simulator
        // alert goes through, not a parallel one.
        const created = useAlertStore.getState().addAlert({
          title: rule.name,
          message,
          severity: 'high',
          category: METRIC_ALERT_CATEGORY[rule.metric],
          serviceName: 'Monitoring Lab',
          metrics: { [rule.metric]: value }
        });
        nextActiveBreaches[rule.id] = created.id;
      } else if (!breached && wasBreached) {
        changed = true;
        const message = `${rule.name}: back to normal (${METRIC_LABELS[rule.metric]} is ${value.toFixed(1)})`;
        newEvents.push({ id: crypto.randomUUID(), ruleId: rule.id, kind: 'resolved', message, timestamp: Date.now() });
        const alertId = activeBreaches[rule.id];
        if (alertId) {
          useAlertStore.getState().resolveAlert(alertId);
        }
        delete nextActiveBreaches[rule.id];
      }
    });

    if (changed) {
      set({
        history: [...newEvents, ...history].slice(0, 30),
        activeBreaches: nextActiveBreaches
      });
      syncToBackend(get);
    }
  },

  // Reconstructs which rules are still actively breached from the history
  // log (the latest event per rule -- if it was a "fired" with no later
  // "resolved", that rule is still active) so a page reload/remount while
  // a condition is still true doesn't fire a duplicate alert. Session-local
  // in-memory alert ids from before the reload are gone, but the app
  // still has that session's live alerts in useAlertStore -- try to find a
  // still-active one with a matching title to resolve later; otherwise
  // just suppress re-firing (never worse than the pre-fix duplicate-fire
  // behavior).
  hydrate: (data) => {
    const rules = data.rules ?? [];
    const history = data.history ?? [];

    const latestEventByRule = new Map<string, MonitoringEvent>();
    for (const event of history) {
      const existing = latestEventByRule.get(event.ruleId);
      if (!existing || event.timestamp > existing.timestamp) {
        latestEventByRule.set(event.ruleId, event);
      }
    }

    const activeAlerts = useAlertStore.getState().alerts;
    const activeBreaches: Record<string, string> = {};
    for (const rule of rules) {
      const latest = latestEventByRule.get(rule.id);
      if (latest?.kind === 'fired') {
        const matchingAlert = activeAlerts.find((a) => a.title === rule.name && a.serviceName === 'Monitoring Lab');
        activeBreaches[rule.id] = matchingAlert?.id ?? '';
      }
    }

    set({
      panels: data.panels ?? [],
      rules,
      history,
      activeBreaches
    });
  }
}));
