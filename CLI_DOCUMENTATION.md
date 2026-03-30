# CloudSimulator AWS CLI Documentation

## 🎯 Overview

The CloudSimulator CLI is a realistic AWS Command Line Interface simulator that teaches DevOps workflows through hands-on practice. It supports real AWS CLI syntax and integrates with the simulator's IAM system.

## 🚀 Quick Start

### Basic Commands

```bash
help                    # Show all available commands
clear                   # Clear terminal history
cloudops status         # Show system status
```

### Keyboard Shortcuts

- `↑` / `↓` - Navigate command history
- `Tab` - Autocomplete commands
- `Esc` - Close suggestions
- `Enter` - Execute command

---

## 📦 AWS EC2 Commands

Manage virtual server instances (EC2).

### `aws ec2 describe-instances`

Lists all EC2 instances with their status, CPU, memory, and RPS.

```bash
aws ec2 describe-instances
aws ec2 describe-instances --instance-ids inst-123
```

**IAM Permission Required:** `cloudsim:DescribeInstances`

### `aws ec2 run-instances`

Launch a new EC2 instance.

```bash
aws ec2 run-instances --instance-type t3.micro
aws ec2 run-instances --instance-type m5.large --iam-instance-profile role-admin
```

**Available Instance Types:**
- `t3.micro` - 2 vCPU, 1 GiB RAM, 100 RPS max, $0.0104/hr
- `t3.small` - 2 vCPU, 2 GiB RAM, 250 RPS max, $0.0208/hr
- `m5.large` - 2 vCPU, 8 GiB RAM, 1000 RPS max, $0.0960/hr
- `c5.xlarge` - 4 vCPU, 8 GiB RAM, 3000 RPS max, $0.1700/hr

**IAM Permission Required:** `cloudsim:RunInstances`

### `aws ec2 terminate-instances`

Shut down and remove an instance.

```bash
aws ec2 terminate-instances --instance-ids inst-123
```

**IAM Permission Required:** `cloudsim:TerminateInstances`

### `aws ec2 reboot-instances`

Reboot a crashed or hung instance.

```bash
aws ec2 reboot-instances --instance-ids inst-123
```

**IAM Permission Required:** `cloudsim:RebootInstances`

---

## 🔐 AWS IAM Commands

Manage Identity and Access Management (roles, policies, permissions).

### `aws iam list-roles`

Display all IAM roles in the system.

```bash
aws iam list-roles
```

**IAM Permission Required:** `cloudsim:IAMListRoles`

### `aws iam list-policies`

List all IAM policies (AWS managed and customer managed).

```bash
aws iam list-policies
aws iam list-policies --scope AWS      # Only AWS managed
aws iam list-policies --scope Local    # Only customer managed
```

**IAM Permission Required:** `cloudsim:IAMListPolicies`

### `aws iam attach-role-policy`

Attach a policy to a role to grant permissions.

```bash
aws iam attach-role-policy --role-name DevOpsRole --policy-arn policy-ec2-full
```

**IAM Permission Required:** `cloudsim:IAMAttachRolePolicy`

**Common Policy ARNs:**
- `policy-admin` - AdministratorAccess (full permissions)
- `policy-ec2-full` - AmazonEC2FullAccess
- `policy-ec2-readonly` - AmazonEC2ReadOnlyAccess
- `policy-iam-full` - IAMFullAccess
- `policy-s3-full` - AmazonS3FullAccess

---

## 🗂️ AWS S3 Commands (Simulated)

Interact with S3 object storage (simulated for learning).

### `aws s3 ls`

List S3 buckets or objects.

```bash
aws s3 ls                      # List all buckets
aws s3 ls s3://my-bucket       # List objects in bucket
```

**IAM Permission Required:** `s3:ListBucket`

### `aws s3 cp`

Copy files to/from S3.

```bash
aws s3 cp file.txt s3://my-bucket/
aws s3 cp s3://my-bucket/file.txt .
```

**IAM Permission Required:** `s3:PutObject`

### `aws s3 mb`

Create a new S3 bucket.

```bash
aws s3 mb s3://my-new-bucket
```

**IAM Permission Required:** `s3:CreateBucket`

---

## ☁️ CloudOps Custom Commands

CloudSimulator-specific commands for managing applications and pods.

### `cloudops get apps`

List all applications deployed in the system.

```bash
cloudops get apps
```

**Output:** Application name, active version, total replicas, deployments

### `cloudops get pods`

List all pods running across all instances.

```bash
cloudops get pods
cloudops get pods --app app-main    # Filter by application
```

**Output:** Pod ID, application, version, status, CPU%, RPS

### `cloudops get deployments`

List all deployments with their replica counts.

```bash
cloudops get deployments
cloudops get deployments --app app-main    # Filter by application
```

### `cloudops scale app`

Scale an application deployment by changing replica count.

```bash
cloudops scale app --app-id app-main --version v1 --replicas 5
```

**Learning Tip:** This demonstrates horizontal scaling - adding more copies of your app to handle increased load.

### `cloudops status`

Show comprehensive system status.

```bash
cloudops status
```

**Output:** Instances, traffic, CPU, error rate, load balancer status, ASG/HPA status

---

## ☸️ Kubectl Commands

Kubernetes-style commands for pod orchestration.

### `kubectl get pods`

List all pods in the cluster.

```bash
kubectl get pods
kubectl get pods --namespace default
```

### `kubectl get nodes`

List all nodes (instances) in the cluster.

```bash
kubectl get nodes
```

### `kubectl scale deployment`

Scale a deployment to a specific number of replicas.

```bash
kubectl scale deployment app-main --replicas=5
kubectl scale deployment frontend-web-app --replicas=3
```

**Note:** Use the lowercase, hyphenated version of the app name.

---

## 🎓 Learning Features

### Educational Tips

After executing commands, you'll see learning tips that explain:
- What the command does in real AWS/cloud environments
- Best practices for DevOps engineers
- Common use cases and gotchas

Example:
```
✓ Instance creation initiated
Instance Type: m5.large
Status: Provisioning

💡 You just launched a virtual server! In production AWS, this command 
would create an EC2 instance that can run applications, process data, 
or host websites.
```

### IAM Permission System

All commands respect IAM permissions. If you don't have the required permission:

```
An error occurred (AccessDenied) when calling the RunInstances operation: 
User: arn:aws:iam::123456789012:user/DevOpsRole is not authorized to perform: 
cloudsim:RunInstances on resource: *
```

This teaches you how AWS IAM works in real environments!

---

## 🔍 Help System

Get help at any level:

```bash
help                        # General help
aws help                    # AWS services overview
aws ec2 help                # EC2 commands
aws ec2 help run-instances  # Specific command help
```

---

## 💡 Example Workflows

### 1. Launch and Manage Infrastructure

```bash
# Check current instances
aws ec2 describe-instances

# Launch a new instance
aws ec2 run-instances --instance-type m5.large

# Check system status
cloudops status

# Scale application
cloudops scale app --app-id app-main --version v1 --replicas 3
```

### 2. Troubleshooting Crashed Instances

```bash
# Find crashed instances
aws ec2 describe-instances

# Reboot crashed instance
aws ec2 reboot-instances --instance-ids inst-123

# Check pod health
kubectl get pods
```

### 3. IAM Management

```bash
# View available roles
aws iam list-roles

# See all policies
aws iam list-policies

# Grant EC2 permissions to a role
aws iam attach-role-policy --role-name DevOpsRole --policy-arn policy-ec2-full
```

### 4. Kubernetes Operations

```bash
# View cluster nodes
kubectl get nodes

# View all pods
kubectl get pods

# Scale deployment
kubectl scale deployment frontend-web-app --replicas=10
```

---

## 🎮 Command History

Navigate through previously executed commands:

1. Press `↑` to go back in history
2. Press `↓` to go forward in history
3. Edit the recalled command and press `Enter` to execute

---

## ✨ Autocomplete

Start typing and press `Tab` to see suggestions:

```bash
aws [Tab]           → shows: aws ec2, aws iam, aws s3
aws ec2 [Tab]       → shows all ec2 operations
kubectl [Tab]       → shows kubectl operations
```

---

## 🚀 Pro Tips

1. **Use Tab Completion** - Don't type full commands manually, use Tab to autocomplete
2. **Check Permissions** - If a command fails with AccessDenied, use `aws iam list-roles` to see your current role
3. **Monitor Resources** - Run `cloudops status` frequently to understand system state
4. **Learn by Doing** - Read the learning tips after each command execution
5. **Practice Real Syntax** - These commands mirror real AWS CLI, so you're learning production skills!

---

## 🔧 Advanced Usage

### Combining Commands

```bash
# Scale infrastructure horizontally
aws ec2 run-instances --instance-type t3.small
kubectl scale deployment app-main --replicas=5

# Investigate performance issues
cloudops status
aws ec2 describe-instances
kubectl get pods
```

### Instance Types Selection Guide

| Type | Use Case | Cost |
|------|----------|------|
| `t3.micro` | Development, low traffic | Lowest |
| `t3.small` | Small production workloads | Low |
| `m5.large` | General purpose production | Medium |
| `c5.xlarge` | High CPU workloads | High |

---

## 📚 Further Learning

The CLI teaches core DevOps concepts:

- **Infrastructure as Code** - Managing cloud resources via commands
- **Auto-scaling** - Responding to traffic changes
- **IAM Security** - Principle of least privilege
- **Container Orchestration** - Kubernetes pod management
- **Cloud Economics** - Balancing performance and cost

Practice these commands in the simulator to build real-world DevOps skills!

---

## ⚠️ Known Limitations

This is a simulator for education, not a production AWS CLI. Differences:

- **Simulated S3** - S3 commands return mock data
- **Limited Command Set** - Only core DevOps commands are implemented
- **Simplified Permissions** - Real AWS IAM is more complex
- **Instant Provisioning** - Real EC2 instances take minutes to launch

These limitations keep the focus on learning workflows without unnecessary complexity.

---

## 🎯 What's Next?

After mastering the CLI:

1. Try combining CLI with the web UI to see real-time effects
2. Enable auto-scaling (ASG, HPA) and watch the CLI reflect changes
3. Experiment with IAM roles to understand permission boundaries
4. Use the CLI to respond to traffic spikes and system outages

**Remember:** The best way to learn is by doing! Type `help` and start exploring. 🚀
