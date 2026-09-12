# Ansible Lab

Ansible is the industry-standard configuration management tool: keeping servers that already exist set up correctly — packages installed, services running, files in the right place — without SSHing in by hand every time. This lab teaches the real inventory → playbook → idempotency lifecycle.

> Running your playbook **3 times** completes this module and earns you a certificate — check your progress on the [Certificates](app:/certificates) page.

## What you can do here

- **Build an inventory** of hosts, organized into groups.
- **Write playbook tasks** using real Ansible modules, with a live preview of the actual YAML they'd produce.
- **Preview a run** with `--check` before actually running it.
- **Run the playbook for real** against every host in your inventory.
- **Simulate drift** — change a host's configuration "by hand" — and see the next run detect and correct it.

## Core concepts

### Inventory: who this applies to

An inventory is the list of servers Ansible manages, organized into named groups (`webservers`, `dbservers`) so a playbook can target exactly the machines that need it — one server or a thousand, without changing the playbook itself. In real Ansible, this connects over plain SSH; nothing needs to be pre-installed on every managed server, which is why it's called agentless. This lets one playbook apply identically to your entire fleet, or to a newly-added single host, with zero changes to the playbook.

### Playbooks: desired state as a list of tasks

A playbook is a list of tasks, each naming a module (a pre-built unit of work, like "install a package" or "ensure a service is running") along with the parameters it needs. Ansible runs every task across every targeted host, top to bottom, before moving to the next task. A task can `notify` a "handler" — an action, like restarting a service, that only runs if something actually changed — which is exactly how a config change gets picked up without unconditionally restarting a service on every single run.

Real playbooks read close to plain English on purpose: `name: Install nginx`, `name: Ensure nginx is running`. That readability doubles as documentation of what the server setup actually *is*, in a way a hand-written shell script rarely is.

### Idempotency: running it twice is always safe

Idempotency is the property that running the same playbook twice produces the same result as running it once — the second run reports `ok` (nothing needed to change) instead of repeating work or erroring out. Before acting, each module checks the target's current state; if it already matches what the task describes, nothing happens. This is what makes it safe to run a playbook on a recurring schedule (a nightly cron job is a common real pattern) purely to confirm the fleet still matches what's declared — a healthy environment reports `changed=0` on every single scheduled run, and an unexpected `changed` count is itself a useful alert that something drifted.

This is a meaningfully different model from Terraform: Ansible doesn't have a "destroy" phase for removed tasks — deleting a task from a playbook doesn't undo whatever it already did, it just means that task no longer runs going forward. Ansible only knows how to converge *toward* what's currently declared, not track and reverse history the way Terraform's state does.

### Drift, Ansible-style

The same underlying idea as Terraform drift, detected task-by-task instead of resource-by-resource: someone changes a server's configuration by hand between runs, and the next run's module checks notice the mismatch and report `changed` again, converging the host back to what the playbook declares. An unexpected `changed` on what should have been a routine, no-op re-run is a real, useful signal that someone bypassed the normal process — worth investigating, not just silently re-applying and moving on.

## Common beginner mistakes

- **Reaching for `command`/`shell` tasks instead of a dedicated module.** Purpose-built modules (like the package or service modules) are idempotent by default; raw shell commands generally report `changed` every single run whether or not anything actually changed.
- **Expecting a deleted task to undo its previous effect.** Ansible has no destroy phase — removing a task just means it stops running, it doesn't reverse what it already did.
- **Being surprised by an unexpected `changed` on a re-run.** That's almost always drift — something changed outside the playbook since the last run.

## Try it yourself

1. Add a host to your inventory and a task to your playbook, then run it and watch it report `changed`.
2. Run the exact same playbook again immediately — confirm it reports `ok`, not `changed` (idempotency working correctly).
3. Use Simulate Drift on a converged host, then run `--check` to see it reported as `changed` again.
4. Run the playbook 3 times total to complete this module and check [Certificates](app:/certificates).
