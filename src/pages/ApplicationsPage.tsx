import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { 
  Layers, Plus, ArrowRight, Container, Globe, GitBranch, Zap, 
  Activity, AlertCircle, CheckCircle2, TrendingUp, Cpu, AlertTriangle,
  Network, Server, Box, ArrowRightLeft, Play, RefreshCw, Maximize2,
  Route, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { HintButton } from '@/components/game/HintButton';
import { CreateAppModal } from '@/components/app/CreateAppModal';
import { SchedulerPanel } from '@/components/app/SchedulerPanel';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const STRATEGY_COLORS: Record<string, string> = {
  'Rolling':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Blue/Green': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

// Health status types
type HealthStatus = 'healthy' | 'warning' | 'critical';

interface AppMetrics {
  runningPods: number;
  desiredReplicas: number;
  totalPods: number;
  crashedPods: number;
  avgCpu: number;
  totalRps: number;
  errorRate: number;
  health: HealthStatus;
  trafficActive: boolean;
  instanceCount: number;
}

interface AppMetrics {
  runningPods: number;
  desiredReplicas: number;
  totalPods: number;
  crashedPods: number;
  avgCpu: number;
  totalRps: number;
  errorRate: number;
  health: HealthStatus;
  trafficActive: boolean;
  instanceCount: number;
}

export default function ApplicationsPage() {
  const { applications, instances, pendingPods, errorRate: globalErrorRate, traffic } = useGameStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [quickActionType, setQuickActionType] = useState<'scale' | 'deploy' | 'restart'>('scale');
  const [scaleReplicas, setScaleReplicas] = useState('1');
  const [newVersion, setNewVersion] = useState('');

  // Calculate metrics for a specific application
  const getAppMetrics = (appId: string): AppMetrics => {
    const app = applications.find(a => a.id === appId);
    if (!app) {
      return {
        runningPods: 0,
        desiredReplicas: 0,
        totalPods: 0,
        crashedPods: 0,
        avgCpu: 0,
        totalRps: 0,
        errorRate: 0,
        health: 'critical',
        trafficActive: false,
        instanceCount: 0,
      };
    }

    // Get all pods for this app
    const appPods = instances.flatMap(inst => 
      inst.pods.filter(p => p.appId === appId)
    );
    const pending = pendingPods.filter(p => p.appId === appId).length;

    const runningPods = appPods.filter(p => p.status === 'running').length;
    const crashedPods = appPods.filter(p => p.status === 'crashed').length;
    const totalPods = appPods.length + pending;

    // Calculate desired replicas from active deployment
    const activeDep = app.deployments.find(d => d.version === app.activeVersion);
    const desiredReplicas = activeDep?.replicas || 0;

    // Calculate average CPU and total RPS
    let totalCpu = 0;
    let totalRps = 0;
    appPods.forEach(pod => {
      if (pod.status === 'running') {
        totalCpu += pod.cpu;
        totalRps += pod.currentRps;
      }
    });
    const avgCpu = runningPods > 0 ? totalCpu / runningPods : 0;

    // Traffic is active if any pod is receiving requests
    const trafficActive = totalRps > 0;

    // Error rate approximation (use global error rate as baseline)
    const errorRate = crashedPods > 0 ? Math.min(100, globalErrorRate + (crashedPods * 5)) : globalErrorRate;

    // Determine health status
    let health: HealthStatus = 'healthy';
    if (crashedPods > 0 || runningPods < desiredReplicas * 0.5) {
      health = 'critical';
    } else if (runningPods < desiredReplicas || avgCpu > 80 || errorRate > 5) {
      health = 'warning';
    }

    // Count unique instances running this app
    const instanceCount = instances.filter(inst => 
      inst.pods.some(p => p.appId === appId)
    ).length;

    return {
      runningPods,
      desiredReplicas,
      totalPods,
      crashedPods,
      avgCpu,
      totalRps,
      errorRate,
      health,
      trafficActive,
      instanceCount,
    };
  };

  const getHealthIcon = (health: HealthStatus) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getHealthColor = (health: HealthStatus) => {
    switch (health) {
      case 'healthy':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  const handleQuickAction = (appId: string, type: 'scale' | 'deploy' | 'restart') => {
    setSelectedApp(appId);
    setQuickActionType(type);
    setShowQuickActions(true);

    const app = applications.find(a => a.id === appId);
    if (type === 'scale' && app) {
      const activeDep = app.deployments.find(d => d.version === app.activeVersion);
      setScaleReplicas((activeDep?.replicas || 1).toString());
    }
  };

  const executeQuickAction = () => {
    if (!selectedApp) return;

    const app = applications.find(a => a.id === selectedApp);
    if (!app) return;

    const { scaleDeployment, createDeployment, restartPod } = useGameStore.getState();

    switch (quickActionType) {
      case 'scale':
        const replicas = parseInt(scaleReplicas);
        if (!isNaN(replicas) && replicas > 0) {
          scaleDeployment(selectedApp, app.activeVersion, replicas);
        }
        break;
      case 'deploy':
        if (newVersion.trim()) {
          createDeployment(selectedApp, newVersion.trim(), 1);
        }
        break;
      case 'restart':
        // Restart all pods for this app
        instances.forEach(inst => {
          inst.pods.forEach(pod => {
            if (pod.appId === selectedApp) {
              restartPod(pod.id);
            }
          });
        });
        break;
    }

    setShowQuickActions(false);
    setSelectedApp(null);
    setNewVersion('');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 sm:gap-3">
                <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> Applications
                <HintButton hint="Applications own deployments, which manage pods. Each deployment version runs as a set of pods distributed across instances (nodes)." topicId="pods" />
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Kubernetes-style application management. Deploy, version, and scale services.
              </p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold min-h-[44px] w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" /> Deploy App
            </Button>
          </div>

          {/* Cluster Capacity Warning */}
          {pendingPods.length > 0 && instances.filter(i => i.status === 'running').length === 0 && (
            <div className="panel p-4 bg-yellow-500/10 border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Cluster Has No Running Nodes</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {pendingPods.length} pod(s) are waiting to be scheduled. 
                    {instances.filter(i => i.status === 'provisioning').length > 0 ? (
                      <span className="text-yellow-500 font-medium"> {instances.filter(i => i.status === 'provisioning').length} instance(s) are currently provisioning...</span>
                    ) : (
                      <span className="text-red-500 font-medium"> Add instances to run workloads.</span>
                    )}
                  </p>
                  {instances.length === 0 && (
                    <Button
                      onClick={() => navigate('/instances')}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Instance
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {applications.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-border rounded-2xl bg-card/30 backdrop-blur-sm">
              <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-bold">No Applications Deployed</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
                Deploy an application to start scheduling pods and managing deployments.
              </p>
              <Button onClick={() => setShowCreate(true)} variant="outline" className="mt-6 border-primary text-primary hover:bg-primary/10">
                Deploy First Application
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {applications.map((app) => {
                const metrics = getAppMetrics(app.id);
                const activeDep = app.deployments.find(d => d.version === app.activeVersion);
                
                return (
                  <div
                    key={app.id}
                    className="panel p-5 group hover:border-primary/50 transition-all flex flex-col gap-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#111827] border border-green-500/30 flex items-center justify-center">
                          <Container className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{app.name}</h3>
                          {app.image && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{app.image}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {app.strategy && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${STRATEGY_COLORS[app.strategy] ?? 'bg-secondary text-muted-foreground border-border'}`}>
                            {app.strategy}
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${getHealthColor(metrics.health)}`}>
                          {getHealthIcon(metrics.health)}
                          {metrics.health.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-secondary/60 rounded-lg py-2.5 px-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Version</p>
                        <p className="font-bold text-base font-mono text-primary">{app.activeVersion}</p>
                      </div>
                      <div className="bg-secondary/60 rounded-lg py-2.5 px-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Replicas</p>
                        <p className="font-bold text-base">
                          <span className={metrics.runningPods < metrics.desiredReplicas ? 'text-yellow-500' : 'text-green-500'}>
                            {metrics.runningPods}
                          </span>
                          <span className="text-muted-foreground text-sm">/{metrics.desiredReplicas}</span>
                        </p>
                      </div>
                      <div className="bg-secondary/60 rounded-lg py-2.5 px-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Error Rate</p>
                        <p className={cn("font-bold text-base", 
                          metrics.errorRate > 10 ? 'text-red-500' : 
                          metrics.errorRate > 5 ? 'text-yellow-500' : 
                          'text-green-500'
                        )}>
                          {metrics.errorRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-secondary/60 rounded-lg py-2.5 px-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Avg CPU</p>
                        <p className={cn("font-bold text-base",
                          metrics.avgCpu > 80 ? 'text-red-500' :
                          metrics.avgCpu > 60 ? 'text-yellow-500' :
                          'text-green-500'
                        )}>
                          {metrics.avgCpu.toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Traffic & Instance Info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Activity className={cn("w-4 h-4", metrics.trafficActive ? 'text-green-500' : 'text-gray-500')} />
                          <span className={cn("text-xs font-medium", metrics.trafficActive ? 'text-green-500' : 'text-muted-foreground')}>
                            {metrics.trafficActive ? `${metrics.totalRps} RPS` : 'No Traffic'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Server className="w-4 h-4" />
                          <span className="text-xs">{metrics.instanceCount} nodes</span>
                        </div>
                        {app.port && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            <span className="text-xs">:{app.port}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/50">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-1.5 text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app.id);
                          setShowArchitecture(true);
                        }}
                      >
                        <Network className="w-3.5 h-3.5" />
                        Architecture
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-1.5 text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(app.id, 'scale');
                        }}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Scale
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-1.5 text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/apps/${app.id}`);
                        }}
                      >
                        Manage
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Quick Actions Dropdown */}
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="flex-1 gap-1.5 text-xs h-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(app.id, 'deploy');
                        }}
                      >
                        <Play className="w-3 h-3" />
                        Deploy New Version
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="flex-1 gap-1.5 text-xs h-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(app.id, 'restart');
                        }}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Restart Pods
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar — Scheduler log */}
      <div className="w-80 shrink-0 border-l border-border bg-card/40 flex flex-col">
        <SchedulerPanel />
      </div>

      {/* Modals */}
      <CreateAppModal open={showCreate} onClose={() => setShowCreate(false)} />

      {/* Architecture Visualization Modal */}
      <Dialog open={showArchitecture} onOpenChange={setShowArchitecture}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Application Architecture
            </DialogTitle>
            <DialogDescription>
              Visual representation of traffic flow through the system
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (() => {
            const app = applications.find(a => a.id === selectedApp);
            if (!app) return null;

            const metrics = getAppMetrics(selectedApp);
            const appPods = instances.flatMap(inst => 
              inst.pods.filter(p => p.appId === selectedApp).map(pod => ({
                ...pod,
                instanceName: inst.name,
                instanceId: inst.id,
                instanceType: inst.typeId,
              }))
            );

            const appInstances = instances.filter(inst =>
              inst.pods.some(p => p.appId === selectedApp)
            );

            return (
              <div className="space-y-8 py-4">
                {/* Flow Diagram */}
                <div className="flex items-center justify-center gap-6">
                  {/* Traffic */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-blue-500">Traffic</p>
                      <p className="text-xl font-bold">{metrics.totalRps}</p>
                      <p className="text-[10px] text-muted-foreground">RPS</p>
                    </div>
                  </div>

                  <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />

                  {/* Load Balancer / Service */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                      <Route className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-purple-500">Service</p>
                      <p className="text-sm font-mono">{app.name}</p>
                      {app.port && <p className="text-[10px] text-muted-foreground">Port {app.port}</p>}
                    </div>
                  </div>

                  <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />

                  {/* Pods */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl bg-green-500/20 border-2 border-green-500 flex items-center justify-center relative">
                      <Box className="w-8 h-8 text-green-500" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                        {metrics.runningPods}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-green-500">Pods</p>
                      <p className="text-sm">{metrics.runningPods}/{metrics.desiredReplicas}</p>
                      <p className="text-[10px] text-muted-foreground">Running</p>
                    </div>
                  </div>

                  <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />

                  {/* Instances/Nodes */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center relative">
                      <Server className="w-8 h-8 text-orange-500" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                        {metrics.instanceCount}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-orange-500">Nodes</p>
                      <p className="text-sm">{metrics.instanceCount}</p>
                      <p className="text-[10px] text-muted-foreground">Instances</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Pod List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Box className="w-4 h-4 text-primary" />
                    Pod Distribution
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {appPods.map((pod) => (
                      <div key={pod.id} className="panel p-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            pod.status === 'running' ? 'bg-green-500' : 
                            pod.status === 'crashed' ? 'bg-red-500' : 
                            'bg-yellow-500'
                          )} />
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{pod.id}</p>
                            <button
                              onClick={() => navigate(`/instances/${pod.instanceId}`)}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
                              title="View instance details"
                            >
                              on {pod.instanceName}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">CPU:</span> <span className="font-mono">{pod.cpu.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">RPS:</span> <span className="font-mono">{pod.currentRps}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instance List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    Hosting Instances
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {appInstances.map((inst) => {
                      const instPods = inst.pods.filter(p => p.appId === selectedApp);
                      return (
                        <button
                          key={inst.id}
                          onClick={() => navigate(`/instances/${inst.id}`)}
                          className="panel p-3 w-full text-left hover:bg-secondary/60 hover:border-primary/40 transition-all cursor-pointer group"
                          title="View instance details"
                        >
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{inst.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{inst.typeId}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Pods:</span>
                            <span className="font-bold">{instPods.length}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">CPU:</span>
                            <span className={cn(
                              "font-mono",
                              inst.cpu > 80 ? 'text-red-500' : inst.cpu > 60 ? 'text-yellow-500' : 'text-green-500'
                            )}>{inst.cpu.toFixed(0)}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Traffic Flow Explanation */}
                <div className="panel p-4 bg-blue-500/10 border-blue-500/20">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    How Traffic Flows
                  </h4>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>External traffic arrives at your application endpoint ({app.port ? `port ${app.port}` : 'default port'})</li>
                    <li>The service (load balancer) distributes requests across healthy pods</li>
                    <li>Each pod processes requests and returns responses</li>
                    <li>Pods run on instances (nodes) that provide compute resources</li>
                    <li>Scaling adds more pods or instances to handle increased load</li>
                  </ol>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Quick Actions Modal */}
      <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {quickActionType === 'scale' && <TrendingUp className="w-5 h-5 text-primary" />}
              {quickActionType === 'deploy' && <Play className="w-5 h-5 text-primary" />}
              {quickActionType === 'restart' && <RefreshCw className="w-5 h-5 text-primary" />}
              {quickActionType === 'scale' && 'Scale Application'}
              {quickActionType === 'deploy' && 'Deploy New Version'}
              {quickActionType === 'restart' && 'Restart All Pods'}
            </DialogTitle>
            <DialogDescription>
              {quickActionType === 'scale' && 'Adjust the number of pod replicas'}
              {quickActionType === 'deploy' && 'Deploy a new version of your application'}
              {quickActionType === 'restart' && 'Restart all pods to clear issues'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {quickActionType === 'scale' && (
              <div className="space-y-2">
                <Label htmlFor="replicas">Number of Replicas</Label>
                <Input
                  id="replicas"
                  type="number"
                  min="1"
                  max="20"
                  value={scaleReplicas}
                  onChange={(e) => setScaleReplicas(e.target.value)}
                  placeholder="Enter replica count"
                />
                <p className="text-xs text-muted-foreground">
                  Current: {selectedApp && getAppMetrics(selectedApp).runningPods} running, 
                  {' '}{selectedApp && getAppMetrics(selectedApp).desiredReplicas} desired
                </p>
              </div>
            )}

            {quickActionType === 'deploy' && (
              <div className="space-y-2">
                <Label htmlFor="version">Version Name</Label>
                <Input
                  id="version"
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="e.g., v2, v1.1.0"
                />
                <p className="text-xs text-muted-foreground">
                  New deployment will start with 1 replica. You can scale it later.
                </p>
              </div>
            )}

            {quickActionType === 'restart' && (
              <div className="panel p-4 bg-yellow-500/10 border-yellow-500/20">
                <p className="text-sm">
                  This will restart all pods for this application. Use this to:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Clear memory leaks</li>
                  <li>Apply configuration changes</li>
                  <li>Recover from errors</li>
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowQuickActions(false)}>
                Cancel
              </Button>
              <Button onClick={executeQuickAction}>
                {quickActionType === 'scale' && 'Apply Scale'}
                {quickActionType === 'deploy' && 'Deploy'}
                {quickActionType === 'restart' && 'Restart All'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
