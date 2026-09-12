# Terraform Lab

Terraform is the industry-standard tool for Infrastructure as Code (IaC): describing the infrastructure you want in text files instead of clicking through a cloud console, then letting a tool figure out exactly what to create, change, or destroy to make reality match. This lab teaches the real plan → apply → state → drift lifecycle, not a simplified stand-in for it.

> Applying your configuration **3 times** completes this module and earns you a certificate — check your progress on the [Certificates](app:/certificates) page.

## What you can do here

- **Author resource blocks** describing infrastructure you want (a server, a load balancer, a security group) with real attributes.
- **Run Plan** to preview exactly what would change, before anything actually happens.
- **Apply** the plan to make it real, updating your state to match.
- **Inspect your state** — what Terraform actually believes exists, separate from your configuration.
- **Simulate drift** — mutate a resource "by hand," outside Terraform — and watch the next plan detect the mismatch.

## Core concepts

### Resource blocks: the basic unit

A resource block declares one piece of infrastructure and the settings it should have. In real Terraform this is HCL syntax — `resource "type" "name" { ... }` — where the type picks what kind of infrastructure you want and the name is a local label you choose to reference it elsewhere. Every resource block you write is read together as your complete desired end-state; Terraform's whole job is making real infrastructure match that description.

This is fundamentally different from clicking through a console: your infrastructure becomes reviewable, versioned in git, and repeatable — the same discipline you already apply to application code, applied to the servers and networks underneath it.

### Plan vs. Apply: preview before you commit

`terraform plan` computes the difference between three things — your configuration, your recorded state, and (in real Terraform) the actual live infrastructure — and classifies every resource as create, update-in-place, destroy, or no-op. Critically, **a plan never changes anything** — it's always safe to run, purely informational. `terraform apply` is the separate step that actually executes those changes.

This separation is exactly what catches "wait, that would destroy my database?" before it happens instead of after. Most real teams require a human to read and approve a plan's output — often as a required check in a CI/CD pipeline — specifically because plan surfaces destructive changes ahead of time, not as a post-incident surprise.

### State: Terraform's memory of what it built

The state file is Terraform's record of what it actually created, mapping every resource block to the real object it corresponds to and that object's current attributes. Without it, Terraform would have no way to know what it already built, no way to compute a meaningful diff on the next plan, and no way to safely tear things down. In real Terraform, state is often stored remotely (S3, Terraform Cloud) so an entire team can share and collaborate against the same source of truth.

### Drift: when reality quietly stops matching state

Drift happens when real infrastructure changes outside of Terraform — someone edits something by hand in a cloud console during an incident, or an automated process changes it — so the actual resource no longer matches what Terraform's state recorded. Terraform has no way to know this happened until the next plan runs and compares state against reality, discovering the mismatch and proposing to reconcile it (usually by reverting the manual change back to what the config says).

This is one of the single most common real-world Terraform problems, and it usually has a very human origin story: an engineer bumps something by hand to fix an incident fast, forgets to update the actual Terraform config, and weeks later a routine apply silently reverts that fix — reintroducing the very problem it solved. Running `plan` on a schedule, purely to detect drift even with no config changes pending, is a common real defense against exactly this.

## Common beginner mistakes

- **Applying without reading the plan.** The plan's whole purpose is catching a mistake before it's real — skipping straight to apply defeats that.
- **Hand-editing state.** State should only ever be changed by Terraform itself running plan/apply — never edited directly.
- **Ignoring an unexpected plan diff.** If a plan shows a change you didn't make in your config, that's drift, and it's worth investigating who or what changed the real resource before blindly applying to revert it.

## Try it yourself

1. Add a resource block, run Plan, review the diff, then Apply it.
2. Change an attribute and repeat Plan → Apply to see an update-in-place.
3. Use Simulate Drift on an applied resource, then run Plan again and watch Terraform detect and report the mismatch.
4. Apply 3 times total to complete this module and check [Certificates](app:/certificates) for your new certificate.
