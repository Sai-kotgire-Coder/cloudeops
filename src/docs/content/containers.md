# Container Lab

The Container Lab is where you learn Docker fundamentals directly: building an image, running containers from it, sending real traffic at them, and watching exactly what happens when they're pushed past their limits.

## What you can do here

- **Build a Docker image** by choosing a base image (nginx, node, python, redis) and watch the build process complete in stages, just like a real `docker build`.
- **Run one or more containers** from an image, each an independent, isolated copy of your application.
- **Send simulated traffic** at your running containers and watch CPU, memory, and RPS respond live.
- **Trigger and observe crashes** when a container is pushed past its resource limits.
- **Enable auto-scaling** to see new containers spin up automatically as load increases.

## Core concepts

### What an image actually is

A Docker image is a self-contained package with everything an application needs to run: the code itself, its runtime (Node.js, Python, whatever), system libraries, and configuration — all bundled together so "works on my machine" becomes "works everywhere, identically." An image is immutable — once built, it never changes — and it's built in layers, where each instruction contributes one layer. Layers are cached, so rebuilding an image after a small code change is usually much faster than the very first build, since only the changed layers (and everything after them) actually need to rebuild.

An image is a *blueprint*, not a running thing. You can run many independent containers from the exact same image, the same way you can stamp out many identical copies from one template.

### What a container actually is

A container is one running instance of an image: an isolated process with its own filesystem, network interface, and resource limits, but sharing the host machine's OS kernel underneath (this is the key difference from a full virtual machine, which needs its own complete OS). That sharing is exactly why containers start in a second or two instead of the minutes a VM typically takes, and why you can run dozens of them on hardware that could only fit a handful of VMs.

Containers should be treated as disposable and stateless — don't rely on data written inside a container surviving a restart, because in production it usually won't. If a container needs to persist something, that data belongs somewhere outside the container itself.

### The build process, base images, and ports

Building an image means reading a Dockerfile line by line: `FROM` picks your base image (the OS + runtime foundation everything else sits on top of), then each subsequent instruction adds another layer — installing dependencies, copying in your code, setting configuration. Smaller base images (Alpine Linux variants are a common choice, often just a few megabytes versus 80+ MB for a full Ubuntu image) mean faster builds, faster deploys, and less attack surface to worry about.

A **port** is where your application listens for incoming connections *inside* the container — 3000 for a typical Node app, 8080 for many Java apps. That internal port gets mapped to a port on the host so traffic can actually reach it; multiple containers can all use the same internal port (say, 3000) as long as their host-side mappings don't collide.

### Why containers crash

A container crashes when the process inside it hits a resource limit or fails outright: CPU pinned at 100% for too long, memory usage exceeding what's allocated (the process gets forcibly killed — "OOMKilled" — rather than allowed to keep consuming memory unchecked), an unhandled exception in the code itself, or a load balancer's health check marking it unhealthy and removing it from rotation. Understanding *why* something crashed, not just that it did, is one of the most transferable DevOps skills there is — the exact same failure modes show up identically in a real Kubernetes cluster.

## Common beginner mistakes

- **Running one container and expecting it to handle unlimited traffic.** Every container has a real capacity ceiling — this is exactly why load balancing and horizontal scaling (running *more* containers, not one bigger one) exist.
- **Confusing an image with a container.** An image never changes and never runs by itself; a container is a live, running instance of one.
- **Choosing a base image without thinking about its capacity.** Different base images in this lab have different simulated RPS capacities (nginx handles more raw traffic than a heavier runtime) — that mirrors real differences between web servers and full application runtimes.

## Try it yourself

1. Build an image, then run a single container from it.
2. Push traffic at it with the slider until it crashes — watch which metric (CPU or memory) hit its limit first.
3. Run several containers from the same image and split that same traffic across them — notice how much more it can absorb.
4. Enable auto-scaling and push traffic well past a single container's capacity — watch new containers appear on their own.
5. Head to [Applications](app:/apps) to see how a real Deployment formalizes "run N replicas of this" instead of manually running containers one at a time.
