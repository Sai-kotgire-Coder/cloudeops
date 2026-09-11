# DevOps Labs — Step-by-Step Guide

This guide walks you through the **Terraform Lab**, **Ansible Lab**, **Vault Lab**, and **GitOps Lab** — four hands-on modules that teach real DevOps tooling concepts by having you actually drive a simplified, real-behavior version of each tool against your simulated infrastructure.

Each section follows the same structure:
1. **The one idea to understand** before you touch anything
2. **Step-by-step walkthrough** — exact buttons/fields to use, in order
3. **Try this next** — a short sequence of exercises that build on each other
4. **Mastery checklist** — the concepts you should be able to explain in your own words once you're done

Do them in order — Terraform → Ansible → Vault → GitOps — since GitOps' commit-based deploy model builds on the "desired state vs. live state" idea Terraform teaches first, and Vault's policy model reuses the least-privilege thinking Ansible's inventory groups warm you up for.

---

## 1. Terraform Lab — Infrastructure as Code

**Where:** sidebar → **Terraform Lab** (`/terraform`)

### The one idea to understand

Terraform never touches infrastructure directly from your config file. It always goes through three distinct stages, and this lab makes all three visible as three separate panels:

| Panel | Real Terraform equivalent | What it means |
|---|---|---|
| **Configuration** | `main.tf` | The infrastructure you *want* |
| **Plan & Apply** | `terraform plan` / `terraform apply` | The diff between what you want and what exists, then executing it |
| **Applied State** | `terraform.tfstate` | What's *actually* running right now |

**Plan is always safe.** It never changes anything — it only computes and shows a diff. **Apply is the only step that changes real infrastructure.**

### Step-by-step walkthrough

1. In the **Configuration** panel, choose a category: **"Cloud Infrastructure"** or **"GitHub / CI Config"**.
   - Cloud Infrastructure gives you 20 resource types (compute instances, load balancers, VPCs, security groups, managed databases, Kubernetes clusters, serverless functions, and more) across three providers: **AWS**, **Google Cloud**, **Azure**.
   - GitHub / CI Config gives you 12 resource types for pipeline infrastructure (repositories, Actions secrets/variables, branch protection rules, deployment environments, webhooks, deploy keys, teams).
2. If you picked Cloud Infrastructure, pick a **provider** from the dropdown — the real Terraform snippet shown below updates instantly to match (AWS uses `aws_instance`, GCP uses `google_compute_instance`, Azure uses `azurerm_linux_virtual_machine`, etc. — this is real, valid HCL, not placeholder text).
3. Read the real Terraform snippet shown under your selection, plus its `variables.tf` and `outputs.tf` — this is exactly what you'd write in a real repository for this resource.
4. Type a resource name (e.g. `web_server`) and click **"Add Block"**. It appears in your Configuration list below, editable inline — you can change any attribute value directly.
5. Click **"Plan"**. The Plan & Apply panel shows a color-coded diff: green rows are **to add**, yellow are **to change**, red are **to destroy**, with a summary line like `Plan: 1 to add, 0 to change, 0 to destroy`.
6. Click **"Apply"**. A confirmation dialog appears — **"Do you want to perform these actions?"** — showing the same diff again. Click **"Yes, apply"**. (If your plan includes any destroys, this button turns red and a warning explains the destroy is irreversible from Terraform's side.)
7. Watch the resource move into the **Applied State** panel — this is your "real" infrastructure now.

### Try this next

1. Add two or three different resources, Plan, Apply — get comfortable with the add-plan-apply loop.
2. Edit an attribute on an already-applied resource in the Configuration panel (don't re-add it, just change a value), then Plan again — notice it now shows as **"to change"** (yellow), not "to add".
3. Remove a resource block entirely from Configuration, Plan again — notice it now shows as **"to destroy"** (red), and Apply it to see the destroy warning dialog.
4. Click **"Simulate Drift"** on an applied resource — this mimics someone changing that resource by hand, outside Terraform. Plan again immediately and see how Terraform detects and reports the drift as a change to reconcile.
5. Click **"Destroy All"** to tear everything down and start clean.

### Mastery checklist

- [ ] I can explain why `plan` never changes anything but `apply` does
- [ ] I can explain what the state file is *for* (why Terraform needs to remember what it built, not just re-read your config)
- [ ] I can explain what "drift" means and why it's dangerous in real infrastructure
- [ ] I understand why real teams require a human to read the plan output before allowing apply in CI/CD

---

## 2. Ansible Lab — Configuration Management

**Where:** sidebar → **Ansible Lab** (`/ansible`)

### The one idea to understand

Terraform provisions infrastructure (creates/destroys resources). Ansible configures things that already exist — installing packages, writing config files, managing services, on hosts you already have. Its defining trait is **idempotency**: running the same playbook twice should change nothing the second time, because the first run already got things into the desired state.

### Step-by-step walkthrough

1. In the **Inventory** panel, add a host: type a hostname (e.g. `web-01`) and a group (defaults to `webservers`), then click **"Add Host"**. Hosts render grouped exactly like a real Ansible inventory file (an INI-style `[webservers]` header with hosts listed under it).
2. In the **Playbook Editor**, pick a module from the dropdown — there are 20 real Ansible modules available, e.g. `ansible.builtin.apt` (Install a Package), `ansible.builtin.template` (Render a Config Template), `ansible.builtin.systemd` (Manage a Service), `ansible.builtin.copy` (Copy a File), `ansible.builtin.user` (Manage a User Account), `ansible.builtin.git` (Clone a Git Repository), `community.docker.docker_container` (Run a Docker Container).
3. Name your task (e.g. "Install nginx") and click **"Add Task"**.
4. In the **Run Playbook** panel, click **"--check"** first — this is a dry run: it previews what *would* happen without changing anything.
5. Click **"Run Playbook"** for real. Watch the log stream in genuine Ansible CLI style:
   ```
   PLAY [webservers] ****...
   TASK [Gathering Facts] ****...
   ok: [web-01]
   TASK [Install nginx] ****...
   changed: [web-01]
   PLAY RECAP ****...
   web-01     : ok=2  changed=1  unreachable=0  failed=0  skipped=0
   ```
6. Click **"Run Playbook"** again with no changes to your tasks. This time every task reports **`ok`** instead of `changed`, and you'll see a toast: *"Playbook run: idempotent — 0 changes, N already ok."* This is the core Ansible promise, made visible.

### Try this next

1. Add hosts to two different groups (e.g. `webservers` and `dbservers`), and add tasks targeting different groups — see how the PLAY header and recap scope to the right hosts.
2. Add three or four tasks that build a real small playbook (install a package → copy a config → manage a service), run it, then run it again to confirm idempotency across the whole playbook, not just one task.
3. Click **"Simulate Drift"** on a converged task in the **Converged State** panel — this mimics someone hand-editing a config file outside Ansible. Run the playbook again and watch Ansible detect and correct it (`changed`, not `ok`, on the next run) — this is Ansible re-asserting desired state, similar in spirit to Terraform's drift detection but happening at every run instead of only on request.

### Mastery checklist

- [ ] I can explain idempotency in my own words, and why it matters for running the same automation repeatedly and safely
- [ ] I can explain the difference between what Terraform manages and what Ansible manages
- [ ] I can read a `PLAY RECAP` line and know what `ok`, `changed`, and `failed` mean
- [ ] I understand why `--check` (dry run) is safe to run against production hosts

---

## 3. Vault Lab — Secrets Management

**Where:** sidebar → **Vault Lab** (`/vault`)

### The one idea to understand

Vault solves one problem: **secrets should never be hardcoded, and access to them should be governed by policy, not by who happens to have the file.** This lab has three layers that build on each other: **engines** (where secrets live), **secrets** (versioned key/value data), and **policies + tokens** (who's allowed to read what).

### Step-by-step walkthrough

1. In the **Engines** panel, pick a secrets engine type from the dropdown (10 are available: **Key/Value Store (v2)**, Dynamic Database Credentials, PKI Certificates, Encryption as a Service, AWS/GCP/Azure Dynamic Credentials, SSH One-Time Passwords, Time-Based One-Time Passwords, Data Masking & Tokenization), confirm or edit the mount path (e.g. `secret`), and click **"Enable"**.
2. In the **Secrets** panel, pick the engine you just enabled from the dropdown, type a secret path (e.g. `myapp/config`), add one or more key/value pairs (e.g. `db_password` = `hunter2`) using **"Add field"**, then click **"Write Secret"**. Notice the live CLI preview above it: `vault kv put secret/myapp/config db_password=hunter2` — that's the real command this represents.
3. Write to the *same* path again with a different value. The secret's badge now reads `v2` — Vault never overwrote your first version, it added a new one. Click the **history icon** on the secret to expand its version list (`v1`, `v2`, ...), then click **"Rollback"** on `v1` — notice this doesn't delete `v2`, it writes a *new* version (`v3`) whose content matches `v1`. This is exactly how real Vault KV v2 rollback works — nothing is ever destructively overwritten.
4. In the **Policies** panel, name a policy (e.g. `myapp-readonly`), set a path pattern (e.g. `secret/data/myapp/*`), and select capabilities (start with just `read` and `list`). Watch the live HCL preview:
   ```
   path "secret/data/myapp/*" {
     capabilities = ["read", "list"]
   }
   ```
   Click **"Create Policy"**.
5. In the **Tokens & Access** panel, name a token (e.g. `myapp-service`), attach the policy you just created, and click **"Create Token"**.
6. Test it: select your token under "as token...", select the secret you wrote under "read secret...", and click **"Attempt Read"**. You should see `$ vault kv get secret/data/myapp/config` followed by a green **"Success — allowed by policy"** and the actual key/value pairs revealed.

### Try this next

1. Create a *second* token with **no** policy attached (or one whose path pattern doesn't match), and attempt to read the same secret — confirm you get a red **"Error: permission denied"**. This is the entire point of Vault: possession of a token is not the same as being authorized.
2. Create a policy scoped to a narrower path (e.g. `secret/data/myapp/config` exactly, no `*`) versus a wildcarded one (`secret/data/myapp/*`), and write secrets at both `myapp/config` and `myapp/other`. Test the same token against both secrets and see which the narrow policy blocks.
3. Write three versions to one secret, then intentionally roll back to an old version and re-verify a token's access still works the same way regardless of version — access control is per-path, not per-version.

### Mastery checklist

- [ ] I can explain why "least privilege" means writing the *narrowest* policy that still works, not the broadest one that's convenient
- [ ] I can explain what KV versioning buys you that a plain overwrite doesn't (audit trail, safe rollback)
- [ ] I can explain the difference between a secret, a policy, and a token, and how they relate
- [ ] I understand why access is denied by default and must be explicitly granted, not the other way around

---

## 4. GitOps Lab — Continuous Deployment from Git

**Where:** sidebar → **GitOps Lab** (`/gitops`)

### The one idea to understand

In GitOps, **Git is the single source of truth.** You never deploy by running a command against a live cluster — you commit a change to a repo, and a controller running in the background continuously makes the live system match what's in Git. Two independent switches control how aggressive that controller is:

- **Auto-Sync** — apply *new commits* automatically, without a manual click
- **Self-Heal** — automatically *revert* any manual change made outside Git (drift)

These solve two different problems, and real Argo CD keeps them as two separate settings for exactly that reason.

### Prerequisite

GitOps deploys to a real Application from your simulator, and that Application needs at least one **instance attached to it** before any deployment can actually go live (pods need somewhere to run). If you haven't already: go to **Applications** → open your app → attach a running instance to it. If you skip this, the GitOps Lab will still work, but syncs will sit in a **"Progressing"** state until an instance is attached — which is itself a useful thing to observe (see step 5 below).

### Step-by-step walkthrough

1. On the GitOps Lab page, fill out **"New Application"**: pick a deploy target (a real Application from your simulator) from the dropdown, name it (e.g. `checkout-gitops`), give it a repo URL (e.g. `https://github.com/acme/gitops-config.git`), and a path (e.g. `manifests/production`). Click **"Create GitOps Application"**.
2. It appears in the list below with **Auto-Sync ON** and **Self-Heal OFF** by default (every new app starts this way — you toggle Self-Heal on explicitly once you're ready).
3. Click on the app row to select it. The **Commit a Change** panel now shows two real manifests: a Kubernetes `Deployment` YAML (your desired replicas/version) and an Argo CD `Application` YAML (how the controller finds and syncs this app) — both update live as you edit fields.
4. Set a version (e.g. `v2`), a replica count (e.g. `3`), write a commit message, and click **"git commit && git push"**.
5. Watch the **Sync Status** badge. Because Auto-Sync is on, it should move through **OutOfSync → Progressing → Synced** within a few seconds, with "Desired" reading `v2 × 3 replicas`. If it stays on **Progressing** for longer than that, it means the destination Application doesn't have running pods for that version yet — go attach an instance to it (see Prerequisite above) and watch it resolve on its own, with no further clicks from you. This "Progressing" state is intentional and honest — it's what a real rollout looks like while it's still landing, not an instant fake success.
6. Go to the **Applications** page and confirm the real app's active version actually changed to `v2` with 3 replicas — this proves GitOps drove the real deployment, not just its own bookkeeping.

### Try this next

1. Turn **Self-Heal** on for the app. Click **"Simulate Drift"** — this mimics someone running `kubectl scale` by hand, outside Git. Watch the badge flip to **OutOfSync**, then — with no action from you — watch it revert back to **Synced** within a couple of seconds. Check the **Recent Activity** log for a "self-healed" event.
2. Turn **Auto-Sync off**, then commit a new version. Notice the badge sits at **OutOfSync** indefinitely this time — because without Auto-Sync, new commits wait for you. Click **"Sync Now"** manually to apply it.
3. Navigate away to a completely different page (e.g. Instances) right after triggering a drift or a commit, then come back a few seconds later. Confirm the reconciliation still happened while you were away — the GitOps controller in this lab runs continuously in the background, on every page, exactly like a real cluster controller does.

### Mastery checklist

- [ ] I can explain the difference between Auto-Sync and Self-Heal, and why they're separate settings
- [ ] I can explain what "OutOfSync" versus "Synced" means, in terms of Git vs. the live system
- [ ] I can explain why a manual `kubectl scale` in a real GitOps-managed cluster is considered a mistake, not a shortcut
- [ ] I understand why the desired state lives in Git commits, not in a dashboard button click

---

## How these four connect

| Lab | Answers the question... |
|---|---|
| **Terraform** | What infrastructure exists, and how do I change it safely? |
| **Ansible** | Once infrastructure exists, how do I configure what's running on it, repeatably? |
| **Vault** | How do I keep the secrets all of the above need out of code and access-controlled? |
| **GitOps** | How do I make "what's in Git" and "what's actually running" continuously agree, without anyone running commands by hand? |

A realistic pipeline in the order you'd actually use these tools: **Terraform** provisions the servers → **Ansible** configures what runs on them → **Vault** supplies the secrets both of those need at runtime → **GitOps** takes over continuous deployment of the application itself from that point forward.
