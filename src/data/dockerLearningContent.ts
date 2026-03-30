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
  }
};

export type LearningSectionId = keyof typeof dockerLearningContent;
