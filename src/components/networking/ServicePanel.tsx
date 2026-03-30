import { useState } from 'react';
import { useNetworkStore } from '@/store/networkStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Network, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const ServicePanel = () => {
  const { services, pods, deleteService, createService, createLoadBalancer } = useNetworkStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [selectorKey, setSelectorKey] = useState('app');
  const [selectorValue, setSelectorValue] = useState('');
  const [serviceType, setServiceType] = useState<'ClusterIP' | 'NodePort' | 'LoadBalancer'>('ClusterIP');
  const [port, setPort] = useState('80');
  const [targetPort, setTargetPort] = useState('8080');

  const handleCreateService = () => {
    if (!serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }

    if (!selectorValue.trim()) {
      toast.error('Selector value is required');
      return;
    }

    const selector = {
      [selectorKey]: selectorValue.trim(),
    };

    createService(
      serviceName.trim(),
      selector,
      serviceType,
      parseInt(port) || 80,
      parseInt(targetPort) || 8080
    );

    // Automatically create a load balancer for LoadBalancer type services
    if (serviceType === 'LoadBalancer') {
      setTimeout(() => {
        const newService = services[services.length - 1];
        if (newService) {
          createLoadBalancer(newService.id, 'round-robin');
        }
      }, 100);
    }

    // Reset form
    setServiceName('');
    setSelectorValue('');
    setPort('80');
    setTargetPort('8080');
    setIsDialogOpen(false);
  };

  const getMatchingPods = (selector: Record<string, string>) => {
    return pods.filter(pod => {
      return Object.entries(selector).every(([key, value]) => pod.labels[key] === value);
    });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Network className="w-5 h-5" />
              Services
            </CardTitle>
            <CardDescription>
              Services provide stable endpoints for accessing pods
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Service
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Service</DialogTitle>
                <DialogDescription>
                  Services route traffic to pods using label selectors
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="serviceName" className="text-white">Service Name</Label>
                  <Input
                    id="serviceName"
                    placeholder="my-service"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white">Service Type</Label>
                  <Select value={serviceType} onValueChange={(v: any) => setServiceType(v)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ClusterIP">ClusterIP (Internal)</SelectItem>
                      <SelectItem value="NodePort">NodePort (External)</SelectItem>
                      <SelectItem value="LoadBalancer">LoadBalancer (Cloud)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="port" className="text-white">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="80"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetPort" className="text-white">Target Port</Label>
                    <Input
                      id="targetPort"
                      type="number"
                      placeholder="8080"
                      value={targetPort}
                      onChange={(e) => setTargetPort(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Pod Selector</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Select value={selectorKey} onValueChange={setSelectorKey}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="app">app</SelectItem>
                        <SelectItem value="version">version</SelectItem>
                        <SelectItem value="tier">tier</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="value"
                      value={selectorValue}
                      onChange={(e) => setSelectorValue(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Service will route to pods with matching labels
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleCreateService}>Create Service</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No services created yet</p>
            <p className="text-sm">Services route traffic to your pods</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => {
              const matchingPods = getMatchingPods(service.selector);
              const runningEndpoints = matchingPods.filter(p => p.status === 'running');
              const hasEndpoints = service.endpoints.length > 0;

              return (
                <Card key={service.id} className="bg-slate-700/50 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          {service.name}
                          {hasEndpoints ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )}
                        </CardTitle>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="outline">{service.type}</Badge>
                          <Badge variant="secondary">
                            Port {service.port} → {service.targetPort}
                          </Badge>
                          {Object.entries(service.selector).map(([key, value]) => (
                            <Badge key={key} className="bg-purple-600">
                              {key}={value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteService(service.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Endpoints:</span>
                        <span className="text-white font-semibold">
                          {runningEndpoints.length} running / {matchingPods.length} total
                        </span>
                      </div>

                      {!hasEndpoints && (
                        <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 text-sm text-yellow-200">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          No pods match this service's selector. Create pods with label{' '}
                          <code className="bg-black/30 px-1 rounded">
                            {Object.entries(service.selector).map(([k, v]) => `${k}=${v}`).join(', ')}
                          </code>
                        </div>
                      )}

                      {hasEndpoints && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {service.endpoints.slice(0, 5).map((podId) => {
                            const pod = pods.find(p => p.id === podId);
                            return pod ? (
                              <Badge key={podId} variant="outline" className="text-xs">
                                {pod.name}
                              </Badge>
                            ) : null;
                          })}
                          {service.endpoints.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{service.endpoints.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
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
