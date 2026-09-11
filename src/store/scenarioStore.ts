import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGameStore } from './gameStore';
import { useSchedulerStore } from './schedulerStore';
import { useContainerStore } from './containerStore';
import { useNetworkStore } from './networkStore';
import { useCICDStore } from './cicdStore';
import { useIAMStore } from './iam/iamStore';
import { useTerraformStore } from './terraformStore';
import { useTicketStore } from './ticketStore';
import { apiClient } from '@/lib/apiClient';

export interface ScenarioObjective {
  id: string;
  description: string;
  completed: boolean;
  checkCondition: () => boolean;
}

export type ScenarioCategory =
  | 'fundamentals'
  | 'deployment'
  | 'containers'
  | 'networking'
  | 'cicd'
  | 'iam'
  | 'terraform'
  | 'incident_response';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  objectives: ScenarioObjective[];
  initialState: {
    instances?: number;
    traffic?: number;
    replicas?: number;
  };
  setupActions: () => void;
  hints: string[];
  successMessage: string;
  failureMessage?: string;
  rewards: {
    xp: number;
    badge?: string;
  };
}

interface ScenarioState {
  activeScenario: Scenario | null;
  scenarioStartTime: number | null;
  currentHintIndex: number;
  completedScenarios: string[];
  totalXP: number;
  
  startScenario: (scenario: Scenario) => void;
  completeScenario: () => void;
  failScenario: () => void;
  exitScenario: () => void;
  showNextHint: () => void;
  checkObjectives: () => void;
}

export const SCENARIOS: Record<string, Scenario> = {
  traffic_spike: {
    id: 'traffic_spike',
    name: 'Survive a Traffic Spike',
    description: 'Your app is getting featured! Traffic will suddenly spike 10x. Keep error rate below 5%.',
    category: 'fundamentals',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    initialState: {
      instances: 1,
      traffic: 50,
      replicas: 2
    },
    setupActions: () => {
      const gameStore = useGameStore.getState();
      gameStore.setTargetTraffic(50);
      gameStore.setTraffic(50);
      
      setTimeout(() => {
        gameStore.setTargetTraffic(500);
        useSchedulerStore.getState().addEvent(
          'scenario_event',
          '🚨 Traffic Spike Detected!',
          'Incoming traffic increased from 50 to 500 RPS'
        );
      }, 10000);
    },
    objectives: [
      {
        id: 'keep_error_rate_low',
        description: 'Keep error rate below 5%',
        completed: false,
        checkCondition: () => useGameStore.getState().errorRate < 5
      },
      {
        id: 'scale_infrastructure',
        description: 'Scale to at least 5 pods',
        completed: false,
        checkCondition: () => {
          const app = useGameStore.getState().applications[0];
          return app?.deployments[0]?.replicas >= 5;
        }
      },
      {
        id: 'enable_autoscaler',
        description: 'Enable Cluster Autoscaler',
        completed: false,
        checkCondition: () => useGameStore.getState().asg.enabled
      }
    ],
    hints: [
      'Scale up your deployment replicas to handle more traffic',
      'Enable the Cluster Autoscaler in the Control Panel',
      'Make sure you have enough instances to host your pods'
    ],
    successMessage: 'Excellent! You handled the traffic spike without breaking a sweat!',
    rewards: { xp: 500, badge: '🏆 Traffic Master' }
  },
  
  node_failure: {
    id: 'node_failure',
    name: 'Recover from Node Failure',
    description: 'A critical node will crash. Ensure your application stays online.',
    category: 'fundamentals',
    difficulty: 'intermediate',
    estimatedTime: '10 min',
    initialState: { instances: 2, traffic: 100, replicas: 4 },
    setupActions: () => {
      setTimeout(() => {
        useGameStore.getState().triggerIncident('crash');
      }, 15000);
    },
    objectives: [
      {
        id: 'maintain_availability',
        description: 'Keep at least 2 pods running',
        completed: false,
        checkCondition: () => {
          let runningPods = 0;
          useGameStore.getState().instances.forEach(inst => {
            runningPods += inst.pods.filter(p => p.status === 'running').length;
          });
          return runningPods >= 2;
        }
      },
      {
        id: 'restart_crashed_node',
        description: 'Restart the crashed instance',
        completed: false,
        checkCondition: () => {
          const gameStore = useGameStore.getState();
          return gameStore.instances.filter(i => i.status === 'crashed').length === 0;
        }
      }
    ],
    hints: [
      'When a node crashes, pods on it die too',
      'Restart the crashed instance from the Instances page',
      'Scale your deployment to replace lost pods'
    ],
    successMessage: 'Great recovery! You handled the node failure with minimal downtime.',
    rewards: { xp: 750, badge: '💪 Resilience Expert' }
  },
  
  blue_green_deployment: {
    id: 'blue_green_deployment',
    name: 'Zero-Downtime Deployment',
    description: 'Deploy a new version without any service interruption.',
    category: 'deployment',
    difficulty: 'advanced',
    estimatedTime: '15 min',
    initialState: { instances: 2, traffic: 200, replicas: 3 },
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '🎯 Deploy v2 without downtime',
        'Use blue-green deployment strategy'
      );
    },
    objectives: [
      {
        id: 'create_v2',
        description: 'Create v2 deployment',
        completed: false,
        checkCondition: () => useGameStore.getState().applications[0]?.deployments.length >= 2
      },
      {
        id: 'scale_v2',
        description: 'Scale v2 to match v1 replicas',
        completed: false,
        checkCondition: () => {
          const app = useGameStore.getState().applications[0];
          if (!app || app.deployments.length < 2) return false;
          const v1Replicas = app.deployments[0].replicas;
          const v2Replicas = app.deployments[1].replicas;
          return v2Replicas >= v1Replicas;
        }
      },
      {
        id: 'switch_traffic',
        description: 'Switch traffic to v2',
        completed: false,
        checkCondition: () => useGameStore.getState().applications[0]?.activeVersion === 'v2'
      }
    ],
    hints: [
      'Create v2 deployment at 0 replicas',
      'Scale v2 to match v1',
      'Wait for pods to be healthy',
      'Switch traffic instantly'
    ],
    successMessage: 'Perfect execution! This is production-grade DevOps!',
    rewards: { xp: 1000, badge: '🌟 Deployment Master' }
  },

  // ============================================
  // FUNDAMENTALS (continued)
  // ============================================
  resource_rightsizing: {
    id: 'resource_rightsizing',
    name: 'Right-Size an Over-Provisioned Fleet',
    description: 'Finance flagged your cloud bill. Traffic is low but you\'re running way more instances than you need — trim the fleet without breaking anything.',
    category: 'fundamentals',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    initialState: { instances: 4, traffic: 20 },
    setupActions: () => {
      const gameStore = useGameStore.getState();
      gameStore.setTargetTraffic(20);
      gameStore.setTraffic(20);
      gameStore.addInstance();
      gameStore.addInstance();
      gameStore.addInstance();
    },
    objectives: [
      {
        id: 'downsize_fleet',
        description: 'Reduce your fleet to 2 or fewer instances',
        completed: false,
        checkCondition: () => useGameStore.getState().instances.length <= 2
      },
      {
        id: 'maintain_health',
        description: 'Keep error rate below 10% while downsizing',
        completed: false,
        checkCondition: () => useGameStore.getState().errorRate < 10
      }
    ],
    hints: [
      'Traffic is only 20 RPS — you almost certainly don\'t need 4 instances for that',
      'Remove instances one at a time from the Instances page and watch error rate',
      'Stop before removing so much capacity that requests start failing'
    ],
    successMessage: 'Nice — same reliability, smaller bill. That\'s the job.',
    rewards: { xp: 400, badge: '💰 Cost Optimizer' }
  },

  // ============================================
  // DEPLOYMENT (continued)
  // ============================================
  rolling_update: {
    id: 'rolling_update',
    name: 'Rolling Update Without Downtime',
    description: 'Ship a new version by gradually shifting replicas from the old version to the new one, instead of switching everything at once.',
    category: 'deployment',
    difficulty: 'intermediate',
    estimatedTime: '10 min',
    initialState: { instances: 2, traffic: 150, replicas: 4 },
    setupActions: () => {
      const gameStore = useGameStore.getState();
      const app = gameStore.applications[0];
      if (app) gameStore.scaleDeployment(app.id, app.deployments[0]?.version ?? 'v1', 4);
    },
    objectives: [
      {
        id: 'create_new_version',
        description: 'Create a new deployment version',
        completed: false,
        checkCondition: () => (useGameStore.getState().applications[0]?.deployments.length ?? 0) >= 2
      },
      {
        id: 'scale_new_up',
        description: 'Scale the new version up to at least 4 replicas',
        completed: false,
        checkCondition: () => {
          const d = useGameStore.getState().applications[0]?.deployments;
          return (d?.[1]?.replicas ?? 0) >= 4;
        }
      },
      {
        id: 'scale_old_down',
        description: 'Gradually scale the old version down to 0 replicas',
        completed: false,
        checkCondition: () => {
          const d = useGameStore.getState().applications[0]?.deployments;
          return (d?.[0]?.replicas ?? 1) === 0;
        }
      }
    ],
    hints: [
      'Create a second deployment for the new version, starting small',
      'Scale the new version up in small steps, not all at once',
      'Scale the old version down as the new one takes over the load'
    ],
    successMessage: 'Smooth rollout — traffic never noticed the switch.',
    rewards: { xp: 700, badge: '🔄 Rolling Update Pro' }
  },

  canary_release: {
    id: 'canary_release',
    name: 'Canary Release',
    description: 'Test a risky new version on a small slice of traffic before betting the whole app on it.',
    category: 'deployment',
    difficulty: 'advanced',
    estimatedTime: '12 min',
    initialState: { instances: 2, traffic: 200, replicas: 4 },
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '🐤 Canary Release',
        'Deploy v2 to a single replica and verify it before promoting'
      );
    },
    objectives: [
      {
        id: 'deploy_canary',
        description: 'Deploy the new version as a canary with just 1 replica',
        completed: false,
        checkCondition: () => {
          const d = useGameStore.getState().applications[0]?.deployments;
          return (d?.length ?? 0) >= 2 && d![1].replicas === 1;
        }
      },
      {
        id: 'verify_health',
        description: 'Keep error rate below 3% while the canary is live',
        completed: false,
        checkCondition: () => useGameStore.getState().errorRate < 3
      },
      {
        id: 'promote_canary',
        description: 'Promote the canary: switch active traffic to the new version',
        completed: false,
        checkCondition: () => {
          const app = useGameStore.getState().applications[0];
          return !!app && !!app.deployments[1] && app.activeVersion === app.deployments[1].version;
        }
      }
    ],
    hints: [
      'Deploy the new version at exactly 1 replica first — that\'s the canary',
      'Watch the error rate before doing anything else',
      'Only switch active traffic once you trust the canary is healthy'
    ],
    successMessage: 'Textbook canary release — you caught problems before they mattered.',
    rewards: { xp: 1000, badge: '🐤 Canary Master' }
  },

  // ============================================
  // CONTAINERS (Container Lab)
  // ============================================
  first_container: {
    id: 'first_container',
    name: 'Build and Deploy Your First Container',
    description: 'Build a Docker image and run it as a container without it crashing.',
    category: 'containers',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    initialState: {},
    setupActions: () => {
      useContainerStore.getState().resetSimulation();
    },
    objectives: [
      {
        id: 'build_image',
        description: 'Build a Docker image',
        completed: false,
        checkCondition: () => useContainerStore.getState().images.length >= 1
      },
      {
        id: 'run_container',
        description: 'Run a container from that image',
        completed: false,
        checkCondition: () => useContainerStore.getState().containers.some((c) => c.status === 'running')
      },
      {
        id: 'stay_healthy',
        description: 'Keep it running without crashing',
        completed: false,
        checkCondition: () => {
          const containers = useContainerStore.getState().containers;
          return containers.length > 0 && containers.every((c) => c.status !== 'crashed');
        }
      }
    ],
    hints: [
      'Use the Image Builder to pick a base image and build it',
      'Drag or run the built image to start a container',
      'Watch its capacity — don\'t send more traffic than it can handle'
    ],
    successMessage: 'Your first container is alive and well!',
    rewards: { xp: 300, badge: '📦 Container Rookie' }
  },

  container_autoscale: {
    id: 'container_autoscale',
    name: 'Auto-Scale Under Load',
    description: 'Traffic is ramping up fast. Turn on auto-scaling and reach enough capacity to keep up.',
    category: 'containers',
    difficulty: 'intermediate',
    estimatedTime: '8 min',
    initialState: {},
    setupActions: () => {
      const store = useContainerStore.getState();
      store.setTraffic(300);
      if (!store.isTrafficRunning) store.toggleTraffic();
    },
    objectives: [
      {
        id: 'enable_autoscale',
        description: 'Enable auto-scaling to handle the load',
        completed: false,
        checkCondition: () => useContainerStore.getState().autoScaleEnabled
      },
      {
        id: 'scale_out',
        description: 'Reach at least 3 running containers',
        completed: false,
        checkCondition: () => useContainerStore.getState().containers.filter((c) => c.status === 'running').length >= 3
      }
    ],
    hints: [
      'Auto-scaling is a toggle in the traffic controls panel',
      'Give it a moment after enabling — it scales up gradually',
      'You can always add containers manually if it\'s too slow'
    ],
    successMessage: 'Auto-scaling handled it before you even had to think about it.',
    rewards: { xp: 600, badge: '📈 Auto-Scale Ace' }
  },

  container_recovery: {
    id: 'container_recovery',
    name: 'Recover from a Container Crash',
    description: 'Heavy load is about to crash a container. Get everything back to healthy.',
    category: 'containers',
    difficulty: 'intermediate',
    estimatedTime: '8 min',
    initialState: {},
    setupActions: () => {
      const store = useContainerStore.getState();
      store.setTraffic(500);
      if (!store.isTrafficRunning) store.toggleTraffic();
    },
    objectives: [
      {
        id: 'restart_recovery',
        description: 'Restart any crashed containers',
        completed: false,
        checkCondition: () => {
          const containers = useContainerStore.getState().containers;
          return containers.length > 0 && containers.every((c) => c.status !== 'crashed');
        }
      },
      {
        id: 'add_capacity',
        description: 'Run at least 2 healthy containers to absorb the load',
        completed: false,
        checkCondition: () => useContainerStore.getState().containers.filter((c) => c.status === 'running').length >= 2
      }
    ],
    hints: [
      'A container that can\'t handle its RPS will crash — that\'s expected here',
      'Restart crashed containers from their card',
      'Add another container or enable the load balancer to spread the load'
    ],
    successMessage: 'Crisis handled — capacity restored and stable.',
    rewards: { xp: 650, badge: '🚑 Incident Responder' }
  },

  // ============================================
  // NETWORKING
  // ============================================
  first_service: {
    id: 'first_service',
    name: 'Design a Load-Balanced Service',
    description: 'Wire up pods, a service, and a load balancer so traffic has somewhere healthy to go.',
    category: 'networking',
    difficulty: 'beginner',
    estimatedTime: '6 min',
    initialState: {},
    setupActions: () => {
      useNetworkStore.getState().resetSimulation();
    },
    objectives: [
      {
        id: 'create_pods',
        description: 'Create at least 2 running pods',
        completed: false,
        checkCondition: () => useNetworkStore.getState().pods.filter((p) => p.status === 'running').length >= 2
      },
      {
        id: 'create_service',
        description: 'Create a service that connects to those pods',
        completed: false,
        checkCondition: () => useNetworkStore.getState().services.some((s) => s.endpoints.length >= 2)
      },
      {
        id: 'add_load_balancer',
        description: 'Attach a load balancer to distribute traffic',
        completed: false,
        checkCondition: () => useNetworkStore.getState().loadBalancers.some((lb) => lb.enabled)
      }
    ],
    hints: [
      'Pods need matching labels to be picked up by a service\'s selector',
      'A service with 0 endpoints means its selector doesn\'t match any pod',
      'Load balancers attach to a service, not directly to pods'
    ],
    successMessage: 'Clean, healthy service topology — exactly how it should look.',
    rewards: { xp: 350, badge: '🔗 Service Builder' }
  },

  ingress_routing: {
    id: 'ingress_routing',
    name: 'Configure Ingress Routing',
    description: 'Get an external domain routing correctly through an ingress to a healthy backend.',
    category: 'networking',
    difficulty: 'intermediate',
    estimatedTime: '8 min',
    initialState: {},
    setupActions: () => {
      useNetworkStore.getState().resetSimulation();
    },
    objectives: [
      {
        id: 'create_ingress',
        description: 'Create an ingress with a domain',
        completed: false,
        checkCondition: () => useNetworkStore.getState().ingresses.length >= 1
      },
      {
        id: 'connect_ingress',
        description: 'Connect the ingress to a healthy service',
        completed: false,
        checkCondition: () => useNetworkStore.getState().ingresses.some((i) => i.status === 'active' && !!i.serviceId)
      },
      {
        id: 'verify_flow',
        description: 'Make sure the service has at least one healthy endpoint',
        completed: false,
        checkCondition: () => useNetworkStore.getState().services.some((s) => s.endpoints.length > 0)
      }
    ],
    hints: [
      'An ingress with no service attached shows as inactive',
      'The service still needs matching, running pods behind it',
      'Check the Traffic Visualization to confirm requests are actually flowing'
    ],
    successMessage: 'Ingress → Service → Pods — the full path is live.',
    rewards: { xp: 550, badge: '🌐 Ingress Engineer' }
  },

  diagnose_outage: {
    id: 'diagnose_outage',
    name: 'Diagnose a Networking Outage',
    description: 'An ingress is live but nothing is reaching your pods. Find the misconfiguration and fix it.',
    category: 'networking',
    difficulty: 'advanced',
    estimatedTime: '10 min',
    initialState: {},
    setupActions: () => {
      const store = useNetworkStore.getState();
      store.resetSimulation();
      store.createService('web-svc', { app: 'web' }, 'ClusterIP', 80, 8080);
      setTimeout(() => {
        const svc = useNetworkStore.getState().services[0];
        if (svc) useNetworkStore.getState().createIngress('shop.example.com', svc.id);
        useNetworkStore.getState().setGlobalTraffic(100);
        useNetworkStore.getState().startSimulation();
        useSchedulerStore.getState().addEvent(
          'scenario_event',
          '🚨 Outage: No backend available',
          'web-svc has an ingress but no pods are answering'
        );
      }, 300);
    },
    objectives: [
      {
        id: 'add_matching_pods',
        description: 'Create pods labeled to match the broken service\'s selector',
        completed: false,
        checkCondition: () => useNetworkStore.getState().services.some((s) => s.endpoints.length > 0)
      },
      {
        id: 'restore_ingress',
        description: 'Get every ingress back to Active status',
        completed: false,
        checkCondition: () => {
          const ingresses = useNetworkStore.getState().ingresses;
          return ingresses.length > 0 && ingresses.every((i) => i.status === 'active');
        }
      }
    ],
    hints: [
      'Check the service\'s selector labels on the Networking page',
      'Create a pod with labels that exactly match that selector',
      'The ingress should flip to Active once the service has a healthy endpoint'
    ],
    successMessage: 'Root-caused and fixed — that\'s a real on-call save.',
    rewards: { xp: 900, badge: '🕵️ Outage Detective' }
  },

  // ============================================
  // CI/CD
  // ============================================
  first_pipeline: {
    id: 'first_pipeline',
    name: 'Ship Your First Pipeline',
    description: 'Trigger a CI/CD pipeline and get it all the way to a successful deployment.',
    category: 'cicd',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    initialState: {},
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '🚀 Ship your first pipeline',
        'Trigger a run and get it to succeed'
      );
    },
    objectives: [
      {
        id: 'trigger_pipeline',
        description: 'Trigger a pipeline run',
        completed: false,
        checkCondition: () => useCICDStore.getState().pipelineRuns.length >= 1
      },
      {
        id: 'ship_successfully',
        description: 'Get a pipeline run to succeed',
        completed: false,
        checkCondition: () => useCICDStore.getState().pipelineRuns.some((r) => r.status === 'success')
      }
    ],
    hints: [
      'Use the pipeline trigger form to pick a branch and environment',
      'Watch each stage run in the visualization',
      'If a stage fails, just trigger again — that\'s normal in CI/CD'
    ],
    successMessage: 'Green pipeline, live deployment. That\'s the loop you\'ll repeat forever.',
    rewards: { xp: 300, badge: '🚀 First Deploy' }
  },

  pipeline_rollback: {
    id: 'pipeline_rollback',
    name: 'Recover from a Failed Deployment',
    description: 'Production deployments don\'t always go smoothly. Keep shipping until production is green.',
    category: 'cicd',
    difficulty: 'intermediate',
    estimatedTime: '10 min',
    initialState: {},
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '⚠️ Get production stable',
        'Trigger production deployments until the latest one is green'
      );
    },
    objectives: [
      {
        id: 'ship_to_prod',
        description: 'Trigger at least 2 pipeline runs to production',
        completed: false,
        checkCondition: () => useCICDStore.getState().pipelineRuns.filter((r) => r.environment === 'production').length >= 2
      },
      {
        id: 'end_green',
        description: 'Make sure the most recent production run succeeded',
        completed: false,
        checkCondition: () => {
          const prodRuns = useCICDStore.getState().pipelineRuns.filter((r) => r.environment === 'production');
          return prodRuns.length > 0 && prodRuns[0].status === 'success';
        }
      }
    ],
    hints: [
      'Production has a real chance of failing — that\'s intentional here',
      'If a production run fails, you can also roll back to the last good version',
      'Keep triggering until the latest run is green'
    ],
    successMessage: 'Production is stable again. This is why you always have a rollback plan.',
    rewards: { xp: 700, badge: '🛟 Rollback Ready' }
  },

  continuous_deployment: {
    id: 'continuous_deployment',
    name: 'Achieve Continuous Deployment',
    description: 'Prove your pipeline is trustworthy: three production deployments in a row, all green.',
    category: 'cicd',
    difficulty: 'advanced',
    estimatedTime: '12 min',
    initialState: {},
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '🏁 Three in a row',
        'Land 3 consecutive successful production deployments'
      );
    },
    objectives: [
      {
        id: 'three_greens',
        description: 'Get 3 consecutive successful production deployments',
        completed: false,
        checkCondition: () => {
          const prod = useCICDStore.getState().pipelineRuns.filter((r) => r.environment === 'production');
          return prod.length >= 3 && prod.slice(0, 3).every((r) => r.status === 'success');
        }
      }
    ],
    hints: [
      'This has to be your 3 most recent production runs, back to back',
      'A single failure resets the streak — trigger again to retry',
      'Real teams track this as their deployment success rate'
    ],
    successMessage: 'That\'s a pipeline a team can actually trust.',
    rewards: { xp: 1000, badge: '🏁 Continuous Deployment' }
  },

  // ============================================
  // IAM & SECURITY
  // ============================================
  least_privilege: {
    id: 'least_privilege',
    name: 'Apply the Principle of Least Privilege',
    description: 'You\'re running as AdminRole for no good reason. Switch to a role that only has the access it actually needs.',
    category: 'iam',
    difficulty: 'intermediate',
    estimatedTime: '5 min',
    initialState: {},
    setupActions: () => {
      useIAMStore.getState().setCurrentUserRole('role-admin');
    },
    objectives: [
      {
        id: 'switch_role',
        description: 'Switch away from AdminRole to a more scoped role',
        completed: false,
        checkCondition: () => useIAMStore.getState().currentUserRoleId !== 'role-admin'
      },
      {
        id: 'no_full_access',
        description: 'Make sure the new role isn\'t attached to full AdministratorAccess',
        completed: false,
        checkCondition: () => {
          const { roles, currentUserRoleId } = useIAMStore.getState();
          const role = roles.find((r) => r.id === currentUserRoleId);
          return !!role && !role.attachedPolicyIds.includes('policy-admin');
        }
      }
    ],
    hints: [
      'Open the IAM page and look at what AdminRole can actually do',
      'DevOpsRole or ReadOnlyRole are much narrower — pick whichever fits the job',
      'Least privilege means the smallest set of permissions that still works'
    ],
    successMessage: 'Exactly right — access that matches the job, nothing more.',
    rewards: { xp: 500, badge: '🔐 Least Privilege' }
  },

  // ============================================
  // TERRAFORM / INFRASTRUCTURE AS CODE
  // ============================================
  terraform_first_resource: {
    id: 'terraform_first_resource',
    name: 'Provision Your First Cloud Resource',
    description: 'Write a resource block, preview it with Plan, then make it real with Apply.',
    category: 'terraform',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    initialState: {},
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '🧱 Provision your first resource',
        'Write, plan, and apply a Terraform resource block'
      );
    },
    objectives: [
      {
        id: 'write_config',
        description: 'Add a resource block to your Terraform configuration',
        completed: false,
        checkCondition: () => useTerraformStore.getState().config.length >= 1
      },
      {
        id: 'apply_it',
        description: 'Run Plan, then Apply to provision it for real',
        completed: false,
        checkCondition: () => useTerraformStore.getState().state.length >= 1
      }
    ],
    hints: [
      'Pick any resource type and provider in the Terraform Lab',
      'Plan always comes before Apply — it shows you the diff first',
      'Apply commits your config as the new applied state'
    ],
    successMessage: 'That\'s the entire Terraform loop: write, plan, apply.',
    rewards: { xp: 400, badge: '🧱 First Resource' }
  },

  terraform_fix_drift: {
    id: 'terraform_fix_drift',
    name: 'Detect and Reconcile Drift',
    description: 'Someone changed a resource by hand outside of Terraform. Find it and bring it back in line.',
    category: 'terraform',
    difficulty: 'intermediate',
    estimatedTime: '8 min',
    initialState: {},
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '🌊 Reconcile configuration drift',
        'Apply a resource, simulate drift on it, then fix it'
      );
    },
    objectives: [
      {
        id: 'have_applied',
        description: 'Have at least one resource applied',
        completed: false,
        checkCondition: () => useTerraformStore.getState().state.length >= 1
      },
      {
        id: 'trigger_drift',
        description: 'Simulate drift on an applied resource',
        completed: false,
        checkCondition: () => useTerraformStore.getState().history.some((e) => e.kind === 'drift')
      },
      {
        id: 'reconcile',
        description: 'Run Plan and Apply again to reconcile the drift',
        completed: false,
        checkCondition: () => useTerraformStore.getState().appliedCount >= 2
      }
    ],
    hints: [
      'Apply a resource first — you can only drift something that exists in state',
      '"Simulate Drift" is in the Applied State panel',
      'Plan will show the drifted attribute as a change to revert'
    ],
    successMessage: 'That\'s exactly how real drift gets caught and fixed.',
    rewards: { xp: 750, badge: '🌊 Drift Hunter' }
  },

  terraform_multi_resource: {
    id: 'terraform_multi_resource',
    name: 'Provision a Multi-Resource Module',
    description: 'Real infrastructure is never just one resource. Compose several into one workspace.',
    category: 'terraform',
    difficulty: 'advanced',
    estimatedTime: '10 min',
    initialState: {},
    setupActions: () => {
      useSchedulerStore.getState().addEvent(
        'scenario_start',
        '🏗️ Compose a real module',
        'Apply at least 3 resources together'
      );
    },
    objectives: [
      {
        id: 'compose_module',
        description: 'Apply at least 3 resources in a single workspace',
        completed: false,
        checkCondition: () => useTerraformStore.getState().state.length >= 3
      }
    ],
    hints: [
      'Mix categories — e.g. a network, a compute instance, and a database',
      'You can apply resources incrementally; they all land in the same state',
      'Check Applied State to confirm the count'
    ],
    successMessage: 'That\'s a real module — multiple resources working together.',
    rewards: { xp: 950, badge: '🏗️ Module Architect' }
  },

  // ============================================
  // INCIDENT RESPONSE
  // ============================================
  resolve_ticket: {
    id: 'resolve_ticket',
    name: 'Triage and Resolve a Critical Incident',
    description: 'A critical ticket just landed in your queue. Work it from open to resolved.',
    category: 'incident_response',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    initialState: {},
    setupActions: () => {
      useTicketStore.getState().addTicket({
        title: '🔴 Critical: Database Connection Pool Exhausted',
        description: 'The application is unable to acquire new database connections. Users are seeing timeout errors.',
        type: 'incident',
        priority: 'critical',
        category: 'deployment',
        affectedService: 'api-backend',
        suggestedFix: '1. Check for connection leaks\n2. Increase pool size temporarily\n3. Restart affected service',
      });
    },
    objectives: [
      {
        id: 'triage',
        description: 'Mark the ticket as in progress',
        completed: false,
        checkCondition: () => useTicketStore.getState().tickets.some((t) => t.status === 'in_progress' || t.status === 'resolved')
      },
      {
        id: 'resolve',
        description: 'Resolve the ticket with a documented fix',
        completed: false,
        checkCondition: () => useTicketStore.getState().tickets.some((t) => t.status === 'resolved' && !!t.actionTaken)
      }
    ],
    hints: [
      'Open the Tickets page — the new critical ticket is at the top',
      'Mark it in progress before you start working it',
      'Resolve it with a note describing what you actually did'
    ],
    successMessage: 'Triaged, fixed, documented. That\'s a clean incident response.',
    rewards: { xp: 350, badge: '🚨 First Responder' }
  }
};

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      activeScenario: null,
      scenarioStartTime: null,
      currentHintIndex: -1,
      completedScenarios: [],
      totalXP: 0,

      startScenario: async (scenario) => {
        scenario.setupActions();
        set({
          activeScenario: scenario,
          scenarioStartTime: Date.now(),
          currentHintIndex: -1
        });

        useSchedulerStore.getState().addEvent(
          'scenario_start',
          `🎮 Scenario Started: ${scenario.name}`,
          scenario.description
        );

        // Save to backend
        try {
          await apiClient.createScenario({
            name: scenario.name,
            type: scenario.id,
            status: 'in_progress',
            progress: 0
          });
        } catch (error) {
          console.error('Failed to save scenario:', error);
        }
      },

      completeScenario: async () => {
        const { activeScenario, completedScenarios, totalXP } = get();
        if (!activeScenario) return;

        const elapsed = Date.now() - (get().scenarioStartTime || 0);
        const minutes = Math.floor(elapsed / 60000);

        set({
          completedScenarios: [...completedScenarios, activeScenario.id],
          totalXP: totalXP + activeScenario.rewards.xp,
          activeScenario: null,
          scenarioStartTime: null,
          currentHintIndex: -1
        });

        useSchedulerStore.getState().addEvent(
          'scenario_complete',
          `✅ Scenario Complete: ${activeScenario.name}`,
          `Completed in ${minutes}m | +${activeScenario.rewards.xp} XP ${activeScenario.rewards.badge || ''}`
        );

        // Update backend - find and update the scenario
        try {
          const scenarios = await apiClient.getScenarios() as any[];
          const currentScenario = scenarios.find((s: any) => s.type === activeScenario.id && s.status === 'in_progress');
          if (currentScenario) {
            await apiClient.updateScenario(currentScenario.id, {
              status: 'completed',
              progress: 100,
              score: activeScenario.rewards.xp,
              completedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to update scenario:', error);
        }
      },

      failScenario: async () => {
        const { activeScenario } = get();
        if (!activeScenario) return;

        useSchedulerStore.getState().addEvent(
          'scenario_failed',
          `❌ Scenario Failed: ${activeScenario.name}`,
          activeScenario.failureMessage || 'Try again to master this challenge'
        );

        // Update backend
        try {
          const scenarios = await apiClient.getScenarios() as any[];
          const currentScenario = scenarios.find((s: any) => s.type === activeScenario.id && s.status === 'in_progress');
          if (currentScenario) {
            await apiClient.updateScenario(currentScenario.id, {
              status: 'failed'
            });
          }
        } catch (error) {
          console.error('Failed to update scenario:', error);
        }

        set({
          activeScenario: null,
          scenarioStartTime: null,
          currentHintIndex: -1
        });
      },

      exitScenario: () => {
        set({
          activeScenario: null,
          scenarioStartTime: null,
          currentHintIndex: -1
        });
      },

      showNextHint: () => {
        const { activeScenario, currentHintIndex } = get();
        if (!activeScenario) return;

        const nextIndex = currentHintIndex + 1;
        if (nextIndex < activeScenario.hints.length) {
          set({ currentHintIndex: nextIndex });
          
          useSchedulerStore.getState().addEvent(
            'hint',
            `💡 Hint ${nextIndex + 1}/${activeScenario.hints.length}`,
            activeScenario.hints[nextIndex]
          );
        }
      },

      checkObjectives: () => {
        const { activeScenario } = get();
        if (!activeScenario) return;

        let allCompleted = true;
        const updatedObjectives = activeScenario.objectives.map(obj => {
          const completed = obj.checkCondition();
          if (!completed) allCompleted = false;
          
          if (completed && !obj.completed) {
            useSchedulerStore.getState().addEvent(
              'objective_complete',
              `✓ Objective Complete`,
              obj.description
            );
          }
          
          return { ...obj, completed };
        });

        set({
          activeScenario: { ...activeScenario, objectives: updatedObjectives }
        });

        if (allCompleted) {
          get().completeScenario();
        }
      }
    }),
    {
      name: 'scenario-storage',
      // activeScenario carries live checkCondition functions -- JSON.stringify
      // silently drops them, so persisting it verbatim means any rehydration
      // (a hard refresh mid-scenario) leaves checkCondition undefined and
      // checkObjectives() throws on the next tick. Only the durable,
      // serializable progress fields should survive a reload; an in-progress
      // scenario resets to the selector, which is safe.
      partialize: (state) => ({
        completedScenarios: state.completedScenarios,
        totalXP: state.totalXP,
      }),
    }
  )
);
