# Networking

Networking ties everything else together: how a request from the outside world actually finds its way to one of your running pods. This module visualizes the full path — Ingress → Service → Load Balancer → Pods — that's usually invisible in a real cloud environment.

## What you can do here

- **Create an Ingress** with a domain name and routing rules, the entry point for external traffic.
- **Create Services** that use label selectors to find and route to matching pods.
- **Attach a Load Balancer** and choose its distribution algorithm.
- **Watch traffic flow visually** through the whole chain, live, as you send requests through it.
- **Simulate a pod crash** and watch traffic automatically redistribute to the pods still healthy.

## Core concepts

### The full path: Ingress → Service → Load Balancer → Pods

A request from a real user starts at a domain name (`myapp.example.com`). The **Ingress** is the entry point that receives it and decides, based on rules you define (which domain, which URL path), which internal Service it should go to. The **Service** doesn't run anything itself — it's a stable, unchanging address that uses label selectors (e.g. `app=myapp, version=v1`) to find whichever pods currently match, since pod IP addresses themselves are constantly changing as pods get created and destroyed. Finally, a **Load Balancer** takes the traffic arriving for that Service and spreads it across every matching pod, so no single pod absorbs it all.

Every one of these layers exists to solve one problem: pods are disposable and temporary, but users need something stable to talk to. Splitting "external routing" (Ingress) from "finding the current pods" (Service) from "spreading load evenly" (Load Balancer) means each piece can change independently — a pod restarting doesn't require any Ingress or DNS change at all.

### Why Ingress specifically

Without an Ingress, every single Service would need its own separate, dedicated load balancer exposed to the internet — expensive, and a management headache once you have more than a couple of services. An Ingress consolidates routing for many services behind one entry point: `/api` can go to one backend, `/admin` to another, `/` to a frontend, all through a single Ingress with path-based rules, and typically handles SSL termination too so individual services don't each need to manage certificates themselves.

### Load balancing algorithms

**Round Robin** sends each new request to the next pod in sequence — simple, and works well when requests are roughly similar in cost (a typical API call). **Least Connections** instead sends new requests to whichever pod currently has the fewest active connections — better when request duration varies a lot (a file upload takes far longer than a health check, so evenly *counting* requests isn't the same as evenly *balancing load*). **IP Hash** routes a given client consistently to the same pod (sticky sessions) — useful when a pod is holding some in-memory session state a user needs to keep hitting. In every case, **health checks** are what actually make this safe: a pod that stops responding correctly gets pulled out of rotation automatically, so a load balancer never keeps sending traffic to something that's already broken.

## Common beginner mistakes

- **Creating a Service with no pods behind it.** A Service is just an address — if nothing currently matches its selector, it has nowhere to actually send traffic, and you'll see exactly that reported as an error.
- **Creating an Ingress that isn't connected to any Service.** The routing rule exists, but points at nothing — shown as "misconfigured" here, exactly like a real dangling DNS/Ingress config.
- **Picking Round Robin for wildly uneven request costs.** If some requests are 100x more expensive than others, Round Robin alone won't prevent hot spots — Least Connections handles that case far better.

## Try it yourself

1. Create an Ingress with a domain, a Service with a label selector, and pods that match — watch traffic actually flow through all three.
2. Add a Load Balancer, send high traffic with the slider, and compare Round Robin vs. Least Connections in the traffic distribution view.
3. Simulate a pod crash mid-traffic and watch the load balancer route around it automatically.
4. Head to [Applications](app:/apps) to see where those pods actually come from, or [Instances](app:/instances) to see what they're running on.
