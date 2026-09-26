# Getting Started

CloudOps Simulator is a hands-on playground for learning DevOps and cloud infrastructure by actually doing it, not just reading about it. Every concept you'd normally only encounter in a real job — provisioning servers, writing Terraform, running Ansible playbooks, managing secrets in Vault, driving a Kubernetes cluster with kubectl, wiring up GitOps, building monitoring dashboards — has a real, working lab here that behaves like the real thing, minus the risk of breaking a real production system.

This page is the full map of the site: every module, every non-module feature (certificates, leaderboard, referrals, community, your account), and how they all fit together. Each section below links to its own deep-dive page for the full detail — treat this one as the table of contents you can always come back to.

> If you'd rather learn a single concept in the moment instead of reading a whole guide, look for the **Learn More** button inside each lab — it opens a short, focused explanation of just what you're looking at right now.

## How the simulator fits together

Everything you do lives inside one simulated environment tied to your account. The **Dashboard** is the control room: it shows your live traffic, CPU, error rate, and score, all driven by a traffic slider you control. Everything else — instances, containers, applications, and every lab — reacts to that same simulated load in real time. This is deliberate: DevOps concepts make a lot more sense once you can see cause and effect. Turn off your load balancer and watch one server get hammered while the others sit idle. Enable auto-scaling and watch new instances appear the moment CPU crosses your threshold. That immediate feedback loop is the entire point of this being a simulator instead of a static tutorial.

Your account has its own private copy of everything: your own instances, your own Terraform state, your own Vault secrets, your own kubectl cluster. Nothing you do here affects any other user, and — just as importantly — nothing here is real infrastructure. You cannot break anything that matters. Break things on purpose. That's how you actually learn what "drift" or a "CrashLoopBackOff" means.

## Finding your way around

- **Sidebar** — every module you've enabled lives here, grouped into Navigation, Upgrade, and Community sections. Collapse it to icon-only with the toggle at the top if you want more screen space; your choice is remembered.
- **Global search** — press **Ctrl+K** (or **Cmd+K** on Mac) anywhere in the app, or click the **Search** button above the sidebar's Navigation section, to jump straight to a module, a doc page, or a matching community submission without clicking through menus.
- **Notifications** — the bell icon in the sidebar footer shows real events as they happen: a certificate earned, a quiz milestone unlocked, a referral bonus landing, a community submission you can now read, or an announcement from the team.
- **Theme** — switch between light and dark from the toggle in the top bar, whichever is easier on your eyes.
- **My Account** — your profile, which modules show in your sidebar, security settings, and your plan all live under your account menu. See [My Account & Plans](app:/docs/account-plans) for the full picture.

## The module groups

**Simulator Basics** (Dashboard, Scenarios, Applications, Container Lab, Instances, Networking) are the foundation — the actual simulated infrastructure everything else operates on. Start here if server/container/networking concepts are new to you.

**Operations** (CI/CD, Live Instances, AWS CLI, Tickets, Issues & Alerts) are about running and operating what you've built — deploying changes safely, watching it in real time, responding when something breaks.

**Infrastructure Labs** (Terraform, Ansible, Vault, kubectl, GitOps, Monitoring) are the deep-dive, tool-specific modules. Each one teaches a real, industry-standard tool the way it's actually used, not a simplified toy version of it. These six also track your progress toward a real certificate — see [Certificates & Quizzes](app:/docs/certificates) for exactly how that works.

There's no required order, but if you're new to all of this, a reasonable path is: **Dashboard** → **Instances** → **Container Lab** → **Applications** → **Networking**, and only then into the Infrastructure Labs, since those build on concepts (instances, deployments, services) introduced in Simulator Basics.

## Beyond the modules: progress, community, and your account

The sidebar's **Community** section and your account menu cover everything that isn't a hands-on lab, but is just as core to the site:

- **[Certificates & Quizzes](app:/docs/certificates)** — how the six tracked labs turn real usage into a genuine, quiz-verified certificate you can print, save, or share publicly.
- **[Leaderboard](app:/docs/leaderboard)** — how your score works, and the workshop-specific cohort view if you came here through a workshop.
- **[Referral Program](app:/docs/referrals)** — your shareable code, and the 50-point bonus you and a referred friend both earn.
- **[Community Library](app:/docs/community-library)** — user-submitted documentation, research, and blog posts, reviewed before publishing, with reactions and comments once live.
- **[My Account & Plans](app:/docs/account-plans)** — your profile, which modules appear in your sidebar, security settings, and what Free vs. Pro actually means.

If your account has admin access, you'll also see an **Admin Panel** entry in the sidebar — that's a separate, staff-facing area for managing users, content, and platform-wide announcements, not covered by these user-facing docs.

## Tips for getting the most out of this

- **Break things on purpose.** Turn off the load balancer. Delete a pod that belongs to a Deployment. Simulate drift in Terraform. The simulator is safe specifically so you can see failure modes without consequences.
- **Watch the numbers change, don't just read about them.** Every doc page shows your own live stats for that module — your real resource counts, your real progress. Use them to check your understanding is actually correct, not just theoretically sound.
- **Use the "Open Module" button** at the top of a lab's doc page to jump straight into it.
- **Come back after using a lab for a while.** A lot of these concepts (drift, idempotency, self-heal) only really click once you've seen the "before" and "after" with your own eyes.
- **Don't skip the milestone quizzes.** They're short on purpose, but they're what actually confirms you understood a module, not just clicked through it.

Pick a module from the sidebar and dig in.
