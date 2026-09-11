export interface LearningSection {
  id: string;
  title: string;
  icon: string;
  definition: string;
  howItWorks: string[];
  whyWeUseIt: string[];
  realWorldExample: string;
  inYourSimulation: string;
  additionalTips?: string[];
}

export const dockerLearningContent: Record<string, LearningSection> = {
  dockerImage: {
    id: 'dockerImage',
    title: '🐳 What is a Docker Image?',
    icon: '📦',
    definition: 'A Docker Image is a lightweight, standalone, executable package that includes everything needed to run a piece of software: the code, runtime, system tools, libraries, and settings.',
    howItWorks: [
      'Contains your application code bundled with all dependencies',
      'Includes the runtime environment (Node.js, Python, etc.)',
      'Built in layers - each instruction in Dockerfile creates a layer',
      'Layers are cached and reused for efficiency',
      'Immutable - once built, it never changes'
    ],
    whyWeUseIt: [
      'Consistency: "Works on my machine" → Works everywhere',
      'Portability: Deploy the same image on any platform',
      'Version control: Tag different versions (v1.0, v2.0)',
      'Fast deployment: Share and deploy quickly',
      'Isolation: Each image is self-contained'
    ],
    realWorldExample: 'Netflix uses Docker images to package their microservices. Each service (video streaming, recommendations, user auth) is a separate image that can be deployed independently across thousands of servers.',
    inYourSimulation: 'When you build an image, you\'re creating a blueprint. You can then run multiple containers from the same image, just like stamping out copies from a template.',
    additionalTips: [
      'Smaller images deploy faster - choose lightweight base images',
      'Use .dockerignore to exclude unnecessary files',
      'Tag your images meaningfully (my-app:v1.0 not my-app:latest)'
    ]
  },

  container: {
    id: 'container',
    title: '📦 What is a Container?',
    icon: '🎁',
    definition: 'A Container is a running instance of a Docker image. It\'s an isolated, lightweight environment where your application executes with its own CPU, memory, network, and filesystem.',
    howItWorks: [
      'Created from a Docker image blueprint',
      'Runs as an isolated process on the host machine',
      'Has its own filesystem, network interface, and process space',
      'Shares the host OS kernel (unlike VMs)',
      'Can be started, stopped, restarted, and removed',
      'Multiple containers can run from the same image'
    ],
    whyWeUseIt: [
      'Lightweight: Starts in seconds, uses minimal resources',
      'Isolation: Failures in one container don\'t affect others',
      'Scalability: Spin up 10 containers instantly',
      'Efficiency: Run dozens of containers on one server',
      'Consistency: Same behavior in dev, test, and production'
    ],
    realWorldExample: 'Uber runs 4,000+ microservices in containers. When demand spikes (Friday night), they automatically spin up more containers to handle ride requests. When demand drops, containers are removed to save costs.',
    inYourSimulation: 'Each container you run is an independent copy of your application. You can run multiple containers to handle more traffic. Watch the CPU, memory, and traffic metrics to see how they perform under load.',
    additionalTips: [
      'Containers should be stateless - don\'t store data inside them',
      'Use health checks to monitor container status',
      'Name your containers meaningfully for easier management'
    ]
  },

  traffic: {
    id: 'traffic',
    title: '🚦 Understanding Traffic & RPS',
    icon: '📊',
    definition: 'RPS (Requests Per Second) measures how many HTTP requests your application receives every second. It\'s a key metric for understanding load and capacity.',
    howItWorks: [
      'Each user request counts as 1 RPS',
      'Higher RPS = more users = more load on your containers',
      'Each container has a maximum capacity (e.g., 100 RPS)',
      'Beyond capacity, response times slow down or containers crash',
      'Load balancers distribute RPS across multiple containers'
    ],
    whyWeUseIt: [
      'Measure application load and user activity',
      'Plan infrastructure capacity',
      'Detect traffic spikes and DDoS attacks',
      'Optimize performance and scaling decisions',
      'Calculate costs (more traffic = more resources needed)'
    ],
    realWorldExample: 'During Black Friday, Amazon handles 600,000+ RPS globally. They use auto-scaling to dynamically add thousands of containers as traffic surges, then scale back down when traffic normalizes.',
    inYourSimulation: 'Use the traffic slider to simulate real-world load. Start with low traffic (50 RPS), then gradually increase it. Watch what happens when you exceed your containers\' capacity!',
    additionalTips: [
      'Monitor RPS trends to predict when to scale',
      'Not all requests are equal - some use more CPU than others',
      'Set up alerts when RPS exceeds thresholds'
    ]
  },

  loadBalancer: {
    id: 'loadBalancer',
    title: '⚖️ How Load Balancers Work',
    icon: '🔀',
    definition: 'A Load Balancer is a traffic cop that distributes incoming requests evenly across multiple containers, preventing any single container from being overwhelmed.',
    howItWorks: [
      'Sits between incoming traffic and your containers',
      'Routes each request to the least-loaded container',
      'Uses algorithms: Round Robin, Least Connections, IP Hash',
      'Performs health checks - removes unhealthy containers from pool',
      'Can handle SSL termination and caching'
    ],
    whyWeUseIt: [
      'Prevents single point of failure - if one container crashes, others handle the load',
      'Better resource utilization - no idle containers while others are overloaded',
      'Improved performance - requests go to available containers faster',
      'Enables zero-downtime deployments',
      'Scalability - add/remove containers without affecting traffic'
    ],
    realWorldExample: 'YouTube uses load balancers to distribute video streaming requests. When you hit play, the load balancer finds the nearest, least-loaded server to stream from, ensuring smooth playback for billions of users.',
    inYourSimulation: 'Without load balancer: All traffic hits one container until it crashes. With load balancer: Traffic is evenly distributed. Toggle it on/off to see the dramatic difference in system stability!',
    additionalTips: [
      'Always use load balancers in production',
      'Configure health checks to detect container failures quickly',
      'Some load balancers can route based on URL paths or headers'
    ]
  },

  autoScaling: {
    id: 'autoScaling',
    title: '🚀 Auto-Scaling (HPA)',
    icon: '📈',
    definition: 'Horizontal Pod Autoscaler (HPA) automatically adjusts the number of running containers based on CPU usage, memory, or custom metrics, ensuring your application always has enough capacity.',
    howItWorks: [
      'Monitors container metrics (CPU, memory) every few seconds',
      'Compares current usage to target threshold (e.g., 70%)',
      'If above threshold: Spawns new containers',
      'If below threshold: Removes excess containers',
      'Gradually scales up/down to avoid thrashing'
    ],
    whyWeUseIt: [
      'Handle traffic spikes automatically - no manual intervention',
      'Cost optimization - scale down during low traffic',
      'Better reliability - prevent crashes from overload',
      'Peace of mind - system adapts to demand 24/7',
      'Faster response times under high load'
    ],
    realWorldExample: 'Airbnb uses auto-scaling during peak booking times. When major events happen (Olympics, concerts), traffic surges 10x. Auto-scaling adds hundreds of containers in minutes, then scales back down after the event.',
    inYourSimulation: 'Set traffic to 200 RPS with 1 container → CPU spikes above 70% → HPA automatically spawns a 2nd container → Traffic gets distributed → CPU drops to healthy levels. It\'s DevOps magic!',
    additionalTips: [
      'Set minimum/maximum container limits to control costs',
      'Don\'t set threshold too low (50%) - wastes money',
      'Don\'t set threshold too high (95%) - risks crashes',
      'Scale on multiple metrics for smarter decisions'
    ]
  },

  containerCrash: {
    id: 'containerCrash',
    title: '💥 Why Containers Crash',
    icon: '⚠️',
    definition: 'Container crashes happen when the application inside runs out of resources (CPU, memory), encounters errors, or becomes unresponsive. Understanding crashes is key to building resilient systems.',
    howItWorks: [
      'CPU overload: Too many requests → CPU hits 100% → process hangs',
      'Memory overflow: Application uses more RAM than allocated → OOMKilled',
      'Unhandled exceptions: Code errors cause process to exit',
      'Health check failures: Load balancer marks container as unhealthy',
      'Dependency failures: Database connection lost, API timeouts'
    ],
    whyWeUseIt: [
      'Learning experience: Understand system limits',
      'Resilience testing: Chaos engineering in practice',
      'Capacity planning: Discover bottlenecks before production',
      'Alert tuning: Know when to get notified',
      'Recovery strategies: Test restart policies'
    ],
    realWorldExample: 'In 2020, Slack had a major outage when a traffic spike caused containers to crash faster than they could restart. The incident taught them to improve auto-scaling and implement better circuit breakers.',
    inYourSimulation: 'Push traffic above container capacity without load balancing → watch containers struggle and crash. Then enable load balancing + auto-scaling → see how the system self-heals. This is DevOps reality!',
    additionalTips: [
      'Set resource limits (CPU, memory) to prevent runaway processes',
      'Implement graceful shutdown - finish current requests before stopping',
      'Use restart policies: always, on-failure, unless-stopped',
      'Monitor crash rates - more than 1% means serious issues'
    ]
  },

  buildProcess: {
    id: 'buildProcess',
    title: '🔨 Docker Build Process',
    icon: '⚙️',
    definition: 'The Docker build process takes your Dockerfile instructions and creates a layered image. Each line in the Dockerfile creates a new layer, making builds efficient through caching.',
    howItWorks: [
      'Reads Dockerfile line by line',
      'Each instruction (FROM, RUN, COPY) creates a layer',
      'Layers are cached - unchanged layers are reused',
      'Final image is a stack of all layers',
      'Can take seconds to minutes depending on complexity'
    ],
    whyWeUseIt: [
      'Reproducibility: Same Dockerfile = same image every time',
      'Efficiency: Caching speeds up subsequent builds',
      'Version control: Track changes to your infrastructure',
      'Automation: Integrate with CI/CD pipelines',
      'Debugging: Inspect each layer if build fails'
    ],
    realWorldExample: 'Google builds millions of Docker images daily for their microservices. Their build system uses advanced caching and parallelization to build images in under 30 seconds, enabling rapid deployment cycles.',
    inYourSimulation: 'When you click "Build Image", watch the progress bar fill up. Each percentage represents a layer being built. Choose different base images (nginx, node, python) to see how they affect build time and size.',
    additionalTips: [
      'Order matters: Put frequently changing instructions last',
      'Combine RUN commands to reduce layers',
      'Use multi-stage builds to minimize final image size',
      'Clean up unnecessary files in the same layer you create them'
    ]
  },

  baseImages: {
    id: 'baseImages',
    title: '🏗️ Understanding Base Images',
    icon: '🖼️',
    definition: 'A base image is the starting point for your Docker image. It contains the operating system and runtime environment (like Node.js, Python) that your application needs to run.',
    howItWorks: [
      'Specified in Dockerfile with FROM instruction',
      'Provides OS (Alpine Linux, Ubuntu) and runtime',
      'Can be official images from Docker Hub or custom',
      'Contains pre-installed tools and libraries',
      'Your application code layers on top of base image'
    ],
    whyWeUseIt: [
      'Don\'t reinvent the wheel - use tested, maintained images',
      'Security: Official images get security updates',
      'Compatibility: Choose runtime matching your app (Node 18, Python 3.11)',
      'Size optimization: Alpine images are tiny (5MB vs 100MB)',
      'Community support: Popular issues already solved'
    ],
    realWorldExample: 'Spotify uses Alpine-based Node.js images for their microservices. Alpine is only 5MB (vs Ubuntu\'s 80MB), meaning faster deploys and less bandwidth. With 1000+ services, this saves terabytes of storage.',
    inYourSimulation: 'Each base image has different characteristics: nginx (100 RPS capacity), node (80 RPS), python (60 RPS), redis (150 RPS). Choose based on your needs - web servers vs app servers vs caching.',
    additionalTips: [
      'Use specific version tags (node:18.2) not "latest"',
      'Alpine is smallest but may lack some libraries',
      'Scan base images for vulnerabilities regularly',
      'Consider slim variants (node:18-slim) for balance'
    ]
  },

  ports: {
    id: 'ports',
    title: '🚪 Container Ports',
    icon: '🔌',
    definition: 'Ports are network endpoints where your containerized application listens for incoming connections. Port 3000 means "my app accepts requests on port 3000".',
    howItWorks: [
      'Applications inside containers bind to ports (3000, 8080)',
      'Ports are mapped: host port → container port',
      'Example: localhost:8080 → container:3000',
      'Multiple containers can use same internal port',
      'But host port must be unique'
    ],
    whyWeUseIt: [
      'Network communication: How external traffic reaches your app',
      'Service discovery: Know where each service listens',
      'Security: Only expose necessary ports',
      'Development: Access container services from host',
      'Load balancing: Distribute traffic to container ports'
    ],
    realWorldExample: 'Nginx typically runs on port 80 (HTTP) and 443 (HTTPS). When you visit a website, your browser connects to port 443. Behind the scenes, a load balancer maps port 443 to hundreds of container ports.',
    inYourSimulation: 'The port you specify (3000) is where your simulated app listens inside the container. In production, you\'d map this to ports 80/443 so users can access it via a URL.',
    additionalTips: [
      'Common ports: 80 (HTTP), 443 (HTTPS), 3000 (Node), 8080 (Java)',
      'Use EXPOSE in Dockerfile to document ports',
      'Don\'t hardcode ports - use environment variables',
      'Avoid privileged ports (<1024) in containers'
    ]
  },

  // ==================== CI/CD PIPELINE TOPICS ====================

  ci_pipeline: {
    id: 'ci_pipeline',
    title: '🔄 What is a CI/CD Pipeline?',
    icon: '⚙️',
    definition: 'CI/CD (Continuous Integration/Continuous Deployment) is an automated workflow that takes your code from commit to production. Every push triggers building, testing, and deploying your application without manual intervention.',
    howItWorks: [
      'Developer pushes code to Git repository (GitHub, GitLab)',
      'Pipeline automatically triggers on push/merge',
      'Code is checked out, dependencies installed',
      'Automated tests run to validate changes',
      'Docker image is built and pushed to registry',
      'Application is deployed to target environment (dev/staging/prod)'
    ],
    whyWeUseIt: [
      'Speed: Deploy in minutes instead of hours/days',
      'Reliability: Eliminate human error from manual deployments',
      'Consistency: Same process every time',
      'Quality: Catch bugs before production through automated testing',
      'Feedback: Developers know immediately if their code breaks something'
    ],
    realWorldExample: 'Amazon deploys code to production every 11.7 seconds using CI/CD pipelines. Facebook pushes code updates twice daily to billions of users. Netflix deploys 4,000+ times per day across their microservices.',
    inYourSimulation: 'When you trigger a pipeline, watch it progress through 6 stages: Checkout → Build → Test → Docker → Push → Deploy. Each stage must succeed before the next begins. Any failure stops the entire pipeline.',
    additionalTips: [
      'Start with dev environment, then staging, finally production',
      'Never skip tests to deploy faster - always a bad idea',
      'Keep pipelines fast (<10 min) for rapid feedback',
      'Monitor deployment success rates - aim for >95%'
    ]
  },

  build_stage: {
    id: 'build_stage',
    title: '🔨 Build Stage',
    icon: '⚙️',
    definition: 'The build stage compiles your source code, installs dependencies, and prepares executable artifacts. It transforms raw code into a runnable application.',
    howItWorks: [
      'Checks out code from Git repository',
      'Installs dependencies (npm install, pip install)',
      'Compiles TypeScript/Java/Go code to executable format',
      'Bundles assets (CSS, images, fonts)',
      'Creates build artifacts ready for deployment'
    ],
    whyWeUseIt: [
      'Validation: Ensures code compiles without syntax errors',
      'Dependency management: Guarantees correct library versions',
      'Optimization: Minifies and bundles code for production',
      'Consistency: Same build process for all developers',
      'Speed: Compiled code runs faster than interpreted'
    ],
    realWorldExample: 'Spotify builds 2,000+ microservices daily. Their build system uses distributed caching and parallel execution to compile massive codebases in under 5 minutes, enabling rapid iteration.',
    inYourSimulation: 'Watch the build stage install dependencies with npm install and compile code with npm run build. In production environments, this step fails 10% of the time due to dependency conflicts or syntax errors.',
    additionalTips: [
      'Use lockfiles (package-lock.json) for reproducible builds',
      'Cache dependencies to speed up builds',
      'Fail fast: Stop immediately on compilation errors',
      'Build once, deploy many times (don\'t rebuild for each environment)'
    ]
  },

  test_stage: {
    id: 'test_stage',
    title: '🧪 Test Stage',
    icon: '✅',
    definition: 'The test stage runs automated tests to verify your code works correctly. It catches bugs before they reach production, acting as a safety net for code quality.',
    howItWorks: [
      'Unit tests: Verify individual functions work correctly',
      'Integration tests: Check components work together',
      'End-to-end tests: Simulate real user workflows',
      'Linting: Enforce code style and standards',
      'Security scans: Detect vulnerabilities',
      'All tests must pass for pipeline to continue'
    ],
    whyWeUseIt: [
      'Bug prevention: Catch errors before users see them',
      'Confidence: Deploy knowing code works',
      'Documentation: Tests show how code should behave',
      'Refactoring safety: Change code without breaking functionality',
      'Faster debugging: Pinpoint exact failure location'
    ],
    realWorldExample: 'Google requires all code changes to pass thousands of tests before merging. Their test suite runs 4+ billion tests per day. A single failing test blocks the entire deployment, preventing bugs from reaching users.',
    inYourSimulation: 'Testing stage runs unit and integration tests. In dev environment, 15% of tests fail to simulate real-world debugging. In production, only 5% fail because code has been vetted. Failed tests automatically block deployment.',
    additionalTips: [
      'Aim for 80%+ code coverage',
      'Write tests BEFORE fixing bugs (test-driven development)',
      'Keep tests fast: unit tests <100ms, integration <5s',
      'Flaky tests are worse than no tests - fix or delete them'
    ]
  },

  docker_build: {
    id: 'docker_build',
    title: '🐳 Dockerize Stage',
    icon: '📦',
    definition: 'The Dockerize stage packages your application and all its dependencies into a Docker image. This image becomes a portable, self-contained unit that runs identically anywhere.',
    howItWorks: [
      'Reads Dockerfile instructions',
      'Starts from base image (node:18, python:3.11)',
      'Copies application code into image',
      'Installs runtime dependencies',
      'Creates compressed, layered image',
      'Tags image with version number (v1.0.3)'
    ],
    whyWeUseIt: [
      'Consistency: "Works on my machine" → Works everywhere',
      'Isolation: Each container is independent',
      'Portability: Deploy same image to any cloud/server',
      'Version control: Track changes through image tags',
      'Rollback capability: Revert to previous working image instantly'
    ],
    realWorldExample: 'PayPal processes $1+ trillion in payments using containerized microservices. Their Docker images include fraud detection models, payment processors, and compliance validators - all versioned and deployable in seconds.',
    inYourSimulation: 'Watch as your code is packaged into layers. Each layer represents a Dockerfile instruction. The final image is tagged with a semantic version (v1.0.x) that auto-increments with each successful build.',
    additionalTips: [
      'Use multi-stage builds to keep images small',
      'Scan images for security vulnerabilities',
      'Tag with specific versions, not "latest"',
      'Smaller images deploy faster and use less storage'
    ]
  },

  image_push: {
    id: 'image_push',
    title: '📤 Push to Registry',
    icon: '☁️',
    definition: 'The push stage uploads your Docker image to a container registry (Docker Hub, ECR, GCR). The registry acts as a central repository where deployment servers can pull images.',
    howItWorks: [
      'Authenticates with container registry',
      'Compresses image layers for upload',
      'Pushes image to registry with unique tag',
      'Registry stores image and serves it globally',
      'Deployment servers pull image when needed'
    ],
    whyWeUseIt: [
      'Centralized storage: Single source of truth for images',
      'Distribution: Servers worldwide can pull same image',
      'Security: Registry scans for vulnerabilities',
      'Version history: Keep all previous image versions',
      'Access control: Manage who can push/pull images'
    ],
    realWorldExample: 'Docker Hub stores 10+ million container images. Netflix pushes Docker images to Amazon ECR, which replicates them across 20+ AWS regions. This ensures any server globally can pull images in <10 seconds.',
    inYourSimulation: 'After building your image, it\'s uploaded to a simulated registry. The push shows progress as layers are transferred. Once complete, the image is available for deployment to any environment (dev, staging, prod).',
    additionalTips: [
      'Use private registries for proprietary code',
      'Implement image signing to prevent tampering',
      'Set up automated vulnerability scanning',
      'Use registry webhooks to trigger deployments'
    ]
  },

  deployment: {
    id: 'deployment',
    title: '🚀 Deployment Stage',
    icon: '🎯',
    definition: 'The deployment stage takes your Docker image and runs it on target servers/Kubernetes clusters. This is where your code becomes a live, accessible application serving real users.',
    howItWorks: [
      'Pulls Docker image from registry',
      'Chooses deployment strategy (rolling/blue-green/canary)',
      'Creates new containers with updated image',
      'Performs health checks to verify containers are ready',
      'Routes production traffic to new containers',
      'Monitors for errors and automatically rolls back if needed'
    ],
    whyWeUseIt: [
      'Zero downtime: Users never see "site down" messages',
      'Risk mitigation: Gradual rollout catches issues early',
      'Fast rollbacks: Revert to previous version in seconds',
      'Scalability: Deploy to 1000s of servers simultaneously',
      'Automation: No manual server access required'
    ],
    realWorldExample: 'Uber deploys 4,000+ microservices using canary deployments. They roll out to 1% of servers, monitor error rates for 10 minutes, then gradually scale to 100%. Any spike in errors triggers automatic rollback.',
    inYourSimulation: 'Choose a deployment strategy: Rolling (gradual replacement), Blue/Green (parallel environments), or Canary (gradual traffic shift). Watch as your app deploys to the selected environment (dev/staging/prod) with health checks validating success.',
    additionalTips: [
      'Always deploy to staging before production',
      'Set up alerts for deployment failures',
      'Keep previous 3 versions ready for instant rollback',
      'Monitor error rates closely for 30 min post-deploy'
    ]
  },

  rollback: {
    id: 'rollback',
    title: '⏮️ Rollback System',
    icon: '🔄',
    definition: 'Rollback is the emergency eject button for deployments. It instantly reverts your application to a previous working version when something goes wrong in production.',
    howItWorks: [
      'Stores previous N versions of Docker images',
      'Monitors deployment health (error rates, latency)',
      'Detects anomalies (5%+ error rate spike)',
      'Automatically or manually triggers rollback',
      'Redeploys previous version to all servers',
      'Traffic routes back to stable version'
    ],
    whyWeUseIt: [
      'Risk mitigation: Bad deploy? Revert in 60 seconds',
      'User protection: Minimize exposure to buggy code',
      'Peace of mind: Deploy confidently knowing rollback exists',
      'Learning opportunity: Analyze what went wrong safely',
      'Compliance: Some industries require rollback capability'
    ],
    realWorldExample: 'In 2021, Facebook had a 6-hour outage partly because they couldn\'t rollback a bad BGP configuration. GitHub, by contrast, rolls back 10-15% of deployments automatically within minutes using health check monitoring.',
    inYourSimulation: 'If a deployment fails (5% chance in production), the system offers automatic or manual rollback. Click "Rollback to Previous" in the deployment panel to revert to the last stable version instantly.',
    additionalTips: [
      'Keep at least 3 versions available for rollback',
      'Test rollback procedures regularly (chaos engineering)',
      'Document rollback criteria (when to trigger)',
      'Combine with feature flags for instant disable without full rollback'
    ]
  },

  deployment_strategies: {
    id: 'deployment_strategies',
    title: '🎯 Deployment Strategies',
    icon: '🔀',
    definition: 'Deployment strategies define HOW you replace old code with new code in production. Different strategies balance speed, risk, and resource usage.',
    howItWorks: [
      'Rolling: Replace servers one-by-one (low risk, slow)',
      'Blue/Green: Run old & new side-by-side, switch traffic instantly',
      'Canary: Send 5% traffic to new version, gradually increase to 100%',
      'Recreate: Stop all, deploy new, start all (downtime, but simple)',
      'A/B Testing: Split traffic by user segment for feature testing'
    ],
    whyWeUseIt: [
      'Risk management: Catch issues before affecting all users',
      'Zero downtime: Keep site running during deployments',
      'Fast rollback: Switch back if problems detected',
      'Performance testing: Compare old vs new version',
      'Confidence: Gradual rollout reduces blast radius'
    ],
    realWorldExample: 'Google Chrome uses canary deployments - new versions roll to 1% of users (Canary channel), then 10% (Dev channel), then 100% (Stable). This catches bugs before billions of users are affected.',
    inYourSimulation: 'Choose your strategy when triggering a pipeline: Rolling (safe, gradual), Blue/Green (instant switch, easy rollback), or Canary (lowest risk, gradual validation). Each has different speed and resource tradeoffs.',
    additionalTips: [
      'Production: Use blue/green or canary',
      'Staging: Rolling or recreate is fine',
      'Dev: Recreate (fastest, downtime acceptable)',
      'Combine strategies: Canary to 10%, then blue/green for final switch'
    ]
  },

  pipeline_monitoring: {
    id: 'pipeline_monitoring',
    title: '📊 Pipeline Monitoring',
    icon: '👀',
    definition: 'Pipeline monitoring tracks every deployment, measuring success rates, duration, and failure patterns. It turns CI/CD from a black box into a transparent, measurable process.',
    howItWorks: [
      'Logs every pipeline run with timestamp and outcome',
      'Tracks stage-level success/failure rates',
      'Measures deployment frequency and lead time',
      'Detects patterns (e.g., tests always fail on Fridays)',
      'Alerts on anomalies (sudden spike in failures)',
      'Provides historical data for optimization'
    ],
    whyWeUseIt: [
      'Visibility: See exactly what deployed when',
      'Debugging: Trace failures to specific commits',
      'Metrics: Prove DevOps improvements with data',
      'Compliance: Audit trail for security/regulations',
      'Optimization: Identify and fix bottlenecks'
    ],
    realWorldExample: 'Etsy monitors 50+ pipeline metrics including deploy frequency (50/day), lead time (20 minutes), MTTR (mean time to recovery: 12 minutes). They visualized that deployments before 10am have 40% lower failure rates.',
    inYourSimulation: 'The pipeline history panel shows all runs with status, version, environment, and duration. Green badge = success, red = failure. Click rollback to revert to any previous successful deployment.',
    additionalTips: [
      'Track DORA metrics: Deployment frequency, lead time, MTTR, change failure rate',
      'Set up dashboards visible to whole team',
      'Alert on failure rate >5%',
      'Review failed pipelines in weekly retrospectives'
    ]
  },

  terraformResource: {
    id: 'terraformResource',
    title: '🧱 What is a Resource Block?',
    icon: '🧱',
    definition: 'A resource block is the basic building unit of Terraform configuration. It declares one piece of infrastructure you want to exist — a server, a load balancer, a security group — and the settings it should have.',
    howItWorks: [
      'Written as `resource "type" "name" { ... }` in real Terraform (HCL)',
      'The "type" picks what kind of infrastructure (e.g. aws_instance)',
      'The "name" is a local label you choose, used to reference it elsewhere',
      'The attributes inside the block describe its desired settings',
      'Terraform reads every resource block together as your desired end-state'
    ],
    whyWeUseIt: [
      'Declarative: you describe the end state, not the steps to get there',
      'Repeatable: the same config produces the same infrastructure every time',
      'Reviewable: infrastructure changes go through the same review as code',
      'Composable: resources can reference each other\'s attributes',
      'Versioned: your infrastructure history lives in git, not in someone\'s memory'
    ],
    realWorldExample: 'HashiCorp\'s own case studies cite companies managing thousands of AWS resources — VPCs, databases, load balancers — from a single reviewed set of resource blocks, rather than clicking through a console by hand for each one.',
    inYourSimulation: 'In the Terraform Lab, adding a resource block adds it to your configuration only — it does not create anything yet. That separation between "written" and "real" is the whole point: run Plan to see what would change, then Apply to make it real.',
    additionalTips: [
      'Give resources descriptive names — "web_server" beats "instance_1"',
      'Group related resources in the same configuration so their relationships are visible',
      'A resource in your config with nothing applied yet shows up as "to add" on the next plan'
    ]
  },

  terraformPlanApply: {
    id: 'terraformPlanApply',
    title: '📋 Plan vs. Apply',
    icon: '📋',
    definition: '`terraform plan` calculates the difference between your configuration (what you want) and your state (what actually exists), without changing anything. `terraform apply` executes that plan and makes the real infrastructure match.',
    howItWorks: [
      'Plan compares three things: your config, your state file, and (in real Terraform) the real infrastructure',
      'Each resource is classified as create, update-in-place, destroy, or no-op',
      'Nothing is touched during a plan — it is always safe to run',
      'Apply walks through the plan\'s actions and executes them one by one',
      'After a successful apply, the state file is updated to match the new reality'
    ],
    whyWeUseIt: [
      'Plan is a preview — you see exactly what will happen before it happens',
      'Catches mistakes before they become outages ("wait, that would destroy my database?")',
      'Makes infrastructure changes reviewable, just like a pull request diff',
      'Removes the guesswork of manually tracking what changed since last time'
    ],
    realWorldExample: 'Most teams that use Terraform in production require a human to read the plan output and approve it — often as a required check in a CI/CD pipeline — before apply is allowed to run, exactly because plan surfaces destructive changes ahead of time.',
    inYourSimulation: 'Click Plan any time after editing your configuration to see a color-coded diff: green for resources to create, yellow for changes, red for destroys. Apply is disabled until you\'ve run a fresh plan, so you always see the diff before committing to it.',
    additionalTips: [
      'Always re-run Plan after any config change — an old plan can go stale',
      'A plan showing "0 to add, 0 to change, 0 to destroy" means your infrastructure already matches your config',
      'In real Terraform, plan output is often piped straight into a pull-request comment for team review'
    ]
  },

  terraformState: {
    id: 'terraformState',
    title: '🗂️ What is the State File?',
    icon: '🗂️',
    definition: 'The state file is Terraform\'s record of what it actually created last time it ran. It maps each resource block in your config to the real infrastructure object it corresponds to, and stores that object\'s current attributes.',
    howItWorks: [
      'Created and updated automatically every time you run apply',
      'Stores IDs and attributes for every resource Terraform manages',
      'Used to compute the diff during the next plan',
      'In real Terraform this is a JSON file, often stored remotely (S3, Terraform Cloud) so a team can share it',
      'If the state doesn\'t match reality, Terraform\'s next plan will be wrong'
    ],
    whyWeUseIt: [
      'Without it, Terraform would have no way to know what it already built',
      'Enables safe updates — Terraform only changes what actually needs to change',
      'Enables safe teardown — Terraform knows exactly what to destroy',
      'Shared remote state lets a whole team collaborate on the same infrastructure'
    ],
    realWorldExample: 'A common real-world incident: someone deletes a resource by hand in the cloud console. Terraform\'s state still thinks it exists — so the next plan reports it needs to be "created" again, because state and reality have diverged.',
    inYourSimulation: 'The State panel shows what\'s actually been applied — separate from your configuration. Try Simulate Drift on an applied resource: it mutates the "real" resource without touching your config, then run Plan to see Terraform notice the mismatch, exactly like a manual console change would.',
    additionalTips: [
      'Never hand-edit a real state file — use `terraform import` or `state` subcommands instead',
      'Losing your state file is one of the most common ways teams lose track of their infrastructure',
      'Drift (state vs. reality mismatch) is one of the most common real-world Terraform problems'
    ]
  },

  terraformDrift: {
    id: 'terraformDrift',
    title: '🌊 What is Configuration Drift?',
    icon: '🌊',
    definition: 'Drift happens when the real infrastructure changes outside of Terraform — someone edits a setting by hand in a cloud console, or an automated process changes it — so the actual resource no longer matches what Terraform\'s state file recorded.',
    howItWorks: [
      'Terraform\'s state assumes nothing changes infrastructure except Terraform itself',
      'A manual change breaks that assumption silently — nothing alerts you immediately',
      'The next `plan` compares state against real infrastructure and detects the mismatch',
      'Terraform reports it as a change to reconcile — usually by proposing to revert it',
      'Left unnoticed, drift compounds: more manual changes make the plan output harder to trust'
    ],
    whyWeUseIt: [
      'Detecting drift early prevents "surprise" applies that revert changes someone made for a real reason',
      'Understanding drift is why teams enforce "no manual changes to Terraform-managed infrastructure"',
      'It\'s one of the most common causes of Terraform plans doing something unexpected in real jobs'
    ],
    realWorldExample: 'A classic incident pattern: an engineer bumps an instance\'s size by hand during an outage to fix it fast, forgets to update the Terraform config, and weeks later a routine apply silently shrinks it back down — reintroducing the outage.',
    inYourSimulation: 'Simulate Drift on any applied resource in the State panel to mutate it "by hand," then run Plan to see Terraform detect and propose to fix the mismatch — the same signal you would see in a real drifted environment.',
    additionalTips: [
      'Run `terraform plan` on a schedule (even with no config changes) purely to detect drift',
      'Treat every unexpected plan diff as a signal to investigate who or what changed the resource',
      'The fix for drift is either to apply (revert to config) or update the config to match reality on purpose'
    ]
  },

  ansibleInventory: {
    id: 'ansibleInventory',
    title: '🗂️ What is an Inventory?',
    icon: '🗂️',
    definition: 'An inventory is the list of servers Ansible manages, usually organized into named groups (like "webservers" or "dbservers") so you can target a playbook at exactly the machines that need it.',
    howItWorks: [
      'In real Ansible, it\'s typically a file (INI or YAML) listing hostnames or IP addresses',
      'Hosts are organized into groups using `[groupname]` headers',
      'A playbook targets a group (or "all") in its `hosts:` field, not individual servers by name',
      'Ansible connects to each host over SSH (no agent needs to be installed on the target)',
      'Inventory can also be "dynamic" — generated on the fly from a cloud provider\'s API'
    ],
    whyWeUseIt: [
      'Lets one playbook apply to 1 server or 1,000 without changing the playbook itself',
      'Groups map naturally to roles: webservers, dbservers, load balancers',
      'Keeps "which machines get this change" separate from "what the change is"',
      'Agentless — nothing to install or maintain on every managed server'
    ],
    realWorldExample: 'A team running 50 web servers behind a load balancer keeps them all in a `[webservers]` group. Deploying a new app version means running one playbook against that group — Ansible handles connecting to and updating all 50 in sequence or in parallel.',
    inYourSimulation: 'The Inventory panel is where you add hosts and assign them to a group. Every task in your playbook runs against every host in your inventory when you run it.',
    additionalTips: [
      'Group hosts by role (webservers, dbservers), not by data center or purchase date',
      'A host can belong to more than one group in real Ansible',
      'Real teams often keep inventory in version control right alongside the playbooks'
    ]
  },

  ansiblePlaybook: {
    id: 'ansiblePlaybook',
    title: '📜 What is a Playbook?',
    icon: '📜',
    definition: 'A playbook is a YAML file describing a list of tasks to run on a group of hosts. Each task uses a "module" — a pre-built unit of work like "install a package" or "start a service" — instead of a hand-written shell script.',
    howItWorks: [
      'A playbook contains one or more "plays", each targeting a host group',
      'Each play contains a list of "tasks", run in order, top to bottom',
      'Each task names a module (e.g. `ansible.builtin.apt`) and the parameters it needs',
      'Ansible runs each task across every targeted host before moving to the next task',
      'A task can `notify` a "handler" — an action (like restarting a service) that only runs if something actually changed'
    ],
    whyWeUseIt: [
      'Modules understand the difference between "already correct" and "needs to change" — you don\'t have to write that logic yourself',
      'Reads close to plain English, so it doubles as documentation of what the server setup actually is',
      'The same playbook works whether it\'s the first run ever or the thousandth',
      'Reusable and shareable — the same playbook can configure dev, staging, and production'
    ],
    realWorldExample: 'A typical web server playbook: install nginx, copy the config, ensure the service is running and enabled at boot, open the firewall port. Four tasks, and it works identically on a fresh server or one that\'s already 90% configured.',
    inYourSimulation: 'The Playbook panel is where you add tasks by picking a real Ansible module. The live preview shows exactly the YAML you\'d write in a real `site.yml` for that task.',
    additionalTips: [
      'Prefer a dedicated module (`ansible.builtin.apt`) over `command`/`shell` whenever one exists — modules are idempotent by default, raw commands usually aren\'t',
      'Give every task a clear `name:` — it\'s what shows up in the run output',
      'Order matters: tasks run top to bottom, so install before configure before start'
    ]
  },

  ansibleIdempotency: {
    id: 'ansibleIdempotency',
    title: '🔁 Idempotency: ok vs. changed',
    icon: '🔁',
    definition: 'Idempotency means running the same playbook twice produces the same end result as running it once — the second run reports "ok" (nothing to do) instead of repeating the work or causing an error.',
    howItWorks: [
      'Before acting, each module checks the current state of the target',
      'If reality already matches what the task describes, it reports `ok` and does nothing further',
      'If reality differs, it makes the change and reports `changed`',
      'At the end of a run, the "PLAY RECAP" totals `ok`/`changed`/`failed` per host',
      'A healthy, fully-converged environment should show `changed=0` on a re-run'
    ],
    whyWeUseIt: [
      'Safe to run on a schedule or after every deploy without fear of side effects',
      'A run that reports unexpected `changed` counts is itself a signal something drifted',
      '`--check` mode uses this same logic to preview a run without touching anything',
      'Removes the "did this already run on that server?" uncertainty of ad-hoc scripts'
    ],
    realWorldExample: 'A team runs their configuration playbook against production every night via a cron job. Almost every night it reports `changed=0` across every host — proof the fleet is exactly as declared. A night with an unexpected `changed=1` immediately gets investigated.',
    inYourSimulation: 'Run Playbook once and you\'ll see `changed` results as hosts get configured for the first time. Run it again immediately with no edits, and everything reports `ok` — that\'s idempotency working correctly.',
    additionalTips: [
      '`command` and `shell` tasks are NOT idempotent by default — they report `changed` every time unless you add a `changed_when` condition',
      'Unlike Terraform, Ansible does not remove things when you delete a task — there\'s no destroy phase, only convergence toward what\'s currently declared',
      '`--check` combined with `--diff` shows exactly which lines of a file would change, without changing them'
    ]
  },

  ansibleDrift: {
    id: 'ansibleDrift',
    title: '🌊 Configuration Drift, Ansible-Style',
    icon: '🌊',
    definition: 'Drift happens when a server\'s real configuration changes outside of Ansible — someone edits a file by hand, restarts a service with the wrong flags — so it no longer matches what the playbook declares.',
    howItWorks: [
      'Ansible only knows what a server looks like at the moment it connects and checks',
      'A manual change made between runs is invisible until the next run happens',
      'The next run\'s module checks detect the mismatch and report `changed` again, even though "nothing changed in the playbook"',
      'Applying converges the host back to what the playbook declares — the manual change gets overwritten',
      'This is the same underlying idea as Terraform drift, but detected task-by-task instead of resource-by-resource'
    ],
    whyWeUseIt: [
      'An unexpected `changed` on a re-run is itself a useful alert that someone bypassed the normal process',
      'Prevents small manual "just this once" fixes from silently becoming permanent, undocumented state',
      'Reinforces the habit of changing the playbook instead of the server when a fix needs to stick'
    ],
    realWorldExample: 'An engineer manually bumps a config value during an incident to stop the bleeding, then forgets to update the playbook. Weeks later, a routine run silently reverts it — reintroducing the original problem, right when no one is looking at it.',
    inYourSimulation: 'Use "Simulate Drift" on a converged host in the Ansible Lab to mutate it "by hand," then run --check to see Ansible report it as `changed` — the same signal you\'d see with a real drifted server.',
    additionalTips: [
      'Run playbooks on a recurring schedule specifically to catch drift, not just when you have a change to make',
      'If a manual fix needs to stay, put it in the playbook — don\'t leave it as an undocumented exception',
      'Frequent unexpected drift on one host often means someone is still SSHing in directly out of habit'
    ]
  },

  vaultSecretsEngine: {
    id: 'vaultSecretsEngine',
    title: '🗄️ What is a Secrets Engine?',
    icon: '🗄️',
    definition: 'A secrets engine is a plugin that handles one specific kind of secret. The most common, KV, just stores whatever key/value pairs you give it. Others, like the database engine, actively generate brand-new credentials for you on demand.',
    howItWorks: [
      'An engine is "enabled" (mounted) at a path, e.g. `secret/` or `database/`',
      'Everything under that path is handled by that engine\'s own logic',
      'KV v2 stores and versions whatever you write — it doesn\'t generate anything itself',
      'Dynamic engines (database, AWS, GCP, Azure, SSH) create a brand-new, short-lived credential every time one is requested',
      'A dynamic credential comes with a "lease" — a TTL after which it automatically stops working'
    ],
    whyWeUseIt: [
      'One consistent access-control and audit model, regardless of what kind of secret it is',
      'Dynamic secrets mean nobody has to remember to rotate a static password — it simply expires',
      'A leaked dynamic credential self-destructs; a leaked static one lives forever unless someone notices',
      'Different engines can be mounted at different paths for different teams or environments'
    ],
    realWorldExample: 'A CI pipeline that needs database access requests a credential from Vault\'s database engine at the start of a job and gets a brand-new username/password pair that\'s only valid for the next hour — no shared, long-lived database password to leak from a build log.',
    inYourSimulation: 'The Secrets Engines panel is where you enable an engine at a mount path before you can write anything into it. Everything else in the lab happens underneath one of these mounts.',
    additionalTips: [
      'KV v2 is almost always the right starting point — start there before reaching for dynamic engines',
      'A mount path shows up in every full secret path (e.g. `secret/data/myapp/config`) and in every policy that references it',
      'Real teams mount the same engine type multiple times at different paths to separate teams or environments'
    ]
  },

  vaultKvVersioning: {
    id: 'vaultKvVersioning',
    title: '📚 KV Versioning',
    icon: '📚',
    definition: 'The KV v2 secrets engine keeps every previous value of a secret, not just the current one. Writing to an existing path doesn\'t overwrite anything — it creates a new version and leaves the old ones intact.',
    howItWorks: [
      'Each write to the same path increments the version number by one',
      '`vault kv get` returns the latest version by default',
      '`vault kv get -version=N` reads a specific historical version',
      'Rolling back is really just writing the old version\'s data again as a brand-new version — history is never actually erased',
      'Old versions can be permanently destroyed on purpose, but that\'s a separate, deliberate action'
    ],
    whyWeUseIt: [
      'A bad rotation ("oops, wrong password") is recoverable in seconds instead of being a fire drill',
      'You can see exactly when a secret\'s value changed, which is often exactly what an incident review needs',
      'Nobody accidentally destroys history just by writing a routine update'
    ],
    realWorldExample: 'Someone rotates an API key and immediately breaks production because the new key wasn\'t actually valid yet. With versioning, restoring service is "roll back to the previous version," not "does anyone remember what the old value was?"',
    inYourSimulation: 'Write a secret to the same path twice with different values in the Secrets panel, then open its version history — you can see both versions and roll back to the earlier one, which itself creates a new version on top.',
    additionalTips: [
      'A rollback creates a new version rather than reviving the old one — the version number always goes up',
      'Set a max-versions limit in real Vault so history doesn\'t grow forever',
      'Version history is not a substitute for real secret rotation — old, retired credentials should be actively revoked, not just kept around as history'
    ]
  },

  vaultPolicies: {
    id: 'vaultPolicies',
    title: '📜 What is a Vault Policy?',
    icon: '📜',
    definition: 'A policy is an HCL document that grants specific capabilities (read, write, list, delete...) on specific paths. Nothing is accessible by default — access exists only where a policy explicitly grants it.',
    howItWorks: [
      'Each `path` block names a path (or pattern with a trailing `*`) and the capabilities allowed there',
      'A token can have multiple policies attached — its effective access is the union of all of them',
      'A request is allowed if ANY attached policy grants the needed capability on that exact path',
      'No matching policy means denied — there is no implicit access',
      'Policies are usually named for the role they represent (e.g. `myapp-readonly`), not for a specific person'
    ],
    whyWeUseIt: [
      'Turns "who can see this secret" into an explicit, reviewable document instead of tribal knowledge',
      'Encourages least privilege: write the narrowest pattern that still works, not `secret/*`',
      'The same policy can be reused across every token that plays the same role',
      'A leaked token is only as dangerous as the policies attached to it'
    ],
    realWorldExample: 'A CI/CD pipeline\'s token is attached to a policy that grants `read` on exactly `secret/data/myapp/*` and nothing else — so even if that token leaks from a build log, whoever finds it can\'t read any other team\'s secrets.',
    inYourSimulation: 'The Policies panel is where you write a path pattern and pick capabilities, then see the exact HCL it produces. Attach it to a token in the Tokens panel to see it actually gate access.',
    additionalTips: [
      'A pattern ending in `/*` matches everything under that prefix — without it, the match is exact-path only',
      '`list` is a separate capability from `read` — a token can be allowed to see that secrets exist without being able to read their values',
      'When an access attempt is denied, check the path pattern first — a missing `/*` or a typo is the most common cause'
    ]
  },

  vaultTokens: {
    id: 'vaultTokens',
    title: '🔑 Tokens & Access Control',
    icon: '🔑',
    definition: 'A token is Vault\'s core proof of identity. Every request — human or machine — is made with a token, and that token\'s attached policies are the only thing standing between "allowed" and "permission denied."',
    howItWorks: [
      'A token is created with one or more policies attached at creation time',
      'On every request, Vault checks the requested path and capability against all of the token\'s attached policies',
      'If any attached policy grants it, the request succeeds; if none do, it\'s denied',
      'In real Vault, tokens also have a TTL and can be revoked instantly, cutting off access immediately',
      'Other auth methods (AppRole for machines, LDAP/userpass for humans) all resolve down to a token with policies — this is the universal mechanism underneath all of them'
    ],
    whyWeUseIt: [
      'Revoking one compromised token doesn\'t affect anyone else\'s access',
      'Access can be scoped per application or per pipeline, not shared across everything',
      'A short-lived token limits how long a leak stays dangerous',
      'The same allow/deny model applies uniformly, no matter how the token was originally issued'
    ],
    realWorldExample: 'Two microservices each get their own token, each attached to a policy scoped to only that service\'s own secrets. When one service is decommissioned, its token is revoked — the other service\'s access is completely unaffected.',
    inYourSimulation: 'Create a token in the Tokens panel, attach a policy (or don\'t), then use "Attempt Read" to see the exact allow/deny outcome — the same evaluation a real Vault server performs on every single request.',
    additionalTips: [
      'A token with zero policies attached can do nothing — there\'s no default access to fall back on',
      'Prefer many narrowly-scoped tokens over one broad one shared across services',
      '"Permission denied" almost always means either the wrong policy is attached, or the path pattern doesn\'t actually cover the path being requested'
    ]
  },

  kubectlPodsAndDeployments: {
    id: 'kubectlPodsAndDeployments',
    title: '📦 Pods, Deployments & Nodes',
    icon: '📦',
    definition: 'A Pod is one running instance of your container. A Deployment declares how many pod replicas should exist and manages replacing them. A Node is the actual machine the pods run on.',
    howItWorks: [
      '`kubectl get pods` lists running pods; `kubectl get pods -o wide` adds the node and IP each one landed on',
      '`kubectl get deployments` shows desired vs. available replica counts for each Deployment',
      '`kubectl get nodes` lists the cluster\'s worker machines and whether each is Ready',
      '`kubectl describe pod <name>` shows full detail: which node it\'s on, its containers, resource usage, and recent events',
      'Deleting a pod that belongs to a Deployment doesn\'t reduce its replica count -- a replacement is scheduled immediately'
    ],
    whyWeUseIt: [
      '`get` gives you the fast overview; `describe` gives you the detail you need once something looks wrong',
      'Knowing which node a crashing pod landed on often points straight at the real problem (e.g. that node is out of memory)',
      'Separating "how many replicas do I want" (Deployment) from "what\'s actually running" (Pods) is the core Kubernetes mental model'
    ],
    realWorldExample: 'A pod keeps restarting. `kubectl get pods` shows `CrashLoopBackOff`. `kubectl describe pod` and `kubectl logs` together usually reveal the real cause within seconds -- a missing environment variable, a failed health check, or a bad image tag.',
    inYourSimulation: 'Run `kubectl get pods` in the Lab to see real IDs from your current cluster, then `kubectl describe pod <id>` on one of them to see the same kind of detail a real cluster would return.',
    additionalTips: [
      'A pod\'s name alone rarely tells you enough -- `describe` and `logs` are where the real diagnosis happens',
      '`-o wide` is an easy habit to build; it costs nothing and often saves a follow-up `describe`',
      'If `get nodes` shows a node as NotReady, nothing new can be scheduled there until it recovers'
    ]
  },

  kubectlDeclarativeVsImperative: {
    id: 'kubectlDeclarativeVsImperative',
    title: '⚡ Declarative (apply) vs. Imperative (create)',
    icon: '⚡',
    definition: '`kubectl create` and `kubectl scale` tell the cluster exactly what to do right now. `kubectl apply -f file.yaml` instead describes the end state you want, and Kubernetes figures out what needs to change to get there.',
    howItWorks: [
      'Imperative commands (`create`, `scale`, `expose`) are direct, one-shot actions -- fast, but not recorded anywhere',
      'Declarative `apply` reads a YAML file describing the desired resource and reconciles the live cluster toward it',
      'Running the same `apply -f file.yaml` twice is safe -- if nothing in the file changed, nothing happens (idempotent, the same idea as Ansible)',
      'A YAML manifest can be checked into version control, reviewed, and diffed -- an imperative command in someone\'s shell history cannot'
    ],
    whyWeUseIt: [
      'Imperative commands are great for quick exploration or a one-off fix during an incident',
      'Declarative YAML is what real teams actually run in CI/CD -- it\'s reviewable, repeatable, and self-documenting',
      'Mixing both on the same resource causes drift: an `apply` can silently undo a manual imperative change'
    ],
    realWorldExample: 'A team manages every Deployment as YAML in a Git repo, applied automatically by their CI/CD pipeline on merge. An engineer who "quickly" scales a deployment by hand with `kubectl scale` gets overwritten on the next pipeline run -- exactly like Terraform reverting a manual console change.',
    inYourSimulation: 'Try `kubectl create deployment` for a fast, direct change, and `kubectl apply -f` to see the declarative form -- notice the response is nearly instant either way, but only one of them is meant to live in version control.',
    additionalTips: [
      'When in doubt, prefer `apply -f` for anything that should persist -- treat imperative commands as scratch work',
      'Real teams almost never hand-run `kubectl create` against production -- it happens through a pipeline applying YAML instead',
      'This is the exact same declarative-vs-imperative distinction as Terraform vs. a hand-run cloud CLI command'
    ]
  },

  kubectlRollouts: {
    id: 'kubectlRollouts',
    title: '🔁 Rollouts: status, restart, undo',
    icon: '🔁',
    definition: 'A "rollout" is Kubernetes updating a Deployment\'s pods to match a new desired state. `kubectl rollout` commands let you watch that update, force it to happen again, or reverse it.',
    howItWorks: [
      '`kubectl rollout status deployment <name>` reports whether the rollout has finished successfully',
      '`kubectl rollout restart deployment <name>` recreates every pod one at a time with zero downtime -- useful for picking up a changed config without changing the image',
      '`kubectl rollout undo deployment <name>` reverts to the previous revision',
      'Kubernetes keeps a revision history per Deployment specifically so `undo` has something to roll back to'
    ],
    whyWeUseIt: [
      'A bad deploy is recoverable in seconds with `undo` instead of needing a brand-new fixed release',
      '`rollout restart` is the standard way to force pods to pick up a changed Secret or ConfigMap',
      '`rollout status` is what CI/CD pipelines poll to know whether a deploy actually succeeded before marking the job green'
    ],
    realWorldExample: 'A new image version starts crash-looping in production. Instead of scrambling to build and ship a fix, the on-call engineer runs `kubectl rollout undo deployment web` and traffic is back on the last known-good version within seconds, buying time to fix the real bug calmly.',
    inYourSimulation: 'After creating a second deployment version in the Applications page, use `kubectl rollout undo deployment <name>` in the Lab to switch the active version back -- the same mechanism a real rollback would use.',
    additionalTips: [
      '`undo` only works if there\'s a previous revision to go back to -- a Deployment\'s very first release has nothing to roll back to',
      'Treat `rollout undo` as a way to buy time, not a substitute for actually fixing the underlying bug',
      'Pair `rollout status` with your CI/CD pipeline so a deploy step doesn\'t report success before pods are actually healthy'
    ]
  },

  kubectlTroubleshooting: {
    id: 'kubectlTroubleshooting',
    title: '🔍 Troubleshooting: logs, exec, top',
    icon: '🔍',
    definition: 'When something is broken, `kubectl logs` shows you what a container printed, `kubectl exec` lets you run a command inside it directly, and `kubectl top` shows live CPU/memory usage -- the three tools for actually finding out what\'s wrong.',
    howItWorks: [
      '`kubectl logs <pod>` streams (or in this simulation, prints) the container\'s stdout/stderr',
      '`kubectl exec <pod> -- <command>` runs a one-off command inside the running container, as if you had a shell on it',
      '`kubectl top pods` shows live CPU and memory usage per pod, which `get`/`describe` don\'t surface as clearly',
      'None of these three commands change anything -- they\'re purely for observation'
    ],
    whyWeUseIt: [
      'Logs usually contain the actual error message or stack trace -- the fastest path to root cause',
      '`exec` lets you check things a log line never mentioned, like whether a config file actually landed where expected',
      '`top` catches resource exhaustion before it becomes an outage, not just after'
    ],
    realWorldExample: 'A service returns 500 errors intermittently. `kubectl logs` on the affected pod shows a stack trace pointing at a missing environment variable that only affects one specific code path -- something a health check alone would never have revealed.',
    inYourSimulation: 'Run `kubectl logs <pod-id>` on a crashed pod in the Lab versus a healthy one and compare the output -- then try `kubectl exec <pod-id> -- whoami` on a running pod to see the exec flow.',
    additionalTips: [
      'Always check logs before restarting a crashing pod -- a restart can throw away the exact evidence you needed',
      '`exec` only works on a pod that\'s actually running -- there\'s nothing to attach to on a crashed one',
      '`top pods` needs the metrics-server add-on in a real cluster; it isn\'t available by default everywhere'
    ]
  },
  gitopsApplication: {
    id: 'gitopsApplication',
    title: '🔗 The Application: linking Git to a cluster',
    icon: '🔗',
    definition: 'An "Application" (Argo CD\'s term) is the object that ties a path in a Git repo to a specific place in the cluster -- it\'s the thing the GitOps controller actually watches and reconciles.',
    howItWorks: [
      'It records a repo URL, a branch/tag to track (targetRevision), and a path inside that repo where manifests live',
      'It records a destination -- which cluster and namespace those manifests should be applied to',
      'The controller polls (or gets webhooked) for changes at that path and diffs them against the live destination',
      'Two independent flags control automation: autoSync (apply new commits automatically) and selfHeal (revert manual drift automatically)'
    ],
    whyWeUseIt: [
      'One repo can hold manifests for many services -- the Application object is what scopes the controller to just one of them',
      'Separating "what to watch" from "how automated to be" lets a team dial in automation per-service (a risky payments service might sync manually; a low-risk internal tool might auto-sync and self-heal)',
      'Because it\'s just another declarative object, the Application definition itself is usually also stored in Git ("app of apps")'
    ],
    realWorldExample: 'A platform team manages 40 microservices with one Argo CD instance by creating 40 Application objects, each pointing at a different path in the same monorepo -- one team\'s bad commit only affects that one Application\'s sync status.',
    inYourSimulation: 'Creating a GitOps Application in the Lab is exactly this: you pick a repo URL, a path, and a destination (a real Application from your simulator) that this GitOps Application will keep in sync.',
    additionalTips: [
      'Real Argo CD calls the destination cluster+namespace; this simulation only tracks one cluster, so namespace does the scoping',
      'Toggling Auto-Sync off doesn\'t stop you from committing -- it just means commits pile up until someone clicks Sync'
    ]
  },
  gitopsDesiredState: {
    id: 'gitopsDesiredState',
    title: '📝 Desired state: the manifest in Git',
    icon: '📝',
    definition: 'The "desired state" is whatever the manifest file at the Application\'s path currently says -- not what\'s running, what\'s written down. GitOps is the discipline of always deploying by changing that file, never the live cluster.',
    howItWorks: [
      'Committing a change (e.g. bumping the image version or replica count) updates the manifest file in Git',
      'That commit becomes the new desired state the instant it lands on the tracked branch -- nothing is deployed yet',
      'If Auto-Sync is on, the controller notices the new commit and applies it within seconds',
      'If Auto-Sync is off, the desired state and the live state simply disagree (OutOfSync) until a human runs Sync'
    ],
    whyWeUseIt: [
      'A commit is reviewable before it ships -- a pull request against the manifest is a deploy approval process for free',
      '`git log` on the manifests directory becomes a complete deploy history: who changed what, when, and why (the commit message)',
      '`git revert` undoes a bad deploy the same way it undoes a bad code change -- no separate rollback tooling needed'
    ],
    realWorldExample: 'A team rolls back a bad release by reverting the commit that bumped the image tag, rather than running an imperative rollback command -- the audit trail and the rollback mechanism are the same Git history.',
    inYourSimulation: 'The Commit panel writes a new version/replica count into the deployment manifest shown above it -- that\'s your desired state -- and "git commit && git push" is standing in for pushing that change to the tracked branch.',
    additionalTips: [
      'The manifest preview always reflects your latest commit, not necessarily what\'s live -- check the Sync Status panel for that',
      'In real GitOps, only the manifest changes; the container image itself is built and pushed by CI beforehand'
    ]
  },
  gitopsSyncStatus: {
    id: 'gitopsSyncStatus',
    title: '🔁 Sync status: Synced, OutOfSync, and self-heal',
    icon: '🔁',
    definition: 'Sync status is the answer to one question: does the live cluster currently match the desired state in Git? "Synced" means yes. "OutOfSync" means no -- either a new commit hasn\'t been applied yet, or something drifted.',
    howItWorks: [
      'The controller diffs the live resource against the manifest at every reconciliation pass',
      'A new commit that hasn\'t been applied yet shows as OutOfSync until a sync (auto or manual) runs',
      'Someone changing the live resource directly (e.g. `kubectl scale` by hand) also shows as OutOfSync -- this is called drift',
      'Self-Heal is the controller automatically re-applying the manifest whenever it detects drift, with no human involved',
      'Auto-Sync and Self-Heal solve two different problems: Auto-Sync reacts to new commits, Self-Heal reacts to unauthorized live changes'
    ],
    whyWeUseIt: [
      'A clear Synced/OutOfSync signal means nobody has to manually audit whether the cluster matches Git',
      'Self-Heal makes configuration drift self-correcting instead of silently accumulating until an incident surfaces it',
      'Because both reconcile through the same apply logic, a self-heal and a normal sync behave identically -- no special-case rollback path'
    ],
    realWorldExample: 'An on-call engineer scales a deployment up by hand during an incident to buy time, then forgets to update Git. With Self-Heal on, the controller reverts that scale-up automatically once the incident pressure is gone -- with Self-Heal off, that manual change silently persists forever until someone notices it doesn\'t match the manifest.',
    inYourSimulation: 'Click Simulate Drift to change a live app\'s replica count outside of Git, watch the badge flip to OutOfSync, then either click Sync Now yourself or -- if Self-Heal is on for that app -- watch it correct itself automatically within a couple of seconds, even if you\'ve navigated to a different page.',
    additionalTips: [
      'A brand-new GitOps Application with no commits yet shows "Unknown", not OutOfSync -- there\'s no desired state to compare against',
      'Self-Heal only reverts drift on a resource whose version already matches Git; a genuinely new commit is Auto-Sync\'s job, not Self-Heal\'s'
    ]
  }
};

export type LearningSectionId = keyof typeof dockerLearningContent;
