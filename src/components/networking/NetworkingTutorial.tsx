import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Globe, Network, Server, Scale, ArrowRight } from 'lucide-react';

export const NetworkingTutorial = () => {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Networking Tutorial
          </CardTitle>
          <CardDescription>
            Learn how cloud networking components work together
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ingress">Ingress</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="lb">Load Balancer</TabsTrigger>
              <TabsTrigger value="pods">Pods</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">Traffic Flow Architecture</h3>
                <p className="text-gray-300">
                  Understanding how external traffic reaches your application is crucial for building scalable cloud applications.
                </p>

                <div className="bg-slate-800/50 rounded p-4 space-y-2">
                  <div className="flex items-center gap-3 text-white">
                    <Globe className="w-5 h-5 text-green-400" />
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <Network className="w-5 h-5 text-purple-400" />
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <Scale className="w-5 h-5 text-blue-400" />
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <Server className="w-5 h-5 text-orange-400" />
                  </div>
                  <p className="text-sm text-gray-400 text-center">
                    User → Ingress → Service → Load Balancer → Pods
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Why This Architecture?</h4>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span><strong>Scalability:</strong> Traffic automatically distributes across multiple pods</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span><strong>Reliability:</strong> If one pod fails, traffic routes to healthy pods</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span><strong>Flexibility:</strong> Update services without changing external URLs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span><strong>Decoupling:</strong> Ingress, services, and pods can be managed independently</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ingress" className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-8 h-8 text-green-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Ingress</h3>
                    <p className="text-sm text-gray-400">Entry point for external traffic</p>
                  </div>
                </div>

                <div className="space-y-3 text-gray-300">
                  <div>
                    <h4 className="font-semibold text-white mb-2">What is Ingress?</h4>
                    <p className="text-sm">
                      An Ingress is like a smart receptionist for your cloud infrastructure. 
                      It receives requests from the internet and routes them to the right service based on rules.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Key Concepts</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge className="bg-green-600 mt-0.5">Domain</Badge>
                        <span>Maps friendly URLs (like myapp.cloudops.dev) to your services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-green-600 mt-0.5">Rules</Badge>
                        <span>Define how different paths route to different services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-green-600 mt-0.5">TLS</Badge>
                        <span>Can terminate SSL/HTTPS connections</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-800 rounded p-3">
                    <p className="text-xs text-gray-400 mb-2">Example:</p>
                    <code className="text-xs text-green-300">
                      myapp.cloudops.dev → Service: my-backend → Pods
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Common Issues</h4>
                    <ul className="space-y-2 text-sm">
                      <li>❌ Ingress without a service = No traffic routing</li>
                      <li>❌ Service without pods = "No backend available"</li>
                      <li>✅ Always verify service connection and pod health</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Network className="w-8 h-8 text-purple-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Service</h3>
                    <p className="text-sm text-gray-400">Stable network endpoint for pods</p>
                  </div>
                </div>

                <div className="space-y-3 text-gray-300">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Why Do We Need Services?</h4>
                    <p className="text-sm">
                      Pods are ephemeral - they can be created, destroyed, or moved. Services provide a stable IP and DNS name 
                      that doesn't change even when pods come and go.
                    </p>
                  </div>

                  <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Think of it like a phone switchboard:</strong> When you call a company, you dial one number (the service), 
                      and they route you to an available employee (a pod).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Service Types</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge className="bg-purple-600 mt-0.5">ClusterIP</Badge>
                        <span>Internal only - pods can talk to each other</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-purple-600 mt-0.5">NodePort</Badge>
                        <span>Exposes service on each node's IP</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-purple-600 mt-0.5">LoadBalancer</Badge>
                        <span>Cloud provider creates external load balancer</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Label Selectors</h4>
                    <p className="text-sm mb-2">
                      Services find pods using labels. A service with selector <code className="bg-black/30 px-1">app=nginx</code> 
                      will route traffic to all pods labeled <code className="bg-black/30 px-1">app=nginx</code>.
                    </p>
                    <div className="bg-slate-800 rounded p-3 text-xs space-y-1">
                      <div className="text-gray-400">Service Selector: app=backend, version=v1</div>
                      <div className="text-green-300">✓ Matches Pod: {'{app: backend, version: v1}'}</div>
                      <div className="text-red-300">✗ Skips Pod: {'{app: frontend, version: v1}'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lb" className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Scale className="w-8 h-8 text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Load Balancer</h3>
                    <p className="text-sm text-gray-400">Intelligent traffic distribution</p>
                  </div>
                </div>

                <div className="space-y-3 text-gray-300">
                  <div>
                    <h4 className="font-semibold text-white mb-2">What is Load Balancing?</h4>
                    <p className="text-sm">
                      Instead of sending all traffic to one pod (which could overload it), a load balancer 
                      distributes requests across multiple pods, ensuring no single pod becomes a bottleneck.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Algorithms</h4>
                    <ul className="space-y-3 text-sm">
                      <li className="bg-slate-800 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-blue-600">Round Robin</Badge>
                          <span className="text-white font-semibold">Default</span>
                        </div>
                        <p>Distributes traffic equally: Request 1 → Pod A, Request 2 → Pod B, Request 3 → Pod C, repeat.</p>
                        <p className="text-gray-400 mt-1">Best for: Similar-sized requests</p>
                      </li>

                      <li className="bg-slate-800 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-blue-600">Least Connections</Badge>
                          <span className="text-white font-semibold">Intelligent</span>
                        </div>
                        <p>Sends new requests to the pod with the fewest active connections.</p>
                        <p className="text-gray-400 mt-1">Best for: Long-running requests or varied request sizes</p>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Why It Matters</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-red-900/30 border border-red-600 rounded p-2">
                        <div className="font-semibold text-red-200 mb-1">Without Load Balancer</div>
                        <div className="text-red-300">
                          • One pod gets all traffic<br/>
                          • Pod overloads and crashes<br/>
                          • Users experience downtime
                        </div>
                      </div>
                      <div className="bg-green-900/30 border border-green-600 rounded p-2">
                        <div className="font-semibold text-green-200 mb-1">With Load Balancer</div>
                        <div className="text-green-300">
                          • Traffic spreads evenly<br/>
                          • All pods work efficiently<br/>
                          • System stays responsive
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pods" className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Server className="w-8 h-8 text-orange-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Pods</h3>
                    <p className="text-sm text-gray-400">The actual workhorses</p>
                  </div>
                </div>

                <div className="space-y-3 text-gray-300">
                  <div>
                    <h4 className="font-semibold text-white mb-2">What are Pods?</h4>
                    <p className="text-sm">
                      A Pod is the smallest deployable unit in Kubernetes. It runs one or more containers that 
                      handle actual application logic. Pods receive and process the traffic routed by services.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Pod Characteristics</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge className="bg-orange-600 mt-0.5">Ephemeral</Badge>
                        <span>Pods can be created and destroyed at any time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-orange-600 mt-0.5">Labeled</Badge>
                        <span>Use labels to group pods logically (app, version, tier)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-orange-600 mt-0.5">Capacity</Badge>
                        <span>Each pod has a maximum RPS it can handle</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-orange-600 mt-0.5">Health</Badge>
                        <span>Pods run, crash, or wait to start</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Scaling Strategy</h4>
                    <div className="bg-slate-800 rounded p-3 space-y-2 text-sm">
                      <div>
                        <strong className="text-white">Horizontal Scaling (Recommended)</strong>
                        <p className="text-gray-400">Add more pods to handle increased traffic</p>
                        <p className="text-green-300">Example: 1 pod at 100 RPS → 5 pods at 20 RPS each</p>
                      </div>
                      <div className="border-t border-slate-600 pt-2">
                        <strong className="text-white">Vertical Scaling</strong>
                        <p className="text-gray-400">Increase capacity of existing pods</p>
                        <p className="text-yellow-300">Limited by single pod capacity</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Common Scenarios</h4>
                    <ul className="space-y-2 text-sm">
                      <li>📈 <strong>High Traffic:</strong> CPU and memory usage increase</li>
                      <li>💥 <strong>Overload:</strong> Pod crashes if traffic exceeds capacity</li>
                      <li>🔄 <strong>Recovery:</strong> Restart crashed pods to restore service</li>
                      <li>⚖️ <strong>Balance:</strong> More pods = better distribution = higher reliability</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Quick Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-red-400">❌</span>
              <div>
                <strong className="text-white">No traffic reaching pods?</strong>
                <p className="text-gray-400">Check: Ingress → Service connection, Service → Pod selector match</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400">❌</span>
              <div>
                <strong className="text-white">Pods crashing?</strong>
                <p className="text-gray-400">Reduce traffic or add more pods to distribute load</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400">❌</span>
              <div>
                <strong className="text-white">Uneven load distribution?</strong>
                <p className="text-gray-400">Switch load balancer algorithm or check pod capacities</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✅</span>
              <div>
                <strong className="text-white">Best practice:</strong>
                <p className="text-gray-400">Always have at least 2-3 pods for redundancy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
