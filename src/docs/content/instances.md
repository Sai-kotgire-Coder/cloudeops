# Instances

Instances are the actual servers underneath everything — the compute your applications and containers run on. This module covers provisioning them, choosing their size, attaching IAM roles that control what they're allowed to do, and understanding auto-scaling.

## What you can do here

- **Provision instances** of different types, each with a different CPU/memory ceiling and simulated cost.
- **Change an instance's type** after the fact (resizing it, the same way you'd resize a real cloud VM).
- **Attach an IAM role** to an instance, controlling what it's permitted to do.
- **Test storage access** (read/write/delete) against a simulated storage service, and see whether the instance's attached role actually permits it.
- **Watch CPU and memory usage** respond live to whatever traffic is currently hitting that instance.

## Core concepts

### What an instance is, and why sizing matters

An instance is a rented virtual computer: you pick how much CPU and memory it has, the provider boots a virtual machine with that shape, you install and run your software, and you're billed for as long as it runs. Instances are the physical foundation everything else in this simulator sits on top of. Undersize them and they crash the moment real traffic arrives; oversize them and you're paying for capacity that sits idle — sizing instances correctly, and re-sizing them as load changes, is a real, constant cost-vs-reliability tradeoff in every cloud environment.

### IAM: who is allowed to do what

Identity & Access Management is the system that decides, strictly, who — or in this case, *what* (an instance, a service, a pipeline) — is permitted to take a given action. A role carries one or more policies, each a document of Allow/Deny statements, and a Deny always overrides an Allow no matter what else grants access. If an instance needs to read from storage, it needs a role whose policy actually grants that specific permission — nothing is implicitly allowed.

The **Principle of Least Privilege** is the discipline this all points toward: give every instance (and every person) exactly the permissions the job requires, nothing broader "just in case." The reason this matters isn't abstract — a huge share of real security breaches trace back to an application that had far more access than its actual job needed, so when it was compromised, the attacker inherited all of that unused access too. Never attach a broad "admin" role to an application server for convenience; if that app has a vulnerability, an attacker gets everything the role was allowed to touch.

### Auto-scaling (ASG)

An Auto-Scaling Group watches your instances' metrics continuously, compares them to thresholds you set (e.g. "scale out if average CPU exceeds 70%"), and automatically provisions new instances when load is climbing, or terminates idle ones when it's not. This is what lets infrastructure survive a sudden viral spike without a human manually reacting to it in real time — and just as importantly, scales back down afterward so you're not paying for a fleet sized for a spike that already ended.

Always set a sensible maximum. Auto-scaling with no ceiling, combined with a bug that pins CPU artificially high, is a classic (and expensive) real-world incident pattern: the system does exactly what it's told and keeps adding instances that never actually fix the underlying problem.

## Common beginner mistakes

- **Attaching no role at all and being confused why storage access fails.** No role means no permissions — there's no default access to fall back on.
- **Treating a Deny as something you can work around with more Allows.** An explicit Deny always wins, by design — it's meant to be an absolute veto.
- **Forgetting auto-scaling has a maximum for a reason.** An unbounded ASG under a genuine bug can scale indefinitely and rack up real cost with no actual benefit.

## Try it yourself

1. Provision an instance and check its CPU/memory under increasing traffic before resizing it.
2. Attach an IAM role and try all three storage actions (read/write/delete) — note which succeed and which don't based on the role's policy.
3. Enable ASG with a low CPU threshold and a small maximum, push traffic up, and watch new instances get provisioned automatically.
4. Compare this to the [Dashboard](app:/)'s own ASG/HPA toggles — they're driving the exact same underlying mechanism from a different page.
