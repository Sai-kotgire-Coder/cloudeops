import { apiClient } from './apiClient';
import { useCICDStore } from '@/store/cicdStore';
import { useGameStore } from '@/store/gameStore';
import { useContainerStore } from '@/store/containerStore';
import { useNetworkStore } from '@/store/networkStore';
import { useTicketStore } from '@/store/ticketStore';
import { useAlertStore } from '@/store/alertStore';
import { useTerraformStore } from '@/store/terraformStore';
import { useAnsibleStore } from '@/store/ansibleStore';
import { useVaultStore } from '@/store/vaultStore';
import { useGitOpsStore } from '@/store/gitopsStore';
import { useMonitoringStore } from '@/store/monitoringStore';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';

/**
 * Hydrate all user data from the backend on login
 * This ensures that all user data persists across sessions
 */
export async function hydrateUserData() {
  try {
    console.log('🔄 Hydrating user data from backend...');

    // Load all user data in parallel for better performance
    const [
      applications,
      instances,
      containers,
      pipelines,
      images,
      tickets,
      scenarios,
      dashboard,
      networking,
      alerts,
      progress,
      gameState,
      terraform,
      ansible,
      vault,
      gitops,
      monitoring,
      profile,
      plan,
    ] = await Promise.allSettled([
      apiClient.getApplications(),
      apiClient.getInstances(),
      apiClient.getContainers(),
      apiClient.getPipelines(),
      apiClient.getImages(),
      apiClient.getTickets(),
      apiClient.getScenarios(),
      apiClient.getDashboard(),
      apiClient.getNetworking(),
      apiClient.getAlerts(),
      apiClient.getProgress(),
      apiClient.getGameState(),
      apiClient.getTerraformWorkspace(),
      apiClient.getAnsibleWorkspace(),
      apiClient.getVaultWorkspace(),
      apiClient.getGitOpsWorkspace(),
      apiClient.getMonitoringWorkspace(),
      apiClient.getProfile(),
      apiClient.getPlan(),
    ]);

    console.log('✅ User data hydration complete', {
      applications: applications.status === 'fulfilled' ? applications.value : [],
      instances: instances.status === 'fulfilled' ? instances.value : [],
      containers: containers.status === 'fulfilled' ? containers.value : [],
      pipelines: pipelines.status === 'fulfilled' ? pipelines.value : [],
      images: images.status === 'fulfilled' ? images.value : [],
      tickets: tickets.status === 'fulfilled' ? tickets.value : [],
      scenarios: scenarios.status === 'fulfilled' ? scenarios.value : [],
      dashboard: dashboard.status === 'fulfilled' ? dashboard.value : null,
      networking: networking.status === 'fulfilled' ? networking.value : null,
      alerts: alerts.status === 'fulfilled' ? alerts.value : [],
      progress: progress.status === 'fulfilled' ? progress.value : [],
      gameState: gameState.status === 'fulfilled' ? gameState.value : null,
      terraform: terraform.status === 'fulfilled' ? terraform.value : null,
      ansible: ansible.status === 'fulfilled' ? ansible.value : null,
      vault: vault.status === 'fulfilled' ? vault.value : null,
      gitops: gitops.status === 'fulfilled' ? gitops.value : null,
      monitoring: monitoring.status === 'fulfilled' ? monitoring.value : null,
    });

    // Hydrate GameStore with instances, applications, and game state
    if (instances.status === 'fulfilled' && instances.value) {
      // Map backend instances to frontend format (type -> typeId)
      const mappedInstances = instances.value.map((inst: any) => ({
        ...inst,
        typeId: inst.type || 't3.micro', // Map 'type' from backend to 'typeId' for frontend
      }));
      useGameStore.setState({ instances: mappedInstances });
    }
    if (applications.status === 'fulfilled' && applications.value) {
      useGameStore.setState({ applications: applications.value });
    }
    if (gameState.status === 'fulfilled' && gameState.value) {
      const gs = gameState.value;
      useGameStore.setState({
        isRunning: gs.isRunning ?? false,
        tick: gs.tick ?? 0,
        score: gs.score ?? 0,
        scoreHistory: gs.scoreHistory ?? [],
        pendingPods: gs.pendingPods ?? [],
        scenario: gs.scenario ?? '',
        totalCost: gs.totalCost ?? 0,
        hasLoadBalancer: gs.hasLoadBalancer ?? false,
        asg: gs.asg ?? {
          enabled: false,
          minInstances: 1,
          maxInstances: 10,
          targetCpuUp: 70,
          targetCpuDown: 30,
          instanceType: 't3.micro'
        },
        hpa: gs.hpa ?? {
          enabled: false,
          minReplicas: 1,
          maxReplicas: 10,
          targetCpuPercent: 70,
          scaleUpCooldownTicks: 10,
          scaleDownCooldownTicks: 20,
          lastScaleTick: 0
        },
        vpa: gs.vpa ?? {
          enabled: false,
          mode: 'Off',
          minInstanceType: 't3.micro',
          maxInstanceType: 'c5.xlarge'
        },
        traffic: gs.traffic ?? 0,
        targetTraffic: gs.targetTraffic ?? 0,
        cpuAvg: gs.cpuAvg ?? 0,
        errorRate: gs.errorRate ?? 0,
        latencyAvg: gs.latencyAvg ?? 0,
        metricsHistory: gs.metricsHistory ?? [],
        tutorialStep: gs.tutorialStep ?? 0,
        tutorialComplete: gs.tutorialComplete ?? false,
        kubectlCommandCount: gs.kubectlCommandCount ?? 0
      });
    }

    // Hydrate ContainerStore with containers and images
    if (containers.status === 'fulfilled' && containers.value) {
      useContainerStore.setState({ containers: containers.value });
    }
    if (images.status === 'fulfilled' && images.value) {
      useContainerStore.setState({ images: images.value });
    }

    // Hydrate NetworkStore with networking state
    if (networking.status === 'fulfilled' && networking.value && networking.value.configurations) {
      const netConfig = networking.value.configurations;
      useNetworkStore.setState({
        pods: netConfig.pods ?? [],
        services: netConfig.services ?? [],
        loadBalancers: netConfig.loadBalancers ?? [],
        ingresses: netConfig.ingresses ?? [],
        globalTraffic: networking.value.traffic ?? 0
      });
    }

    // Hydrate TicketStore with tickets
    if (tickets.status === 'fulfilled' && tickets.value) {
      useTicketStore.setState({ tickets: tickets.value });
    }

    // Hydrate AlertStore with alerts
    if (alerts.status === 'fulfilled' && alerts.value) {
      useAlertStore.setState({ alerts: alerts.value });
    }

    // Load pipelines into CICD store
    if (pipelines.status === 'fulfilled') {
      const loadPipelines = useCICDStore.getState().loadPipelines;
      await loadPipelines();
    }

    // Hydrate TerraformStore with the saved workspace
    if (terraform.status === 'fulfilled' && terraform.value) {
      useTerraformStore.getState().hydrate(terraform.value);
    }

    // Hydrate AnsibleStore with the saved workspace
    if (ansible.status === 'fulfilled' && ansible.value) {
      useAnsibleStore.getState().hydrate(ansible.value);
    }

    // Hydrate VaultStore with the saved workspace
    if (vault.status === 'fulfilled' && vault.value) {
      useVaultStore.getState().hydrate(vault.value);
    }

    // Hydrate GitOpsStore with the saved workspace
    if (gitops.status === 'fulfilled' && gitops.value) {
      useGitOpsStore.getState().hydrate(gitops.value);
    }

    // Hydrate MonitoringStore with the saved workspace
    if (monitoring.status === 'fulfilled' && monitoring.value) {
      useMonitoringStore.getState().hydrate(monitoring.value as any);
    }

    // Hydrate ProfileStore with personal info, selected modules, and plan.
    // OnboardingGate blocks rendering on this store's `hydrated` flag, so a
    // failed fetch must still flip it (to safe all-modules/onboarding-done
    // defaults) rather than leaving the app stuck on a spinner.
    useProfileStore.getState().hydrate(profile.status === 'fulfilled' && profile.value ? (profile.value as any) : {});
    if (plan.status === 'fulfilled' && plan.value) {
      useProfileStore.getState().hydratePlan(plan.value as any);
    }

    // Fire-and-forget -- not part of the critical hydration path above
    // (ProgressWatcher polls this same summary every 30s once mounted).
    useProgressStore.getState().fetchSummary();
    useProgressStore.getState().fetchCertificates();

    return {
      applications: applications.status === 'fulfilled' ? applications.value : [],
      instances: instances.status === 'fulfilled' ? instances.value : [],
      containers: containers.status === 'fulfilled' ? containers.value : [],
      pipelines: pipelines.status === 'fulfilled' ? pipelines.value : [],
      images: images.status === 'fulfilled' ? images.value : [],
      tickets: tickets.status === 'fulfilled' ? tickets.value : [],
      scenarios: scenarios.status === 'fulfilled' ? scenarios.value : [],
      dashboard: dashboard.status === 'fulfilled' ? dashboard.value : null,
      networking: networking.status === 'fulfilled' ? networking.value : null,
      alerts: alerts.status === 'fulfilled' ? alerts.value : [],
      progress: progress.status === 'fulfilled' ? progress.value : [],
      gameState: gameState.status === 'fulfilled' ? gameState.value : null,
      terraform: terraform.status === 'fulfilled' ? terraform.value : null,
      ansible: ansible.status === 'fulfilled' ? ansible.value : null,
      vault: vault.status === 'fulfilled' ? vault.value : null,
      gitops: gitops.status === 'fulfilled' ? gitops.value : null,
      monitoring: monitoring.status === 'fulfilled' ? monitoring.value : null,
    };
  } catch (error) {
    console.error('❌ Failed to hydrate user data:', error);
    // Don't throw - allow user to continue with fresh state
    return null;
  }
}

/**
 * Clear all user data on logout
 */
export function clearUserData() {
  console.log('🧹 Clearing user data...');
  // Clear CI/CD store
  const clearHistory = useCICDStore.getState().clearHistory;
  clearHistory();
  // The stores will handle their own cleanup via logout actions
  // This function is a placeholder for any global cleanup needed
}
