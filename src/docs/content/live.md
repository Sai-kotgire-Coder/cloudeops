# Live Instances

Where [Instances](app:/instances) is about provisioning and configuring servers, Live Instances is the operational view: every server grouped by its current real-time status, with the controls you'd actually reach for while on call.

## What you can do here

- **See every instance grouped by status** — running, stopped, crashed, or still booting/provisioning — at a glance.
- **Start, stop, or restart** any instance directly from its card.
- **See live pod counts** running on each instance, alongside overall traffic, CPU, and error rate.
- **Get AI-mentor guidance** reacting to whatever's currently happening in your fleet.
- **Add a new instance** directly from this view when you need more capacity right now.

## Core concepts

### Why a status-grouped view matters operationally

When you're actively responding to a problem, "which of my 15 instances is actually broken right now" is a far more urgent question than "what type of instance is this." Grouping by status — crashed instances surfaced clearly instead of buried in a general list — is exactly the kind of triage view real on-call engineers reach for during an incident: it answers "what's actually wrong, right now" before anything else.

### Booting/provisioning vs. running vs. crashed

A newly-added instance doesn't serve traffic instantly — it spends time **provisioning/booting** first, mirroring the real minute-or-so a cloud VM takes to actually come up before it's ready for load. Once it's **running**, it can serve traffic and host pods. A **crashed** instance stopped responding correctly — the same failure this simulator's [Container Lab](app:/containers) and Dashboard both let you trigger deliberately, but here you're seeing it from the "responding to it live" side rather than the "why did this happen" side.

### Restart vs. stop vs. start

Restarting an instance is often the fastest real recovery action for a crashed one — it clears whatever transient bad state caused the crash and gives it a clean slate, without you needing to fully diagnose the root cause first (a real, common incident-response pattern: restart to restore service quickly, investigate the actual cause afterward, calmly). Stopping an instance removes its capacity deliberately — useful for cost control during low traffic, or to safely take one out of rotation for maintenance without deleting it outright.

## Common beginner mistakes

- **Restarting a crashed instance without checking why it crashed first.** A restart often fixes the symptom immediately, but if the underlying cause (say, sustained traffic beyond its capacity) hasn't changed, it can crash again shortly after.
- **Ignoring instances stuck "provisioning."** A newly-added instance under high traffic conditions may be trying to boot while already overwhelmed — that combination is worth noticing.
- **Treating this as a replacement for actual auto-scaling.** Manually restarting/adding instances works in the moment, but ASG/HPA (see [Instances](app:/instances) and the [Dashboard](app:/)) exist specifically so you don't have to do this by hand every time.

## Try it yourself

1. Push traffic up until at least one instance crashes, and watch it land in the "crashed" group here.
2. Restart it and watch it move back to "running."
3. Add a new instance directly from this page and watch it move from "provisioning" to "running" over a few seconds.
4. Compare this operational view against [Instances](app:/instances)'s configuration-focused view of the exact same servers.
