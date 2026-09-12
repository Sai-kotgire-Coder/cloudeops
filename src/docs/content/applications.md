# Applications

Applications are what your instances actually run. If Instances are the raw servers, an Application is the deployed piece of software living on them — with its own versions, replica counts, and a deployment strategy governing how you roll out changes to it.

## What you can do here

- **Deploy applications** with a name, image, and port — the same three things you'd specify deploying a real containerized service.
- **Create new deployment versions** (v1, v2, v3...) without taking the current one down.
- **Scale a deployment's replica count** up or down.
- **Switch which version is "active"** — the one actually receiving traffic — instantly.
- **Attach or detach instances** from an application, controlling exactly which servers can run its pods.
- **Choose a deployment strategy** — Rolling or Blue/Green — that changes how a version switch actually happens.

## Core concepts

### Deployments: desired state vs. reality

A Deployment is a declaration: "I want exactly N replicas of this application version running, at all times." You don't manually keep track of individual running copies — you state the number you want, and the system's job is to make reality match that number continuously. If a pod crashes, a replacement is scheduled immediately, without you doing anything. This is what "self-healing infrastructure" actually means in practice: the system watches live pod count against your desired replica count, every single tick, and reconciles the difference.

### Services: a stable address for something that keeps changing

Individual pods are disposable — they get created, crash, and get replaced constantly, each with a new identity every time. If something like a user's browser had to track individual pod addresses directly, everything would break every time a pod restarted. A Service solves this by giving a stable address to *whichever* pods currently match a given version, so traffic always has somewhere reliable to go regardless of what's happening underneath.

The **active version** you see in Applications is exactly this idea: it's what the Service currently points traffic at. Switching it is instant from the user's perspective — traffic starts flowing to the new version's pods with no reconfiguration needed anywhere else.

### Rolling vs. Blue/Green deployments

**Rolling** deployments replace pods gradually, one (or a few) at a time — always some capacity running the old version and some running the new, until the rollout finishes. It's resource-efficient (never running two full fleets at once) but a rollback mid-rollout means some traffic already saw the new version.

**Blue/Green** deployments run the old version ("blue") and the new version ("green") fully side-by-side, then switch all traffic over in one instant move. Rollback is equally instant — just switch the Service back to blue. It costs more (you're running double the infrastructure during the switch), but it's the safer option when a bad version needs to be reversible in seconds, not minutes.

Real teams often combine ideas from both with a **canary** release: send a small percentage of traffic to the new version first, watch its error rate for a few minutes, and only then roll it out fully — catching a bad release while it's only affecting a handful of users instead of everyone.

## Common beginner mistakes

- **Scaling to zero and being surprised traffic fails.** A deployment version with 0 replicas has nowhere to route requests — this is often exactly what "misconfigured Service" bugs look like in real incidents too.
- **Switching the active version before the new one has any running pods.** Create the deployment and let it have running replicas *before* cutting traffic over to it.
- **Not attaching enough instances.** A deployment can want as many replicas as you like, but pods still need somewhere (an attached instance) to actually run.

## Try it yourself

1. Create an application in [Applications](app:/apps), attach it to at least one instance from [Instances](app:/instances).
2. Create a second version and scale it up before switching traffic to it.
3. Switch the active version and watch traffic move over instantly.
4. Try both strategies (Rolling vs. Blue/Green) on different applications and compare how each one behaves during the switch.
