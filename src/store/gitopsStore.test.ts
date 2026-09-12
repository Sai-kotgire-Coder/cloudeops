import { describe, it, expect, beforeEach } from 'vitest';
import { getSyncStatus, latestCommit, type GitOpsApp, type GitCommit } from './gitopsStore';
import { useGameStore } from './gameStore';

function makeApp(overrides: Partial<GitOpsApp> = {}): GitOpsApp {
  return {
    id: 'gitops-app-1',
    name: 'test-app',
    repoUrl: 'https://github.com/example/repo.git',
    path: 'manifests/production',
    targetRevision: 'main',
    destinationAppId: 'live-app-1',
    autoSync: true,
    selfHeal: false,
    pendingSync: false,
    ...overrides
  };
}

function makeCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    id: 'commit-1',
    appId: 'gitops-app-1',
    sha: 'abc1234',
    message: 'Deploy v2',
    version: 'v2',
    replicas: 3,
    author: 'you',
    timestamp: Date.now(),
    ...overrides
  };
}

describe('latestCommit', () => {
  it('returns undefined when there are no commits for that app', () => {
    expect(latestCommit([], 'gitops-app-1')).toBeUndefined();
  });

  it('returns the most recent commit by timestamp for that specific app', () => {
    const older = makeCommit({ id: 'c1', version: 'v1', timestamp: 1000 });
    const newer = makeCommit({ id: 'c2', version: 'v2', timestamp: 2000 });
    const otherApp = makeCommit({ id: 'c3', appId: 'other-app', version: 'v99', timestamp: 3000 });

    expect(latestCommit([older, newer, otherApp], 'gitops-app-1')).toEqual(newer);
  });
});

describe('getSyncStatus', () => {
  beforeEach(() => {
    useGameStore.setState({ applications: [] });
  });

  it('is Unknown when there is no commit yet', () => {
    const app = makeApp();
    expect(getSyncStatus(app, [])).toBe('Unknown');
  });

  it('is Unknown when the destination Application no longer exists', () => {
    const app = makeApp();
    const commit = makeCommit();
    expect(getSyncStatus(app, [commit])).toBe('Unknown');
  });

  it('is OutOfSync when the live active version does not match the desired commit', () => {
    useGameStore.setState({
      applications: [
        { id: 'live-app-1', name: 'live', activeVersion: 'v1', deployments: [{ id: 'd1', version: 'v1', replicas: 3 }], assignedInstances: [] }
      ]
    });
    const app = makeApp();
    const commit = makeCommit({ version: 'v2', replicas: 3 });
    expect(getSyncStatus(app, [commit])).toBe('OutOfSync');
  });

  it('is OutOfSync when the version matches but replica count has drifted', () => {
    useGameStore.setState({
      applications: [
        { id: 'live-app-1', name: 'live', activeVersion: 'v2', deployments: [{ id: 'd1', version: 'v2', replicas: 5 }], assignedInstances: [] }
      ]
    });
    const app = makeApp();
    const commit = makeCommit({ version: 'v2', replicas: 3 });
    expect(getSyncStatus(app, [commit])).toBe('OutOfSync');
  });

  it('is Synced when the live version and replica count exactly match the desired commit', () => {
    useGameStore.setState({
      applications: [
        { id: 'live-app-1', name: 'live', activeVersion: 'v2', deployments: [{ id: 'd1', version: 'v2', replicas: 3 }], assignedInstances: [] }
      ]
    });
    const app = makeApp();
    const commit = makeCommit({ version: 'v2', replicas: 3 });
    expect(getSyncStatus(app, [commit])).toBe('Synced');
  });
});
