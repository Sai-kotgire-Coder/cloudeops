import { useEffect } from 'react';
import { useProgressStore } from '@/store/progressStore';

// Headless watcher, mounted once alongside the app's other background
// watchers (ScenarioObjectiveWatcher, GitOpsReconciler). Polling this
// endpoint is what actually triggers server-side module-completion
// detection (see GET /api/progress/summary) -- any resulting "certificate
// earned" notification surfaces through the existing NotificationBell poll,
// no separate toast logic needed here.
export const ProgressWatcher = () => {
  const fetchSummary = useProgressStore((s) => s.fetchSummary);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return null;
};
