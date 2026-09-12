# Issues & Alerts

This is the live incident feed for your entire simulated infrastructure — every alert currently active, why it fired, what it affects, and what to do about it. Alerts here come from two sources: this simulator's own built-in auto-detection, and any custom rules you author yourself in the [Monitoring Lab](app:/monitoring).

## What you can do here

- **See every active alert** with its severity (`critical`, `high`, `medium`, `low`) and category (CPU, memory, pod, deployment, traffic, network, performance, capacity).
- **Read the reasoning behind each alert** — why it fired, its likely impact, and a recommended action, not just a bare "something's wrong" message.
- **Acknowledge, investigate, or resolve** an alert as you work it.
- **Watch alerts auto-resolve** the moment the underlying condition actually clears.
- **See alerts you authored yourself** in the Monitoring Lab appear here identically to built-in ones — there's no separate, second alert system.

## Core concepts

### Auto-detection: rules watching your infrastructure continuously

This simulator runs a set of built-in detection rules continuously against your live state — high CPU, high memory, high error rate, a deployment failing outright, pods stuck pending, a traffic overload, an instance still provisioning far longer than expected, and more. Each rule is a condition checked automatically, tick after tick, exactly the way a real monitoring system never stops watching just because nobody's currently looking at a dashboard.

### Why every alert explains itself

A raw "CPU alert" tells you almost nothing actionable. Alerts here carry real context: *why* it fired (the specific condition that was crossed), its *impact* (what this actually means for users or the system), and a *recommendation* (what to actually do about it). This mirrors a genuinely important shift in real observability practice — modern alerting is judged not just on catching problems, but on how fast a human can go from "an alert fired" to "I know what to do next," and a well-written alert message is a large part of achieving that.

### Severity vs. category

Severity is about urgency (how fast this needs eyes on it); category is about *what kind* of problem it is. The two are independent — a `low` severity `memory` alert and a `critical` severity `deployment` alert are both worth tracking, just at very different urgency levels. Grouping and filtering by both together is how a real on-call engineer triages a noisy alert feed down to what actually matters right now.

### Alerts you author yourself

Anything you build in the [Monitoring Lab](app:/monitoring) — an alert rule watching traffic, CPU, error rate, or latency against a threshold you set — fires into this exact same feed, using the exact same underlying mechanism as the simulator's own built-in rules. There's no separate "custom alerts" page; a rule you wrote is treated identically to one the simulator ships with, which is also how it works in a real monitoring stack (Prometheus/Grafana rules and built-in provider alerts typically land in the same incident feed, not two separate ones).

## Common beginner mistakes

- **Only looking at the alert title.** The why/impact/recommendation detail is where the actually useful information lives — read past the headline.
- **Manually resolving something that would have auto-resolved anyway.** If the underlying condition has genuinely cleared, the alert clears itself — manual resolution is for cases where you've fixed something the system can't detect on its own.
- **Writing alert rules so sensitive they fire on normal fluctuation.** A rule that fires constantly gets ignored, in this simulator and in every real on-call rotation — see [Monitoring Lab](app:/monitoring) for why a duration-based threshold ("for 5 minutes," not instantly) usually matters more than the raw number itself.

## Try it yourself

1. Push traffic or CPU high enough to trigger a built-in alert and read its full why/impact/recommendation detail.
2. Build a rule in [Monitoring Lab](app:/monitoring) that will definitely fire, then come back here and confirm it shows up in the same feed.
3. Let the underlying condition recover and watch the alert resolve on its own.
