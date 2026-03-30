import { useNetworkStore } from '@/store/networkStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Scale, Plus, Trash2, Power, PowerOff, Activity } from 'lucide-react';
import { toast } from 'sonner';

export const LoadBalancerPanel = () => {
  const {
    loadBalancers,
    services,
    pods,
    toggleLoadBalancer,
    setLoadBalancerAlgorithm,
    deleteLoadBalancer,
    createLoadBalancer,
  } = useNetworkStore();

  const servicesWithoutLB = services.filter(
    service => !loadBalancers.some(lb => lb.serviceId === service.id)
  );

  const handleCreateLB = (serviceId: string) => {
    createLoadBalancer(serviceId, 'round-robin');
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Load Balancers
            </CardTitle>
            <CardDescription>
              Distribute traffic across multiple pods intelligently
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick create for services without LB */}
        {servicesWithoutLB.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-600 rounded p-4">
            <p className="text-sm text-blue-200 mb-2">
              Services without load balancer:
            </p>
            <div className="flex flex-wrap gap-2">
              {servicesWithoutLB.map(service => (
                <Button
                  key={service.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateLB(service.id)}
                  className="gap-2"
                >
                  <Plus className="w-3 h-3" />
                  {service.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loadBalancers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No load balancers created yet</p>
            <p className="text-sm">Load balancers distribute traffic to pods</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loadBalancers.map((lb) => {
              const service = services.find(s => s.id === lb.serviceId);
              const totalPods = service ? service.endpoints.length : 0;
              const distributedPods = Object.keys(lb.distributedRps).length;

              return (
                <Card key={lb.id} className="bg-slate-700/50 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          Load Balancer
                          {lb.enabled ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </CardTitle>
                        {service && (
                          <p className="text-sm text-gray-400 mt-1">
                            Service: {service.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleLoadBalancer(lb.id)}
                          className={lb.enabled ? 'text-green-400' : 'text-gray-400'}
                        >
                          {lb.enabled ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteLoadBalancer(lb.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Algorithm Selection */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Load Balancing Algorithm
                      </label>
                      <Select
                        value={lb.algorithm}
                        onValueChange={(value: any) => setLoadBalancerAlgorithm(lb.id, value)}
                      >
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round-robin">Round Robin</SelectItem>
                          <SelectItem value="least-connections">Least Connections</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        {lb.algorithm === 'round-robin'
                          ? 'Distributes traffic equally across all pods'
                          : 'Sends traffic to pods with lowest current load'}
                      </p>
                    </div>

                    {/* Traffic Stats */}
                    <div className="bg-slate-600/50 rounded p-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Total Traffic
                        </span>
                        <span className="text-white font-semibold">
                          {lb.totalRps} RPS
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Connected Pods</span>
                        <span className="text-white font-semibold">
                          {distributedPods} / {totalPods}
                        </span>
                      </div>
                    </div>

                    {/* Traffic Distribution */}
                    {Object.keys(lb.distributedRps).length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Traffic Distribution:</p>
                        <div className="space-y-2">
                          {Object.entries(lb.distributedRps).map(([podId, rps]) => {
                            const pod = pods.find(p => p.id === podId);
                            if (!pod) return null;

                            const percentage = lb.totalRps > 0 ? (rps / lb.totalRps) * 100 : 0;

                            return (
                              <div key={podId} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-300">{pod.name}</span>
                                  <span className="text-white">
                                    {rps.toFixed(0)} RPS ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                                <Progress value={percentage} className="h-1.5" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No traffic being distributed yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
