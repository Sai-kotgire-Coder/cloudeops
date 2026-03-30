import { useState } from 'react';
import { useNetworkStore } from '@/store/networkStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Server, Plus, Trash2, AlertCircle, Activity, Cpu, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export const PodPanel = () => {
  const { pods, createPod, deletePod, crashPod } = useNetworkStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [podName, setPodName] = useState('');
  const [appLabel, setAppLabel] = useState('');
  const [versionLabel, setVersionLabel] = useState('v1');
  const [maxRps, setMaxRps] = useState('100');

  const handleCreatePod = () => {
    if (!podName.trim()) {
      toast.error('Pod name is required');
      return;
    }

    if (!appLabel.trim()) {
      toast.error('App label is required');
      return;
    }

    const labels = {
      app: appLabel.trim(),
      version: versionLabel.trim(),
    };

    createPod(podName.trim(), labels, parseInt(maxRps) || 100);
    
    // Reset form
    setPodName('');
    setAppLabel('');
    setVersionLabel('v1');
    setMaxRps('100');
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'terminating':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Running</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'terminating':
        return <Badge variant="secondary">Terminating</Badge>;
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
              <Server className="w-5 h-5" />
              Pods
            </CardTitle>
            <CardDescription>
              Create and manage pods that will receive traffic from services
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Pod
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Pod</DialogTitle>
                <DialogDescription>
                  Pods are the smallest deployable units that run your containers
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="podName" className="text-white">Pod Name</Label>
                  <Input
                    id="podName"
                    placeholder="my-app-pod"
                    value={podName}
                    onChange={(e) => setPodName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="appLabel" className="text-white">App Label</Label>
                  <Input
                    id="appLabel"
                    placeholder="nginx"
                    value={appLabel}
                    onChange={(e) => setAppLabel(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Used by services to select this pod
                  </p>
                </div>

                <div>
                  <Label htmlFor="versionLabel" className="text-white">Version Label</Label>
                  <Select value={versionLabel} onValueChange={setVersionLabel}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">v1</SelectItem>
                      <SelectItem value="v2">v2</SelectItem>
                      <SelectItem value="v3">v3</SelectItem>
                      <SelectItem value="canary">canary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxRps" className="text-white">Max RPS Capacity</Label>
                  <Input
                    id="maxRps"
                    type="number"
                    placeholder="100"
                    value={maxRps}
                    onChange={(e) => setMaxRps(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum requests per second this pod can handle
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleCreatePod}>Create Pod</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {pods.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No pods created yet</p>
            <p className="text-sm">Create pods to handle traffic from services</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pods.map((pod) => (
              <Card key={pod.id} className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(pod.status)}`} />
                        {pod.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(pod.status)}
                        <Badge variant="outline" className="text-xs">
                          {pod.labels.app}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {pod.labels.version}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePod(pod.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Traffic */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Traffic
                      </span>
                      <span className="text-white">
                        {pod.currentRps} / {pod.maxRps} RPS
                      </span>
                    </div>
                    <Progress
                      value={(pod.currentRps / pod.maxRps) * 100}
                      className="h-2"
                    />
                  </div>

                  {/* CPU */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        CPU
                      </span>
                      <span className="text-white">{pod.cpu.toFixed(0)}%</span>
                    </div>
                    <Progress value={pod.cpu} className="h-2" />
                  </div>

                  {/* Memory */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        Memory
                      </span>
                      <span className="text-white">{pod.memory.toFixed(0)}%</span>
                    </div>
                    <Progress value={pod.memory} className="h-2" />
                  </div>

                  {/* Restart count */}
                  {pod.restartCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-yellow-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>Restarted {pod.restartCount} time(s)</span>
                    </div>
                  )}

                  {/* Actions */}
                  {pod.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        deletePod(pod.id);
                        createPod(pod.name, pod.labels, pod.maxRps);
                      }}
                      className="w-full"
                    >
                      Restart Pod
                    </Button>
                  )}

                  {pod.status === 'running' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => crashPod(pod.id)}
                      className="w-full"
                    >
                      Simulate Crash
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
