import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useGameStore } from '@/store/gameStore';

export interface GitOpsApp {
  id: string;
  name: string;
  repoUrl: string;
  path: string;
  targetRevision: string;
  destinationAppId: string; // a real Application id from gameStore
  autoSync: boolean;
  selfHeal: boolean;
  // A sync was requested (a commit under autoSync, or a manual "Sync Now")
  // but the live deployment didn't have running pods yet to switch traffic
  // to -- reconcileTick keeps retrying until it lands, same as a real
  // controller shows "Progressing" and keeps reconciling.
  pendingSync: boolean;
}

export interface GitCommit {
  id: string;
  appId: string; // GitOpsApp id
  sha: string;
  message: string;
  version: string;
  replicas: number;
  author: string;
  timestamp: number;
}

export interface WorkspaceEvent {
  id: string;
  kind: 'commit' | 'sync' | 'drift' | 'selfheal';
  message: string;
  timestamp: number;
}

export type SyncStatus = 'Synced' | 'OutOfSync' | 'Unknown';

function randomSha(): string {
  return Math.random().toString(16).slice(2, 9);
}

export function latestCommit(commits: GitCommit[], appId: string): GitCommit | undefined {
  return commits.filter((c) => c.appId === appId).sort((a, b) => b.timestamp - a.timestamp)[0];
}

export function getSyncStatus(app: GitOpsApp, commits: GitCommit[]): SyncStatus {
  const desired = latestCommit(commits, app.id);
  if (!desired) return 'Unknown';
  const liveApp = useGameStore.getState().applications.find((a) => a.id === app.destinationAppId);
  if (!liveApp) return 'Unknown';
  if (liveApp.activeVersion !== desired.version) return 'OutOfSync';
  const liveDeployment = liveApp.deployments.find((d) => d.version === desired.version);
  if (!liveDeployment || liveDeployment.replicas !== desired.replicas) return 'OutOfSync';
  return 'Synced';
}

interface GitOpsState {
  apps: GitOpsApp[];
  commits: GitCommit[];
  history: WorkspaceEvent[];
  syncCount: number;

  createApp: (name: string, repoUrl: string, path: string, destinationAppId: string, autoSync: boolean, selfHeal: boolean) => void;
  removeApp: (id: string) => void;
  toggleAutoSync: (id: string) => void;
  toggleSelfHeal: (id: string) => void;
  commit: (appId: string, message: string, version: string, replicas: number) => void;
  sync: (appId: string) => void;
  simulateDrift: (appId: string) => void;
  reconcileTick: () => void;
  hydrate: (data: { apps?: GitOpsApp[]; commits?: GitCommit[]; history?: WorkspaceEvent[]; syncCount?: number }) => void;
}

function syncToBackend(get: () => GitOpsState) {
  const { apps, commits, history, syncCount } = get();
  apiClient
    .updateGitOpsWorkspace({ commitCount: commits.length, syncCount, apps, commits, history })
    .catch((err) => console.error('Failed to sync gitops workspace:', err));
}

// Applies the desired commit's version/replicas onto the real Application in
// gameStore -- this is the one reconciliation routine used by manual Sync,
// auto-sync, and self-heal alike, so all three behave identically.
//
// Returns whether the live Application actually converged. gameStore schedules
// pods asynchronously (scaleDeployment kicks off a setTimeout chain that only
// promotes pods to "running" some milliseconds later), while setActiveVersion
// is synchronous and refuses to switch traffic to a version with zero running
// pods. So a single reconcile() call can legitimately fail to converge on the
// first attempt -- reconcileTick (below) keeps retrying until it does, the
// same way a real controller reports "Progressing" until a rollout lands.
function reconcile(app: GitOpsApp, desired: GitCommit): boolean {
  const gameStore = useGameStore.getState();
  const liveApp = gameStore.applications.find((a) => a.id === app.destinationAppId);
  if (!liveApp) return false;

  const hasVersion = liveApp.deployments.some((d) => d.version === desired.version);
  if (!hasVersion) {
    gameStore.createDeployment(liveApp.id, desired.version, desired.replicas);
  }
  if (liveApp.activeVersion !== desired.version) {
    gameStore.setActiveVersion(liveApp.id, desired.version);
  }
  gameStore.scaleDeployment(liveApp.id, desired.version, desired.replicas);

  const after = useGameStore.getState().applications.find((a) => a.id === app.destinationAppId);
  if (!after) return false;
  const liveDeployment = after.deployments.find((d) => d.version === desired.version);
  return after.activeVersion === desired.version && !!liveDeployment && liveDeployment.replicas === desired.replicas;
}

export const useGitOpsStore = create<GitOpsState>()((set, get) => ({
  apps: [],
  commits: [],
  history: [],
  syncCount: 0,

  createApp: (name, repoUrl, path, destinationAppId, autoSync, selfHeal) => {
    const app: GitOpsApp = {
      id: crypto.randomUUID(),
      name: name.trim() || `app-${get().apps.length + 1}`,
      repoUrl: repoUrl.trim() || 'https://github.com/example/gitops-repo.git',
      path: path.trim() || 'manifests/production',
      targetRevision: 'main',
      destinationAppId,
      autoSync,
      selfHeal,
      pendingSync: false,
    };
    set((s) => ({ apps: [...s.apps, app] }));
    toast.success(`GitOps Application "${app.name}" created`);
    syncToBackend(get);
  },

  removeApp: (id) => {
    set((s) => ({
      apps: s.apps.filter((a) => a.id !== id),
      commits: s.commits.filter((c) => c.appId !== id),
    }));
    syncToBackend(get);
  },

  toggleAutoSync: (id) => {
    set((s) => ({ apps: s.apps.map((a) => (a.id === id ? { ...a, autoSync: !a.autoSync } : a)) }));
    syncToBackend(get);
  },

  toggleSelfHeal: (id) => {
    set((s) => ({ apps: s.apps.map((a) => (a.id === id ? { ...a, selfHeal: !a.selfHeal } : a)) }));
    syncToBackend(get);
  },

  commit: (appId, message, version, replicas) => {
    const app = get().apps.find((a) => a.id === appId);
    if (!app) return;
    const c: GitCommit = {
      id: crypto.randomUUID(),
      appId,
      sha: randomSha(),
      message: message.trim() || `Deploy ${version}`,
      version: version.trim() || 'v1',
      replicas,
      author: 'you',
      timestamp: Date.now(),
    };
    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'commit',
      message: `${c.sha} "${c.message}" pushed to ${app.path} (${c.version}, ${c.replicas} replicas)`,
      timestamp: Date.now(),
    };
    set((s) => ({ commits: [...s.commits, c], history: [event, ...s.history].slice(0, 30) }));
    toast.success(`Committed ${c.sha}`);
    syncToBackend(get);

    if (app.autoSync) {
      // Real controllers reconcile within seconds of a new commit; a short
      // delay here makes that continuous-loop behavior visible rather than
      // indistinguishable from a manual sync.
      setTimeout(() => get().sync(appId), 800);
    }
  },

  sync: (appId) => {
    const { apps, commits, history, syncCount } = get();
    const app = apps.find((a) => a.id === appId);
    const desired = latestCommit(commits, appId);
    if (!app || !desired) {
      toast.error('Nothing to sync -- commit a change first');
      return;
    }

    const converged = reconcile(app, desired);
    if (converged) {
      const event: WorkspaceEvent = {
        id: crypto.randomUUID(),
        kind: 'sync',
        message: `${app.name} synced to ${desired.sha} (${desired.version}, ${desired.replicas} replicas)`,
        timestamp: Date.now(),
      };
      set((s) => ({
        history: [event, ...s.history].slice(0, 30),
        syncCount: s.syncCount + 1,
        apps: s.apps.map((a) => (a.id === appId ? { ...a, pendingSync: false } : a)),
      }));
      toast.success(`${app.name} synced`);
    } else {
      const event: WorkspaceEvent = {
        id: crypto.randomUUID(),
        kind: 'sync',
        message: `${app.name}: sync requested for ${desired.sha} (${desired.version}) -- waiting for pods to become ready`,
        timestamp: Date.now(),
      };
      set((s) => ({
        history: [event, ...s.history].slice(0, 30),
        apps: s.apps.map((a) => (a.id === appId ? { ...a, pendingSync: true } : a)),
      }));
      toast.info(`${app.name}: sync requested`, {
        description: 'Waiting for the target Application to have running pods for this version -- make sure an instance is attached to it. This will finish automatically once it does.',
      });
    }
    syncToBackend(get);
  },

  simulateDrift: (appId) => {
    const { apps, history } = get();
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const liveApp = useGameStore.getState().applications.find((a) => a.id === app.destinationAppId);
    if (!liveApp) return;
    const activeDeployment = liveApp.deployments.find((d) => d.version === liveApp.activeVersion);
    const currentReplicas = activeDeployment?.replicas ?? 1;
    const driftedReplicas = Math.max(1, currentReplicas + (Math.random() > 0.5 ? 2 : -1));

    useGameStore.getState().scaleDeployment(liveApp.id, liveApp.activeVersion, driftedReplicas);

    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'drift',
      message: `${app.name}: someone ran "kubectl scale" by hand -- replicas changed to ${driftedReplicas} outside Git`,
      timestamp: Date.now(),
    };
    set({ history: [event, ...history].slice(0, 30) });
    toast.error(`Drift on "${app.name}" -- live replicas no longer match Git`);
    syncToBackend(get);
  },

  // Called on an interval by GitOpsReconciler (mounted globally) -- this is
  // the actual "controller loop", handling two distinct jobs every pass:
  //  1. Finish an apply that hasn't landed yet (autoSync/pendingSync apps
  //     whose target version still had no running pods last time reconcile
  //     ran) -- keeps retrying with no user action, same as a real
  //     controller reporting "Progressing" until the rollout completes.
  //  2. Self-heal: an app whose version already matches Git but whose
  //     replica count was changed by hand outside Git gets silently
  //     reverted, but only when Self-Heal is enabled for it.
  reconcileTick: () => {
    const { apps, commits, history } = get();
    const newEvents: WorkspaceEvent[] = [];
    const clearedPendingIds = new Set<string>();

    apps.forEach((app) => {
      const desired = latestCommit(commits, app.id);
      if (!desired) return;
      const liveApp = useGameStore.getState().applications.find((a) => a.id === app.destinationAppId);
      if (!liveApp) return;

      if (liveApp.activeVersion !== desired.version) {
        if (!app.autoSync && !app.pendingSync) return;
        const converged = reconcile(app, desired);
        if (converged) {
          clearedPendingIds.add(app.id);
          newEvents.push({
            id: crypto.randomUUID(),
            kind: 'sync',
            message: `${app.name}: rollout finished -- synced to ${desired.sha} (${desired.version}, ${desired.replicas} replicas)`,
            timestamp: Date.now(),
          });
        }
        return;
      }

      if (!app.selfHeal) return;
      const liveDeployment = liveApp.deployments.find((d) => d.version === desired.version);
      if (liveDeployment && liveDeployment.replicas !== desired.replicas) {
        useGameStore.getState().scaleDeployment(liveApp.id, desired.version, desired.replicas);
        newEvents.push({
          id: crypto.randomUUID(),
          kind: 'selfheal',
          message: `${app.name}: self-healed -- replicas reverted from ${liveDeployment.replicas} back to ${desired.replicas} automatically`,
          timestamp: Date.now(),
        });
      }
    });

    if (newEvents.length > 0 || clearedPendingIds.size > 0) {
      set((s) => ({
        history: [...newEvents, ...s.history].slice(0, 30),
        apps: s.apps.map((a) => (clearedPendingIds.has(a.id) ? { ...a, pendingSync: false } : a)),
      }));
      newEvents.forEach((e) => toast.info(e.message));
      if (newEvents.length > 0) syncToBackend(get);
    }
  },

  hydrate: (data) => {
    set({
      apps: (data.apps ?? []).map((a) => ({ pendingSync: false, ...a })),
      commits: data.commits ?? [],
      history: data.history ?? [],
      syncCount: data.syncCount ?? 0,
    });
  },
}));
