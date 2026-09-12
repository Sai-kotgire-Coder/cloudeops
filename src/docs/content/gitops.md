# GitOps Lab

GitOps means the desired state of your infrastructure and applications lives in a Git repository, and an automated controller continuously makes the live system match what's in Git — instead of engineers running commands by hand against a live cluster. This lab links a real Git repo path to a real deployed Application from your simulator, and runs an actual reconciliation controller against it in the background.

> Running **3 syncs** completes this module and earns you a certificate — check your progress on the [Certificates](app:/certificates) page.

## What you can do here

- **Create a GitOps Application** linking a repo URL and path to a real destination Application from [Applications](app:/apps).
- **Commit** a version/replica change, updating the desired state.
- **Sync** — apply the desired state to the live destination — manually, or automatically if Auto-Sync is enabled.
- **Simulate drift** by changing the live deployment "by hand," outside Git.
- **Enable Self-Heal** to have the controller automatically revert that drift on its own, running continuously in the background even while you're on a different page.

## Core concepts

### The Application: linking Git to a real destination

An "Application" (borrowing Argo CD's term for it) is the object tying a Git repo path to a specific destination — here, a real Application from your simulator's [Applications](app:/apps) page. It's the thing the controller actually watches and reconciles continuously. Two independent flags control just how automated it is: **Auto-Sync** (apply new commits automatically) and **Self-Heal** (revert manual drift automatically) — deliberately separate settings, because a real team often wants different automation levels for different services (a risky payments service synced manually with human review; a low-risk internal tool fully automated).

### Desired state: the manifest in Git

The "desired state" is simply whatever your latest commit says — not what's currently running, what's *written down*. Committing a version or replica change updates that desired state instantly, but nothing is actually deployed yet on its own; only a sync (auto or manual) makes reality match it. This is what makes a Git commit function as a deploy approval process for free: a pull request against the manifest is reviewable before it ships, `git log` on the manifests directory becomes a complete deploy history (who changed what, when, and why via the commit message), and `git revert` undoes a bad deploy the exact same way it undoes a bad code change — no separate rollback tooling required.

### Sync status: Synced, OutOfSync, and drift

Sync status answers one question continuously: does the live destination currently match the desired state in Git? **Synced** means yes. **OutOfSync** means no — either because a new commit hasn't been applied yet, or because something drifted (someone changed the live deployment directly, outside Git). **Self-Heal** is the controller automatically re-applying the manifest the instant it detects drift, with zero human involvement — and because it reconciles through the exact same apply logic as a normal sync, a self-heal and a routine sync behave identically; there's no special-case "undo" path needed.

This solves a very real problem: an on-call engineer scales something up by hand during an incident to buy time, then — understandably, mid-incident — forgets to update Git afterward. With Self-Heal enabled, the controller reverts that manual scale-up on its own once it notices, rather than that change silently persisting forever, undocumented, until someone eventually notices it doesn't match the manifest.

## Common beginner mistakes

- **Expecting a commit to deploy immediately without Auto-Sync enabled.** A commit only updates desired state — without Auto-Sync (or a manual Sync), it just sits there as OutOfSync.
- **Confusing Auto-Sync and Self-Heal.** They solve two different problems: Auto-Sync reacts to *new commits*; Self-Heal reacts to *unauthorized live changes*. Enabling one doesn't imply the other.
- **Being surprised a brand-new Application shows "Unknown," not OutOfSync.** With no commits yet, there's nothing to compare the live state against.

## Try it yourself

1. Create a GitOps Application linking a repo path to a real deployed Application.
2. Commit a version/replica change with Auto-Sync off, watch it sit OutOfSync, then Sync it manually.
3. Enable Self-Heal, use Simulate Drift to change the live deployment by hand, and watch it self-correct automatically — even after navigating to a different page.
4. Sync 3 times total to complete this module and check [Certificates](app:/certificates).
