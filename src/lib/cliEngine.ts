import { useGameStore, INSTANCE_TYPES, InstanceTypeId } from '@/store/gameStore';
import { useIAMStore } from '@/store/iam/iamStore';
import { evaluatePermission } from '@/store/iam/engine';
import { executeKubectlCommand, getKubectlAutocompleteSuggestions } from '@/lib/kubectlEngine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CommandResultType = 'success' | 'error' | 'info';

export interface CommandResult {
  type: CommandResultType;
  output: string;
  learningTip?: string;
  timestamp: number;
}

export interface ParsedCommand {
  service: string;
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
  iamAction?: string;
  handler: (parsed: ParsedCommand) => CommandResult;
}

// ============================================================================
// COMMAND PARSER
// ============================================================================

export function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { service: '', operation: '', flags: {}, rawArgs: [] };
  }

  // Handle kubectl separately (not "aws kubectl")
  if (parts[0] === 'kubectl') {
    const operation = parts[1] || '';
    const rawArgs = parts.slice(2);
    const flags = parseFlags(rawArgs);
    
    return {
      service: 'kubectl',
      operation,
      flags,
      rawArgs,
    };
  }

  // Handle cloudops commands
  if (parts[0] === 'cloudops') {
    const operation = parts[1] || '';
    const rawArgs = parts.slice(2);
    const flags = parseFlags(rawArgs);
    
    return {
      service: 'cloudops',
      operation,
      flags,
      rawArgs,
    };
  }

  // AWS commands: aws <service> <operation> [flags]
  if (parts[0] === 'aws') {
    const service = parts[1] || '';
    const operation = parts[2] || '';
    const rawArgs = parts.slice(3);
    const flags = parseFlags(rawArgs);
    
    return {
      service,
      operation,
      flags,
      rawArgs,
    };
  }

  // Single word commands (help, clear, etc.)
  return {
    service: parts[0],
    operation: '',
    flags: {},
    rawArgs: parts.slice(1),
  };
}

function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Long flag: --flag=value or --flag value
    if (arg.startsWith('--')) {
      const flagName = arg.slice(2);
      
      if (flagName.includes('=')) {
        const [key, value] = flagName.split('=');
        flags[key] = value;
      } else {
        // Check if next arg is a value
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          flags[flagName] = args[i + 1];
          i++;
        } else {
          flags[flagName] = true;
        }
      }
    }
    // Short flag: -f or -f value
    else if (arg.startsWith('-') && arg.length > 1) {
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

// ============================================================================
// IAM PERMISSION CHECK
// ============================================================================

export function checkIAMPermission(action: string, resource: string = '*'): { allowed: boolean; message?: string } {
  const { managedPolicies, customPolicies, roles, currentUserRoleId } = useIAMStore.getState();
  const role = roles.find(r => r.id === currentUserRoleId);
  
  if (!role) {
    return {
      allowed: false,
      message: `No active role found. Current user role: ${currentUserRoleId}`,
    };
  }
  
  const allAvailable = [...managedPolicies, ...customPolicies];
  const userPolicies = allAvailable.filter(p => role.attachedPolicyIds.includes(p.id));
  
  const result = evaluatePermission(userPolicies, action, resource);
  
  if (result === 'Deny') {
    return {
      allowed: false,
      message: `An error occurred (AccessDenied) when calling the ${action} operation: User: arn:aws:iam::123456789012:user/${role.name} is not authorized to perform: ${action} on resource: ${resource}`,
    };
  }
  
  return { allowed: true };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatInstanceTable(instances: any[]): string {
  if (instances.length === 0) return 'No instances found.';
  
  const header = 'INSTANCE ID                NAME           TYPE         STATE        CPU%    MEMORY%   RPS';
  const separator = '-'.repeat(header.length);
  const rows = instances.map(i => 
    `${i.id.padEnd(25)} ${i.name.padEnd(14)} ${i.typeId.padEnd(12)} ${i.status.padEnd(12)} ${i.cpu.toFixed(1).padStart(6)} ${i.memory.toFixed(1).padStart(8)} ${i.currentRps.toString().padStart(6)}`
  );
  
  return [header, separator, ...rows].join('\n');
}

function formatApplicationTable(apps: any[]): string {
  if (apps.length === 0) return 'No applications found.';
  
  const rows = apps.map(a => {
    const totalReplicas = a.deployments.reduce((sum: number, d: any) => sum + d.replicas, 0);
    return `${a.name.padEnd(25)} ${a.activeVersion.padEnd(12)} ${totalReplicas.toString().padStart(10)} ${a.deployments.length.toString().padStart(12)}`;
  });
  
  const header = 'APPLICATION NAME          VERSION      REPLICAS   DEPLOYMENTS';
  const separator = '-'.repeat(header.length);
  
  return [header, separator, ...rows].join('\n');
}

function formatPodTable(pods: any[]): string {
  if (pods.length === 0) return 'No pods found.';
  
  const rows = pods.map(p => 
    `${p.id.padEnd(25)} ${p.appId.padEnd(20)} ${p.version.padEnd(10)} ${p.status.padEnd(12)} ${p.cpu.toFixed(1).padStart(6)}% ${p.currentRps.toString().padStart(6)}`
  );
  
  const header = 'POD ID                    APPLICATION          VERSION    STATUS       CPU%     RPS';
  const separator = '-'.repeat(header.length);
  
  return [header, separator, ...rows].join('\n');
}

function formatRoleTable(roles: any[]): string {
  if (roles.length === 0) return 'No roles found.';
  
  const rows = roles.map(r => 
    `${r.name.padEnd(30)} ${r.attachedPolicyIds.length.toString().padStart(10)}   ${r.id}`
  );
  
  const header = 'ROLE NAME                      POLICIES   ROLE ID';
  const separator = '-'.repeat(header.length);
  
  return [header, separator, ...rows].join('\n');
}

// ============================================================================
// COMMAND HANDLERS - EC2
// ============================================================================

const ec2Commands: CommandDefinition[] = [
  {
    name: 'describe-instances',
    operation: 'describe-instances',
    description: 'Describes one or more of your instances',
    usage: 'aws ec2 describe-instances [--instance-ids <value>]',
    examples: [
      'aws ec2 describe-instances',
      'aws ec2 describe-instances --instance-ids inst-123',
    ],
    iamAction: 'cloudsim:DescribeInstances',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('cloudsim:DescribeInstances');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const { instances } = useGameStore.getState();
      const instanceId = parsed.flags['instance-ids'] as string;
      
      const filtered = instanceId 
        ? instances.filter(i => i.id === instanceId)
        : instances;

      return {
        type: 'success',
        output: formatInstanceTable(filtered),
        learningTip: '💡 EC2 instances are virtual servers in the cloud. You can scale horizontally by adding more instances to handle increased traffic.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'run-instances',
    operation: 'run-instances',
    description: 'Launches one EC2 instance',
    usage: 'aws ec2 run-instances --instance-type <type> [--iam-instance-profile <role-id>]',
    examples: [
      'aws ec2 run-instances --instance-type t3.micro',
      'aws ec2 run-instances --instance-type m5.large --iam-instance-profile role-admin',
    ],
    iamAction: 'cloudsim:RunInstances',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('cloudsim:RunInstances');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const instanceType = (parsed.flags['instance-type'] as string) || 't3.micro';
      const roleId = (parsed.flags['iam-instance-profile'] as string) || 'role-readonly';
      
      if (!INSTANCE_TYPES[instanceType as InstanceTypeId]) {
        return {
          type: 'error',
          output: `Invalid instance type: ${instanceType}. Valid types: ${Object.keys(INSTANCE_TYPES).join(', ')}`,
          timestamp: Date.now(),
        };
      }

      useGameStore.getState().addInstance(instanceType as InstanceTypeId, roleId);

      return {
        type: 'success',
        output: `✓ Instance creation initiated\nInstance Type: ${instanceType}\nIAM Role: ${roleId}\nStatus: Provisioning (will be ready in ~8 seconds)`,
        learningTip: '🚀 You just launched a virtual server! In production AWS, this command would create an EC2 instance that can run applications, process data, or host websites.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'terminate-instances',
    operation: 'terminate-instances',
    description: 'Shuts down one or more instances',
    usage: 'aws ec2 terminate-instances --instance-ids <value>',
    examples: ['aws ec2 terminate-instances --instance-ids inst-123'],
    iamAction: 'cloudsim:TerminateInstances',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('cloudsim:TerminateInstances');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const instanceId = parsed.flags['instance-ids'] as string;
      
      if (!instanceId) {
        return {
          type: 'error',
          output: 'Error: Missing required parameter --instance-ids',
          timestamp: Date.now(),
        };
      }

      const { instances } = useGameStore.getState();
      const instance = instances.find(i => i.id === instanceId);
      
      if (!instance) {
        return {
          type: 'error',
          output: `Error: Instance '${instanceId}' not found`,
          timestamp: Date.now(),
        };
      }

      useGameStore.getState().removeInstance(instanceId);

      return {
        type: 'success',
        output: `✓ Terminating instance: ${instanceId} (${instance.name})`,
        learningTip: '⚠️ Terminated instances cannot be recovered. In production, always double-check before terminating instances with critical data!',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'reboot-instances',
    operation: 'reboot-instances',
    description: 'Requests a reboot of one or more instances',
    usage: 'aws ec2 reboot-instances --instance-ids <value>',
    examples: ['aws ec2 reboot-instances --instance-ids inst-123'],
    iamAction: 'cloudsim:RebootInstances',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('cloudsim:RebootInstances');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const instanceId = parsed.flags['instance-ids'] as string;
      
      if (!instanceId) {
        return {
          type: 'error',
          output: 'Error: Missing required parameter --instance-ids',
          timestamp: Date.now(),
        };
      }

      const { instances } = useGameStore.getState();
      const instance = instances.find(i => i.id === instanceId);
      
      if (!instance) {
        return {
          type: 'error',
          output: `Error: Instance '${instanceId}' not found`,
          timestamp: Date.now(),
        };
      }

      useGameStore.getState().restartInstance(instanceId);

      return {
        type: 'success',
        output: `✓ Rebooting instance: ${instanceId} (${instance.name})`,
        learningTip: '🔄 Rebooting an instance can fix temporary issues like memory leaks or hung processes. It\'s a common troubleshooting step in DevOps.',
        timestamp: Date.now(),
      };
    },
  },
];

// ============================================================================
// COMMAND HANDLERS - IAM
// ============================================================================

const iamCommands: CommandDefinition[] = [
  {
    name: 'list-roles',
    operation: 'list-roles',
    description: 'Lists the IAM roles',
    usage: 'aws iam list-roles',
    examples: ['aws iam list-roles'],
    iamAction: 'cloudsim:IAMListRoles',
    handler: () => {
      const permCheck = checkIAMPermission('cloudsim:IAMListRoles');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const { roles } = useIAMStore.getState();

      return {
        type: 'success',
        output: formatRoleTable(roles),
        learningTip: '🔐 IAM roles define what actions users or services can perform. The principle of least privilege means granting only the permissions needed for a task.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'list-policies',
    operation: 'list-policies',
    description: 'Lists all the managed policies',
    usage: 'aws iam list-policies [--scope All|AWS|Local]',
    examples: ['aws iam list-policies', 'aws iam list-policies --scope AWS'],
    iamAction: 'cloudsim:IAMListPolicies',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('cloudsim:IAMListPolicies');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const { managedPolicies, customPolicies } = useIAMStore.getState();
      const scope = (parsed.flags['scope'] as string)?.toLowerCase();
      
      let policies = [...managedPolicies, ...customPolicies];
      
      if (scope === 'aws') {
        policies = managedPolicies;
      } else if (scope === 'local') {
        policies = customPolicies;
      }

      const output = policies.map(p => 
        `${p.name.padEnd(40)} ${p.isManaged ? 'AWS Managed' : 'Customer'}`
      ).join('\n');

      return {
        type: 'success',
        output: output || 'No policies found.',
        learningTip: '📜 IAM policies are JSON documents that define permissions. AWS managed policies are maintained by AWS, while customer managed policies are created by you.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'attach-role-policy',
    operation: 'attach-role-policy',
    description: 'Attaches a managed policy to an IAM role',
    usage: 'aws iam attach-role-policy --role-name <value> --policy-arn <value>',
    examples: ['aws iam attach-role-policy --role-name DevOpsRole --policy-arn policy-ec2-full'],
    iamAction: 'cloudsim:IAMAttachRolePolicy',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('cloudsim:IAMAttachRolePolicy');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const roleName = parsed.flags['role-name'] as string;
      const policyArn = parsed.flags['policy-arn'] as string;

      if (!roleName || !policyArn) {
        return {
          type: 'error',
          output: 'Error: Missing required parameters --role-name and --policy-arn',
          timestamp: Date.now(),
        };
      }

      const { roles } = useIAMStore.getState();
      const role = roles.find(r => r.name === roleName);

      if (!role) {
        return {
          type: 'error',
          output: `Error: Role '${roleName}' not found`,
          timestamp: Date.now(),
        };
      }

      useIAMStore.getState().attachPolicyToRole(role.id, policyArn);

      return {
        type: 'success',
        output: `✓ Attached policy '${policyArn}' to role '${roleName}'`,
        learningTip: '🔗 Attaching policies to roles is how you grant permissions. A role can have multiple policies attached to combine different permission sets.',
        timestamp: Date.now(),
      };
    },
  },
];

// ============================================================================
// COMMAND HANDLERS - S3 (Simulated)
// ============================================================================

const s3Commands: CommandDefinition[] = [
  {
    name: 'ls',
    operation: 'ls',
    description: 'Lists S3 buckets or objects (simulated)',
    usage: 'aws s3 ls [s3://bucket-name]',
    examples: ['aws s3 ls', 'aws s3 ls s3://my-bucket'],
    iamAction: 's3:ListBucket',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('s3:ListBucket');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const bucket = parsed.rawArgs[0];

      if (!bucket) {
        return {
          type: 'success',
          output: '2024-01-15 10:23:45 production-assets\n2024-02-20 14:32:12 backup-data\n2024-03-10 09:15:33 logs-archive',
          learningTip: '🗂️ S3 is object storage for the cloud. It\'s highly durable and can store anything from backups to static website files.',
          timestamp: Date.now(),
        };
      }

      return {
        type: 'success',
        output: '2024-03-15 10:23:45      12345 file1.txt\n2024-03-16 14:32:12    5678901 data.json\n2024-03-17 09:15:33        456 config.yaml',
        learningTip: '📦 S3 objects can be versioned, encrypted, and have lifecycle policies for automatic archival or deletion.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'cp',
    operation: 'cp',
    description: 'Copies files to/from S3 (simulated)',
    usage: 'aws s3 cp <source> <destination>',
    examples: ['aws s3 cp file.txt s3://my-bucket/', 'aws s3 cp s3://my-bucket/file.txt .'],
    iamAction: 's3:PutObject',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('s3:PutObject');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const source = parsed.rawArgs[0];
      const dest = parsed.rawArgs[1];

      if (!source || !dest) {
        return {
          type: 'error',
          output: 'Error: Missing source or destination',
          timestamp: Date.now(),
        };
      }

      return {
        type: 'success',
        output: `✓ upload: ${source} to ${dest}`,
        learningTip: '☁️ S3 is perfect for storing backups, logs, and static assets. Unlike EBS volumes, S3 data persists independently of EC2 instances.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'mb',
    operation: 'mb',
    description: 'Creates an S3 bucket (simulated)',
    usage: 'aws s3 mb s3://bucket-name',
    examples: ['aws s3 mb s3://my-new-bucket'],
    iamAction: 's3:CreateBucket',
    handler: (parsed) => {
      const permCheck = checkIAMPermission('s3:CreateBucket');
      if (!permCheck.allowed) {
        return { type: 'error', output: permCheck.message!, timestamp: Date.now() };
      }

      const bucket = parsed.rawArgs[0];

      if (!bucket || !bucket.startsWith('s3://')) {
        return {
          type: 'error',
          output: 'Error: Bucket name must start with s3://',
          timestamp: Date.now(),
        };
      }

      return {
        type: 'success',
        output: `✓ make_bucket: ${bucket}`,
        learningTip: '🪣 S3 bucket names must be globally unique across all AWS accounts. Choose names carefully!',
        timestamp: Date.now(),
      };
    },
  },
];

// ============================================================================
// COMMAND HANDLERS - CLOUDOPS (Custom)
// ============================================================================

const cloudopsCommands: CommandDefinition[] = [
  {
    name: 'get apps',
    operation: 'get',
    description: 'Lists all applications',
    usage: 'cloudops get apps',
    examples: ['cloudops get apps'],
    handler: () => {
      const { applications } = useGameStore.getState();

      return {
        type: 'success',
        output: formatApplicationTable(applications),
        learningTip: '🚀 Applications in CloudOps represent containerized services running on your infrastructure, similar to Kubernetes deployments.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get pods',
    operation: 'get',
    description: 'Lists all pods across all instances',
    usage: 'cloudops get pods [--app <app-id>]',
    examples: ['cloudops get pods', 'cloudops get pods --app app-main'],
    handler: (parsed) => {
      const { instances } = useGameStore.getState();
      const appId = parsed.flags['app'] as string;
      
      let allPods = instances.flatMap(inst => inst.pods);
      
      if (appId) {
        allPods = allPods.filter(p => p.appId === appId);
      }

      return {
        type: 'success',
        output: formatPodTable(allPods),
        learningTip: '🎯 Pods are the smallest deployable units in Kubernetes-style orchestration. Each pod runs one or more containers.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get deployments',
    operation: 'get',
    description: 'Lists all deployments',
    usage: 'cloudops get deployments [--app <app-id>]',
    examples: ['cloudops get deployments', 'cloudops get deployments --app app-main'],
    handler: (parsed) => {
      const { applications } = useGameStore.getState();
      const appId = parsed.flags['app'] as string;
      
      const filtered = appId ? applications.filter(a => a.id === appId) : applications;
      
      const rows = filtered.flatMap(app =>
        app.deployments.map(d =>
          `${app.name.padEnd(25)} ${d.version.padEnd(12)} ${d.replicas.toString().padStart(10)}   ${d.id}`
        )
      );

      const header = 'APPLICATION NAME          VERSION      REPLICAS   DEPLOYMENT ID';
      const separator = '-'.repeat(header.length);

      return {
        type: 'success',
        output: rows.length > 0 ? [header, separator, ...rows].join('\n') : 'No deployments found.',
        learningTip: '📦 Deployments manage the desired state of your application, including version and replica count.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'scale app',
    operation: 'scale',
    description: 'Scales an application deployment',
    usage: 'cloudops scale app --app-id <id> --version <ver> --replicas <num>',
    examples: ['cloudops scale app --app-id app-main --version v1 --replicas 3'],
    handler: (parsed) => {
      const appId = parsed.flags['app-id'] as string;
      const version = parsed.flags['version'] as string;
      const replicas = parseInt(parsed.flags['replicas'] as string);

      if (!appId || !version || isNaN(replicas)) {
        return {
          type: 'error',
          output: 'Error: Missing required parameters --app-id, --version, --replicas',
          timestamp: Date.now(),
        };
      }

      const { applications } = useGameStore.getState();
      const app = applications.find(a => a.id === appId);

      if (!app) {
        return {
          type: 'error',
          output: `Error: Application '${appId}' not found`,
          timestamp: Date.now(),
        };
      }

      useGameStore.getState().scaleDeployment(appId, version, replicas);

      return {
        type: 'success',
        output: `✓ Scaled ${app.name} (${version}) to ${replicas} replicas`,
        learningTip: '📈 Horizontal scaling (adding replicas) is a key cloud pattern for handling increased traffic without downtime.',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'status',
    operation: 'status',
    description: 'Shows overall system status',
    usage: 'cloudops status',
    examples: ['cloudops status'],
    handler: () => {
      const { instances, traffic, cpuAvg, errorRate, hasLoadBalancer, asg, hpa } = useGameStore.getState();
      
      const running = instances.filter(i => i.status === 'running').length;
      const crashed = instances.filter(i => i.status === 'crashed').length;
      
      const output = `
╔════════════════════════════════════════╗
║       CLOUD INFRASTRUCTURE STATUS      ║
╠════════════════════════════════════════╣
║ Instances:        ${instances.length.toString().padStart(3)} (${running} running, ${crashed} crashed)
║ Traffic:          ${traffic} RPS
║ Avg CPU:          ${cpuAvg.toFixed(1)}%
║ Error Rate:       ${errorRate.toFixed(2)}%
║ Load Balancer:    ${hasLoadBalancer ? 'Enabled ✓' : 'Disabled ✗'}
║ ASG:              ${asg.enabled ? 'Enabled ✓' : 'Disabled ✗'}
║ HPA:              ${hpa.enabled ? 'Enabled ✓' : 'Disabled ✗'}
╚════════════════════════════════════════╝
      `.trim();

      return {
        type: 'info',
        output,
        learningTip: '📊 Monitoring your infrastructure status is crucial. In production, you\'d use tools like CloudWatch, Datadog, or Prometheus.',
        timestamp: Date.now(),
      };
    },
  },
];

// ============================================================================
// COMMAND REGISTRY
// ============================================================================
// Note: kubectl is handled separately -- see executeKubectlCommand import --
// so both this page and the dedicated Kubectl Lab share one implementation.

export const commandRegistry = {
  ec2: ec2Commands,
  iam: iamCommands,
  s3: s3Commands,
  cloudops: cloudopsCommands,
};

// ============================================================================
// HELP SYSTEM
// ============================================================================

export function getHelp(service?: string, operation?: string): string {
  if (!service) {
    return `
CloudOps AWS CLI Simulator
==========================

Available Services:
  aws ec2          - Elastic Compute Cloud (EC2) instance operations
  aws iam          - Identity and Access Management
  aws s3           - Simple Storage Service (simulated)
  cloudops         - CloudOps custom commands
  kubectl          - Kubernetes CLI commands

Special Commands:
  help             - Show this help message
  clear            - Clear terminal history
  status           - Show system status

Usage:
  aws <service> <operation> [flags]
  aws help <service>            - Show service-specific help
  aws <service> help            - Show service-specific help

Examples:
  aws ec2 describe-instances
  aws ec2 run-instances --instance-type m5.large
  kubectl get pods
  cloudops get apps

💡 Tip: Commands respect IAM permissions. Use 'aws iam list-roles' to see available roles.
    `.trim();
  }

  const commands = commandRegistry[service as keyof typeof commandRegistry];
  
  if (!commands) {
    return `Unknown service: ${service}\nType 'help' for available services.`;
  }

  if (operation) {
    const cmd = commands.find(c => c.operation === operation);
    if (!cmd) {
      return `Unknown operation: ${operation} for service ${service}`;
    }

    return `
${cmd.description}

Usage:
  ${cmd.usage}

Examples:
${cmd.examples.map(ex => `  ${ex}`).join('\n')}
${cmd.iamAction ? `\nRequired IAM Permission:\n  ${cmd.iamAction}` : ''}
    `.trim();
  }

  // Service-level help
  const serviceHelp = commands.map(cmd => 
    `  ${cmd.operation.padEnd(25)} ${cmd.description}`
  ).join('\n');

  return `
${service.toUpperCase()} Commands:
${'='.repeat(service.length + 10)}

${serviceHelp}

Use 'aws ${service} help <operation>' for more details on a specific command.
  `.trim();
}

// ============================================================================
// AUTOCOMPLETE SUGGESTIONS
// ============================================================================

export function getAutocompleteSuggestions(input: string): string[] {
  const trimmed = input.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);

  // Empty input
  if (!trimmed) {
    return ['aws ec2', 'aws iam', 'aws s3', 'kubectl', 'cloudops', 'help', 'clear'];
  }

  // "aws" -> suggest services
  if (parts.length === 1 && parts[0] === 'aws') {
    return ['aws ec2', 'aws iam', 'aws s3'];
  }

  // "aws <service>" -> suggest operations
  if (parts.length === 2 && parts[0] === 'aws') {
    const service = parts[1];
    const commands = commandRegistry[service as keyof typeof commandRegistry];
    if (commands) {
      return commands.map(cmd => `aws ${service} ${cmd.operation}`);
    }
  }

  // "kubectl ..." -> delegate to the kubectl engine's own suggestions
  if (parts[0] === 'kubectl') {
    return getKubectlAutocompleteSuggestions(trimmed);
  }

  // "cloudops" -> suggest operations
  if (parts.length === 1 && parts[0] === 'cloudops') {
    return ['cloudops get apps', 'cloudops get pods', 'cloudops get deployments', 'cloudops scale app', 'cloudops status'];
  }

  return [];
}

// ============================================================================
// MAIN COMMAND EXECUTOR
// ============================================================================

export function executeCommand(input: string): CommandResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { type: 'info', output: '', timestamp: Date.now() };
  }

  // Handle special commands
  if (trimmed.toLowerCase() === 'help') {
    return { type: 'info', output: getHelp(), timestamp: Date.now() };
  }

  if (trimmed.toLowerCase() === 'clear') {
    return { type: 'info', output: '__CLEAR__', timestamp: Date.now() };
  }

  // kubectl has its own dedicated engine (shared with the Kubectl Lab page)
  if (trimmed.split(/\s+/)[0] === 'kubectl') {
    return executeKubectlCommand(trimmed);
  }

  // Parse command
  const parsed = parseCommand(trimmed);

  // Handle help for specific services
  if (parsed.operation === 'help' || parsed.flags['help']) {
    return { type: 'info', output: getHelp(parsed.service, ''), timestamp: Date.now() };
  }

  // Find and execute command
  const commands = commandRegistry[parsed.service as keyof typeof commandRegistry];

  if (!commands) {
    return {
      type: 'error',
      output: `Command not found: ${trimmed}\nType 'help' for available commands.`,
      timestamp: Date.now(),
    };
  }

  const command = commands.find(cmd =>
    cmd.operation === parsed.operation ||
    (parsed.service === 'cloudops' && `${parsed.operation} ${parsed.rawArgs[0]}` === cmd.name)
  );

  if (!command) {
    return {
      type: 'error',
      output: `Unknown operation: ${parsed.operation}\nUse 'aws ${parsed.service} help' to see available operations.`,
      timestamp: Date.now(),
    };
  }

  try {
    return command.handler(parsed);
  } catch (error) {
    return {
      type: 'error',
      output: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: Date.now(),
    };
  }
}
