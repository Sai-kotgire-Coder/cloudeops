# kubectl Lab

kubectl is the command-line tool for talking directly to a Kubernetes cluster — listing what's running, digging into why something is broken, and making changes, all without a UI standing in between you and the cluster. This lab is a real terminal operating against the exact same cluster state as the rest of the simulator.

> Running **10 mutating commands** (delete, scale, rollout, apply, create, or expose) completes this module and earns you a certificate — check your progress on the [Certificates](app:/certificates) page.

## What you can do here

- **List and inspect resources**: `get pods`, `get nodes`, `get deployments`, `get services`, `describe pod/deployment/node`.
- **Mutate the cluster**: `delete pod`, `scale deployment`, `rollout restart/undo`, `apply -f`, `create deployment`, `expose deployment`.
- **Troubleshoot live**: `logs`, `exec`, `top pods`.
- **Check cluster-level info**: `cluster-info`, `config current-context`.

## Core concepts

### Pods, Deployments, and Nodes

A **Pod** is one running instance of your container — usually one container, sometimes a few tightly-coupled ones sharing network and storage. A **Deployment** declares how many pod replicas should exist and manages replacing them — you manage the Deployment, and it manages the Pods, not the other way around. A **Node** is the actual machine pods run on. `kubectl get pods -o wide` shows which node each pod landed on — often the first clue when a crashing pod's real problem is actually that node being out of resources, not the application itself.

Deleting a pod that belongs to a Deployment doesn't reduce its replica count — a replacement gets scheduled immediately. This is the core self-healing behavior of Kubernetes: you declare "I want 3," and the system keeps making that true regardless of what happens to any individual pod.

### Declarative (`apply`) vs. imperative (`create`)

`kubectl create`, `scale`, and `expose` are imperative: fast, direct, one-shot actions — great for quick exploration, but nothing about them is recorded anywhere. `kubectl apply -f file.yaml` is declarative: you describe the end state you want in a file, and Kubernetes reconciles toward it. Running the same `apply -f` twice is safe and idempotent — if nothing in the file changed, nothing happens, the exact same idea as Ansible's idempotency.

This is exactly the same declarative-vs-imperative distinction that shows up between Terraform and a hand-run cloud CLI command. Real teams almost always run declarative YAML through CI/CD in production, treating imperative commands as scratch work for exploration or a genuine one-off emergency fix — not something to build a lasting deployment on.

### Rollouts: status, restart, undo

A "rollout" is Kubernetes updating a Deployment's pods to match a new desired state. `rollout status` reports whether it finished successfully — this is what CI/CD pipelines typically poll to know a deploy actually succeeded, not just that the command was accepted. `rollout restart` recreates every pod one at a time with zero downtime, the standard way to force pods to pick up a changed config without changing the image itself. `rollout undo` reverts to the previous revision — Kubernetes keeps a revision history per Deployment specifically so this has something to roll back to. A bad deploy becomes recoverable in seconds with `undo`, buying time to actually fix the real bug without user-facing pressure.

### Troubleshooting: logs, exec, top

`logs` shows a container's actual output — usually the fastest path to a real root cause, since it often contains the exact error message or stack trace. `exec` runs a one-off command inside a running container, letting you check things a log line never mentioned. `top pods` shows live CPU/memory usage, catching resource exhaustion before it becomes a full outage rather than only after. None of these three commands change anything — they're purely for observation, which is exactly why they're usually the first thing to reach for, not the last.

## Common beginner mistakes

- **Restarting a crashing pod before checking its logs.** A restart can throw away the exact evidence (stack trace, error output) you needed to actually diagnose it.
- **Treating `create`/`scale` as the "real" way to deploy.** In practice, most real production changes go through declarative `apply -f` via CI/CD, not hand-run imperative commands.
- **Trying `exec` on a pod that isn't running.** There's nothing to attach a shell to on a crashed pod — check its status first.

## Try it yourself

1. Run `kubectl get pods` and `kubectl describe pod <id>` on one of them.
2. Scale a deployment with `kubectl scale deployment <name> --replicas=N`, then check `kubectl get deployments`.
3. Deliberately roll back a deployment with `kubectl rollout undo deployment <name>`.
4. Run 10 mutating commands total to complete this module and check [Certificates](app:/certificates).
