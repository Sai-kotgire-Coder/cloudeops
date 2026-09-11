import { create } from 'zustand';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';

export type Provider = 'aws' | 'gcp' | 'azure';
export type ResourceCategory = 'cloud_infra' | 'github_ci';

export interface ResourceTypeDef {
  id: string;
  label: string;
  description: string;
  category: ResourceCategory;
  providerTypes?: Partial<Record<Provider, string>>;
  terraformType?: string;
  defaultAttrs: Record<string, string | number>;
}

export const PROVIDER_LABELS: Record<Provider, string> = {
  aws: 'AWS',
  gcp: 'Google Cloud',
  azure: 'Azure',
};

// ~20 provider-agnostic infrastructure categories, each mapped to the real
// Terraform resource type for AWS/GCP/Azure -- the concept stays the same
// across clouds, only the resource name and its provider prefix change.
export const RESOURCE_CATALOG: ResourceTypeDef[] = [
  {
    id: 'compute_instance', label: 'Compute Instance', category: 'cloud_infra',
    description: 'A single virtual server that runs your application code.',
    providerTypes: { aws: 'aws_instance', gcp: 'google_compute_instance', azure: 'azurerm_linux_virtual_machine' },
    defaultAttrs: { instance_size: 't3.micro', image: 'ami-0abcdef1234567890' },
  },
  {
    id: 'auto_scaling_group', label: 'Auto Scaling Group', category: 'cloud_infra',
    description: 'Automatically adds or removes compute instances based on demand.',
    providerTypes: { aws: 'aws_autoscaling_group', gcp: 'google_compute_region_autoscaler', azure: 'azurerm_linux_virtual_machine_scale_set' },
    defaultAttrs: { min_size: 1, max_size: 5 },
  },
  {
    id: 'load_balancer', label: 'Load Balancer', category: 'cloud_infra',
    description: 'Distributes incoming traffic across multiple healthy instances.',
    providerTypes: { aws: 'aws_lb', gcp: 'google_compute_forwarding_rule', azure: 'azurerm_lb' },
    defaultAttrs: { type: 'application', internal: 'false' },
  },
  {
    id: 'virtual_network', label: 'Virtual Network (VPC)', category: 'cloud_infra',
    description: 'An isolated private network for your cloud resources.',
    providerTypes: { aws: 'aws_vpc', gcp: 'google_compute_network', azure: 'azurerm_virtual_network' },
    defaultAttrs: { cidr_block: '10.0.0.0/16' },
  },
  {
    id: 'subnet', label: 'Subnet', category: 'cloud_infra',
    description: 'A segment of a virtual network, often tied to one availability zone.',
    providerTypes: { aws: 'aws_subnet', gcp: 'google_compute_subnetwork', azure: 'azurerm_subnet' },
    defaultAttrs: { cidr_block: '10.0.1.0/24', availability_zone: 'us-east-1a' },
  },
  {
    id: 'security_group', label: 'Security Group / Firewall Rule', category: 'cloud_infra',
    description: 'A firewall controlling what traffic can reach a resource.',
    providerTypes: { aws: 'aws_security_group', gcp: 'google_compute_firewall', azure: 'azurerm_network_security_group' },
    defaultAttrs: { ingress_port: 443, protocol: 'tcp' },
  },
  {
    id: 'nat_gateway', label: 'NAT Gateway', category: 'cloud_infra',
    description: 'Lets private resources reach the internet without being reachable from it.',
    providerTypes: { aws: 'aws_nat_gateway', gcp: 'google_compute_router_nat', azure: 'azurerm_nat_gateway' },
    defaultAttrs: { subnet_ref: 'public-subnet-1' },
  },
  {
    id: 'object_storage', label: 'Object Storage Bucket', category: 'cloud_infra',
    description: 'Durable storage for files and static assets, addressed by key.',
    providerTypes: { aws: 'aws_s3_bucket', gcp: 'google_storage_bucket', azure: 'azurerm_storage_account' },
    defaultAttrs: { bucket_name: 'my-app-assets', versioning: 'true' },
  },
  {
    id: 'managed_database', label: 'Managed Database', category: 'cloud_infra',
    description: 'A fully managed relational database the provider patches and backs up.',
    providerTypes: { aws: 'aws_db_instance', gcp: 'google_sql_database_instance', azure: 'azurerm_postgresql_flexible_server' },
    defaultAttrs: { engine: 'postgres', instance_class: 'db.t3.micro' },
  },
  {
    id: 'cache_cluster', label: 'Cache Cluster', category: 'cloud_infra',
    description: 'An in-memory store (like Redis) for fast, temporary data access.',
    providerTypes: { aws: 'aws_elasticache_cluster', gcp: 'google_redis_instance', azure: 'azurerm_redis_cache' },
    defaultAttrs: { engine: 'redis', node_type: 'cache.t3.micro' },
  },
  {
    id: 'dns_zone', label: 'DNS Zone', category: 'cloud_infra',
    description: 'A container for DNS records under one domain name.',
    providerTypes: { aws: 'aws_route53_zone', gcp: 'google_dns_managed_zone', azure: 'azurerm_dns_zone' },
    defaultAttrs: { domain_name: 'example.com' },
  },
  {
    id: 'dns_record', label: 'DNS Record', category: 'cloud_infra',
    description: 'Maps a hostname to an IP address or another resource.',
    providerTypes: { aws: 'aws_route53_record', gcp: 'google_dns_record_set', azure: 'azurerm_dns_a_record' },
    defaultAttrs: { record_type: 'A', ttl: 300 },
  },
  {
    id: 'cdn_distribution', label: 'CDN Distribution', category: 'cloud_infra',
    description: 'Caches content at edge locations closer to your users.',
    providerTypes: { aws: 'aws_cloudfront_distribution', gcp: 'google_compute_backend_bucket', azure: 'azurerm_cdn_profile' },
    defaultAttrs: { origin: 'origin.example.com', price_class: 'PriceClass_100' },
  },
  {
    id: 'iam_role', label: 'IAM Role', category: 'cloud_infra',
    description: 'An identity that resources can assume to gain specific permissions.',
    providerTypes: { aws: 'aws_iam_role', gcp: 'google_service_account', azure: 'azurerm_role_definition' },
    defaultAttrs: { assume_role_policy: 'ec2.amazonaws.com' },
  },
  {
    id: 'kubernetes_cluster', label: 'Kubernetes Cluster', category: 'cloud_infra',
    description: 'A managed control plane for running containerized workloads.',
    providerTypes: { aws: 'aws_eks_cluster', gcp: 'google_container_cluster', azure: 'azurerm_kubernetes_cluster' },
    defaultAttrs: { node_count: 3, version: '1.29' },
  },
  {
    id: 'container_registry', label: 'Container Registry', category: 'cloud_infra',
    description: 'A private repository for storing container images.',
    providerTypes: { aws: 'aws_ecr_repository', gcp: 'google_artifact_registry_repository', azure: 'azurerm_container_registry' },
    defaultAttrs: { repository_name: 'my-app' },
  },
  {
    id: 'serverless_function', label: 'Serverless Function', category: 'cloud_infra',
    description: 'Runs your code on demand without managing a server.',
    providerTypes: { aws: 'aws_lambda_function', gcp: 'google_cloudfunctions_function', azure: 'azurerm_linux_function_app' },
    defaultAttrs: { runtime: 'nodejs20.x', memory_mb: 256 },
  },
  {
    id: 'message_queue', label: 'Message Queue', category: 'cloud_infra',
    description: 'Decouples services by buffering messages between them.',
    providerTypes: { aws: 'aws_sqs_queue', gcp: 'google_pubsub_topic', azure: 'azurerm_servicebus_queue' },
    defaultAttrs: { visibility_timeout: 30 },
  },
  {
    id: 'secrets_manager', label: 'Secret', category: 'cloud_infra',
    description: 'Securely stores and rotates sensitive values like passwords.',
    providerTypes: { aws: 'aws_secretsmanager_secret', gcp: 'google_secret_manager_secret', azure: 'azurerm_key_vault_secret' },
    defaultAttrs: { secret_name: 'db-password' },
  },
  {
    id: 'monitoring_alert', label: 'Monitoring Alert', category: 'cloud_infra',
    description: 'Notifies you when a metric crosses a defined threshold.',
    providerTypes: { aws: 'aws_cloudwatch_metric_alarm', gcp: 'google_monitoring_alert_policy', azure: 'azurerm_monitor_metric_alert' },
    defaultAttrs: { metric: 'CPUUtilization', threshold: 80 },
  },

  // GitHub / CI config -- 12 of the most-used resources from the real
  // Terraform GitHub provider (`integrations/github`), covering repo setup,
  // CI secrets/config, environments, access control, and branch rules.
  {
    id: 'github_repository', label: 'Repository', category: 'github_ci',
    description: 'The GitHub repository itself -- where your code, workflows, and settings live.',
    terraformType: 'github_repository',
    defaultAttrs: { visibility: 'private', default_branch: 'main' },
  },
  {
    id: 'github_actions_secret', label: 'Actions Secret', category: 'github_ci',
    description: 'An encrypted secret (like an API token) available to GitHub Actions workflows.',
    terraformType: 'github_actions_secret',
    defaultAttrs: { secret_name: 'DEPLOY_TOKEN' },
  },
  {
    id: 'github_actions_variable', label: 'Actions Variable', category: 'github_ci',
    description: 'A non-secret configuration value (like an environment name) available to workflows.',
    terraformType: 'github_actions_variable',
    defaultAttrs: { variable_name: 'APP_ENVIRONMENT', value: 'production' },
  },
  {
    id: 'github_branch_protection', label: 'Branch Protection Rule', category: 'github_ci',
    description: 'Requires reviews or passing checks before code can be merged into a protected branch.',
    terraformType: 'github_branch_protection',
    defaultAttrs: { pattern: 'main', require_review: 'true' },
  },
  {
    id: 'github_repository_environment', label: 'Deployment Environment', category: 'github_ci',
    description: 'A named deployment target (e.g. staging, production) with its own approval rules.',
    terraformType: 'github_repository_environment',
    defaultAttrs: { environment: 'production', required_reviewers: 1 },
  },
  {
    id: 'github_actions_environment_secret', label: 'Environment Secret', category: 'github_ci',
    description: 'A secret scoped to one deployment environment, not the whole repository.',
    terraformType: 'github_actions_environment_secret',
    defaultAttrs: { environment: 'production', secret_name: 'DB_PASSWORD' },
  },
  {
    id: 'github_webhook', label: 'Repository Webhook', category: 'github_ci',
    description: 'Notifies an external URL (like a CI server) whenever an event such as push happens.',
    terraformType: 'github_repository_webhook',
    defaultAttrs: { url: 'https://ci.example.com/hook', events: 'push' },
  },
  {
    id: 'github_deploy_key', label: 'Deploy Key', category: 'github_ci',
    description: 'An SSH key granting a server or CI job read (or write) access to one repository.',
    terraformType: 'github_repository_deploy_key',
    defaultAttrs: { title: 'ci-deploy-key', read_only: 'true' },
  },
  {
    id: 'github_team', label: 'Team', category: 'github_ci',
    description: 'A group of organization members, used to manage repository access at scale.',
    terraformType: 'github_team',
    defaultAttrs: { team_name: 'platform-eng' },
  },
  {
    id: 'github_team_repository', label: 'Team Repository Access', category: 'github_ci',
    description: 'Grants a team a specific permission level (read/write/admin) on a repository.',
    terraformType: 'github_team_repository',
    defaultAttrs: { team: 'platform-eng', permission: 'push' },
  },
  {
    id: 'github_repository_collaborator', label: 'Repository Collaborator', category: 'github_ci',
    description: 'Grants one individual GitHub user direct access to a repository.',
    terraformType: 'github_repository_collaborator',
    defaultAttrs: { username: 'octocat', permission: 'push' },
  },
  {
    id: 'github_repository_file', label: 'Repository File', category: 'github_ci',
    description: 'Commits a specific file (e.g. a CI workflow YAML) into the repo via Terraform itself.',
    terraformType: 'github_repository_file',
    defaultAttrs: { file_path: '.github/workflows/ci.yml', branch: 'main' },
  },
];

export function getResourceDef(typeId: string): ResourceTypeDef | undefined {
  return RESOURCE_CATALOG.find((r) => r.id === typeId);
}

export function resourceTypeString(resource: Pick<TerraformResource, 'typeId' | 'provider'>): string {
  const def = getResourceDef(resource.typeId);
  if (!def) return resource.typeId;
  if (def.category === 'github_ci') return def.terraformType ?? def.id;
  return def.providerTypes?.[resource.provider ?? 'aws'] ?? def.id;
}

export interface TerraformResource {
  id: string;
  typeId: string;
  category: ResourceCategory;
  provider?: Provider;
  name: string;
  attrs: Record<string, string | number>;
}

export type PlanActionKind = 'create' | 'update' | 'destroy';

export interface AttrChange {
  key: string;
  from: string | number | undefined;
  to: string | number | undefined;
}

export interface PlanAction {
  kind: PlanActionKind;
  resource: TerraformResource;
  changes?: AttrChange[];
}

export interface WorkspaceEvent {
  id: string;
  kind: 'apply' | 'destroy' | 'drift';
  message: string;
  timestamp: number;
}

function diffAttrs(a: Record<string, string | number>, b: Record<string, string | number>): AttrChange[] {
  const changes: AttrChange[] = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((key) => {
    if (a[key] !== b[key]) changes.push({ key, from: b[key], to: a[key] });
  });
  return changes;
}

function diff(config: TerraformResource[], state: TerraformResource[]): PlanAction[] {
  const stateById = new Map(state.map((r) => [r.id, r]));
  const configById = new Map(config.map((r) => [r.id, r]));
  const actions: PlanAction[] = [];

  config.forEach((resource) => {
    const existing = stateById.get(resource.id);
    if (!existing) {
      actions.push({ kind: 'create', resource, changes: diffAttrs(resource.attrs, {}) });
    } else {
      const changes = diffAttrs(resource.attrs, existing.attrs);
      if (changes.length > 0) {
        actions.push({ kind: 'update', resource, changes });
      }
    }
  });

  state.forEach((resource) => {
    if (!configById.has(resource.id)) {
      actions.push({ kind: 'destroy', resource });
    }
  });

  return actions;
}

interface TerraformState {
  config: TerraformResource[];
  state: TerraformResource[];
  plan: PlanAction[] | null;
  history: WorkspaceEvent[];
  appliedCount: number;
  isApplying: boolean;
  applyLog: string[];

  addResource: (typeId: string, name: string, provider?: Provider) => void;
  updateResourceAttr: (id: string, key: string, value: string | number) => void;
  removeResource: (id: string) => void;
  runPlan: () => void;
  applyPlan: () => Promise<void>;
  destroyAll: () => void;
  simulateDrift: (id: string) => void;
  hydrate: (data: { config?: TerraformResource[]; state?: TerraformResource[]; history?: WorkspaceEvent[]; appliedCount?: number }) => void;
}

function syncToBackend(get: () => TerraformState) {
  const { config, state, history, appliedCount } = get();
  apiClient
    .updateTerraformWorkspace({
      resourceCount: config.length,
      appliedCount,
      config,
      state,
      history,
    })
    .catch((err) => console.error('Failed to sync terraform workspace:', err));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useTerraformStore = create<TerraformState>()((set, get) => ({
  config: [],
  state: [],
  plan: null,
  history: [],
  appliedCount: 0,
  isApplying: false,
  applyLog: [],

  addResource: (typeId, name, provider) => {
    const def = getResourceDef(typeId);
    if (!def) return;
    const resource: TerraformResource = {
      id: crypto.randomUUID(),
      typeId,
      category: def.category,
      provider: def.category === 'cloud_infra' ? (provider ?? 'aws') : undefined,
      name: name.trim() || `${typeId}_${get().config.length + 1}`,
      attrs: { ...def.defaultAttrs },
    };
    set((s) => ({ config: [...s.config, resource], plan: null }));
    toast.info(`Added resource block "${resource.name}" — run Plan to see the effect`);
    syncToBackend(get);
  },

  updateResourceAttr: (id, key, value) => {
    set((s) => ({
      config: s.config.map((r) => (r.id === id ? { ...r, attrs: { ...r.attrs, [key]: value } } : r)),
      plan: null,
    }));
    syncToBackend(get);
  },

  removeResource: (id) => {
    set((s) => ({ config: s.config.filter((r) => r.id !== id), plan: null }));
    toast.info('Removed from config — run Plan to see the destroy it will trigger');
    syncToBackend(get);
  },

  runPlan: () => {
    const { config, state } = get();
    const actions = diff(config, state);
    set({ plan: actions });
    if (actions.length === 0) {
      toast.success('No changes. Infrastructure matches the configuration.');
    } else {
      const creates = actions.filter((a) => a.kind === 'create').length;
      const updates = actions.filter((a) => a.kind === 'update').length;
      const destroys = actions.filter((a) => a.kind === 'destroy').length;
      toast.info(`Plan: ${creates} to add, ${updates} to change, ${destroys} to destroy`);
    }
  },

  applyPlan: async () => {
    const { plan, config, history, appliedCount } = get();
    if (!plan) {
      toast.error('Run Plan before Apply');
      return;
    }
    if (plan.length === 0) {
      toast.info('Nothing to apply');
      return;
    }

    set({ isApplying: true, applyLog: [] });
    const verbs: Record<PlanActionKind, [string, string]> = {
      create: ['Creating...', 'Creation complete'],
      update: ['Modifying...', 'Modifications complete'],
      destroy: ['Destroying...', 'Destruction complete'],
    };

    for (const action of plan) {
      const address = `${resourceTypeString(action.resource)}.${action.resource.name}`;
      const [inProgress] = verbs[action.kind];
      set((s) => ({ applyLog: [...s.applyLog, `${address}: ${inProgress}`] }));
      await sleep(350 + Math.random() * 250);
      const seconds = (0.8 + Math.random() * 2.4).toFixed(1);
      const [, done] = verbs[action.kind];
      set((s) => ({ applyLog: [...s.applyLog, `${address}: ${done} after ${seconds}s`] }));
    }

    const creates = plan.filter((a) => a.kind === 'create').length;
    const updates = plan.filter((a) => a.kind === 'update').length;
    const destroys = plan.filter((a) => a.kind === 'destroy').length;
    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'apply',
      message: `Apply complete: ${creates} added, ${updates} changed, ${destroys} destroyed`,
      timestamp: Date.now(),
    };
    set({
      state: config.map((r) => ({ ...r, attrs: { ...r.attrs } })),
      plan: null,
      isApplying: false,
      history: [event, ...history].slice(0, 20),
      appliedCount: appliedCount + 1,
    });
    toast.success(event.message);
    syncToBackend(get);
  },

  destroyAll: () => {
    const { state, history } = get();
    if (state.length === 0) {
      toast.info('No applied infrastructure to destroy');
      return;
    }
    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'destroy',
      message: `Destroyed ${state.length} resource${state.length === 1 ? '' : 's'}`,
      timestamp: Date.now(),
    };
    set({ state: [], plan: null, applyLog: [], history: [event, ...history].slice(0, 20) });
    toast.success(event.message);
    syncToBackend(get);
  },

  simulateDrift: (id) => {
    const { state, history } = get();
    const target = state.find((r) => r.id === id);
    if (!target) return;
    const keys = Object.keys(target.attrs);
    if (keys.length === 0) return;
    const key = keys[0];
    const driftedValue = typeof target.attrs[key] === 'number'
      ? Number(target.attrs[key]) + 1
      : `${target.attrs[key]}-manual-edit`;
    const event: WorkspaceEvent = {
      id: crypto.randomUUID(),
      kind: 'drift',
      message: `Detected drift on "${target.name}": ${key} changed outside Terraform`,
      timestamp: Date.now(),
    };
    set({
      state: state.map((r) => (r.id === id ? { ...r, attrs: { ...r.attrs, [key]: driftedValue } } : r)),
      history: [event, ...history].slice(0, 20),
      plan: null,
    });
    toast.error(`Drift detected on "${target.name}" — run Plan to see what changed`);
    syncToBackend(get);
  },

  hydrate: (data) => {
    set({
      config: data.config ?? [],
      state: data.state ?? [],
      history: data.history ?? [],
      appliedCount: data.appliedCount ?? 0,
      plan: null,
      applyLog: [],
    });
  },
}));
