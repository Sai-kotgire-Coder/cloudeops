# Dashboard

The Dashboard is the control room for your entire simulated infrastructure. Every other module — instances, containers, applications, all six labs — reacts to the same simulation running behind this page. If you only ever look at one page to understand "is my infrastructure healthy right now," this is it.

## What you can do here

- **Start or pause the simulation** with the play/pause control — while running, a tick advances every second, moving traffic, recalculating CPU/memory, and checking every alert rule against current state.
- **Drag the traffic slider** to set how many requests per second (RPS) are hitting your infrastructure. This is the single input that drives almost everything else on this page.
- **Toggle Auto-Scaling (ASG)** to automatically add or remove instances based on CPU thresholds you set.
- **Toggle the Horizontal Pod Autoscaler (HPA)** to automatically add or remove pod replicas the same way, at the application layer instead of the instance layer.
- **Watch your Smart Health Score**, a single number summarizing whether your architecture is currently in good shape.
- **See active alerts** as they fire, without leaving the dashboard.
- **Track simulated cost** as you add instances and scale — infrastructure isn't free in the real world either.

## Core concepts

### Traffic and RPS

RPS (Requests Per Second) is the industry-standard way to measure load: how many separate requests your application is receiving every second. Every request costs a small amount of CPU to process, so as RPS climbs, CPU climbs with it. Each of your instances has a real, finite capacity — push past it and response times start to climb, then errors start appearing, then the instance can crash outright.

This isn't a hypothetical: it's exactly what "going viral" looks like for a real system. A sudden 10x traffic spike from a marketing campaign, a bot attack, or simply an unexpectedly popular post can multiply RPS in seconds — the pattern is sometimes called the "Slashdot effect" or the "hug of death," where a flood of entirely legitimate traffic behaves just like a denial-of-service attack on infrastructure that wasn't built to absorb it.

Try it: push the traffic slider up with no load balancer and no auto-scaling enabled, and watch what happens to a single instance. Then turn both on and push the same traffic again — that difference is the entire reason those two features exist.

### CPU, memory, and the Four Golden Signals

CPU usage measures how hard your instances are working to process requests; memory (RAM) measures how much temporary working space your application needs. Both climb under load, but they fail differently: CPU maxing out at 100% makes everything *slow* (requests queue up and latency climbs), while memory maxing out gets a process *killed outright* — the operating system terminates it to protect the rest of the machine (commonly called being "OOMKilled" — Out Of Memory Killed).

Site Reliability Engineers (SREs) at companies like Google formalized this into the "Four Golden Signals" of observability: **Latency** (how long a request takes), **Traffic** (how much load you're under), **Errors** (how often requests fail), and **Saturation** (how close to capacity you are, e.g. CPU/memory). Nearly every dashboard you'll ever look at professionally — including the [Monitoring Lab](app:/monitoring) in this simulator — is built around some version of these four numbers.

### Error rate and latency

Latency is how long a single request takes to complete. As CPU approaches 100%, latency rises sharply — the same request that took 20ms at low load can take seconds under heavy load. Push past what your infrastructure can actually handle, and instead of just being slow, requests start failing outright: a `503 Service Unavailable` or `502 Bad Gateway` means the server couldn't even attempt to respond. Users tolerate slow far better than they tolerate broken — a 10-second load time loses some patience, but a raw error page loses the visit entirely.

### Health score

Your Smart Health Score distills traffic, CPU, memory, and error rate into one number, the same way a real "system status" page tries to answer "is everything okay?" without making you cross-reference five different graphs yourself. Watching it dip in response to a change you just made (enabling auto-scaling, adding an instance, fixing an overloaded deployment) is the fastest way to confirm whether that change actually helped.

## Common beginner mistakes

- **Cranking traffic to maximum immediately.** Start low, watch the metrics respond, then increase gradually — that's how you actually build intuition for where your capacity limits are.
- **Assuming more traffic is always bad.** Traffic is *demand* — the goal isn't to avoid it, it's to build infrastructure (auto-scaling, load balancing) that absorbs it gracefully.
- **Ignoring the health score until it's already red.** In a real job, you'd want alerting long before a dashboard turns red — that's exactly what the [Monitoring Lab](app:/monitoring) teaches.

## Try it yourself

1. With the simulation running and traffic low, note your health score and CPU.
2. Push the traffic slider up in steps and watch CPU, error rate, and health score respond.
3. Enable HPA (or ASG), then push traffic to the same level again — compare how much healthier the system looks with autoscaling doing its job.
4. Head to [Instances](app:/instances) to see the actual servers HPA/ASG created, or [Applications](app:/apps) to see the pods.
