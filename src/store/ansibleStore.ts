import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

export interface AnsibleModuleDef {
  id: string;
  label: string;
  description: string;
  module: string;
  defaultParams: Record<string, string | number>;
}

// 20 real ansible.builtin / community modules, covering the tasks a real
// playbook actually does: packages, services, files, users, source control,
// scheduling, containers, and system checks.
export const ANSIBLE_MODULE_CATALOG: AnsibleModuleDef[] = [
  {
    id: 'apt', label: 'Install a Package (APT)', module: 'ansible.builtin.apt',
    description: 'Installs or removes a package using APT (Debian/Ubuntu).',
    defaultParams: { name: 'nginx', state: 'present' },
  },
  {
    id: 'yum', label: 'Install a Package (YUM)', module: 'ansible.builtin.yum',
    description: 'Installs or removes a package using YUM (RHEL/CentOS).',
    defaultParams: { name: 'httpd', state: 'present' },
  },
  {
    id: 'systemd', label: 'Manage a Service', module: 'ansible.builtin.systemd',
    description: 'Starts, stops, or enables a systemd-managed service.',
    defaultParams: { name: 'nginx', state: 'started', enabled: 'true' },
  },
  {
    id: 'copy', label: 'Copy a File', module: 'ansible.builtin.copy',
    description: 'Copies a static file from the control machine to the target host.',
    defaultParams: { src: 'files/app.conf', dest: '/etc/app/app.conf' },
  },
  {
    id: 'template', label: 'Render a Config Template', module: 'ansible.builtin.template',
    description: 'Renders a Jinja2 template into a config file on the target host.',
    defaultParams: { src: 'templates/nginx.conf.j2', dest: '/etc/nginx/nginx.conf' },
  },
  {
    id: 'file', label: 'Manage a File or Directory', module: 'ansible.builtin.file',
    description: 'Sets permissions and ownership, or creates a file/directory/symlink.',
    defaultParams: { path: '/var/www/html', state: 'directory', mode: '0755' },
  },
  {
    id: 'lineinfile', label: 'Edit a Line in a File', module: 'ansible.builtin.lineinfile',
    description: 'Ensures a specific line exists (or is absent) in a file.',
    defaultParams: { path: '/etc/hosts', line: '127.0.0.1 app.local' },
  },
  {
    id: 'user', label: 'Manage a User Account', module: 'ansible.builtin.user',
    description: 'Creates, modifies, or removes a user account.',
    defaultParams: { name: 'deploy', shell: '/bin/bash', groups: 'sudo' },
  },
  {
    id: 'group', label: 'Manage a Group', module: 'ansible.builtin.group',
    description: 'Creates, modifies, or removes a group.',
    defaultParams: { name: 'developers', gid: 1500 },
  },
  {
    id: 'git', label: 'Clone a Git Repository', module: 'ansible.builtin.git',
    description: 'Clones or updates a Git repository on the target host.',
    defaultParams: { repo: 'https://github.com/example/app.git', dest: '/opt/app' },
  },
  {
    id: 'cron', label: 'Schedule a Cron Job', module: 'ansible.builtin.cron',
    description: "Schedules a recurring job via the host's crontab.",
    defaultParams: { name: 'backup job', minute: '0', hour: '2', job: '/usr/local/bin/backup.sh' },
  },
  {
    id: 'command', label: 'Run a Command', module: 'ansible.builtin.command',
    description: 'Runs a command on the target host (no shell features like pipes).',
    defaultParams: { cmd: 'php artisan migrate --force' },
  },
  {
    id: 'shell', label: 'Run a Shell Command', module: 'ansible.builtin.shell',
    description: 'Runs a command through the shell, supporting pipes and redirects.',
    defaultParams: { cmd: 'curl -s http://localhost/health | grep ok' },
  },
  {
    id: 'docker_container', label: 'Run a Docker Container', module: 'community.docker.docker_container',
    description: 'Manages the lifecycle of a Docker container.',
    defaultParams: { name: 'web', image: 'nginx:latest', state: 'started' },
  },
  {
    id: 'pip', label: 'Install a Python Package', module: 'ansible.builtin.pip',
    description: 'Installs a Python package via pip.',
    defaultParams: { name: 'django', version: '5.0' },
  },
  {
    id: 'unarchive', label: 'Extract an Archive', module: 'ansible.builtin.unarchive',
    description: 'Extracts a compressed archive on the target host.',
    defaultParams: { src: 'app-release.tar.gz', dest: '/opt/app' },
  },
  {
    id: 'uri', label: 'Make an HTTP Request', module: 'ansible.builtin.uri',
    description: 'Makes an HTTP request -- useful for health checks or webhooks.',
    defaultParams: { url: 'https://api.example.com/health', method: 'GET' },
  },
  {
    id: 'firewalld', label: 'Manage a Firewall Rule', module: 'ansible.posix.firewalld',
    description: 'Manages firewall rules via firewalld.',
    defaultParams: { port: '443/tcp', state: 'enabled', permanent: 'true' },
  },
  {
    id: 'wait_for', label: 'Wait for a Port', module: 'ansible.builtin.wait_for',
    description: 'Waits for a port to open (or a condition) before continuing.',
    defaultParams: { port: 8080, timeout: 30 },
  },
  {
    id: 'debug', label: 'Print Debug Output', module: 'ansible.builtin.debug',
    description: 'Prints a message -- useful for surfacing values while testing a playbook.',
    defaultParams: { msg: 'Deployment complete' },
  },
];

export function getModuleDef(moduleId: string): AnsibleModuleDef | undefined {
  return ANSIBLE_MODULE_CATALOG.find((m) => m.id === moduleId);
}

export interface AnsibleHost {
  id: string;
  hostname: string;
  group: string;
}

export interface AnsibleTask {
  id: string;
  moduleId: string;
  name: string;
  params: Record<string, string | number>;
}

export type TaskStatus = 'ok' | 'changed' | 'failed';

export interface TaskResult {
  hostId: string;
  hostname: string;
  taskId: string;
  taskName: string;
  status: TaskStatus;
}

export interface WorkspaceEvent {
  id: string;
  kind: 'run' | 'drift';
  message: string;
  timestamp: number;
}

// hostId -> taskId -> last-converged params for that task on that host
type HostState = Record<string, Record<string, Record<string, string | number>>>;

function paramsEqual(a: Record<string, string | number>, b: Record<string, string | number>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

function computeResults(inventory: AnsibleHost[], playbook: AnsibleTask[], hostState: HostState): TaskResult[] {
  const results: TaskResult[] = [];
  inventory.forEach((host) => {
    playbook.forEach((task) => {
      const applied = hostState[host.id]?.[task.id];
      const status: TaskStatus = !applied || !paramsEqual(applied, task.params) ? 'changed' : 'ok';
      results.push({ hostId: host.id, hostname: host.hostname, taskId: task.id, taskName: task.name, status });
    });
  });
  return results;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AnsibleState {
  inventory: AnsibleHost[];
  playbook: AnsibleTask[];
  hostState: HostState;
  history: WorkspaceEvent[];
  runCount: number;
  isRunning: boolean;
  runLog: string[];
  lastResults: TaskResult[] | null;

  addHost: (hostname: string, group: string) => void;
  removeHost: (id: string) => void;
  addTask: (moduleId: string, name: string) => void;
  updateTaskParam: (id: string, key: string, value: string | number) => void;
  removeTask: (id: string) => void;
  dryRun: () => void;
  runPlaybook: () => Promise<void>;
  simulateDrift: (hostId: string, taskId: string) => void;
  hydrate: (data: {
    inventory?: AnsibleHost[];
    playbook?: AnsibleTask[];
    hostState?: HostState;
    history?: WorkspaceEvent[];
    runCount?: number;
  }) => void;
}

function syncToBackend(get: () => AnsibleState) {
  const { inventory, playbook, hostState, history, runCount } = get();
  apiClient
    .updateAnsibleWorkspace({
      taskCount: playbook.length,
      runCount,
      inventory,
      playbook,
      hostState,
      history,
    })
    .catch((err) => console.error('Failed to sync ansible workspace:', err));
}

export const useAnsibleStore = create<AnsibleState>()((set, get) => ({
  inventory: [],
  playbook: [],
  hostState: {},
  history: [],
  runCount: 0,
  isRunning: false,
  runLog: [],
  lastResults: null,

  addHost: (hostname, group) => {
    const host: AnsibleHost = {
      id: crypto.randomUUID(),
      hostname: hostname.trim() || `host-${get().inventory.length + 1}`,
      group: group.trim() || 'ungrouped',
    };
    set((s) => ({ inventory: [...s.inventory, host], lastResults: null }));
    toast.info(`Added "${host.hostname}" to inventory`);
    syncToBackend(get);
  },

  removeHost: (id) => {
    set((s) => ({ inventory: s.inventory.filter((h) => h.id !== id), lastResults: null }));
    syncToBackend(get);
  },

  addTask: (moduleId, name) => {
    const def = getModuleDef(moduleId);
    if (!def) return;
    const task: AnsibleTask = {
      id: crypto.randomUUID(),
      moduleId,
      name: name.trim() || def.label,
      params: { ...def.defaultParams },
    };
    set((s) => ({ playbook: [...s.playbook, task], lastResults: null }));
    toast.info(`Added task "${task.name}" — run --check to preview it`);
    syncToBackend(get);
  },

  updateTaskParam: (id, key, value) => {
    set((s) => ({
      playbook: s.playbook.map((t) => (t.id === id ? { ...t, params: { ...t.params, [key]: value } } : t)),
      lastResults: null,
    }));
    syncToBackend(get);
  },

  removeTask: (id) => {
    // Ansible does not purge -- removing a task just means it won't run
    // again. Whatever it last configured on hosts is left exactly as-is.
    set((s) => ({ playbook: s.playbook.filter((t) => t.id !== id), lastResults: null }));
    toast.info('Removed from playbook — this will not undo what it already configured on hosts');
    syncToBackend(get);
  },

  dryRun: () => {
    const { inventory, playbook, hostState } = get();
    if (inventory.length === 0) {
      toast.error('Add at least one host to the inventory first');
      return;
    }
    if (playbook.length === 0) {
      toast.error('Add at least one task to the playbook first');
      return;
    }
    const results = computeResults(inventory, playbook, hostState);
    set({ lastResults: results });
    const changed = results.filter((r) => r.status === 'changed').length;
    const ok = results.filter((r) => r.status === 'ok').length;
    if (changed === 0) {
      toast.success(`--check: no changes. All ${ok} task runs are already ok.`);
    } else {
      toast.info(`--check: ${changed} would change, ${ok} already ok`);
    }
  },

  runPlaybook: async () => {
    const { inventory, playbook, hostState, history, runCount } = get();
    if (inventory.length === 0 || playbook.length === 0) {
      toast.error('Add hosts and tasks before running the playbook');
      return;
    }

    set({ isRunning: true, runLog: [] });

    const groups = Array.from(new Set(inventory.map((h) => h.group)));
    set((s) => ({ runLog: [...s.runLog, `PLAY [${groups.join(', ')}] ${'*'.repeat(40)}`] }));
    await sleep(300);

    set((s) => ({ runLog: [...s.runLog, '', `TASK [Gathering Facts] ${'*'.repeat(30)}`] }));
    for (const host of inventory) {
      await sleep(150);
      set((s) => ({ runLog: [...s.runLog, `ok: [${host.hostname}]`] }));
    }

    const newHostState: HostState = JSON.parse(JSON.stringify(hostState));
    const allResults: TaskResult[] = [];

    for (const task of playbook) {
      set((s) => ({ runLog: [...s.runLog, '', `TASK [${task.name}] ${'*'.repeat(Math.max(1, 30 - task.name.length))}`] }));
      for (const host of inventory) {
        await sleep(200 + Math.random() * 150);
        const applied = newHostState[host.id]?.[task.id];
        const status: TaskStatus = !applied || !paramsEqual(applied, task.params) ? 'changed' : 'ok';
        if (!newHostState[host.id]) newHostState[host.id] = {};
        newHostState[host.id][task.id] = { ...task.params };
        allResults.push({ hostId: host.id, hostname: host.hostname, taskId: task.id, taskName: task.name, status });
        set((s) => ({ runLog: [...s.runLog, `${status}: [${host.hostname}]`] }));
      }
    }

    await sleep(200);
    set((s) => ({ runLog: [...s.runLog, '', `PLAY RECAP ${'*'.repeat(40)}`] }));
    for (const host of inventory) {
      const hostResults = allResults.filter((r) => r.hostId === host.id);
      const okCount = hostResults.filter((r) => r.status === 'ok').length + 1; // +1 for Gathering Facts
      const changedCount = hostResults.filter((r) => r.status === 'changed').length;
      const failedCount = hostResults.filter((r) => r.status === 'failed').length;
      set((s) => ({
        runLog: [
          ...s.runLog,
          `${host.hostname.padEnd(20)} : ok=${okCount}  changed=${changedCount}  unreachable=0  failed=${failedCount}  skipped=0`,
        ],
      }));
    }

    const totalChanged = allResults.filter((r) => r.status === 'changed').length;
    const totalOk = allResults.filter((r) => r.status === 'ok').length;
    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'run',
      message: totalChanged === 0
        ? `Playbook run: idempotent -- 0 changes, ${totalOk} already ok`
        : `Playbook run: ${totalChanged} changed, ${totalOk} ok`,
      timestamp: Date.now(),
    };

    set({
      hostState: newHostState,
      lastResults: allResults,
      isRunning: false,
      history: [event, ...history].slice(0, 20),
      runCount: runCount + 1,
    });
    toast.success(event.message);
    syncToBackend(get);
  },

  simulateDrift: (hostId, taskId) => {
    const { hostState, history, inventory, playbook } = get();
    const applied = hostState[hostId]?.[taskId];
    const host = inventory.find((h) => h.id === hostId);
    const task = playbook.find((t) => t.id === taskId);
    if (!applied || !host || !task) return;

    const keys = Object.keys(applied);
    if (keys.length === 0) return;
    const key = keys[0];
    const driftedValue = typeof applied[key] === 'number'
      ? Number(applied[key]) + 1
      : `${applied[key]}-manually-edited`;

    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'drift',
      message: `Detected drift on "${host.hostname}": "${task.name}" was changed outside Ansible`,
      timestamp: Date.now(),
    };

    set({
      hostState: {
        ...hostState,
        [hostId]: { ...hostState[hostId], [taskId]: { ...applied, [key]: driftedValue } },
      },
      history: [event, ...history].slice(0, 20),
      lastResults: null,
    });
    toast.error(`Drift on "${host.hostname}" — run --check to see what Ansible would fix`);
    syncToBackend(get);
  },

  hydrate: (data) => {
    set({
      inventory: data.inventory ?? [],
      playbook: data.playbook ?? [],
      hostState: data.hostState ?? {},
      history: data.history ?? [],
      runCount: data.runCount ?? 0,
      lastResults: null,
      runLog: [],
    });
  },
}));
