# Scenarios

Scenarios are guided, objective-based challenges that give you a concrete goal instead of an open-ended sandbox. Where the rest of the simulator lets you explore freely, a Scenario says: "here's a specific situation, here's what success looks like, go fix it."

## What you can do here

- **Browse scenarios** organized by category (fundamentals, deployment strategies, and more) and difficulty (beginner, intermediate, advanced), each with an estimated completion time.
- **Start a scenario** to have the simulator set up a specific starting situation for you automatically — traffic patterns, existing instances, a broken deployment, whatever the scenario calls for.
- **Track objectives** as a checklist that updates live while you work — each objective has a concrete, checkable condition (not "understand load balancing" but "enable a load balancer and reduce error rate below 1%").
- **Use hints** if you're stuck, revealed progressively rather than all at once.
- **Earn XP** on completion, tracked across all the scenarios you've finished.

## Core concepts

### Why objective-based learning works

An open sandbox is great once you already know roughly what you're doing, but it's a poor way to *start* learning something. "Go explore Kubernetes" is a much harder prompt to act on than "your deployment has 3 replicas but only 1 is receiving traffic — fix it." Scenarios exist to give you that second kind of prompt: a specific, checkable goal, with the freedom to solve it however you like using the same real tools (instances, applications, the labs) as everywhere else in the simulator.

### How objectives are checked

Every objective in a scenario has a real, automated condition behind it — a background watcher checks all of your active scenario's objectives continuously, not just when you click a "check" button. That means you can genuinely explore your own approach to a problem and the scenario will notice the moment you've actually solved it, exactly like a real production incident doesn't wait for you to declare it fixed — it's fixed when the metrics say it's fixed.

### Difficulty and categories

Beginner scenarios tend to isolate one concept (e.g. "enable a load balancer"). Intermediate and advanced scenarios combine several concepts and often involve a realistic complication — a deployment strategy gone wrong, a spike that needs both scaling and load balancing to survive. Working through scenarios roughly in order of difficulty is a reasonable way to build up layered understanding rather than being dropped into a multi-part incident before you've seen any of its individual pieces.

## Common beginner mistakes

- **Skipping straight to advanced scenarios.** They often assume you're already comfortable with concepts a beginner scenario would have taught you first.
- **Giving up and checking a hint immediately.** Sitting with a broken objective for a few minutes, forming a hypothesis, and testing it is a large part of what actually builds real troubleshooting skill.
- **Not reading what "success" actually requires.** A scenario's objectives are specific on purpose — re-read them if your fix doesn't seem to register as complete.

## Try it yourself

1. Open [Scenarios](app:/scenarios) and pick a beginner-difficulty one from the fundamentals category.
2. Read every objective before touching anything.
3. Make your changes in whichever module the scenario calls for (often [Instances](app:/instances), [Applications](app:/apps), or [Networking](app:/networking)) and watch the objective checklist update live.
4. Once complete, check your XP total and try an intermediate scenario next.
