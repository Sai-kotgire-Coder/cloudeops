import { Instance, INSTANCE_TYPES } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, BookOpen, Code, Lightbulb, ExternalLink } from 'lucide-react';

interface InstanceLearningModalProps {
  instance: Instance | null;
  open: boolean;
  onClose: () => void;
}

export function InstanceLearningModal({ instance, open, onClose }: InstanceLearningModalProps) {
  if (!instance) return null;

  const spec = INSTANCE_TYPES[instance.typeId];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{instance.name}</DialogTitle>
              <DialogDescription className="mt-1">
                Understanding Cloud Instances & EC2
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scaling">Scaling</TabsTrigger>
            <TabsTrigger value="realworld">Real-World</TabsTrigger>
            <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">What is an Instance?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    An <strong>instance</strong> (also called a <strong>server</strong> or <strong>virtual machine</strong>) is a computer running in the cloud. 
                    It has CPU, memory, and storage just like a physical computer, but it's virtualized—meaning multiple instances can run on the same physical hardware.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Your Instance Specs:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-mono font-semibold">{spec.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">vCPUs:</span>
                    <span className="font-semibold">{spec.vcpu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory:</span>
                    <span className="font-semibold">{spec.ramGib} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max RPS:</span>
                    <span className="font-semibold">{spec.maxRps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-semibold">${spec.costPerHour.toFixed(4)}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Pods:</span>
                    <span className="font-semibold">{spec.maxPods}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Key Concepts</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                    <li><strong>Status:</strong> Running, Stopped, Booting, or Crashed</li>
                    <li><strong>CPU Usage:</strong> How much processing power is being used (0-100%)</li>
                    <li><strong>Memory:</strong> RAM usage for running applications</li>
                    <li><strong>Traffic (RPS):</strong> Requests Per Second this instance handles</li>
                    <li><strong>Pods:</strong> Containers running your application on this instance</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scaling" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">How Scaling Works</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  When traffic increases, a single instance may not be able to handle all requests. This is where <strong>scaling</strong> comes in.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 border border-border rounded-lg">
                  <h5 className="font-semibold text-sm mb-1 text-blue-500">Horizontal Scaling (Scale Out)</h5>
                  <p className="text-xs text-muted-foreground">
                    Add more instances to handle traffic. Example: 1 instance → 3 instances.
                  </p>
                  <p className="text-xs mt-1.5">
                    ✅ Good for: High traffic, redundancy
                  </p>
                </div>

                <div className="p-3 border border-border rounded-lg">
                  <h5 className="font-semibold text-sm mb-1 text-purple-500">Vertical Scaling (Scale Up)</h5>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to a larger instance type. Example: t3.micro → m5.large.
                  </p>
                  <p className="text-xs mt-1.5">
                    ✅ Good for: Memory-intensive apps
                  </p>
                </div>

                <div className="p-3 border border-border rounded-lg">
                  <h5 className="font-semibold text-sm mb-1 text-green-500">Auto-Scaling</h5>
                  <p className="text-xs text-muted-foreground">
                    Automatically add/remove instances based on CPU usage or traffic patterns.
                  </p>
                  <p className="text-xs mt-1.5">
                    ✅ Best practice: Enable HPA (Horizontal Pod Autoscaler) or ASG (Auto Scaling Group)
                  </p>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                <h5 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  When to Scale?
                </h5>
                <ul className="text-xs space-y-1 mt-2">
                  <li>📈 <strong>CPU &gt; 70%:</strong> Consider adding instances</li>
                  <li>💥 <strong>Instance crashes:</strong> You're overloaded—scale immediately</li>
                  <li>📉 <strong>CPU &lt; 30%:</strong> Remove instances to save costs</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="realworld" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Code className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">AWS EC2 Equivalent</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    In AWS, instances are called <strong>EC2 (Elastic Compute Cloud)</strong>. The instance types you see here 
                    (t3.micro, m5.large, etc.) are <strong>real AWS instance types</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-sm">Real-World Use Cases:</h5>
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold text-sm">🌐 Web Server</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Host a Node.js/Python/PHP application serving HTTP requests
                    </p>
                    <p className="text-xs mt-1 font-mono">Example: t3.small (2 vCPU, 2GB RAM)</p>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold text-sm">🗄️ Database Server</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run PostgreSQL, MySQL, or MongoDB with high memory requirements
                    </p>
                    <p className="text-xs mt-1 font-mono">Example: m5.large (2 vCPU, 8GB RAM)</p>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold text-sm">🚀 High-Traffic API</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Handle thousands of requests per second with compute-optimized instances
                    </p>
                    <p className="text-xs mt-1 font-mono">Example: c5.xlarge (4 vCPU, 8GB RAM)</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm mb-1">Learn More</h5>
                    <p className="text-xs text-muted-foreground">
                      Search for "AWS EC2 instance types" to see the full list of real-world options and pricing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="troubleshoot" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Common Issues & Solutions</h4>

              <div className="space-y-3">
                <div className="p-3 border border-red-500/50 rounded-lg bg-red-500/5">
                  <h5 className="font-semibold text-sm text-red-500 mb-1">❌ Instance Crashed</h5>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Cause:</strong> CPU overload (usually &gt;95% for sustained period)
                  </p>
                  <p className="text-xs">
                    <strong>Solution:</strong> Click "Restart" button or enable auto-scaling to prevent future crashes
                  </p>
                </div>

                <div className="p-3 border border-yellow-500/50 rounded-lg bg-yellow-500/5">
                  <h5 className="font-semibold text-sm text-yellow-500 mb-1">⚠️ High CPU Usage</h5>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Cause:</strong> Traffic exceeds instance capacity
                  </p>
                  <p className="text-xs">
                    <strong>Solution:</strong> Add more instances or upgrade to a larger instance type
                  </p>
                </div>

                <div className="p-3 border border-blue-500/50 rounded-lg bg-blue-500/5">
                  <h5 className="font-semibold text-sm text-blue-500 mb-1">🔄 Instance Stuck Booting</h5>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Cause:</strong> Normal—instances take 3-5 seconds to boot
                  </p>
                  <p className="text-xs">
                    <strong>Solution:</strong> Wait for boot to complete. Status will change to "Running"
                  </p>
                </div>

                <div className="p-3 border border-gray-500/50 rounded-lg bg-gray-500/5">
                  <h5 className="font-semibold text-sm text-gray-500 mb-1">⏸ Instance Stopped</h5>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Cause:</strong> Manually stopped or no traffic
                  </p>
                  <p className="text-xs">
                    <strong>Solution:</strong> Click "Start" to activate. Note: Stopped instances don't handle traffic.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                <h5 className="font-semibold text-sm mb-2">✅ Best Practices</h5>
                <ul className="text-xs space-y-1.5 list-disc list-inside">
                  <li>Always enable a <strong>Load Balancer</strong> when you have multiple instances</li>
                  <li>Enable <strong>HPA or ASG</strong> for automatic scaling during traffic spikes</li>
                  <li>Monitor CPU usage—keep it between 50-70% for optimal performance</li>
                  <li>Stop instances when not in use to save costs</li>
                  <li>Use the right instance type for your workload (web server vs. database)</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
