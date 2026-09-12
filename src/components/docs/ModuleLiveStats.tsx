import { useGameStore } from '@/store/gameStore';
import { useScenarioStore } from '@/store/scenarioStore';
import { useContainerStore } from '@/store/containerStore';
import { useTerraformStore } from '@/store/terraformStore';
import { useAnsibleStore } from '@/store/ansibleStore';
import { useVaultStore } from '@/store/vaultStore';
import { useGitOpsStore } from '@/store/gitopsStore';
import { useMonitoringStore } from '@/store/monitoringStore';
import { useNetworkStore } from '@/store/networkStore';
import { useCICDStore } from '@/store/cicdStore';
import { useTicketStore } from '@/store/ticketStore';
import { useAlertStore } from '@/store/alertStore';

interface Stat {
  label: string;
  value: string | number;
}

// Pulls a handful of the user's OWN real numbers for the given module --
// this is what makes a doc page feel alive instead of a static wiki page.
// Returns null for modules with nothing meaningful to show yet.
function useModuleStats(moduleId: string | undefined): Stat[] | null {
  const instances = useGameStore((s) => s.instances);
  const applications = useGameStore((s) => s.applications);
  const traffic = useGameStore((s) => s.traffic);
  const cpuAvg = useGameStore((s) => s.cpuAvg);
  const errorRate = useGameStore((s) => s.errorRate);
  const kubectlCommandCount = useGameStore((s) => s.kubectlCommandCount);

  const { completedScenarios, totalXP } = useScenarioStore();
  const { containers, images } = useContainerStore();
  const { config: terraformConfig, appliedCount } = useTerraformStore();
  const { playbook, runCount } = useAnsibleStore();
  const { secrets, accessCount } = useVaultStore();
  const { apps: gitopsApps, syncCount } = useGitOpsStore();
  const { panels, rules } = useMonitoringStore();
  const { pods, services, loadBalancers, ingresses } = useNetworkStore();
  const { pipelineRuns } = useCICDStore();
  const tickets = useTicketStore((s) => s.tickets);
  const alerts = useAlertStore((s) => s.alerts);

  switch (moduleId) {
    case 'dashboard':
      return [
        { label: 'Traffic', value: `${traffic.toFixed(0)} RPS` },
        { label: 'CPU avg', value: `${cpuAvg.toFixed(1)}%` },
        { label: 'Error rate', value: `${errorRate.toFixed(1)}%` },
        { label: 'Instances', value: instances.length },
      ];
    case 'scenarios':
      return [
        { label: 'Completed', value: completedScenarios.length },
        { label: 'Total XP', value: totalXP },
      ];
    case 'applications':
      return [{ label: 'Applications', value: applications.length }];
    case 'containers':
      return [
        { label: 'Running containers', value: containers.length },
        { label: 'Images built', value: images.length },
      ];
    case 'instances':
      return [
        { label: 'Instances', value: instances.length },
        { label: 'Running', value: instances.filter((i) => i.status === 'running').length },
      ];
    case 'networking':
      return [
        { label: 'Pods', value: pods.length },
        { label: 'Services', value: services.length },
        { label: 'Load balancers', value: loadBalancers.length },
        { label: 'Ingress rules', value: ingresses.length },
      ];
    case 'cicd':
      return [
        { label: 'Pipeline runs', value: pipelineRuns.length },
        { label: 'Successful', value: pipelineRuns.filter((p) => p.status === 'success').length },
      ];
    case 'live':
      return [
        { label: 'Instances', value: instances.length },
        { label: 'Applications', value: applications.length },
      ];
    case 'tickets':
      return [
        { label: 'Total tickets', value: tickets.length },
        { label: 'Open', value: tickets.filter((t) => t.status === 'open').length },
      ];
    case 'issues':
      return [{ label: 'Active alerts', value: alerts.filter((a) => a.status === 'active').length }];
    case 'terraform':
      return [
        { label: 'Resources authored', value: terraformConfig.length },
        { label: 'Applies run', value: appliedCount },
      ];
    case 'ansible':
      return [
        { label: 'Tasks authored', value: playbook.length },
        { label: 'Playbook runs', value: runCount },
      ];
    case 'vault':
      return [
        { label: 'Secrets written', value: secrets.length },
        { label: 'Access attempts', value: accessCount },
      ];
    case 'kubectl':
      return [{ label: 'Commands run', value: kubectlCommandCount }];
    case 'gitops':
      return [
        { label: 'Applications', value: gitopsApps.length },
        { label: 'Syncs', value: syncCount },
      ];
    case 'monitoring':
      return [
        { label: 'Dashboard panels', value: panels.length },
        { label: 'Alert rules', value: rules.length },
      ];
    default:
      return null;
  }
}

export const ModuleLiveStats = ({ moduleId }: { moduleId: string | undefined }) => {
  const stats = useModuleStats(moduleId);
  if (!stats || stats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
          <p className="text-lg font-bold font-mono tabular-nums leading-tight">{s.value}</p>
        </div>
      ))}
    </div>
  );
};
