import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGameStore } from './gameStore';
import { useSchedulerStore } from './schedulerStore';
import { apiClient } from '@/lib/apiClient';

export interface ScenarioObjective {
  id: string;
  description: string;
  completed: boolean;
  checkCondition: () => boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
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
    { name: 'scenario-storage' }
  )
);
