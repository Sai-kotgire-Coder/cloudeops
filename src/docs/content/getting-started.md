# Getting Started

CloudOps Simulator is a hands-on playground for learning DevOps and cloud infrastructure by actually doing it, not just reading about it. Every concept you'd normally only encounter in a real job — provisioning servers, writing Terraform, running Ansible playbooks, managing secrets in Vault, driving a Kubernetes cluster with kubectl, wiring up GitOps, building monitoring dashboards — has a real, working lab here that behaves like the real thing, minus the risk of breaking a real production system.

This documentation section is the deep reference: one guide per module, written so a complete beginner can follow along, with enough depth that someone who already knows the basics still learns something. If you'd rather learn a single concept in the moment, look for the **Learn More** button inside each lab — it opens a short, focused explanation of just what you're looking at right now. These docs are for when you want the full picture.

## How the simulator fits together

Everything you do lives inside one simulated environment tied to your account. The **Dashboard** is the control room: it shows your live traffic, CPU, error rate, and score, all driven by a traffic slider you control. Everything else — instances, containers, applications, and every lab — reacts to that same simulated load in real time. This is deliberate: DevOps concepts make a lot more sense once you can see cause and effect. Turn off your load balancer and watch one server get hammered while the others sit idle. Enable auto-scaling and watch new instances appear the moment CPU crosses your threshold. That immediate feedback loop is the entire point of this being a simulator instead of a static tutorial.

Your account has its own private copy of everything: your own instances, your own Terraform state, your own Vault secrets, your own kubectl cluster. Nothing you do here affects any other user, and — just as importantly — nothing here is real infrastructure. You cannot break anything that matters. Break things on purpose. That's how you actually learn what "drift" or a "CrashLoopBackOff" means.

## The three tiers of modules

**Simulator Basics** (Dashboard, Scenarios, Applications, Container Lab, Instances, Networking) are the foundation — the actual simulated infrastructure everything else operates on. Start here if server/container/networking concepts are new to you.

**Operations** (CI/CD, Live Instances, AWS CLI, Tickets, Issues & Alerts) are about running and operating what you've built — deploying changes safely, watching it in real time, responding when something breaks.

**Infrastructure Labs** (Terraform, Ansible, Vault, kubectl, GitOps, Monitoring) are the deep-dive, tool-specific modules. Each one teaches a real, industry-standard tool the way it's actually used, not a simplified toy version of it. These six modules also track your progress — complete enough real activity in one and you'll earn a certificate (see [Certificates](app:/certificates)).

There's no required order, but if you're new to all of this, a reasonable path is: **Dashboard** → **Instances** → **Container Lab** → **Applications** → **Networking**, and only then into the Infrastructure Labs, since those build on concepts (instances, deployments, services) introduced in Simulator Basics.

## Tips for getting the most out of this

- **Break things on purpose.** Turn off the load balancer. Delete a pod that belongs to a Deployment. Simulate drift in Terraform. The simulator is safe specifically so you can see failure modes without consequences.
- **Watch the numbers change, don't just read about them.** Every doc page below shows your own live stats for that module — your real resource counts, your real progress. Use them to check your understanding is actually correct, not just theoretically sound.
- **Use the "Open Module" button** at the top of every doc page below to jump straight into the lab it's describing.
- **Come back after using a lab for a while.** A lot of these concepts (drift, idempotency, self-heal) only really click once you've seen the "before" and "after" with your own eyes.

Pick a module from the sidebar and dig in.
