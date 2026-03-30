import { useState } from 'react';
import { useTicketStore, Ticket } from '@/store/ticketStore';
import { useGameStore } from '@/store/gameStore';
import { useNetworkStore } from '@/store/networkStore';
import { useContainerStore } from '@/store/containerStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Flame,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Zap,
  CheckCircle,
  X,
  Wrench,
  Lightbulb,
  BookOpen,
  Activity,
  Play,
  RotateCcw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface TicketDetailPanelProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketDetailPanel = ({ ticket, isOpen, onClose }: TicketDetailPanelProps) => {
  const { markInProgress, markResolved, addActivity } = useTicketStore();
  const gameStore = useGameStore();
  const networkStore = useNetworkStore();
  const containerStore = useContainerStore();
  
  const [actionNote, setActionNote] = useState('');
  const [showHint, setShowHint] = useState(false);

  if (!ticket) return null;

  const getPriorityIcon = () => {
    switch (ticket.priority) {
      case 'critical':
        return <Flame className="w-6 h-6 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'low':
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStatusIcon = () => {
    switch (ticket.status) {
      case 'open':
        return <Clock className="w-5 h-5" />;
      case 'in_progress':
        return <Zap className="w-5 h-5 animate-pulse" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      case 'closed':
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  // Actionable fix handlers
  const handleQuickFix = (action: string) => {
    let actionTaken = '';
    let success = false;

    switch (action) {
      case 'enable-hpa':
        if (gameStore.hpa && !gameStore.hpa.enabled) {
          gameStore.updateHPA({ enabled: true });
          actionTaken = 'Enabled Horizontal Pod Autoscaler (HPA)';
          success = true;
        } else {
          toast.error('HPA already enabled or not available');
          return;
        }
        break;

      case 'enable-asg':
        if (gameStore.asg && !gameStore.asg.enabled) {
          gameStore.updateASG({ enabled: true });
          actionTaken = 'Enabled Auto-Scaling Group (ASG)';
          success = true;
        } else {
          toast.error('ASG already enabled or not available');
          return;
        }
        break;

      case 'scale-pods':
        if (ticket.category === 'cpu' || ticket.category === 'scaling') {
          const currentApps = gameStore.applications || [];
          if (currentApps.length > 0) {
            const app = currentApps[0];
            const currentDeployment = app.deployments?.find(d => d.version === app.activeVersion);
            if (currentDeployment) {
              const newReplicas = Math.min(currentDeployment.replicas + 2, 10);
              // This would update deployment replicas - integrate with your gameStore method
              actionTaken = `Scaled pods from ${currentDeployment.replicas} to ${newReplicas} replicas`;
              success = true;
              toast.success('Pod scaling initiated');
            }
          }
        }
        break;

      case 'restart-pods':
        if (ticket.category === 'pod') {
          const instances = gameStore.instances || [];
          let restarted = 0;
          instances.forEach(inst => {
            inst.pods?.forEach(pod => {
              if (pod.status === 'crashed') {
                pod.status = 'running';
                pod.cpu = 0;
                pod.memory = 0;
                restarted++;
              }
            });
          });
          
          // Also restart network pods
          const networkPods = networkStore.pods || [];
          networkPods.forEach(pod => {
            if (pod.status === 'failed') {
              networkStore.updatePodStatus(pod.id, 'running');
              restarted++;
            }
          });

          if (restarted > 0) {
            actionTaken = `Restarted ${restarted} crashed pod(s)`;
            success = true;
          } else {
            toast.info('No crashed pods found');
            return;
          }
        }
        break;

      case 'add-instances':
        if (ticket.category === 'scaling' || ticket.category === 'cpu') {
          // Add new instance
          if (gameStore.addInstance) {
            const newInstanceType = 'm5.large';
            gameStore.addInstance(newInstanceType);
            actionTaken = `Provisioned new ${newInstanceType} instance`;
            success = true;
          }
        }
        break;

      case 'enable-load-balancer':
        if (containerStore.toggleLoadBalancer && !containerStore.hasLoadBalancer) {
          containerStore.toggleLoadBalancer();
          actionTaken = 'Enabled load balancer for traffic distribution';
          success = true;
        } else {
          toast.info('Load balancer already enabled');
          return;
        }
        break;

      case 'reduce-traffic':
        if (gameStore.setTraffic) {
          const currentTraffic = gameStore.traffic || 0;
          const newTraffic = Math.max(0, currentTraffic * 0.7);
          gameStore.setTraffic(newTraffic);
          actionTaken = `Reduced traffic from ${currentTraffic} to ${newTraffic} RPS`;
          success = true;
        }
        break;

      case 'fix-service-selector':
        if (ticket.category === 'service') {
          const services = networkStore.services || [];
          services.forEach(svc => {
            if (svc.endpoints.length === 0) {
              networkStore.updateServiceEndpoints(svc.id);
            }
          });
          actionTaken = 'Updated service endpoints';
          success = true;
        }
        break;

      default:
        toast.info('Fix action not implemented yet');
        return;
    }

    if (success) {
      addActivity(ticket.id, {
        action: 'action_taken',
        description: actionTaken,
        metadata: { quickFix: action },
      });

      toast.success('Quick fix applied!', {
        description: actionTaken,
      });

      // Auto-resolve if successful
      setTimeout(() => {
        markResolved(ticket.id, actionTaken);
      }, 2000);
    }
  };

  const handleMarkInProgress = () => {
    markInProgress(ticket.id);
  };

  const handleResolve = () => {
    if (!actionNote.trim()) {
      toast.error('Please describe the action taken');
      return;
    }

    markResolved(ticket.id, actionNote);
    setActionNote('');
    onClose();
  };

  const getQuickFixButtons = () => {
    const fixes: Array<{ action: string; label: string; icon: any }> = [];

    if (ticket.category === 'cpu' || ticket.category === 'memory') {
      fixes.push(
        { action: 'enable-hpa', label: 'Enable HPA', icon: Activity },
        { action: 'enable-asg', label: 'Enable ASG', icon: Activity },
        { action: 'add-instances', label: 'Add Instance', icon: Play }
      );
    }

    if (ticket.category === 'scaling') {
      fixes.push(
        { action: 'scale-pods', label: 'Scale Pods', icon: Activity },
        { action: 'enable-asg', label: 'Enable ASG', icon: Activity }
      );
    }

    if (ticket.category === 'pod') {
      fixes.push(
        { action: 'restart-pods', label: 'Restart Pods', icon: RotateCcw }
      );
    }

    if (ticket.category === 'service') {
      fixes.push(
        { action: 'fix-service-selector', label: 'Fix Service', icon: Wrench }
      );
    }

    if (ticket.category === 'container') {
      fixes.push(
        { action: 'enable-load-balancer', label: 'Enable LB', icon: Activity },
        { action: 'reduce-traffic', label: 'Reduce Traffic', icon: Activity }
      );
    }

    return fixes;
  };

  const quickFixes = getQuickFixButtons();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 border-slate-700">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getPriorityIcon()}
              <div>
                <SheetTitle className="text-white text-lg">
                  {ticket.title}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs">{ticket.ticketNumber}</span>
                  <span>•</span>
                  <span className="capitalize">{ticket.type.replace('_', ' ')}</span>
                  {ticket.category && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {ticket.category}
                      </Badge>
                    </>
                  )}
                </SheetDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm text-white capitalize">
              {ticket.status.replace('_', ' ')}
            </span>
            {ticket.status === 'open' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkInProgress}
                className="ml-auto"
              >
                Start Working
              </Button>
            )}
          </div>

          <Separator />

          {/* Description */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 whitespace-pre-line">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Affected Service */}
          {ticket.affectedService && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Affected Service</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-orange-400">{ticket.affectedService}</code>
              </CardContent>
            </Card>
          )}

          {/* Quick Fixes */}
          {quickFixes.length > 0 && (ticket.status === 'open' || ticket.status === 'in_progress') && (
            <Card className="bg-blue-900/20 border-blue-600">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Quick Fixes
                </CardTitle>
                <CardDescription>
                  One-click actions to resolve this issue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quickFixes.map(fix => (
                    <Button
                      key={fix.action}
                      size="sm"
                      onClick={() => handleQuickFix(fix.action)}
                      className="gap-2"
                    >
                      <fix.icon className="w-4 h-4" />
                      {fix.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Fix */}
          {ticket.suggestedFix && (
            <Card className="bg-green-900/20 border-green-600">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Suggested Fix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 whitespace-pre-line text-sm">
                  {ticket.suggestedFix}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Hint */}
          <Card className="bg-purple-900/20 border-purple-600">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                AI DevOps Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showHint ? (
                <Button variant="outline" size="sm" onClick={() => setShowHint(true)}>
                  Get Hint
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    {ticket.category === 'cpu' && "Your instances are under heavy load. Consider scaling horizontally (more pods) or vertically (bigger instances)."}
                    {ticket.category === 'memory' && "Memory pressure detected. Check for memory leaks or enable VPA to allocate more resources."}
                    {ticket.category === 'pod' && "Pods are crashing. Check logs, verify resource limits, and ensure health checks are configured."}
                    {ticket.category === 'scaling' && "You're running out of capacity. Enable Auto-Scaling Group to automatically provision new nodes."}
                    {ticket.category === 'service' && "Your service can't find pods. Verify label selectors match pod labels exactly."}
                    {ticket.category === 'container' && "Containers are overloaded. Enable load balancing to distribute traffic evenly."}
                    {!ticket.category && "Investigate the metrics, identify the root cause, and apply the suggested fix."}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-purple-400 p-0 h-auto"
                    onClick={() => {/* Open learning modal */}}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Learn More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Resolution */}
          {(ticket.status === 'in_progress' || ticket.status === 'open') && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Mark as Resolved</CardTitle>
                <CardDescription>
                  Describe what action you took to fix this issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="E.g., Scaled pods to 5 replicas and enabled HPA..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
                <Button onClick={handleResolve} className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve Ticket
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          {ticket.activities && ticket.activities.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-xs">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                      <div className="flex-1">
                        <p className="text-white font-medium capitalize">
                          {activity.action.replace('_', ' ')}
                        </p>
                        <p className="text-gray-400">{activity.description}</p>
                        <p className="text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
