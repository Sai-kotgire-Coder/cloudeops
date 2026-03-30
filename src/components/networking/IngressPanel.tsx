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
import { Globe, Plus, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const IngressPanel = () => {
  const { ingresses, services, createIngress, deleteIngress, updateIngressService } = useNetworkStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');

  const handleCreateIngress = () => {
    if (!domain.trim()) {
      toast.error('Domain name is required');
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain.trim())) {
      toast.error('Invalid domain format (e.g., myapp.cloudops.dev)');
      return;
    }

    createIngress(domain.trim(), selectedService || null);

    // Reset form
    setDomain('');
    setSelectedService('');
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'misconfigured':
        return <Badge variant="destructive">Misconfigured</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Ingress Controllers
            </CardTitle>
            <CardDescription>
              Manage external access to services via domain names
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Ingress
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Ingress</DialogTitle>
                <DialogDescription>
                  Ingress routes external traffic to your services
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain" className="text-white">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="myapp.cloudops.dev"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    The domain that will route to your service
                  </p>
                </div>

                <div>
                  <Label className="text-white">Target Service (Optional)</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (configure later)</SelectItem>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">
                    You can attach a service later if needed
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleCreateIngress}>Create Ingress</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {ingresses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No ingress rules created yet</p>
            <p className="text-sm">Ingress routes external traffic to your services</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ingresses.map((ingress) => {
              const service = ingress.serviceId ? services.find(s => s.id === ingress.serviceId) : null;

              return (
                <Card key={ingress.id} className="bg-slate-700/50 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {ingress.domain}
                          {getStatusBadge(ingress.status)}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            https://{ingress.domain}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteIngress(ingress.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Service Connection */}
                    <div>
                      <Label className="text-sm text-gray-400 mb-2 block">
                        Backend Service
                      </Label>
                      <Select
                        value={ingress.serviceId || 'none'}
                        onValueChange={(value) => {
                          if (value !== 'none') {
                            updateIngressService(ingress.id, value);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                          <SelectValue placeholder="Select service..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No service attached</SelectItem>
                          {services.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Info */}
                    {ingress.status === 'misconfigured' && (
                      <div className="bg-red-900/30 border border-red-600 rounded p-3 text-sm text-red-200">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Ingress is misconfigured. Please attach a valid service.
                      </div>
                    )}

                    {ingress.status === 'inactive' && !ingress.serviceId && (
                      <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 text-sm text-yellow-200">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        No service attached. Traffic will not be routed.
                      </div>
                    )}

                    {ingress.status === 'active' && service && (
                      <div className="bg-green-900/30 border border-green-600 rounded p-3">
                        <div className="text-sm text-green-200">
                          ✓ Routing traffic to <strong>{service.name}</strong>
                        </div>
                        {service.endpoints.length === 0 && (
                          <div className="text-xs text-yellow-300 mt-2">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Warning: Service has no pods available
                          </div>
                        )}
                      </div>
                    )}

                    {/* Traffic Stats */}
                    {ingress.totalTraffic > 0 && (
                      <div className="bg-slate-600/50 rounded p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Current Traffic:</span>
                          <span className="text-white font-semibold">
                            {ingress.totalTraffic} RPS
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rules */}
                    {ingress.rules.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Routing Rules:</p>
                        <div className="space-y-1">
                          {ingress.rules.map((rule, idx) => {
                            const ruleService = services.find(s => s.id === rule.serviceId);
                            return (
                              <div
                                key={idx}
                                className="text-xs bg-slate-600/30 rounded px-2 py-1 flex items-center justify-between"
                              >
                                <span className="text-gray-300">
                                  {rule.path} → {ruleService?.name || 'Unknown'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  :{rule.port}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
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
