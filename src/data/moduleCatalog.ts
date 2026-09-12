import {
  Activity, Target, Layers, Container, FileCode, ScrollText, Lock, Boxes,
  GitMerge, Network, Server, GitBranch, Zap, Terminal, Ticket, AlertTriangle,
  LineChart, type LucideIcon,
} from 'lucide-react';

export interface ModuleDef {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
}

// The single canonical list of every opt-in nav module, shared by the
// sidebar (which filters to a user's selectedModules) and the My Account
// module picker (which edits that same list) so the two can never drift.
export const MODULE_CATALOG: ModuleDef[] = [
  { id: 'dashboard', title: 'Dashboard', url: '/', icon: Activity, description: 'Live overview of your simulated infrastructure and score.' },
  { id: 'scenarios', title: 'Scenarios', url: '/scenarios', icon: Target, description: 'Guided, objective-based exercises across every module.' },
  { id: 'applications', title: 'Applications', url: '/apps', icon: Layers, description: 'Deploy and manage your simulated applications.' },
  { id: 'containers', title: 'Container Lab', url: '/containers', icon: Container, description: 'Build images, run containers, and learn Docker basics.' },
  { id: 'terraform', title: 'Terraform Lab', url: '/terraform', icon: FileCode, description: 'Infrastructure as Code: plan, apply, state & drift.' },
  { id: 'ansible', title: 'Ansible Lab', url: '/ansible', icon: ScrollText, description: 'Configuration management: playbooks, idempotency.' },
  { id: 'vault', title: 'Vault Lab', url: '/vault', icon: Lock, description: 'Secrets management: engines, policies, tokens.' },
  { id: 'kubectl', title: 'kubectl Lab', url: '/kubectl', icon: Boxes, description: 'A real terminal for driving Kubernetes-style commands.' },
  { id: 'gitops', title: 'GitOps Lab', url: '/gitops', icon: GitMerge, description: 'Continuous deployment: commit, sync & self-heal.' },
  { id: 'monitoring', title: 'Monitoring Lab', url: '/monitoring', icon: LineChart, description: 'Build dashboards and alert rules on your live metrics.' },
  { id: 'networking', title: 'Networking', url: '/networking', icon: Network, description: 'Pods, services, load balancers, and ingress rules.' },
  { id: 'instances', title: 'Instances', url: '/instances', icon: Server, description: 'Provision and manage simulated compute instances.' },
  { id: 'cicd', title: 'CI/CD', url: '/cicd', icon: GitBranch, description: 'Build, test, and deploy pipelines.' },
  { id: 'live', title: 'Live Instances', url: '/live', icon: Zap, description: 'Real-time view of running instance metrics.' },
  { id: 'cli', title: 'AWS CLI', url: '/cli', icon: Terminal, description: 'A terminal for AWS-style CLI commands.' },
  { id: 'tickets', title: 'Tickets', url: '/tickets', icon: Ticket, description: 'Simulated support tickets to triage and resolve.' },
  { id: 'issues', title: 'Issues', url: '/issues', icon: AlertTriangle, description: 'Alerts and incidents surfaced from your infrastructure.' },
];

export const ALL_MODULE_IDS = MODULE_CATALOG.map((m) => m.id);
