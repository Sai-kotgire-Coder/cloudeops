import { useEffect, useRef } from 'react';
import { useNetworkStore } from '@/store/networkStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Network, Server, ArrowRight, Activity } from 'lucide-react';

export const TrafficVisualization = () => {
  const { ingresses, services, pods, trafficFlows, globalTraffic } = useNetworkStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation for traffic flows
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let offset = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw animated dashed lines for active flows
      trafficFlows.forEach((flow, idx) => {
        const y = 50 + idx * 30;
        const x1 = 50;
        const x2 = canvas.width - 50;

        // Animated dashed line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -offset;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();

        // RPS label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(`${flow.rps.toFixed(0)} RPS`, (x1 + x2) / 2 - 30, y - 5);
      });

      offset += 1;
      if (offset > 15) offset = 0;

      animationFrame = requestAnimationFrame(animate);
    };

    if (trafficFlows.length > 0) {
      animate();
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [trafficFlows]);

  const activeIngresses = ingresses.filter(i => i.status === 'active');
  const activeServices = services.filter(s => s.endpoints.length > 0);
  const runningPods = pods.filter(p => p.status === 'running');

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Traffic Flow Visualization
        </CardTitle>
        <CardDescription>
          Watch how traffic flows from Ingress → Service → Pods
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Visual Flow Diagram */}
          <div className="relative">
            {/* Flow stages */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Stage 1: Ingress */}
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className="bg-green-600/20 border-2 border-green-500 rounded-lg p-4 w-full">
                    <Globe className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold text-center">Ingress</p>
                    <p className="text-gray-400 text-xs text-center mt-1">
                      {activeIngresses.length} active
                    </p>
                  </div>
                </div>
                {activeIngresses.map(ingress => (
                  <div key={ingress.id} className="bg-slate-700/50 rounded p-2 text-xs">
                    <div className="text-white font-medium truncate">{ingress.domain}</div>
                    <div className="text-gray-400">{ingress.totalTraffic} RPS</div>
                  </div>
                ))}
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>

              {/* Stage 2: Service */}
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className="bg-purple-600/20 border-2 border-purple-500 rounded-lg p-4 w-full">
                    <Network className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold text-center">Service</p>
                    <p className="text-gray-400 text-xs text-center mt-1">
                      {activeServices.length} with endpoints
                    </p>
                  </div>
                </div>
                {activeServices.slice(0, 3).map(service => (
                  <div key={service.id} className="bg-slate-700/50 rounded p-2 text-xs">
                    <div className="text-white font-medium truncate">{service.name}</div>
                    <div className="text-gray-400">
                      {service.endpoints.length} endpoint{service.endpoints.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>

              {/* Stage 3: Pods */}
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className="bg-orange-600/20 border-2 border-orange-500 rounded-lg p-4 w-full">
                    <Server className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold text-center">Pods</p>
                    <p className="text-gray-400 text-xs text-center mt-1">
                      {runningPods.length} running
                    </p>
                  </div>
                </div>
                {runningPods.slice(0, 3).map(pod => (
                  <div key={pod.id} className="bg-slate-700/50 rounded p-2 text-xs">
                    <div className="text-white font-medium truncate">{pod.name}</div>
                    <div className="text-gray-400">{pod.currentRps.toFixed(0)} RPS</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Animated Canvas for Traffic Lines */}
          {trafficFlows.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
              <p className="text-sm text-gray-400 mb-2">Active Traffic Flows:</p>
              <canvas
                ref={canvasRef}
                width={800}
                height={Math.max(100, trafficFlows.length * 30)}
                className="w-full"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          {/* Traffic Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-400">Total Traffic</p>
              <p className="text-2xl font-bold text-white">{globalTraffic} RPS</p>
            </div>
            
            <div className="bg-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-400">Active Flows</p>
              <p className="text-2xl font-bold text-white">{trafficFlows.length}</p>
            </div>

            <div className="bg-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-400">Avg Pod Load</p>
              <p className="text-2xl font-bold text-white">
                {runningPods.length > 0
                  ? (pods.reduce((sum, p) => sum + p.cpu, 0) / runningPods.length).toFixed(0)
                  : 0}%
              </p>
            </div>

            <div className="bg-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-400">System Status</p>
              <Badge className={
                globalTraffic === 0 ? 'bg-gray-500' :
                activeIngresses.length === 0 ? 'bg-red-500' :
                activeServices.length === 0 ? 'bg-yellow-500' :
                runningPods.length === 0 ? 'bg-red-500' :
                'bg-green-500'
              }>
                {globalTraffic === 0 ? 'Idle' :
                 activeIngresses.length === 0 ? 'No Ingress' :
                 activeServices.length === 0 ? 'No Services' :
                 runningPods.length === 0 ? 'No Pods' :
                 'Healthy'}
              </Badge>
            </div>
          </div>

          {/* Warnings */}
          {globalTraffic > 0 && (
            <>
              {activeIngresses.length === 0 && (
                <div className="bg-red-900/30 border border-red-600 rounded p-3 text-sm text-red-200">
                  ⚠️ No active ingress rules. Create an ingress to route traffic.
                </div>
              )}
              
              {activeIngresses.length > 0 && activeServices.length === 0 && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 text-sm text-yellow-200">
                  ⚠️ No services with endpoints. Create services and pods.
                </div>
              )}

              {activeServices.length > 0 && runningPods.length === 0 && (
                <div className="bg-red-900/30 border border-red-600 rounded p-3 text-sm text-red-200">
                  ⚠️ No running pods. Services cannot route traffic.
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
