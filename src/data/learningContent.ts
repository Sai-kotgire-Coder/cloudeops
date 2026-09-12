import { TopicId } from '@/store/learningStore';

export interface LearningTopic {
  id: TopicId;
  title: string;
  beginner: string;
  how_it_works: string[];
  why_it_matters: string;
  simulator_context: string;
  pro_tip: string;
}

export const LEARNING_CONTENT: Record<TopicId, LearningTopic> = {
  instances: {
    id: 'instances',
    title: 'What is a Server Instance?',
    beginner: 'A server instance is like a rented virtual computer in the cloud. It provides the CPU and memory needed to run your application code.',
    how_it_works: [
      'You choose the hardware size (CPU & RAM).',
      'The cloud provider boots up a virtual machine (VM).',
      'You install your software and run your app.',
      'You are billed continuously while it runs.'
    ],
    why_it_matters: 'Instances are the physical foundation of the cloud. If you provision servers that are too small, they crash under traffic. If you provision ones that are too large, you waste money.',
    simulator_context: 'In this game, instances provide the base computing power. They boot up slowly and host your Pods. Watch out for OOM (Out of Memory) crashes if they are overloaded!',
    pro_tip: 'Modern architectures favor smaller, ephemeral instances managed by auto-scaling groups rather than long-lived massive "pet" servers.'
  },
  load_balancer: {
    id: 'load_balancer',
    title: 'What is a Load Balancer?',
    beginner: 'A load balancer is like a traffic cop for your website. It takes incoming visitor traffic and splits it equally among all your available servers.',
    how_it_works: [
      'Users send requests to a single Load Balancer IP.',
      'The Load Balancer checks which servers are healthy.',
      'It forwards the request to an available server.',
      'The server replies through the Load Balancer back to the user.'
    ],
    why_it_matters: 'Without a load balancer, your traffic might hit a single server, causing it to crash while other servers sit idle. It is essential for High Availability (HA).',
    simulator_context: 'Turning off the load balancer here enables "Chaos Mode" where 95% of traffic will hammer your first server, quickly causing a CPU exhaustion crash.',
    pro_tip: 'Real-world load balancers (like AWS ALB) also terminate SSL certificates, protect against DDoS, and route traffic based on URL paths.'
  },
  auto_scaling: {
    id: 'auto_scaling',
    title: 'Auto-Scaling Group (ASG)',
    beginner: 'ASG automatically adds more servers to your application when it gets busy, and removes them when traffic dies down to save money.',
    how_it_works: [
      'You set a Minimum and Maximum server count.',
      'You define CPU thresholds (e.g., scale out if CPU > 80%).',
      'The ASG monitors metrics continuously.',
      'It automatically boots new servers or terminates idle ones based on rules.'
    ],
    why_it_matters: 'Traffic is rarely constant. Auto-scaling ensures you survive sudden viral spikes without paying for a massive fleet of servers during quiet nights.',
    simulator_context: 'Enable ASG in the control panel to automatically provision EC2-like nodes when the cluster runs out of room to schedule Pods.',
    pro_tip: 'Always set a reasonable Maximum to prevent infinite scaling loops and massive cloud bills if a bug causes high CPU!'
  },
  pods: {
    id: 'pods',
    title: 'Pods vs Instances (Containers)',
    beginner: 'A Pod is the smallest deployable unit of your app (usually a container). An Instance (Node) is the physical machine that holds many Pods.',
    how_it_works: [
      'Instances (Nodes) provide raw CPU/Memory.',
      'Pods contain your application code and dependencies.',
      'A Load Balancer distributes requests to Pods.',
      'A node can run multiple Pods safely isolated from one another.'
    ],
    why_it_matters: 'Containers revolutionized DevOps because they isolate apps from the underlying operating system. You can pack many microservices onto a single instance efficiently.',
    simulator_context: 'Watch instances in the UI—you will see individual Pods running inside. If an instance crashes, all its Pods die too (CrashLoopBackOff).',
    pro_tip: 'In Kubernetes, you almost never manage Pods directly. You manage a "Deployment" that ensures a specific number of Pod replicas are always running.'
  },
  iam: {
    id: 'iam',
    title: 'Identity & Access Management (IAM)',
    beginner: 'IAM is a security system that determines strictly WHO is allowed to do WHAT in your cloud environment.',
    how_it_works: [
      'A User or Instance assumes a Role.',
      'The Role has Policies attached (JSON documents).',
      'Policies contain Statements (Allow or Deny actions).',
      'Deny rules ALWAYS override Allow rules.'
    ],
    why_it_matters: 'Security breaches often occur because an app had "god mode" permissions. The Principle of Least Privilege says an app should only have exactly the permissions it needs.',
    simulator_context: 'If your instance needs to read from S3, it must wear a Role with a policy permitting "s3:GetObject". Try testing S3 access in the Instance Manager!',
    pro_tip: 'Never attach an Admin role to an application server. If an attacker finds a vulnerability in your code, they will gain full control of your cloud account.'
  },
  cpu_memory: {
    id: 'cpu_memory',
    title: 'CPU & Memory Utilization',
    beginner: 'CPU measures the brain power your app is using. Memory (RAM) measures the temporary workspace it needs to hold data.',
    how_it_works: [
      'Running heavy calculations spikes the CPU.',
      'Caching data or suffering a memory leak fills up the RAM.',
      'If CPU hits 100%, requests slow down drastically.',
      'If RAM hits 100%, the OS kills the app instantly (OOMKilled).'
    ],
    why_it_matters: 'Monitoring these two metrics is the foundation of DevOps observability. They dictate when you must scale up hardware.',
    simulator_context: 'Green is healthy (<60%), Yellow is warning (>60%), Red is dangerous (>85%). Memory leaks gradually consume RAM until the instance crashes.',
    pro_tip: 'High CPU is usually a symptom of traffic or bad algorithms. High memory is often a symptom of caching issues or unbounded arrays in the code (Memory Leaks).'
  },
  traffic: {
    id: 'traffic',
    title: 'Incoming Traffic (RPS)',
    beginner: 'RPS (Requests Per Second) measures how many users are actively attacking or using your application at any given moment.',
    how_it_works: [
      'Each request requires a tiny bit of CPU to process.',
      'More requests = higher CPU utilization.',
      'Every server has a physical limit to how many requests it can handle.'
    ],
    why_it_matters: 'Predicting traffic is impossible. A marketing campaign or a bot attack can suddenly multiply your RPS by 10x in seconds.',
    simulator_context: 'Use the Traffic Generator slider to stress test your architecture. Enable HPA to handle sudden spikes in RPS gracefully without lagging.',
    pro_tip: 'Look up "Slashdot effect" or "Hug of death" — when a sudden influx of legitimate traffic inadvertently acts like a Denial of Service attack on a weak architecture.'
  },
  errors: {
    id: 'errors',
    title: 'Error Rates & Latency',
    beginner: 'Latency is how long a request takes to process. Error requests happen when a server is too overloaded or broken to reply.',
    how_it_works: [
      'As CPU approaches 100%, latency skyrockets.',
      'If limits are exceeded, the server starts dropping connections (502 Bad Gateway / 503 Service Unavailable).',
      'High error rates lose customers.'
    ],
    why_it_matters: 'Users will tolerate a redesign, but they will bounce if a site takes 10 seconds to load or shows a raw error screen.',
    simulator_context: 'You lose points if your cluster generates high error rates! Scale out your infrastructure to reduce latency and maintain a healthy tick score.',
    pro_tip: 'Site Reliability Engineers (SREs) track the "Four Golden Signals": Latency, Traffic, Errors, and Saturation.'
  },
  deployments: {
    id: 'deployments',
    title: 'Kubernetes Deployments',
    beginner: 'A Deployment is a blueprint that says "I want exactly 3 copies of my app running at all times". Kubernetes automatically creates and replaces pods to match that target.',
    how_it_works: [
      'You define a Deployment with a container image, replicas, and resource limits.',
      'The Deployment Controller watches live pod count vs desired replicas.',
      'If a pod crashes, the controller immediately creates a new one.',
      'You can roll out new versions (v1→v2) and switch traffic via the Service.'
    ],
    why_it_matters: 'Deployments provide self-healing infrastructure. Your app stays up even if a node dies or a container crashes, without any manual intervention.',
    simulator_context: 'The Deployment manager here lets you set replica count. The Deployment Controller (running every simulation tick) will reconcile actual vs desired pods.',
    pro_tip: 'Blue/Green deployments let you run v1 and v2 side-by-side. Switch the Service to v2 and instantly roll back to v1 if something goes wrong — zero downtime.'
  },
  services: {
    id: 'services',
    title: 'Kubernetes Services',
    beginner: 'A Service is a stable DNS name and IP that routes traffic to a set of matching pods. Pods come and go, but the Service address never changes.',
    how_it_works: [
      'A Service uses label selectors (e.g., app=myapp, version=v1) to find matching pods.',
      'Traffic sent to the Service IP is load-balanced across matching pods.',
      'When you do a Blue/Green deploy, you change the Service selector from v1 to v2.',
      'Pod IPs are ephemeral — only the Service IP is stable.'
    ],
    why_it_matters: 'Without a Service, you would need to discover pod IPs manually. Services abstract that away so other apps (and users) have a consistent endpoint.',
    simulator_context: 'The "Active Version" shown in the simulator represents which deployment version the Service is pointing to. Switch versions with the blue "Switch Traffic Here" button.',
    pro_tip: 'There are multiple Service types: ClusterIP (internal only), NodePort (exposes on every node), and LoadBalancer (provisions a cloud load balancer automatically).'
  },
  containers: {
    id: 'containers',
    title: 'Docker Containers & Container Orchestration',
    beginner: 'A Docker container is a lightweight, isolated package that contains your application code and all its dependencies. Unlike a full VM, containers share the host OS kernel, making them fast to start and efficient with resources.',
    how_it_works: [
      'You create a Docker Image (a snapshot) from a Dockerfile that defines your app\'s environment.',
      'A Container is a running instance of that image — you can run multiple containers from one image.',
      'Each container has its own CPU/memory limits, network, and file system.',
      'Containers can crash if they exceed resource limits or get overloaded with traffic.',
      'Kubernetes groups containers into Pods and manages their lifecycle automatically.'
    ],
    why_it_matters: 'Containers revolutionized DevOps by ensuring "if it works on my laptop, it works in production." They eliminate the "works on my machine" problem by packaging everything together. Container orchestration (Kubernetes, Docker Swarm) automatically scales, restarts, and distributes containers across servers.',
    simulator_context: 'In the Container Lab, you build Docker images, run containers, and send traffic to see them handle load. When containers crash from overload, you learn why Kubernetes uses Pods and auto-scaling to maintain availability. Try running multiple containers from one image, then enable auto-scaling to see HPA (Horizontal Pod Autoscaler) in action.',
    pro_tip: 'Real-world best practice: Keep containers stateless (no local data storage) and scale horizontally (add more containers) instead of vertically (bigger containers). This is why microservices architecture became dominant — each service runs in its own container and scales independently.'
  },
  networking: {
    id: 'networking',
    title: 'Cloud Networking Fundamentals',
    beginner: 'Cloud networking is how external users reach your application through layers of routing and load balancing. Traffic flows from the internet → Ingress → Service → Load Balancer → Pods.',
    how_it_works: [
      'Users send requests to a domain (like myapp.cloudops.dev).',
      'The Ingress controller receives the request and routes it based on rules.',
      'The Service provides a stable endpoint that selects matching pods.',
      'A Load Balancer distributes traffic across multiple pod instances.',
      'Pods process the request and send responses back through the same path.'
    ],
    why_it_matters: 'Understanding networking flow is critical for building scalable, reliable applications. Without proper networking setup, your application cannot receive traffic, scale effectively, or recover from failures. This architecture separates concerns: Ingress handles external routing, Services provide pod discovery, and Load Balancers ensure even distribution.',
    simulator_context: 'The Networking Simulator visualizes the complete traffic flow. Create an Ingress with a domain, connect it to a Service, attach the Service to Pods via label selectors, and watch traffic flow in real-time. Add a Load Balancer to see intelligent traffic distribution in action.',
    pro_tip: 'Always design for failure: Have multiple pods behind each service, use health checks to detect failures, and configure load balancers to automatically route around unhealthy pods. This is how Netflix, Amazon, and Google achieve 99.99% uptime.'
  },
  ingress: {
    id: 'ingress',
    title: 'Ingress Controllers & Domain Routing',
    beginner: 'An Ingress is the entry point for external HTTP/HTTPS traffic. It maps domain names to Services and handles SSL termination, path-based routing, and virtual hosting.',
    how_it_works: [
      'You create an Ingress resource with a domain name (myapp.cloudops.dev).',
      'The Ingress defines rules: which paths route to which Services.',
      'External traffic hits the Ingress controller (like NGINX or Traefik).',
      'The controller routes requests to the appropriate Service based on hostname/path.',
      'The Service then load-balances to pods.'
    ],
    why_it_matters: 'Without Ingress, you would need to expose each Service with a separate load balancer, wasting money and creating management complexity. Ingress consolidates all your HTTP routing rules in one place, supports multiple domains on one IP, and handles SSL certificates automatically (via cert-manager).',
    simulator_context: 'In the Networking Simulator, create an Ingress and connect it to a Service. If the Service has no pods, you will see a "No backend available" error. If the Ingress is not connected to any Service, it shows as "misconfigured". Watch the Traffic Visualization to see requests flowing from Ingress → Service → Pods.',
    pro_tip: 'In production, use path-based routing to route different URLs to different microservices: /api → backend-service, /admin → admin-service, / → frontend-service. This is cheaper and simpler than running separate load balancers for each service.'
  },
  load_balancing: {
    id: 'load_balancing',
    title: 'Load Balancing Algorithms & Strategies',
    beginner: 'Load balancing distributes incoming traffic across multiple backend servers to prevent any single server from becoming overwhelmed. Different algorithms optimize for different scenarios.',
    how_it_works: [
      'Round Robin: Distributes requests equally to all pods in sequence (Pod1 → Pod2 → Pod3 → Pod1).',
      'Least Connections: Sends new requests to the pod with the fewest active connections.',
      'IP Hash: Routes the same client IP to the same pod (sticky sessions).',
      'Weighted Round Robin: Gives more traffic to more powerful pods.',
      'Health checks: Automatically removes unhealthy pods from the rotation.'
    ],
    why_it_matters: 'Poor load balancing leads to "hot spots" where one pod is maxed out at 100% CPU while others sit idle. This causes slow response times, timeouts, and crashes. Intelligent load balancing ensures even distribution, maximizes throughput, and provides fault tolerance when pods fail.',
    simulator_context: 'Create a Load Balancer in the Networking Simulator and experiment with Round Robin vs Least Connections. Send high traffic with the slider and watch the Traffic Distribution chart. Round Robin gives equal RPS to all pods. Least Connections favors pods with lower current load. Simulate a pod crash to see traffic automatically redistribute to healthy pods.',
    pro_tip: 'Choose Round Robin for similar-sized requests (like API calls). Choose Least Connections for variable request durations (like file uploads or long-polling). In cloud environments, always enable health checks — never send traffic to a pod that is failing.'
  },
  iac: {
    id: 'iac',
    title: 'Infrastructure as Code (IaC)',
    beginner: 'Infrastructure as Code means describing your servers, networks, and other cloud resources in text files instead of clicking through a console. A tool then reads that text and builds the real thing for you.',
    how_it_works: [
      'You write config files describing the infrastructure you want (a "resource block" per piece).',
      'The tool compares your config against what already exists — this is called a "plan".',
      'You review the plan, which shows exactly what will be added, changed, or removed.',
      'You "apply" the plan, and the tool creates, updates, or destroys real infrastructure to match.',
      'The tool remembers what it built in a "state" file, so next time it only changes what\'s different.'
    ],
    why_it_matters: 'Manually clicking through a cloud console doesn\'t scale, isn\'t repeatable, and leaves no record of what changed or why. IaC turns infrastructure changes into something reviewable like code — the same discipline you\'d apply to an application.',
    simulator_context: 'The Terraform Lab lets you write resource blocks, run a Plan to preview the diff, Apply it to provision resources, and even simulate real-world drift (someone changing something by hand) to see how IaC tools detect and reconcile it.',
    pro_tip: 'Terraform is the most widely used tool for this, but the same plan → review → apply pattern shows up across the ecosystem — it\'s the core idea to understand, not just one tool\'s syntax.'
  },
  config_management: {
    id: 'config_management',
    title: 'Configuration Management',
    beginner: 'Configuration management is about keeping servers that already exist set up correctly — installed packages, running services, correct file permissions — without you having to SSH in and do it by hand, every time, on every server.',
    how_it_works: [
      'You describe the desired setup as a list of tasks in a "playbook" (e.g. "nginx should be installed and running").',
      'A list of target servers is defined in an "inventory".',
      'The tool connects to each server (often over plain SSH — no special agent needed) and checks the current state.',
      'It only changes what\'s actually different from the desired state — nothing happens if a server is already correct.',
      'Run the same playbook again anytime, safely — that property is called idempotency.'
    ],
    why_it_matters: 'Without it, "how is this server configured?" is answered by tribal knowledge and old SSH history. Configuration management makes server setup reviewable, repeatable, and safe to re-run — the same discipline Infrastructure as Code brings to provisioning, applied to what runs on top of it.',
    simulator_context: 'The Ansible Lab lets you build an inventory of hosts, write playbook tasks using real modules, preview them with --check, run them for real, and simulate someone changing a server by hand to see how the next run detects and reconciles it.',
    pro_tip: 'Terraform decides what infrastructure should exist; configuration management tools like Ansible decide what\'s installed and running on it. Most real teams use both together, not one instead of the other.'
  },
  secrets_management: {
    id: 'secrets_management',
    title: 'Secrets Management',
    beginner: 'Secrets management is about storing passwords, API keys, and certificates in one controlled place instead of scattered across config files and Slack messages — and strictly controlling who (or what) is allowed to read each one.',
    how_it_works: [
      'Secrets live behind a "secrets engine" — a plugin for a specific kind of secret (static key/value, dynamic database credentials, certificates, etc.).',
      'A "policy" declares which paths a given identity can read, write, or list — nothing is accessible by default.',
      'A "token" (or another auth method) proves who\'s asking, and carries one or more attached policies.',
      'Every request checks the token\'s policies against the requested path before allowing or denying it.',
      'Some engines issue secrets that expire on their own (a "lease"), so a leaked credential stops working automatically.'
    ],
    why_it_matters: 'Without this, "who can see the production database password?" is usually answered by "everyone who has ever needed it, forever." Centralizing secrets with real access control means a leaked credential is scoped, an offboarded engineer\'s access actually disappears, and every read is auditable.',
    simulator_context: 'The Vault Lab lets you enable a secrets engine, write a versioned secret, write an HCL policy scoping access to one path, attach it to a token, and then attempt to read the secret as that token — you\'ll see a real allow or a real "permission denied" depending on whether the policy actually covers it.',
    pro_tip: 'The habit worth building is least privilege by default: a policy should grant exactly the paths and capabilities a token needs, nothing broader "just in case."'
  },
  kubectl_cli: {
    id: 'kubectl_cli',
    title: 'kubectl: Talking Directly to Kubernetes',
    beginner: 'kubectl is the command-line tool for interacting with a Kubernetes cluster directly — listing what\'s running, inspecting why something is broken, and making changes, all without needing a UI.',
    how_it_works: [
      'Every command follows the same shape: `kubectl <verb> <resource> [name] [flags]` — e.g. `kubectl get pods`, `kubectl scale deployment web --replicas=5`.',
      '`get` lists resources, `describe` shows deep detail on one, `logs` shows a container\'s output, `exec` runs a command inside a running container.',
      '`apply -f file.yaml` is declarative — you describe the end state and Kubernetes reconciles toward it.',
      '`create`, `scale`, and `expose` are imperative — you tell it exactly what to do, right now.',
      '`rollout status/restart/undo` manage a Deployment\'s update history, including rolling back a bad release.'
    ],
    why_it_matters: 'Buttons in a dashboard can\'t cover every situation, and most real incident response happens at a terminal. Being fluent in kubectl — especially `describe` and `logs` — is usually the fastest way to actually find out why something is broken.',
    simulator_context: 'The kubectl Lab is a real terminal running against the exact same cluster state as the rest of the app — `kubectl scale deployment web --replicas=5` here does the same thing the Scale button does on the Applications page, just from the command line.',
    pro_tip: '`kubectl describe` and `kubectl logs` are the two commands you\'ll reach for the most during an actual incident — get comfortable with both before you need them under pressure.'
  },
  gitops: {
    id: 'gitops',
    title: 'GitOps: Git as the Source of Truth',
    beginner: 'GitOps means the desired state of your infrastructure and applications lives in a Git repository, and an automated controller continuously makes the live system match what\'s in Git — instead of engineers running commands by hand against the cluster.',
    how_it_works: [
      'You commit a change (a new image version, a replica count) to a Git repo instead of running a command against the cluster directly.',
      'A controller (like Argo CD or Flux) is always watching that repo and comparing it to what\'s actually running.',
      'If Git and the live cluster differ, the app is "OutOfSync" — the controller can sync automatically, or wait for a human to click Sync.',
      'If someone changes the live cluster by hand (a manual `kubectl scale`), that\'s "drift" — the live system no longer matches Git.',
      'With self-heal enabled, the controller reverts that manual drift on its own, so Git always wins.'
    ],
    why_it_matters: 'Manual changes against a live cluster are invisible and unreviewable — nobody can tell what changed, why, or who approved it. GitOps makes every change a commit: reviewable, revertible with `git revert`, and auditable, and it means the cluster can never silently drift from what\'s documented.',
    simulator_context: 'The GitOps Lab lets you link a Git repo path to a real deployed Application, commit version/replica changes, and watch Auto-Sync apply them automatically — then use Simulate Drift to change replicas by hand and watch Self-Heal correct it back, in the background, from any page.',
    pro_tip: 'Auto-Sync and Self-Heal are two different switches: Auto-Sync applies new commits automatically; Self-Heal reverts manual out-of-band changes automatically. Real Argo CD treats them as separate settings for exactly this reason.'
  },
  monitoring: {
    id: 'monitoring',
    title: 'Monitoring: Dashboards & Alert Rules',
    beginner: 'Monitoring means continuously collecting metrics from your running system (traffic, CPU, error rate, latency) and giving humans two things: dashboards to see the current state at a glance, and alert rules that page someone the moment a metric crosses a threshold that matters.',
    how_it_works: [
      'A metrics system (like Prometheus) scrapes numeric time-series data from every service on an interval.',
      'A dashboard tool (like Grafana) queries that data and renders it as graphs, so an on-call engineer can see trends, not just a single number.',
      'An alert rule is a query plus a threshold: "if error rate stays above 5% for 5 minutes, fire."',
      'When a rule crosses its threshold, it "fires" -- creating an active alert that stays open until the underlying metric recovers, at which point it auto-resolves.',
      'Good alerting rules are specific enough to page only on real problems -- too sensitive and people learn to ignore pages; too loose and real incidents go unnoticed.'
    ],
    why_it_matters: 'Without monitoring, the first sign of an outage is a customer complaint. Dashboards let you catch a slow-building problem (creeping latency, a memory leak) before it becomes an outage, and alert rules mean you find out about a sudden one (a crash, a traffic spike) in seconds instead of hours.',
    simulator_context: 'The Monitoring Lab lets you build dashboard panels charting your simulator\'s own live metrics (traffic, CPU, error rate, latency) and author alert rules against them -- crossing a rule\'s threshold creates a real Alert, visible on the Issues page, exactly like any other incident in this simulator.',
    pro_tip: 'Real alerting systems almost always require a threshold to be breached "for" a duration (e.g. 5 minutes), not instantly on a single reading -- this avoids paging someone over one noisy data point. Think about what duration would make each of your rules meaningful rather than noisy.'
  }
};
