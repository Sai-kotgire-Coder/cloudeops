import { Alert, AlertCategory } from '@/store/alertStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, TrendingUp, Shield, Server, Activity, Network, Boxes, Gauge } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AlertLearningModalProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
}

const categoryIcons = {
  cpu: Activity,
  memory: Server,
  pod: Boxes,
  deployment: TrendingUp,
  traffic: Network,
  network: Network,
  performance: Gauge,
  capacity: Server,
};

const learningContent: Record<AlertCategory, {
  title: string;
  whatItMeans: string;
  whyItMatters: string;
  howToFix: string[];
  bestPractices: string[];
  realWorld: string;
}> = {
  cpu: {
    title: 'CPU Usage & Performance',
    whatItMeans: 'CPU (Central Processing Unit) usage measures how much processing power your instances are consuming. High CPU usage means your servers are working hard to process requests.',
    whyItMatters: 'When CPU usage exceeds 80-90%, your application slows down, requests take longer to process, and you risk service degradation or crashes.',
    howToFix: [
      'Enable Horizontal Pod Autoscaler (HPA) to automatically add more pods when CPU is high',
      'Enable Auto-Scaling Group (ASG) to provision more instances',
      'Optimize application code to reduce CPU-intensive operations',
      'Use caching to reduce repeated calculations',
      'Consider upgrading to larger instance types with more vCPUs',
    ],
    bestPractices: [
      'Set CPU limits and requests for pods to prevent resource exhaustion',
      'Monitor CPU trends over time, not just spikes',
      'Keep production CPU usage below 70% to handle unexpected spikes',
      'Use CPU profiling tools to identify performance bottlenecks',
      'Implement rate limiting to prevent CPU overload from traffic spikes',
    ],
    realWorld: 'Companies like Netflix and Spotify use auto-scaling to handle millions of concurrent users. When CPU usage rises during peak hours, their systems automatically provision more capacity and scale back down during quiet periods to save costs.',
  },
  
  memory: {
    title: 'Memory Management & Leaks',
    whatItMeans: 'Memory usage tracks how much RAM (Random Access Memory) your application is consuming. Applications load data into memory for fast access. High memory usage can indicate memory leaks or insufficient resources.',
    whyItMatters: 'When memory usage exceeds 85-90%, the operating system may kill your application (OOM - Out of Memory). This causes immediate service disruption and data loss.',
    howToFix: [
      'Restart instances/pods to clear memory leaks (temporary fix)',
      'Enable Vertical Pod Autoscaler (VPA) to allocate more memory',
      'Profile your application to find and fix memory leaks',
      'Implement garbage collection tuning for runtime environments',
      'Scale horizontally to distribute memory load across instances',
    ],
    bestPractices: [
      'Set memory limits to prevent runaway processes',
      'Monitor memory usage patterns to detect leaks early',
      'Implement health checks that restart pods showing memory issues',
      'Use memory-efficient data structures and algorithms',
      'Regular restarts can mitigate slow memory leaks in production',
    ],
    realWorld: 'Twitter famously experienced memory-related outages in their early days. Modern cloud platforms use memory monitoring and automatic restart policies to prevent cascading failures when applications leak memory.',
  },
  
  pod: {
    title: 'Kubernetes Pods & Container Orchestration',
    whatItMeans: 'A pod is the smallest deployable unit in Kubernetes - one or more containers running together. Pods can crash due to resource limits, application errors, failed health checks, or infrastructure issues.',
    whyItMatters: 'Pod crashes mean your application is unavailable for those requests. Multiple pod crashes can lead to complete service outages and data loss.',
    howToFix: [
      'Check pod logs to identify the root cause of crashes',
      'Verify resource limits (CPU/memory) are sufficient',
      'Review health check configurations (liveness/readiness probes)',
      'Restart crashed pods to restore service quickly',
      'Scale replicas to distribute load and provide redundancy',
    ],
    bestPractices: [
      'Run multiple replicas (minimum 3) for production services',
      'Configure pod disruption budgets to maintain availability during updates',
      'Use init containers to validate dependencies before starting',
      'Implement exponential backoff for restart policies',
      'Set proper resource requests and limits to prevent scheduling issues',
    ],
    realWorld: 'Amazon uses pod-to-pod redundancy extensively. Even if 30% of pods crash, the remaining pods continue serving traffic while Kubernetes automatically replaces failed pods.',
  },
  
  deployment: {
    title: 'Deployment Strategies & Rollouts',
    whatItMeans: 'Deployment failures occur when new versions of your application cannot start successfully. This can be due to image errors, configuration problems, or resource constraints.',
    whyItMatters: 'Failed deployments prevent you from releasing new features or fixes. They can also cause outages if you\'re replacing existing versions.',
    howToFix: [
      'Check if the container image exists and is accessible',
      'Verify configuration (environment variables, secrets, configmaps)',
      'Ensure sufficient cluster resources for new replicas',
      'Review deployment logs for startup errors',
      'Rollback to previous working version if needed',
    ],
    bestPractices: [
      'Use rolling updates to minimize downtime during deployments',
      'Implement blue-green or canary deployments for safer releases',
      'Always test deployments in staging before production',
      'Set proper health checks to detect failed starts early',
      'Use deployment automation with automatic rollback on failure',
    ],
    realWorld: 'GitHub uses blue-green deployments to release updates with zero downtime. They deploy new versions alongside old ones, test them, then switch traffic over only when validated.',
  },
  
  traffic: {
    title: 'Traffic Management & Load Distribution',
    whatItMeans: 'Traffic alerts indicate your system is receiving more requests than it can handle. This happens during viral events, DDoS attacks, or insufficient capacity planning.',
    whyItMatters: 'Traffic overload leads to slow responses, timeouts, errors, and complete service outages. Users abandon slow sites, hurting business metrics.',
    howToFix: [
      'Enable load balancing to distribute traffic evenly',
      'Scale out by adding more instances/pods immediately',
      'Implement rate limiting to protect from overload',
      'Use CDN (Content Delivery Network) to cache static assets',
      'Consider degrading non-critical features during peak load',
    ],
    bestPractices: [
      'Always overprovision capacity for unexpected spikes (50-100% buffer)',
      'Use auto-scaling to handle variable traffic patterns',
      'Implement circuit breakers to prevent cascade failures',
      'Cache aggressively at multiple levels (CDN, server, database)',
      'Load test your infrastructure before expected traffic spikes',
    ],
    realWorld: 'During Black Friday, retailers like Amazon handle 10x normal traffic using auto-scaling groups that provision hundreds of servers automatically. They pre-warm capacity before expected spikes.',
  },
  
  network: {
    title: 'Network Configuration & Connectivity',
    whatItMeans: 'Network issues involve connectivity problems between services, load balancers, or external dependencies. This includes misconfigured routes, firewall rules, or DNS problems.',
    whyItMatters: 'Network issues prevent services from communicating, causing failures even when individual components are healthy.',
    howToFix: [
      'Verify load balancer is enabled and properly configured',
      'Check service discovery and DNS resolution',
      'Review firewall rules and security groups',
      'Test network connectivity between services',
      'Verify ingress/egress configurations',
    ],
    bestPractices: [
      'Use service mesh for complex microservice networking',
      'Implement network policies to control traffic flow',
      'Monitor network latency and packet loss',
      'Use health checks to detect network partitions',
      'Implement retry logic with exponential backoff',
    ],
    realWorld: 'Google uses advanced load balancing across multiple regions. If one region has network issues, traffic automatically routes to healthy regions within milliseconds.',
  },
  
  performance: {
    title: 'Application Performance Optimization',
    whatItMeans: 'Performance alerts indicate your application is responding slowly to requests. High latency or error rates degrade user experience.',
    whyItMatters: 'Studies show that 100ms of additional latency can reduce conversions by 7%. Users expect fast, reliable responses.',
    howToFix: [
      'Profile application code to find slow operations',
      'Optimize database queries and add indexes',
      'Implement caching layers (Redis, Memcached)',
      'Use asynchronous processing for heavy tasks',
      'Scale resources if performance is resource-bound',
    ],
    bestPractices: [
      'Set performance budgets and SLOs (Service Level Objectives)',
      'Monitor p95/p99 latency, not just averages',
      'Use APM (Application Performance Monitoring) tools',
      'Implement request tracing to identify bottlenecks',
      'Optimize critical path operations first',
    ],
    realWorld: 'Uber optimized their mobile app startup time from 12 seconds to 2 seconds, resulting in 30% increase in user engagement. Performance directly impacts business metrics.',
  },
  
  capacity: {
    title: 'Capacity Planning & Resource Management',
    whatItMeans: 'Capacity issues occur when you don\'t have enough infrastructure resources (instances, pods, storage) to run your application at scale.',
    whyItMatters: 'Insufficient capacity prevents scaling, causes deployment failures, and limits your ability to handle growth.',
    howToFix: [
      'Provision additional instances to increase cluster capacity',
      'Enable auto-scaling to automatically manage capacity',
      'Right-size workloads to use resources efficiently',
      'Clean up unused resources to free capacity',
      'Consider multi-region deployment for unlimited scale',
    ],
    bestPractices: [
      'Plan capacity based on trends and growth projections',
      'Maintain 30-50% headroom for unexpected growth',
      'Use spot/preemptible instances for cost-effective capacity',
      'Implement resource quotas to prevent resource exhaustion',
      'Regular capacity planning reviews (monthly/quarterly)',
    ],
    realWorld: 'Zoom scaled from 10 million daily users to 300 million in 3 months during COVID-19 by leveraging cloud auto-scaling and multi-region deployments. Proper capacity planning enables rapid growth.',
  },
};

export function AlertLearningModal({ alert, open, onClose }: AlertLearningModalProps) {
  if (!alert) return null;

  const content = learningContent[alert.category];
  const Icon = categoryIcons[alert.category];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold">{content.title}</div>
              <div className="text-sm font-normal text-muted-foreground">
                DevOps Learning Center
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              <BookOpen className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="howto" className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              How to Fix
            </TabsTrigger>
            <TabsTrigger value="best" className="flex-1">
              <Shield className="w-4 h-4 mr-2" />
              Best Practices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="panel p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">📚</span>
                What does this mean?
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {content.whatItMeans}
              </p>
            </div>

            <div className="panel p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Why it matters
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {content.whyItMatters}
              </p>
            </div>

            <div className="panel p-4 bg-blue-500/10 border border-blue-500/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-400">
                <span className="text-lg">🌐</span>
                Real-World Example
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {content.realWorld}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="howto" className="space-y-3 mt-4">
            <div className="panel p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">🔧</span>
                How to fix this issue
              </h3>
              <div className="space-y-2">
                {content.howToFix.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-foreground/80 flex-1 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="best" className="space-y-3 mt-4">
            <div className="panel p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">✨</span>
                Production Best Practices
              </h3>
              <div className="space-y-2">
                {content.bestPractices.map((practice, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm p-2 rounded hover:bg-foreground/5">
                    <span className="text-green-500 flex-shrink-0 text-lg">✓</span>
                    <p className="text-foreground/80 flex-1">{practice}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
