# CLI Quick Reference Card

## 🎯 Most Used Commands

| Command | Description |
|---------|-------------|
| `help` | Show all available commands |
| `cloudops status` | System overview |
| `aws ec2 describe-instances` | List all instances |
| `aws ec2 run-instances --instance-type t3.micro` | Create instance |
| `kubectl get pods` | List all pods |
| `kubectl scale deployment app-main --replicas=5` | Scale app |
| `aws iam list-roles` | Show IAM roles |
| `clear` | Clear terminal |

## ⌨️ Keyboard Shortcuts

- `↑` / `↓` - Command history
- `Tab` - Autocomplete
- `Esc` - Close suggestions
- `Enter` - Execute

## 📦 Instance Types

| Type | vCPU | RAM | Max RPS | Cost/hr |
|------|------|-----|---------|---------|
| t3.micro | 2 | 1 GB | 100 | $0.01 |
| t3.small | 2 | 2 GB | 250 | $0.02 |
| m5.large | 2 | 8 GB | 1000 | $0.10 |
| c5.xlarge | 4 | 8 GB | 3000 | $0.17 |

## 🔐 Common Policy ARNs

- `policy-admin` - Full access
- `policy-ec2-full` - EC2 full access
- `policy-ec2-readonly` - EC2 read-only
- `policy-iam-full` - IAM management
- `policy-s3-full` - S3 access

## 🚀 Quick Workflows

### Launch Infrastructure
```bash
aws ec2 run-instances --instance-type m5.large
cloudops get apps
cloudops scale app --app-id app-main --version v1 --replicas 3
```

### Troubleshoot Issues
```bash
aws ec2 describe-instances
aws ec2 reboot-instances --instance-ids inst-123
kubectl get pods
```

### Manage IAM
```bash
aws iam list-roles
aws iam list-policies
aws iam attach-role-policy --role-name DevOpsRole --policy-arn policy-ec2-full
```

## 💡 Pro Tips

1. Use `Tab` for autocomplete
2. Use `↑` to recall last command
3. Check `cloudops status` often
4. Read learning tips after commands
5. Practice with different IAM roles

---

**Full Documentation:** See `CLI_DOCUMENTATION.md`
