# Monitoring Lab

Monitoring means continuously collecting metrics from a running system and giving humans two things: dashboards to see the current state at a glance, and alert rules that fire the moment a metric crosses a threshold that actually matters. This lab lets you build both against your own simulator's real, live metrics — not synthetic sample data.

> Creating **2 dashboard panels and 2 alert rules** (both, at once) completes this module and earns you a certificate — check your progress on the [Certificates](app:/certificates) page.

## What you can do here

- **Build dashboard panels** charting a live metric — Traffic, CPU Average, Error Rate, or Latency Average — the exact same numbers driving your [Dashboard](app:/).
- **Author alert rules**: pick a metric, an operator (`>`, `>=`, `<`, `<=`), and a threshold.
- **Watch rules evaluate automatically** every few seconds while the page is open, against your simulator's actual current state.
- **See a fired rule become a real alert**, visible on [Issues & Alerts](app:/issues) — not a separate, parallel notification system.
- **Watch alerts auto-resolve** the moment the underlying metric recovers.

## Core concepts

### Dashboards: seeing trends, not just a single number

A metrics system (Prometheus is the industry-standard example) scrapes numeric time-series data from a running service on a regular interval. A dashboard tool (Grafana, most commonly) queries that data and renders it as graphs, so an on-call engineer can see a *trend* — traffic climbing steadily over the last 20 minutes — not just a single instantaneous reading that tells you nothing about direction. Panels in this lab work the same way: each one charts one specific metric continuously, exactly what a real Grafana panel does against a real Prometheus query.

### Alert rules: a query plus a threshold

An alert rule is genuinely simple in concept: a metric, a comparison, and a threshold — "if error rate stays above 5%, fire." When a rule crosses its threshold, it *fires*, creating an active alert that stays open until the underlying metric actually recovers, at which point it auto-resolves with no manual intervention needed. The hard part of real alerting isn't the mechanism, it's *tuning* — a rule that's too sensitive pages people over normal, harmless fluctuation, and they quickly learn to ignore pages entirely (a genuinely dangerous outcome, since it means the *next* real incident gets ignored too); a rule that's too loose lets a real, actionable problem run unnoticed for far too long.

Real alerting systems almost always require a threshold to be breached *for a duration* — "above 5% for 5 minutes" — rather than firing instantly on one noisy reading. Worth thinking about for every rule you write here: what duration would make it a meaningful signal instead of noise?

### One alert system, not two

A rule you author here fires into the exact same alert feed as every built-in alert on [Issues & Alerts](app:/issues) — there's no separate "Monitoring Lab alerts" list. This mirrors how real observability stacks actually work: a Prometheus alerting rule and a cloud provider's built-in alert typically land in the same incident feed, on the same on-call pager, not two different ones a human has to separately watch.

## Common beginner mistakes

- **Writing a rule with an unrealistic threshold that will never fire.** Check the current value on your Dashboard first, and set a threshold you'll actually see crossed under real simulator conditions.
- **Writing a rule so sensitive it fires constantly.** A rule that never stops firing teaches you (and would teach a real on-call team) to tune it out — exactly the failure mode worth avoiding.
- **Building only panels, or only rules.** Completing this module specifically requires both — dashboards and alerting are two different, complementary halves of real monitoring, not substitutes for each other.

## Try it yourself

1. Add a panel for Traffic and a panel for CPU Average, and watch their live values update.
2. Author an alert rule against a metric and threshold you know your current simulator state will cross.
3. Wait for it to fire, then check [Issues & Alerts](app:/issues) to confirm the same alert appears there.
4. Push the underlying metric back below threshold and watch it auto-resolve in both places.
5. With 2 panels and 2 rules created, check [Certificates](app:/certificates) for your new certificate.
