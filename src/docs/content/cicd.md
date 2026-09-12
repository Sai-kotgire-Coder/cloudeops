# CI/CD

CI/CD (Continuous Integration/Continuous Deployment) automates the entire path from committed code to a running deployment. This module runs a real, staged pipeline — Checkout → Build → Test → Dockerize → Push → Deploy — for every pipeline you trigger, and lets you choose a deployment strategy and environment for each run.

## What you can do here

- **Trigger a pipeline** with a commit message, branch, target environment (dev/staging/production), and deployment strategy.
- **Watch each of the 6 stages execute in order**, each one gating the next — a failure at any stage stops the whole pipeline.
- **Review pipeline history**, including status, version, environment, and duration for every past run.
- **Roll back** to the last successful deployment in a given environment, instantly.

## Core concepts

### The pipeline as a sequence of gates

A CI/CD pipeline isn't one step — it's a sequence where each stage has to succeed before the next one even starts. **Checkout** pulls the code. **Build** installs dependencies and compiles it into something runnable. **Test** runs automated unit, integration, and end-to-end checks — this is the safety net that catches bugs *before* a human ever sees them in production, and any failure here blocks the deploy entirely rather than shipping a known-broken build. **Dockerize** packages the built code into an image. **Push** uploads that image to a registry (a central store other servers can pull it from). **Deploy** finally runs it in the target environment, with health checks confirming it actually came up correctly.

Real companies run this at extreme scale and speed — Amazon deploys to production roughly every 12 seconds somewhere in their systems; Netflix deploys thousands of times a day across its microservices. None of that speed would be trustworthy without the Test stage acting as a hard gate every single time.

### Choosing an environment and strategy

Pipelines target **dev**, **staging**, or **production** — the standard progression is to prove a change in dev, then staging, before it ever reaches production, since each stage carries progressively higher stakes if something's wrong. The **deployment strategy** you choose (Rolling, Blue/Green, or Canary — see the [Applications](app:/apps) doc for how Rolling vs. Blue/Green actually differ) governs *how* the Deploy stage replaces the running version, trading off speed, resource cost, and how easy an immediate rollback is.

### Rollback: the emergency eject button

If a deployment turns out to be bad — error rates spike, something's clearly broken — rollback reverts an environment to its last known-good version, in seconds, without needing to build and ship a brand-new fixed release under pressure. This isn't a hypothetical safety net: real incident postmortems (Facebook's 2021 outage is a well-known example) repeatedly cite *inability* to roll back quickly as what turned a bad deploy into an extended outage, versus organizations like GitHub that automatically roll back a meaningful percentage of deployments within minutes based on health-check monitoring.

### Pipeline monitoring

Every pipeline run is logged — status, version, environment, duration — which turns deployments from a black box into something measurable. Real DevOps teams track specific numbers from this data (the "DORA metrics": deployment frequency, lead time for changes, mean time to recovery, and change failure rate) specifically because you can't improve a process you can't see. A spike in failed pipelines, or in one particular stage consistently failing, is a concrete signal worth investigating rather than a vague feeling that "deploys have been rough lately."

## Common beginner mistakes

- **Deploying straight to production without proving it in staging first.** Nearly every real incident postmortem includes some version of "we skipped staging because we were in a hurry."
- **Treating rollback as a last resort instead of a normal tool.** A fast rollback that buys time to fix the real bug calmly is a *good* outcome, not a failure.
- **Ignoring pipeline history until something breaks.** Patterns (tests failing more often on certain branches, one stage being consistently slow) are visible in the history long before they become an incident.

## Try it yourself

1. Trigger a pipeline targeting `dev` and watch all 6 stages run in sequence.
2. Trigger another targeting `production` with a different deployment strategy and compare how the Deploy stage behaves.
3. Deliberately trigger a rollback and confirm the environment reverts to the previous version.
4. Check the pipeline history to see the full record of what you just did.
