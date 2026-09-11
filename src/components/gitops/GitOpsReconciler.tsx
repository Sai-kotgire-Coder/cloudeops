import { useEffect } from 'react';
import { useGitOpsStore } from '@/store/gitopsStore';

/**
 * The entire point of GitOps is a controller that keeps watching and
 * reconciling forever, regardless of whether anyone is looking at it.
 * Mounted once at the App level (same reasoning as ScenarioObjectiveWatcher)
 * so reconciliation actually fires no matter which page the user is on --
 * simulating drift on the GitOps page and then wandering off to Instances
 * should still get auto-corrected in the background, and a sync that didn't
 * land immediately (pods still scheduling) should still finish on its own.
 */
export const GitOpsReconciler = () => {
  const hasActiveApps = useGitOpsStore((s) => s.apps.some((a) => a.selfHeal || a.autoSync || a.pendingSync));

  useEffect(() => {
    if (!hasActiveApps) return;
    const interval = setInterval(() => {
      useGitOpsStore.getState().reconcileTick();
    }, 2000);
    return () => clearInterval(interval);
  }, [hasActiveApps]);

  return null;
};
