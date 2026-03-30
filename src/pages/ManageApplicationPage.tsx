import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore, checkDeploymentReadiness, getDeploymentStatus, INSTANCE_TYPES } from '@/store/gameStore';
import { useSchedulerStore } from '@/store/schedulerStore';
import { 
  Layers, ArrowLeft, GitCommit, Server, Zap, Plus, Minus, RotateCcw, Trash2, 
  CheckCircle, Clock, AlertCircle, Container, Activity, Cpu, MemoryStick, 
  Network, TrendingUp, AlertTriangle, Info, ArrowRightLeft, Route, Box,
  Settings, Play, Pause, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HintButton } from '@/components/game/HintButton';
import { SchedulerPanel } from '@/components/app/SchedulerPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function PodStatusBadge({ status }: { status: string }) {
  if (status === 'running')
    return <span className="flex items-center gap-1 text-success text-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Running</span>;
  if (status === 'crashed')
    return <span className="flex items-center gap-1 text-destructive text-xs font-semibold"><AlertCircle className="w-3 h-3" /> Failed</span>;
  return <span className="flex items-center gap-1 text-warning text-xs font-semibold"><Clock className="w-3 h-3" /> Terminating</span>;
}

function CpuBar({ val, label }: { val: number; label: string }) {
  const color = val > 80 ? 'bg-destructive' : val > 60 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <span className="w-6">{label}</span>
      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, val)}%` }} />
      </div>
      <span className="w-7 text-right font-mono">{Math.round(val)}%</span>
    </div>
  );
}

export default function ManageApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    applications, createDeployment, scaleDeployment, setActiveVersion, 
    instances, pendingPods, deletePod, restartPod, traffic, errorRate,
    attachInstance, detachInstance
  } = useGameStore();
  const addEvent = useSchedulerStore(s => s.addEvent);
  const [showTrafficFlow, setShowTrafficFlow] = useState(false);

  const app = applications.find(a => a.id === id);

  if (!app) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center gap-4 text-muted-foreground">
        <Layers className="w-12 h-12 opacity-30" />
        <p className="font-semibold">Application not found.</p>
        <Button onClick={() => navigate('/apps')} variant="outline" size="sm">← Return to Applications</Button>
      </div>
    );
  }

  // Calculate metrics for this app
  const allAppPods = instances.flatMap(inst => 
    inst.pods
      .filter(p => p.appId === app.id)
      .map(pod => ({
        ...pod,
        instanceName: inst.name,
        instanceId: inst.id,
        instanceType: inst.typeId,
        instanceCpu: inst.cpu,
      }))
  );

  const runningPods = allAppPods.filter(p => p.status === 'running');
  const crashedPods = allAppPods.filter(p => p.status === 'crashed');
  const totalRps = runningPods.reduce((sum, p) => sum + p.currentRps, 0);
  const avgCpu = runningPods.length > 0 
    ? runningPods.reduce((sum, p) => sum + p.cpu, 0) / runningPods.length 
    : 0;

  // Calculate traffic split (only active version gets traffic)
  const trafficSplit = app.deployments.map(dep => ({
    version: dep.version,
    percentage: dep.version === app.activeVersion ? 100 : 0,
    replicas: dep.replicas,
    runningPods: allAppPods.filter(p => p.version === dep.version && p.status === 'running').length,
  }));

  // Instance mapping - only instances assigned to this app
  const assignedInstances = instances.filter(inst => inst.assignedAppId === app.id);
  const instanceMapping = assignedInstances
    .filter(inst => inst.pods.some(p => p.appId === app.id))
    .map(inst => ({
      ...inst,
      appPods: inst.pods.filter(p => p.appId === app.id),
    }));

  // Available instances that can be attached (running, not assigned or assigned to this app)
  const unassignedInstances = instances.filter(inst => 
    inst.assignedAppId === null || inst.assignedAppId === undefined
  );

  // Calculate pending pods for this app
  const appPendingPods = pendingPods.filter(p => p.appId === app.id);
  
  // Calculate desired replicas
  const totalDesiredReplicas = app.deployments.reduce((sum, dep) => sum + dep.replicas, 0);
  const totalRunningPods = runningPods.length;
  
  // Instance availability - only consider assigned instances
  const runningAssignedInstances = assignedInstances.filter(i => i.status === 'running');
  const provisioningAssignedInstances = assignedInstances.filter(i => i.status === 'provisioning');
  const hasNoAssignedInstances = assignedInstances.length === 0;
  const hasNoRunningAssignedInstances = runningAssignedInstances.length === 0;
  const hasProvisioningAssignedInstances = provisioningAssignedInstances.length > 0;

  const handleNewDeployment = () => {
    const versionStr = prompt("Enter new deployment version (e.g. v2, v3)", `v${app.deployments.length + 1}`);
    if (versionStr && versionStr.trim()) {
      createDeployment(app.id, versionStr.trim(), 0);
      addEvent('deployment_created', `New deployment ${versionStr.trim()} created for ${app.name}`, 'Replicas: 0');
    }
  };

  const handleTrafficSwitch = (version: string) => {
    setActiveVersion(app.id, version);
    // Validation is now handled inside setActiveVersion in gameStore
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 p-4 md:p-5 shrink-0 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/apps')} className="rounded-full hover:bg-secondary shrink-0">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Applications / <span className="text-foreground font-medium">{app.name}</span>
                </p>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Container className="w-5 h-5 text-primary" /> {app.name}
                  {app.image && <span className="text-xs font-mono text-muted-foreground ml-1 hidden md:block">{app.image}</span>}
                  <HintButton hint="A Deployment creates and manages a ReplicaSet of pods. The Service routes traffic to the active version." topicId="pods" />
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrafficFlow(!showTrafficFlow)}
                className="gap-2"
              >
                <Network className="w-4 h-4" />
                {showTrafficFlow ? 'Hide' : 'Show'} Flow
              </Button>
            </div>
          </div>

          {/* Real-time Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="panel p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Activity className="w-3.5 h-3.5" />
                Traffic
              </div>
              <p className="text-lg font-bold">{totalRps} <span className="text-xs text-muted-foreground">RPS</span></p>
            </div>
            <div className="panel p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Box className="w-3.5 h-3.5" />
                Pods
              </div>
              <p className="text-lg font-bold">
                <span className={runningPods.length > 0 ? 'text-green-500' : 'text-muted-foreground'}>{runningPods.length}</span>
                <span className="text-xs text-muted-foreground">/{allAppPods.length}</span>
              </p>
            </div>
            <div className="panel p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Cpu className="w-3.5 h-3.5" />
                Avg CPU
              </div>
              <p className={cn("text-lg font-bold", 
                avgCpu > 80 ? 'text-red-500' : avgCpu > 60 ? 'text-yellow-500' : 'text-green-500'
              )}>
                {avgCpu.toFixed(0)}%
              </p>
            </div>
            <div className="panel p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Errors
              </div>
              <p className={cn("text-lg font-bold",
                errorRate > 10 ? 'text-red-500' : errorRate > 5 ? 'text-yellow-500' : 'text-green-500'
              )}>
                {errorRate.toFixed(1)}%
              </p>
            </div>
            <div className="panel p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Server className="w-3.5 h-3.5" />
                Nodes
              </div>
              <p className="text-lg font-bold">{instanceMapping.length}</p>
            </div>
          </div>

          {/* Traffic Flow Visualization */}
          {showTrafficFlow && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 panel p-4 bg-blue-500/5 border-blue-500/20"
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Route className="w-4 h-4 text-blue-500" />
                Traffic Flow
              </h3>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-lg bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-xs font-bold">Incoming</p>
                  <p className="text-sm font-mono">{traffic} RPS</p>
                </div>
                
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-lg bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                    <Route className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-xs font-bold">Service</p>
                  <p className="text-xs text-muted-foreground">{app.name}</p>
                </div>
                
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-lg bg-green-500/20 border-2 border-green-500 flex items-center justify-center relative">
                    <Box className="w-6 h-6 text-green-500" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                      {runningPods.length}
                    </div>
                  </div>
                  <p className="text-xs font-bold">Pods</p>
                  <p className="text-xs font-mono text-green-500">{app.activeVersion}</p>
                </div>
                
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-lg bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center relative">
                    <Server className="w-6 h-6 text-orange-500" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                      {instanceMapping.length}
                    </div>
                  </div>
                  <p className="text-xs font-bold">Nodes</p>
                  <p className="text-xs text-muted-foreground">Instances</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
          
          {/* Traffic Split Section */}
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400" /> Traffic Distribution
            </h2>
            <div className="panel p-5">
              <div className="space-y-3">
                {trafficSplit.map((split) => (
                  <div key={split.version}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{split.version}</span>
                        {split.percentage === 100 && (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            <Zap className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{split.runningPods}/{split.replicas} pods</span>
                        <span className="font-bold text-lg">{split.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${split.percentage}%` }}
                        className={cn(
                          "h-full rounded-full transition-all",
                          split.percentage === 100 ? 'bg-green-500' : 'bg-muted-foreground/30'
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 panel p-3 bg-blue-500/5 border-blue-500/20">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  <span>
                    <strong className="text-foreground">Safe Deployment Workflow:</strong> 
                    {' '}(1) Create new deployment → (2) Scale to desired replicas → (3) Wait for pods to become Running → (4) Switch traffic. 
                    Traffic switching is blocked if target deployment has no running pods.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Deployments Section */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <GitCommit className="w-5 h-5 text-purple-400" /> Deployments
            </h2>
            <Button onClick={handleNewDeployment} size="sm" variant="outline" className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10 gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Deployment
            </Button>
          </div>

          <AnimatePresence>
            {app.deployments.map((dep) => {
              const isActive = app.activeVersion === dep.version;
              const matchingPendingCount = pendingPods.filter(p => p.appId === app.id && p.version === dep.version).length;
              const matchingPods: Array<{ 
                id: string; 
                cpu: number; 
                memory: number; 
                currentRps: number; 
                status: string; 
                hostName: string; 
                hostId: string;
                instanceType: string;
              }> = [];
              
              instances.forEach(inst => {
                inst.pods.forEach(p => {
                  if (p.appId === app.id && p.version === dep.version) {
                    matchingPods.push({ ...p, hostName: inst.name, hostId: inst.id, instanceType: inst.typeId });
                  }
                });
              });

              const runningCount = matchingPods.filter(p => p.status === 'running').length;
              const crashedCount = matchingPods.filter(p => p.status === 'crashed').length;
              
              // Check deployment readiness for traffic switching
              const readiness = checkDeploymentReadiness(app.id, dep.version);
              const canSwitchTraffic = readiness.ready && !isActive;
              
              // Rollout status calculation
              let rolloutStatus: 'complete' | 'in-progress' | 'failed' = 'complete';
              if (runningCount < dep.replicas) {
                rolloutStatus = 'in-progress';
              }
              if (crashedCount > 0) {
                rolloutStatus = 'failed';
              }

              return (
                <motion.div
                  key={dep.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`panel p-5 rounded-xl transition-all ${
                    isActive 
                      ? 'ring-2 ring-primary/60 shadow-xl shadow-primary/10 border-primary/30' 
                      : 'hover:border-border/80'
                  }`}
                >
                  {/* Deployment Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-border/50">
                    <span className="text-2xl font-bold font-mono tracking-tight">{dep.version}</span>
                    {isActive ? (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1.5">
                        <Zap className="w-3 h-3" /> Live Traffic
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Standby / Idle
                      </Badge>
                    )}
                    
                    {/* Rollout Status */}
                    {rolloutStatus === 'complete' && runningCount === dep.replicas && dep.replicas > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Rollout Complete
                      </Badge>
                    )}
                    {rolloutStatus === 'in-progress' && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1.5 animate-pulse">
                        <Clock className="w-3 h-3" /> Rolling Out
                      </Badge>
                    )}
                    {rolloutStatus === 'failed' && (
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1.5">
                        <AlertCircle className="w-3 h-3" /> Degraded
                      </Badge>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      {!isActive && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  size="sm"
                                  onClick={() => handleTrafficSwitch(dep.version)}
                                  disabled={!canSwitchTraffic}
                                  className={cn(
                                    "gap-1.5 text-xs",
                                    canSwitchTraffic 
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                      : "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Zap className="w-3.5 h-3.5" /> Switch Traffic Here
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {!canSwitchTraffic && (
                              <TooltipContent side="bottom" className="max-w-xs">
                                <p className="font-semibold text-xs mb-1">Cannot switch traffic</p>
                                <p className="text-xs">{readiness.reason}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {/* Warning badge for deployments with no running pods */}
                      {!isActive && dep.replicas > 0 && runningCount === 0 && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          No Pods Running
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Replica Controls */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Replica Set</h4>
                      <div className="flex items-center gap-3 bg-secondary/60 p-3 rounded-xl border border-border">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          onClick={() => scaleDeployment(app.id, dep.version, Math.max(0, dep.replicas - 1))}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-3xl font-bold">{dep.replicas}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">desired</p>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          onClick={() => scaleDeployment(app.id, dep.version, dep.replicas + 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-success/5 border border-success/20 rounded-lg py-2">
                          <p className="text-[10px] text-muted-foreground">Running</p>
                          <p className="font-bold text-success">{runningCount}</p>
                        </div>
                        <div className="bg-warning/5 border border-warning/20 rounded-lg py-2">
                          <p className="text-[10px] text-muted-foreground">Pending</p>
                          <p className="font-bold text-warning">{matchingPendingCount}</p>
                        </div>
                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg py-2">
                          <p className="text-[10px] text-muted-foreground">Failed</p>
                          <p className="font-bold text-destructive">{crashedCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pod Grid */}
                    <div className="md:col-span-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5" /> Pods ({matchingPods.length + matchingPendingCount})
                      </h4>

                      {matchingPods.length === 0 && matchingPendingCount === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-border rounded-xl text-center">
                          <Server className="w-8 h-8 opacity-30 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground/80 mb-1">No pods scheduled</p>
                            {dep.replicas === 0 ? (
                              <>
                                <p className="text-xs text-muted-foreground mb-3">
                                  This deployment has 0 desired replicas.
                                </p>
                                <div className="flex items-center gap-2 justify-center text-xs text-blue-500">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Use the + button to scale up this deployment</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Waiting for {dep.replicas} pod{dep.replicas > 1 ? 's' : ''} to be scheduled...
                                </p>
                                <div className="flex items-center gap-2 justify-center text-xs text-yellow-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pods will appear when scheduler finds available capacity</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Pending pods */}
                          {Array.from({ length: matchingPendingCount }).map((_, i) => (
                            <div key={`pending-${i}`} className="bg-warning/5 border border-warning/20 p-3 rounded-xl text-xs text-warning flex items-center gap-2 animate-pulse">
                              <Clock className="w-4 h-4 shrink-0" />
                              <div>
                                <p className="font-bold">Pending Scheduling…</p>
                                <p className="text-warning/60 text-[10px] mt-0.5">Waiting for available Node capacity</p>
                              </div>
                            </div>
                          ))}

                          {/* Live pods */}
                          {matchingPods.map(p => (
                            <div
                              key={p.id}
                              className={`p-3 rounded-xl border transition-colors ${p.status === 'running' ? 'bg-success/5 border-success/20' : p.status === 'crashed' ? 'bg-destructive/10 border-destructive/20' : 'bg-secondary border-border'}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[11px] text-foreground/80 truncate">
                                  {p.id.length > 14 ? p.id.substring(0, 14) + '…' : p.id}
                                </span>
                                <PodStatusBadge status={p.status} />
                              </div>
                              <div className="space-y-1 mb-2">
                                <CpuBar val={p.cpu} label="CPU" />
                                <CpuBar val={p.memory} label="Mem" />
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/instances/${p.hostId}`);
                                  }}
                                  className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                                  title="View instance details"
                                >
                                  <Server className="w-3 h-3" /> {p.hostName}
                                </button>
                                <div className="flex gap-1">
                                  <button
                                    title="Restart Pod"
                                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => { restartPod(p.id); addEvent('pod_scheduled', `Pod ${p.id} restarted`, `Host: ${p.hostName}`); }}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                  <button
                                    title="Delete Pod"
                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => { deletePod(p.id); addEvent('pod_failed', `Pod ${p.id} deleted by user`, `Host: ${p.hostName}`); }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Comprehensive Pod Management Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Box className="w-5 h-5 text-green-400" /> All Pods ({allAppPods.length})
            </h2>
            
            {allAppPods.length === 0 ? (
              <div className="panel p-8 text-center text-muted-foreground">
                <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No pods running</p>
                <p className="text-sm mt-1">Scale up deployments to create pods</p>
              </div>
            ) : (
              <div className="panel p-0 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Pod ID</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Node</TableHead>
                      <TableHead className="text-right">CPU</TableHead>
                      <TableHead className="text-right">Memory</TableHead>
                      <TableHead className="text-right">RPS</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAppPods.map((pod) => (
                      <TableRow key={pod.id}>
                        <TableCell className="font-mono text-xs">{pod.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {pod.version}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <PodStatusBadge status={pod.status} />
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => navigate(`/instances/${pod.instanceId}`)}
                            className="flex items-center gap-1.5 text-xs hover:bg-secondary/60 rounded px-2 py-1 -ml-2 transition-colors group"
                            title="View instance details"
                          >
                            <Server className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-medium group-hover:text-primary transition-colors">{pod.instanceName}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              ({pod.instanceType})
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-mono text-sm font-semibold",
                            pod.cpu > 80 ? 'text-red-500' : 
                            pod.cpu > 60 ? 'text-yellow-500' : 
                            'text-green-500'
                          )}>
                            {pod.cpu.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-mono text-sm font-semibold",
                            pod.memory > 80 ? 'text-red-500' : 
                            pod.memory > 60 ? 'text-yellow-500' : 
                            'text-green-500'
                          )}>
                            {pod.memory.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-sm">{pod.currentRps}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                restartPod(pod.id);
                                addEvent('pod_scheduled', `Pod ${pod.id} restarted`, `Host: ${pod.instanceName}`);
                              }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                deletePod(pod.id);
                                addEvent('pod_failed', `Pod ${pod.id} deleted`, `Host: ${pod.instanceName}`);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Instance Mapping Visualization */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Server className="w-5 h-5 text-orange-400" /> Instance Mapping
              <span className="text-xs font-normal text-muted-foreground">({instanceMapping.length} hosting)</span>
            </h2>
            
            {instanceMapping.length === 0 ? (
              <div className="panel p-8 text-center text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No instances hosting this application</p>
                <p className="text-sm mt-1">Pods will be scheduled when you scale up</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instanceMapping.map((inst) => {
                  const instAppPods = inst.appPods;
                  const runningPodsOnInst = instAppPods.filter(p => p.status === 'running').length;
                  const crashedPodsOnInst = instAppPods.filter(p => p.status === 'crashed').length;
                  
                  return (
                    <button
                      key={inst.id}
                      onClick={() => navigate(`/instances/${inst.id}`)}
                      className="panel p-4 w-full text-left hover:bg-secondary/40 hover:border-primary/40 transition-all cursor-pointer group"
                      title="View instance details"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{inst.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{inst.typeId}</p>
                        </div>
                        <Badge variant={inst.status === 'running' ? 'default' : 'destructive'} className="text-xs">
                          {inst.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-secondary/60 rounded p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">CPU</p>
                          <p className={cn(
                            "font-bold text-sm",
                            inst.cpu > 80 ? 'text-red-500' : inst.cpu > 60 ? 'text-yellow-500' : 'text-green-500'
                          )}>
                            {inst.cpu.toFixed(0)}%
                          </p>
                        </div>
                        <div className="bg-secondary/60 rounded p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Memory</p>
                          <p className={cn(
                            "font-bold text-sm",
                            inst.memory > 80 ? 'text-red-500' : inst.memory > 60 ? 'text-yellow-500' : 'text-green-500'
                          )}>
                            {inst.memory.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Pods on this node:</span>
                          <span className="font-bold">{instAppPods.length}</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>{runningPodsOnInst}</span>
                          </div>
                          {crashedPodsOnInst > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span>{crashedPodsOnInst}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                        {instAppPods.slice(0, 3).map((pod) => (
                          <div key={pod.id} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-muted-foreground truncate">
                              {pod.id.substring(0, 12)}...
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {pod.version}
                            </Badge>
                          </div>
                        ))}
                        {instAppPods.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{instAppPods.length - 3} more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned Nodes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Server className="w-5 h-5 text-green-400" /> Assigned Nodes
                <span className="text-xs font-normal text-muted-foreground">({assignedInstances.length} dedicated)</span>
                <HintButton hint="Only assigned instances can run pods for this application. Attach instances to provide compute capacity." topicId="instances" />
              </h2>
            </div>

            {/* Capacity Warning */}
            {appPendingPods.length > 0 && hasNoRunningAssignedInstances && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel p-4 bg-yellow-500/10 border-yellow-500/30"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">No Compute Capacity</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {appPendingPods.length} pod(s) waiting. 
                      {hasNoAssignedInstances ? (
                        <span className="text-red-500 font-medium"> No instances assigned to this application.</span>
                      ) : hasProvisioningAssignedInstances ? (
                        <span className="text-yellow-500 font-medium"> {provisioningAssignedInstances.length} assigned instance(s) provisioning...</span>
                      ) : (
                        <span> All assigned instances at capacity.</span>
                      )}
                    </p>
                    {unassignedInstances.length > 0 && (
                      <p className="text-xs text-blue-400 font-medium">
                        💡 {unassignedInstances.length} unassigned instance(s) available below
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Assigned Instance List */}
            {hasNoAssignedInstances ? (
              <div className="panel p-8 text-center text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No instances assigned</p>
                <p className="text-sm mt-1 mb-4">Attach instances from the unassigned nodes below to run workloads</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignedInstances.map((inst) => {
                  const instPods = inst.pods.filter(p => p.appId === app.id);
                  const totalPods = inst.pods.length;
                  const maxPods = INSTANCE_TYPES[inst.typeId].maxPods;
                  const capacityUsed = (totalPods / maxPods) * 100;
                  
                  return (
                    <div
                      key={inst.id}
                      className={cn(
                        "panel p-3 w-full relative",
                        inst.status === 'provisioning' && 'border-yellow-500/40 border-dashed',
                        inst.status === 'crashed' && 'border-red-500/40 opacity-60'
                      )}
                    >
                      {/* Detach Button */}
                      <button
                        onClick={() => detachInstance(app.id, inst.id)}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors z-10"
                        title="Detach instance from this app"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/instances/${inst.id}`)}
                        className="w-full text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-start justify-between mb-2 pr-6">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{inst.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono">{inst.typeId}</p>
                          </div>
                          <Badge 
                            variant={inst.status === 'running' ? 'default' : inst.status === 'provisioning' ? 'secondary' : 'destructive'} 
                            className="text-xs shrink-0 ml-2"
                          >
                            {inst.status === 'provisioning' ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-pulse" />
                                {inst.provisionTimer}s
                              </span>
                            ) : (
                              inst.status
                            )}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {/* Capacity Bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Pod Capacity</span>
                              <span className="font-mono font-bold">{totalPods}/{maxPods}</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  capacityUsed >= 100 ? 'bg-red-500' :
                                  capacityUsed >= 80 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                )}
                                style={{ width: `${Math.min(100, capacityUsed)}%` }}
                              />
                            </div>
                          </div>

                          {/* App Pods Count */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">This app:</span>
                            <span className="font-bold text-primary">{instPods.length} pod(s)</span>
                          </div>

                          {/* Status Message */}
                          {inst.status === 'provisioning' && (
                            <p className="text-xs text-yellow-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Booting...
                            </p>
                          )}
                          {inst.status === 'running' && totalPods >= maxPods && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              At capacity
                            </p>
                          )}
                          {inst.status === 'running' && totalPods < maxPods && (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {maxPods - totalPods} slot(s) free
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unassigned Nodes Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Server className="w-5 h-5 text-muted-foreground" /> Unassigned Nodes
              <span className="text-xs font-normal text-muted-foreground">({unassignedInstances.length} available)</span>
              <HintButton hint="Unassigned instances are available for any application. Click 'Attach' to dedicate an instance to this application." topicId="instances" />
            </h2>

            {unassignedInstances.length === 0 ? (
              <div className="panel p-6 text-center text-muted-foreground">
                <Server className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">All instances are assigned</p>
                <p className="text-xs mt-1">Create new instances from the Instances page</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedInstances.map((inst) => {
                  const maxPods = INSTANCE_TYPES[inst.typeId].maxPods;
                  
                  return (
                    <div
                      key={inst.id}
                      className={cn(
                        "panel p-3 w-full",
                        inst.status === 'provisioning' && 'border-yellow-500/40 border-dashed opacity-60',
                        inst.status === 'crashed' && 'border-red-500/40 opacity-40'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate">{inst.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{inst.typeId}</p>
                        </div>
                        <Badge 
                          variant={inst.status === 'running' ? 'outline' : inst.status === 'provisioning' ? 'secondary' : 'destructive'} 
                          className="text-xs shrink-0 ml-2"
                        >
                          {inst.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-muted-foreground">Max Capacity:</span>
                        <span className="font-mono font-bold">{maxPods} pods</span>
                      </div>

                      <Button
                        onClick={() => attachInstance(app.id, inst.id)}
                        disabled={inst.status !== 'running'}
                        size="sm"
                        className="w-full gap-2"
                        variant={inst.status === 'running' ? 'default' : 'secondary'}
                      >
                        <Plus className="w-3 h-3" />
                        {inst.status === 'running' ? 'Attach to App' : inst.status === 'provisioning' ? 'Booting...' : 'Crashed'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Right Sidebar — Enhanced Event Panel */}
      <div className="w-80 shrink-0 border-l border-border bg-card/40 flex flex-col">
        <SchedulerPanel />
      </div>
    </div>
  );
}
