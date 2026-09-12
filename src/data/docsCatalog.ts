import {
  Rocket, Activity, Target, Layers, Container, Server, Network, GitBranch,
  Zap, Terminal, Ticket, AlertTriangle, FileCode, ScrollText, Lock, Boxes,
  GitMerge, LineChart, type LucideIcon,
} from 'lucide-react';

export interface DocEntry {
  /** Matches the .md filename in src/docs/content/ (without extension) */
  id: string;
  title: string;
  /** One-line description shown under the title in the sidebar */
  description: string;
  icon: LucideIcon;
  /** The group this doc is listed under in the sidebar */
  group: 'Getting Started' | 'Simulator Basics' | 'Operations' | 'Infrastructure Labs';
  /** If set, matches a MODULE_CATALOG id -- powers the "Open Module" button and live stats */
  moduleId?: string;
}

export const DOCS_CATALOG: DocEntry[] = [
  { id: 'getting-started', title: 'Getting Started', description: 'What this simulator is and how to use these guides', icon: Rocket, group: 'Getting Started' },

  { id: 'dashboard', title: 'Dashboard', description: 'Reading your live traffic, CPU, and error-rate metrics', icon: Activity, group: 'Simulator Basics', moduleId: 'dashboard' },
  { id: 'scenarios', title: 'Scenarios', description: 'Guided, objective-based exercises across every module', icon: Target, group: 'Simulator Basics', moduleId: 'scenarios' },
  { id: 'applications', title: 'Applications', description: 'Deployments, versions, and traffic-switching', icon: Layers, group: 'Simulator Basics', moduleId: 'applications' },
  { id: 'containers', title: 'Container Lab', description: 'Docker images, containers, and why they crash', icon: Container, group: 'Simulator Basics', moduleId: 'containers' },
  { id: 'instances', title: 'Instances', description: 'Servers, IAM roles, and auto-scaling', icon: Server, group: 'Simulator Basics', moduleId: 'instances' },
  { id: 'networking', title: 'Networking', description: 'Ingress, Services, and load-balancing strategies', icon: Network, group: 'Simulator Basics', moduleId: 'networking' },

  { id: 'cicd', title: 'CI/CD', description: 'Build, test, dockerize, and deploy pipelines', icon: GitBranch, group: 'Operations', moduleId: 'cicd' },
  { id: 'live', title: 'Live Instances', description: 'Real-time view of running instance metrics', icon: Zap, group: 'Operations', moduleId: 'live' },
  { id: 'cli', title: 'AWS CLI', description: 'Driving the simulator from a terminal', icon: Terminal, group: 'Operations', moduleId: 'cli' },
  { id: 'tickets', title: 'Tickets', description: 'Triaging incidents raised by your infrastructure', icon: Ticket, group: 'Operations', moduleId: 'tickets' },
  { id: 'issues', title: 'Issues & Alerts', description: 'Reading and resolving active alerts', icon: AlertTriangle, group: 'Operations', moduleId: 'issues' },

  { id: 'terraform', title: 'Terraform Lab', description: 'Infrastructure as Code: plan, apply, state & drift', icon: FileCode, group: 'Infrastructure Labs', moduleId: 'terraform' },
  { id: 'ansible', title: 'Ansible Lab', description: 'Configuration management: playbooks & idempotency', icon: ScrollText, group: 'Infrastructure Labs', moduleId: 'ansible' },
  { id: 'vault', title: 'Vault Lab', description: 'Secrets management: engines, policies, tokens', icon: Lock, group: 'Infrastructure Labs', moduleId: 'vault' },
  { id: 'kubectl', title: 'kubectl Lab', description: 'A real terminal for Kubernetes-style commands', icon: Boxes, group: 'Infrastructure Labs', moduleId: 'kubectl' },
  { id: 'gitops', title: 'GitOps Lab', description: 'Continuous deployment: commit, sync & self-heal', icon: GitMerge, group: 'Infrastructure Labs', moduleId: 'gitops' },
  { id: 'monitoring', title: 'Monitoring Lab', description: 'Dashboards and alert rules on your live metrics', icon: LineChart, group: 'Infrastructure Labs', moduleId: 'monitoring' },
];

export const DOC_GROUPS: DocEntry['group'][] = ['Getting Started', 'Simulator Basics', 'Operations', 'Infrastructure Labs'];

export function getDocEntry(id: string): DocEntry | undefined {
  return DOCS_CATALOG.find((d) => d.id === id);
}

// The 6 modules covered by the progress-tracking/certificates system
// (see GET /api/progress/summary) -- these get a live progress bar on
// their doc page, the others don't have a completion concept.
export const PROGRESS_TRACKED_MODULE_IDS = new Set(['terraform', 'ansible', 'vault', 'kubectl', 'gitops', 'monitoring']);
