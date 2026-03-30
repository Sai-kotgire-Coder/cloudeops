import { create } from 'zustand';

export interface SchedulerEvent {
  id: string;
  timestamp: number;
  type: 'pod_scheduled' | 'pod_pending' | 'pod_failed' | 'instance_added' | 'instance_removed' | 'deployment_scaled' | 'traffic_switched' | 'hpa_trigger' | 'asg_trigger' | 'scenario_event' | 'scenario_start' | 'scenario_complete' | 'scenario_failed' | 'objective_complete' | 'hint';
  message: string;
  detail?: string;
}

interface SchedulerLogState {
  events: SchedulerEvent[];
  addEvent: (type: SchedulerEvent['type'], message: string, detail?: string) => void;
  clearLog: () => void;
}

const ICONS: Record<SchedulerEvent['type'], string> = {
  pod_scheduled:    '🟢',
  pod_pending:      '🟡',
  pod_failed:       '🔴',
  instance_added:   '📈',
  instance_removed: '📉',
  deployment_scaled:'⚖️',
  traffic_switched: '🔀',
  hpa_trigger:      '🤖',
  asg_trigger:      '🚀',
  scenario_event:   '🎯',
  scenario_start:   '🚀',
  scenario_complete:'✅',
  scenario_failed:  '❌',
  objective_complete:'🎖️',
  hint:             '💡',
};

export const getSchedulerIcon = (type: SchedulerEvent['type']) => ICONS[type] ?? '📋';

export const useSchedulerStore = create<SchedulerLogState>((set) => ({
  events: [],
  addEvent: (type, message, detail) =>
    set((s) => ({
      events: [
        {
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: Date.now(),
          type,
          message,
          detail,
        },
        ...s.events,
      ].slice(0, 200), // cap at 200 entries
    })),
  clearLog: () => set({ events: [] }),
}));
