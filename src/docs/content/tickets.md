# Tickets

Tickets represent the operational incident-tracking side of DevOps — issues that get raised, assigned, worked, and formally closed, with a full record of what happened. Some tickets are created automatically from real conditions detected elsewhere in your infrastructure; you can also see how they progress from `open` to `closed`.

## What you can do here

- **View tickets** by status (`open`, `in_progress`, `resolved`, `closed`), priority (`critical`, `high`, `medium`, `low`), and category (CPU, memory, scaling, deployment, network, pod, service, container, load balancer).
- **Work a ticket** through its lifecycle from open to closed.
- **See tickets auto-generated** from real conditions elsewhere in the simulator — an overloaded instance or a crashed deployment can raise a ticket automatically, the same way real monitoring tools file incidents without a human noticing first.
- **Read each ticket's numbered ID**, description, and category, formatted the way a real ticketing system (Jira, ServiceNow, PagerDuty) would present an incident.

## Core concepts

### Why tickets exist alongside alerts

An alert (see [Issues & Alerts](app:/issues)) is the *signal* that something's wrong, firing the moment a threshold is crossed. A ticket is the *unit of work* to actually resolve it — assigned, tracked, and eventually closed with a record of what was done. Not every alert needs a ticket (a five-second blip that self-resolves usually doesn't), but anything that needs a human to investigate or fix generally does. Keeping this distinction clear — a firehose of alerts vs. a smaller, curated set of things actually being worked — is exactly how real on-call rotations stay sane instead of drowning in noise.

### Priority and category

Priority (`critical` down to `low`) is about urgency — how fast this needs attention. Category (`cpu`, `memory`, `deployment`, `network`, and so on) is about *what kind* of problem it is, useful for spotting patterns: if most of this week's tickets are category `scaling`, that's a signal your auto-scaling thresholds might need tuning, not that this week was just unlucky.

### The lifecycle: open → in_progress → resolved → closed

A ticket starts `open` (raised, nobody's started on it yet), moves to `in_progress` once someone's actively working it, becomes `resolved` once the fix is in and verified, and finally `closed` once everything's confirmed settled (sometimes distinct from "resolved" if there's a follow-up verification period in a real process). This lifecycle is deliberately similar across almost every real incident-management tool for a reason: it's a proven shape for making sure nothing quietly falls through the cracks between "noticed" and "actually done."

## Common beginner mistakes

- **Treating every ticket as equally urgent.** Priority exists precisely so a `critical` production issue doesn't sit behind three `low` priority ones in your attention.
- **Closing a ticket without actually verifying the fix.** A resolved-but-unverified issue that recurs is a common, avoidable source of repeat incidents.
- **Ignoring category patterns.** A category showing up repeatedly is usually a sign of a systemic issue worth fixing at the root, not five unrelated one-off problems.

## Try it yourself

1. Push traffic high enough to crash something elsewhere in the simulator (an overloaded instance is a reliable way) and watch a ticket appear here automatically.
2. Open it, note its priority and category, and walk it through to `closed`.
3. Compare the ticket's description against the alert that likely triggered it on [Issues & Alerts](app:/issues).
