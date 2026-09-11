import { useEffect } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';

/**
 * Objectives can reference state in any store (Networking, Container Lab,
 * CI/CD, IAM, Terraform, Tickets), but gameStore.simulationTick() -- the only
 * other place checkObjectives() used to run from -- is only ticking while the
 * user is on the Dashboard. Without this, a scenario built around another
 * page would sit frozen the whole time the user is actually doing the work.
 * Mounted once at the App level so it keeps running across every route.
 */
export const ScenarioObjectiveWatcher = () => {
  const activeScenario = useScenarioStore((s) => s.activeScenario);

  useEffect(() => {
    if (!activeScenario) return;
    const interval = setInterval(() => {
      useScenarioStore.getState().checkObjectives();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeScenario?.id]);

  return null;
};
