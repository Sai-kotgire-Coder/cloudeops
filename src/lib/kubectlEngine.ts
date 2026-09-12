import { useGameStore, type Instance, type Pod } from '@/store/gameStore';

export type CommandResultType = 'success' | 'error' | 'info';

export interface CommandResult {
  type: CommandResultType;
  output: string;
  learningTip?: string;
  timestamp: number;
}

export interface ParsedCommand {
  operation: string;
  flags: Record<string, string | boolean>;
  rawArgs: string[];
}

export interface CommandDefinition {
  name: string;
  operation: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (parsed: ParsedCommand) => CommandResult;
}

// ============================================================================
// PARSER (kubectl-specific: `kubectl <verb> [resource] [name] [flags]`)
// ============================================================================

export function parseKubectlCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const operation = parts[1] || '';
  const rawArgs = parts.slice(2);
  const flags = parseFlags(rawArgs);
  return { operation, flags, rawArgs };
}

function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const flagName = arg.slice(2);
      if (!flagName) continue;
      if (flagName.includes('=')) {
        const [key, value] = flagName.split('=');
        flags[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[flagName] = args[i + 1];
        i++;
      } else {
        flags[flagName] = true;
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      const flagName = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[flagName] = args[i + 1];
        i++;
      } else {
        flags[flagName] = true;
      }
    }
  }
  return flags;
}

// A resource arg after the verb is either "deployment" or "deployment/name" --
// real kubectl accepts both. This resolves the actual name either way.
function resolveResourceName(rawArgs: string[], nameIndex: number): string | undefined {
  const resourceArg = rawArgs[nameIndex - 1];
  if (resourceArg?.includes('/')) return resourceArg.split('/')[1];
  return rawArgs[nameIndex];
}

function toK8sName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ============================================================================
// TABLE FORMATTERS
// ============================================================================

function padCols(cols: string[], widths: number[]): string {
  return cols.map((c, i) => c.padEnd(widths[i])).join(' ').trimEnd();
}

function formatPodsTable(instances: Instance[], wide: boolean): string {
  const { applications, pendingPods } = useGameStore.getState();
  const scheduled = instances.flatMap((inst) => inst.pods.map((p) => ({ pod: p, node: inst })));

  const widths = wide ? [30, 7, 15, 10, 6, 15, 20] : [30, 7, 15, 10, 6];
  if (scheduled.length === 0 && pendingPods.length === 0) return 'No resources found in default namespace.';

  const header = wide
    ? padCols(['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE', 'IP', 'NODE'], widths)
    : padCols(['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'], widths);

  const scheduledRows = scheduled.map(({ pod, node }) => {
    const statusMap: Record<Pod['status'], string> = { running: 'Running', crashed: 'CrashLoopBackOff', terminating: 'Terminating' };
    const ready = pod.status === 'running' ? '1/1' : '0/1';
    const cols = wide
      ? [pod.id, ready, statusMap[pod.status], '0', '2d', `10.244.${Math.floor(Math.random() * 8)}.${Math.floor(Math.random() * 254)}`, toK8sName(node.name)]
      : [pod.id, ready, statusMap[pod.status], '0', '2d'];
    return padCols(cols, widths);
  });

  // Pods stuck waiting for capacity -- a real cluster still lists these via
  // `get pods`, just with no node assigned yet.
  const pendingRows = pendingPods.map((p, i) => {
    const app = applications.find((a) => a.id === p.appId);
    const name = `${toK8sName(app?.name ?? p.appId)}-${p.version}-pending-${i}`;
    const cols = wide
      ? [name, '0/1', 'Pending', '0', '1m', '<none>', '<none>']
      : [name, '0/1', 'Pending', '0', '1m'];
    return padCols(cols, widths);
  });

  return [header, ...scheduledRows, ...pendingRows].join('\n');
}

function formatNodesTable(instances: Instance[]): string {
  if (instances.length === 0) return 'No resources found';
  const header = padCols(['NAME', 'STATUS', 'ROLES', 'AGE', 'VERSION'], [25, 9, 9, 6, 10]);
  const rows = instances.map((i) =>
    padCols([toK8sName(i.name), i.status === 'crashed' ? 'NotReady' : 'Ready', '<none>', '2d', 'v1.29.2'], [25, 9, 9, 6, 10])
  );
  return [header, ...rows].join('\n');
}

function formatDeploymentsTable(): string {
  const { applications } = useGameStore.getState();
  if (applications.length === 0) return 'No resources found in default namespace.';
  const header = padCols(['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'AGE'], [25, 8, 12, 11, 6]);
  const rows = applications.map((a) => {
    const active = a.deployments.find((d) => d.version === a.activeVersion) ?? a.deployments[0];
    const replicas = active?.replicas ?? 0;
    return padCols([toK8sName(a.name), `${replicas}/${replicas}`, String(replicas), String(replicas), '2d'], [25, 8, 12, 11, 6]);
  });
  return [header, ...rows].join('\n');
}

function formatServicesTable(): string {
  const { applications } = useGameStore.getState();
  if (applications.length === 0) return 'No resources found in default namespace.';
  const header = padCols(['NAME', 'TYPE', 'CLUSTER-IP', 'EXTERNAL-IP', 'PORT(S)', 'AGE'], [25, 12, 15, 13, 12, 6]);
  const rows = applications.map((a, i) =>
    padCols([`${toK8sName(a.name)}-svc`, 'ClusterIP', `10.96.${i}.${10 + i}`, '<none>', `${a.port ?? 80}/TCP`, '2d'], [25, 12, 15, 13, 12, 6])
  );
  return [header, ...rows].join('\n');
}

function formatNamespacesTable(): string {
  const header = padCols(['NAME', 'STATUS', 'AGE'], [20, 9, 6]);
  const rows = ['default', 'kube-system', 'kube-public', 'kube-node-lease'].map((ns) =>
    padCols([ns, 'Active', '30d'], [20, 9, 6])
  );
  return [header, ...rows].join('\n');
}

// ============================================================================
// COMMANDS
// ============================================================================

export const kubectlCommands: CommandDefinition[] = [
  {
    name: 'get pods', operation: 'get',
    description: 'Lists pods in the cluster', usage: 'kubectl get pods [-o wide]',
    examples: ['kubectl get pods', 'kubectl get pods -o wide'],
    handler: (parsed) => {
      const { instances } = useGameStore.getState();
      const wide = parsed.flags['o'] === 'wide' || parsed.flags['output'] === 'wide';
      return {
        type: 'success',
        output: formatPodsTable(instances, wide),
        learningTip: '☸️ A Pod is the smallest deployable unit in Kubernetes -- usually one container, sometimes a few tightly-coupled ones sharing network and storage.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get nodes', operation: 'get',
    description: 'Lists nodes in the cluster', usage: 'kubectl get nodes',
    examples: ['kubectl get nodes'],
    handler: () => {
      const { instances } = useGameStore.getState();
      return {
        type: 'success',
        output: formatNodesTable(instances),
        learningTip: '🖥️ Nodes are the worker machines -- VMs or physical servers -- that actually run your pods. The control plane schedules pods onto nodes with available capacity.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get deployments', operation: 'get',
    description: 'Lists deployments', usage: 'kubectl get deployments',
    examples: ['kubectl get deployments'],
    handler: () => ({
      type: 'success',
      output: formatDeploymentsTable(),
      learningTip: '📦 A Deployment declares how many replicas of a pod template should exist and manages rolling out changes to them.',
      timestamp: Date.now(),
    }),
  },
  {
    name: 'get services', operation: 'get',
    description: 'Lists services', usage: 'kubectl get services',
    examples: ['kubectl get services', 'kubectl get svc'],
    handler: () => ({
      type: 'success',
      output: formatServicesTable(),
      learningTip: '🔌 A Service gives a stable network identity to a set of pods, since individual pod IPs change every time a pod is recreated.',
      timestamp: Date.now(),
    }),
  },
  {
    name: 'get namespaces', operation: 'get',
    description: 'Lists namespaces', usage: 'kubectl get namespaces',
    examples: ['kubectl get namespaces', 'kubectl get ns'],
    handler: () => ({
      type: 'success',
      output: formatNamespacesTable(),
      learningTip: '🗂️ Namespaces partition one cluster into isolated virtual clusters -- commonly one per team or environment (dev/staging/prod).',
      timestamp: Date.now(),
    }),
  },
  {
    name: 'describe pod', operation: 'describe',
    description: 'Shows detailed information about a pod', usage: 'kubectl describe pod <name>',
    examples: ['kubectl describe pod pod-abc123'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 1);
      const { instances } = useGameStore.getState();
      const found = instances.flatMap((i) => i.pods.map((p) => ({ pod: p, node: i }))).find((x) => x.pod.id === name);
      if (!name || !found) {
        return { type: 'error', output: `Error from server (NotFound): pods "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      const { pod, node } = found;
      const output = `Name:         ${pod.id}
Namespace:    default
Node:         ${toK8sName(node.name)}
Status:       ${pod.status === 'running' ? 'Running' : pod.status === 'crashed' ? 'CrashLoopBackOff' : 'Terminating'}
IP:           10.244.0.${Math.floor(Math.random() * 254)}
Containers:
  app:
    Image:       ${useGameStore.getState().applications.find((a) => a.id === pod.appId)?.image ?? 'app:latest'}
    State:       ${pod.status === 'running' ? 'Running' : 'Waiting'}
    CPU:         ${pod.cpu.toFixed(1)}%
    Memory:      ${pod.memory.toFixed(1)}%
    Restart Count: 0
Events:
  Type     Reason     Age   From               Message
  ----     ------     ----  ----               -------
  Normal   Scheduled  2d    default-scheduler  Successfully assigned default/${pod.id} to ${toK8sName(node.name)}
  Normal   Pulled     2d    kubelet            Container image pulled successfully
  Normal   Started    2d    kubelet            Started container app`;
      return { type: 'success', output, timestamp: Date.now() };
    },
  },
  {
    name: 'describe deployment', operation: 'describe',
    description: 'Shows detailed information about a deployment', usage: 'kubectl describe deployment <name>',
    examples: ['kubectl describe deployment web'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 1);
      const { applications } = useGameStore.getState();
      const app = applications.find((a) => toK8sName(a.name) === name);
      if (!name || !app) {
        return { type: 'error', output: `Error from server (NotFound): deployments.apps "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      const active = app.deployments.find((d) => d.version === app.activeVersion) ?? app.deployments[0];
      const output = `Name:                   ${toK8sName(app.name)}
Namespace:              default
Strategy Type:          ${app.strategy ?? 'RollingUpdate'}
Replicas:               ${active?.replicas ?? 0} desired | ${active?.replicas ?? 0} updated | ${active?.replicas ?? 0} available
Image:                  ${app.image ?? 'app:latest'}
Deployment versions:    ${app.deployments.map((d) => `${d.version} (${d.replicas} replicas)`).join(', ')}
Active version:         ${app.activeVersion}`;
      return { type: 'success', output, timestamp: Date.now() };
    },
  },
  {
    name: 'describe node', operation: 'describe',
    description: 'Shows detailed information about a node', usage: 'kubectl describe node <name>',
    examples: ['kubectl describe node ip-10-0-1-23'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 1);
      const { instances } = useGameStore.getState();
      const inst = instances.find((i) => toK8sName(i.name) === name);
      if (!name || !inst) {
        return { type: 'error', output: `Error from server (NotFound): nodes "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      const output = `Name:               ${toK8sName(inst.name)}
Roles:              <none>
Instance Type:      ${inst.typeId}
Conditions:
  Type             Status
  Ready            ${inst.status === 'crashed' ? 'False' : 'True'}
  MemoryPressure   ${inst.memory > 90 ? 'True' : 'False'}
Capacity:
  cpu:     100%
  memory:  100%
Allocated resources:
  cpu:     ${inst.cpu.toFixed(1)}%
  memory:  ${inst.memory.toFixed(1)}%
Non-terminated Pods: ${inst.pods.length}`;
      return { type: 'success', output, timestamp: Date.now() };
    },
  },
  {
    name: 'delete pod', operation: 'delete',
    description: 'Deletes a pod', usage: 'kubectl delete pod <name>',
    examples: ['kubectl delete pod pod-abc123'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 1);
      const { instances } = useGameStore.getState();
      const exists = instances.some((i) => i.pods.some((p) => p.id === name));
      if (!name || !exists) {
        return { type: 'error', output: `Error from server (NotFound): pods "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      useGameStore.getState().deletePod(name);
      return {
        type: 'success',
        output: `pod "${name}" deleted`,
        learningTip: '🗑️ Deleting a pod that belongs to a Deployment doesn\'t reduce your replica count -- the Deployment controller notices and schedules a replacement immediately.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'scale deployment', operation: 'scale',
    description: 'Sets a new size for a deployment', usage: 'kubectl scale deployment <name> --replicas=<num>',
    examples: ['kubectl scale deployment web --replicas=5'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 1);
      const replicas = parseInt((parsed.flags['replicas'] as string) || '', 10);
      if (!name || isNaN(replicas)) {
        return { type: 'error', output: 'error: Usage: kubectl scale deployment <name> --replicas=<num>', timestamp: Date.now() };
      }
      const { applications } = useGameStore.getState();
      const app = applications.find((a) => toK8sName(a.name) === name);
      if (!app) {
        return { type: 'error', output: `Error from server (NotFound): deployments.apps "${name}" not found`, timestamp: Date.now() };
      }
      useGameStore.getState().scaleDeployment(app.id, app.activeVersion, replicas);
      return {
        type: 'success',
        output: `deployment.apps/${name} scaled`,
        learningTip: '⚖️ Manual scaling like this is a one-time change. In production, a Horizontal Pod Autoscaler usually does this automatically based on live metrics.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'rollout status', operation: 'rollout',
    description: 'Shows the rollout status of a deployment', usage: 'kubectl rollout status deployment <name>',
    examples: ['kubectl rollout status deployment web'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 2);
      const { applications } = useGameStore.getState();
      const app = applications.find((a) => toK8sName(a.name) === name);
      if (!name || !app) {
        return { type: 'error', output: `Error from server (NotFound): deployments.apps "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      return { type: 'success', output: `deployment "${name}" successfully rolled out`, timestamp: Date.now() };
    },
  },
  {
    name: 'rollout restart', operation: 'rollout',
    description: 'Restarts all pods in a deployment', usage: 'kubectl rollout restart deployment <name>',
    examples: ['kubectl rollout restart deployment web'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 2);
      const { applications } = useGameStore.getState();
      const app = applications.find((a) => toK8sName(a.name) === name);
      if (!name || !app) {
        return { type: 'error', output: `Error from server (NotFound): deployments.apps "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      return {
        type: 'success',
        output: `deployment.apps/${name} restarted`,
        learningTip: '🔄 A rolling restart recreates every pod one at a time, with zero downtime -- useful for picking up a new ConfigMap or Secret without changing the image.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'rollout undo', operation: 'rollout',
    description: 'Rolls back to the previous deployment revision', usage: 'kubectl rollout undo deployment <name>',
    examples: ['kubectl rollout undo deployment web'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 2);
      const { applications } = useGameStore.getState();
      const app = applications.find((a) => toK8sName(a.name) === name);
      if (!name || !app) {
        return { type: 'error', output: `Error from server (NotFound): deployments.apps "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      const previous = app.deployments.find((d) => d.version !== app.activeVersion);
      if (!previous) {
        return { type: 'error', output: `error: no rollout history found for deployment "${name}"`, timestamp: Date.now() };
      }
      useGameStore.getState().setActiveVersion(app.id, previous.version);
      return {
        type: 'success',
        output: `deployment.apps/${name} rolled back`,
        learningTip: '⏪ Kubernetes keeps a revision history for every Deployment specifically so a bad rollout can be undone in seconds.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'logs', operation: 'logs',
    description: 'Prints the logs of a pod', usage: 'kubectl logs <pod-name>',
    examples: ['kubectl logs pod-abc123'],
    handler: (parsed) => {
      const name = parsed.rawArgs[0];
      const { instances } = useGameStore.getState();
      const pod = instances.flatMap((i) => i.pods).find((p) => p.id === name);
      if (!name || !pod) {
        return { type: 'error', output: `Error from server (NotFound): pods "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      const output = pod.status === 'crashed'
        ? `2026-09-11T10:14:02Z ERROR panic: connection refused to database\n2026-09-11T10:14:02Z ERROR goroutine 1 [running]:\n2026-09-11T10:14:02Z ERROR main.main()\nContainer restarting...`
        : `2026-09-11T10:12:41Z INFO  Server listening on :${8080}\n2026-09-11T10:12:55Z INFO  GET /health 200 3ms\n2026-09-11T10:13:10Z INFO  GET /api/users 200 41ms\n2026-09-11T10:13:22Z INFO  GET /health 200 2ms`;
      return { type: 'info', output, timestamp: Date.now() };
    },
  },
  {
    name: 'exec', operation: 'exec',
    description: 'Executes a command inside a pod', usage: 'kubectl exec <pod-name> -- <command>',
    examples: ['kubectl exec pod-abc123 -- whoami'],
    handler: (parsed) => {
      const name = parsed.rawArgs[0];
      const { instances } = useGameStore.getState();
      const pod = instances.flatMap((i) => i.pods).find((p) => p.id === name);
      if (!name || !pod) {
        return { type: 'error', output: `Error from server (NotFound): pods "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      if (pod.status !== 'running') {
        return { type: 'error', output: `error: unable to upgrade connection: container not running (${pod.id})`, timestamp: Date.now() };
      }
      const dashIndex = parsed.rawArgs.indexOf('--');
      const command = dashIndex >= 0 ? parsed.rawArgs.slice(dashIndex + 1).join(' ') : parsed.rawArgs.slice(1).join(' ');
      const canned: Record<string, string> = {
        whoami: 'app',
        pwd: '/app',
        ls: 'index.js  node_modules  package.json',
        env: 'NODE_ENV=production\nPORT=8080',
      };
      return { type: 'info', output: canned[command] ?? `(simulated) ran: ${command || 'sh'}`, timestamp: Date.now() };
    },
  },
  {
    name: 'apply', operation: 'apply',
    description: 'Applies a configuration file to the cluster', usage: 'kubectl apply -f <file>',
    examples: ['kubectl apply -f deployment.yaml'],
    handler: (parsed) => {
      const file = (parsed.flags['f'] as string) || (parsed.flags['filename'] as string);
      if (!file) {
        return { type: 'error', output: 'error: must specify -f <filename>', timestamp: Date.now() };
      }
      return {
        type: 'success',
        output: `deployment.apps/from-${file.replace(/\.(ya?ml)$/i, '')} created`,
        learningTip: '📄 `apply` is declarative -- you describe the desired end state in YAML, and Kubernetes figures out what to create, update, or leave alone to get there. This is the same mental model as Terraform plan/apply.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'create deployment', operation: 'create',
    description: 'Creates a new deployment imperatively', usage: 'kubectl create deployment <name> --image=<image>',
    examples: ['kubectl create deployment web --image=nginx:latest'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 1);
      const image = parsed.flags['image'] as string;
      if (!name || !image) {
        return { type: 'error', output: 'error: Usage: kubectl create deployment <name> --image=<image>', timestamp: Date.now() };
      }
      // Fire-and-forget, same pattern as the AWS CLI's run-instances handler --
      // real kubectl create also returns immediately while scheduling happens
      // asynchronously behind the scenes.
      useGameStore.getState().createApplication(name, { image });
      return {
        type: 'success',
        output: `deployment.apps/${name} created`,
        learningTip: '⚡ `create` is imperative -- you tell Kubernetes exactly what to do right now. It\'s fast for one-off exploration, but `apply -f` is what real teams check into version control.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'expose deployment', operation: 'expose',
    description: 'Creates a Service for a deployment', usage: 'kubectl expose deployment <name> --port=<port>',
    examples: ['kubectl expose deployment web --port=80'],
    handler: (parsed) => {
      const name = resolveResourceName(parsed.rawArgs, 1);
      const port = (parsed.flags['port'] as string) || '80';
      const { applications } = useGameStore.getState();
      const app = applications.find((a) => toK8sName(a.name) === name);
      if (!name || !app) {
        return { type: 'error', output: `Error from server (NotFound): deployments.apps "${name ?? ''}" not found`, timestamp: Date.now() };
      }
      return { type: 'success', output: `service/${name} exposed`, timestamp: Date.now() };
    },
  },
  {
    name: 'top pods', operation: 'top',
    description: 'Shows CPU/memory usage for pods', usage: 'kubectl top pods',
    examples: ['kubectl top pods'],
    handler: () => {
      const { instances } = useGameStore.getState();
      const allPods = instances.flatMap((i) => i.pods);
      if (allPods.length === 0) return { type: 'info', output: 'No resources found in default namespace.', timestamp: Date.now() };
      const header = padCols(['NAME', 'CPU(cores)', 'MEMORY(bytes)'], [30, 12, 14]);
      const rows = allPods.map((p) => padCols([p.id, `${Math.round(p.cpu * 2)}m`, `${Math.round(p.memory * 5)}Mi`], [30, 12, 14]));
      return { type: 'success', output: [header, ...rows].join('\n'), timestamp: Date.now() };
    },
  },
  {
    name: 'cluster-info', operation: 'cluster-info',
    description: 'Shows cluster endpoint information', usage: 'kubectl cluster-info',
    examples: ['kubectl cluster-info'],
    handler: () => {
      const { instances } = useGameStore.getState();
      return {
        type: 'info',
        output: `Kubernetes control plane is running at https://cloudops-sim-cluster:6443\nCoreDNS is running at https://cloudops-sim-cluster:6443/api/v1/namespaces/kube-system/services/kube-dns\n\n${instances.length} node(s) registered`,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'config current-context', operation: 'config',
    description: 'Shows the current kubeconfig context', usage: 'kubectl config current-context',
    examples: ['kubectl config current-context'],
    handler: () => ({ type: 'info', output: 'cloudops-sim-cluster', timestamp: Date.now() }),
  },
];

// ============================================================================
// HELP
// ============================================================================

export function getKubectlHelp(operationName?: string): string {
  if (!operationName) {
    const lines = kubectlCommands.map((c) => `  ${c.usage.padEnd(48)} ${c.description}`);
    return `kubectl -- Kubernetes command-line tool\n\nCommands:\n${lines.join('\n')}\n\nType 'kubectl <command> help' is not supported here -- see the list above for exact usage.`;
  }
  const cmd = kubectlCommands.find((c) => c.name === operationName || c.operation === operationName);
  if (!cmd) return `Unknown command: ${operationName}`;
  return `${cmd.description}\n\nUsage:\n  ${cmd.usage}\n\nExamples:\n${cmd.examples.map((e) => `  ${e}`).join('\n')}`;
}

export function getKubectlAutocompleteSuggestions(input: string): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || trimmed === 'kubectl') {
    return Array.from(new Set(kubectlCommands.map((c) => `kubectl ${c.name.split(' ')[0]}`)));
  }
  const parts = trimmed.split(/\s+/);
  if (parts[0] !== 'kubectl') return [];
  if (parts.length <= 2) {
    return kubectlCommands
      .filter((c) => c.name.startsWith(parts[1] || ''))
      .map((c) => `kubectl ${c.name}`);
  }
  return [];
}

// ============================================================================
// EXECUTOR
// ============================================================================

// Operations that count as "real" progress toward the kubectl Lab's
// completion threshold (see GET /api/progress/summary) -- read-only verbs
// like get/describe/logs/top/cluster-info don't count.
const MUTATING_OPERATIONS = new Set(['delete', 'scale', 'rollout', 'apply', 'create', 'expose']);

export function executeKubectlCommand(input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { type: 'info', output: '', timestamp: Date.now() };

  if (trimmed.toLowerCase() === 'clear') return { type: 'info', output: '__CLEAR__', timestamp: Date.now() };
  if (trimmed.toLowerCase() === 'help' || trimmed.toLowerCase() === 'kubectl help') {
    return { type: 'info', output: getKubectlHelp(), timestamp: Date.now() };
  }

  const parsed = parseKubectlCommand(trimmed);
  if (parsed.flags['help'] || parsed.flags['h']) {
    return { type: 'info', output: getKubectlHelp(`${parsed.operation} ${parsed.rawArgs[0] ?? ''}`.trim()), timestamp: Date.now() };
  }
  const nameCandidate = `${parsed.operation} ${parsed.rawArgs[0] ?? ''}`.trim();

  const command =
    kubectlCommands.find((c) => c.name === nameCandidate) ??
    kubectlCommands.find((c) => c.operation === parsed.operation && !c.name.includes(' '));

  if (!command) {
    return {
      type: 'error',
      output: `error: unknown command "${trimmed}"\nType 'help' to see available kubectl commands.`,
      timestamp: Date.now(),
    };
  }

  try {
    const result = command.handler(parsed);
    if (result.type === 'success' && MUTATING_OPERATIONS.has(command.operation)) {
      useGameStore.getState().incrementKubectlCommandCount();
    }
    return result;
  } catch (error) {
    return {
      type: 'error',
      output: `error: ${error instanceof Error ? error.message : 'unknown error'}`,
      timestamp: Date.now(),
    };
  }
}
