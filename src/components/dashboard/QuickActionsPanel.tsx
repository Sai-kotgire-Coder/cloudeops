import { useGameStore, InstanceTypeId } from '@/store/gameStore';
import { 
  Plus, 
  TrendingUp, 
  RotateCcw, 
  Zap,
  Server,
  Rocket,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

export function QuickActionsPanel() {
  const {
    addInstance,
    updateHPA,
    updateASG,
    hpa,
    asg,
    instances,
    restartInstance,
    createDeployment,
    applications,
  } = useGameStore();

  const [selectedInstanceType, setSelectedInstanceType] = useState<InstanceTypeId>('t3.micro');
  const crashedInstances = instances.filter(i => i.status === 'crashed');

  const handleAddInstance = () => {
    addInstance(selectedInstanceType);
    toast.success(`Provisioning new ${selectedInstanceType} instance`);
  };

  const handleEnableHPA = () => {
    if (!hpa.enabled) {
      updateHPA({ enabled: true });
      toast.success('✅ Horizontal Pod Autoscaler enabled');
    } else {
      toast.info('HPA is already enabled');
    }
  };

  const handleEnableASG = () => {
    if (!asg.enabled) {
      updateASG({ enabled: true });
      toast.success('✅ Auto-Scaling Group enabled');
    } else {
      toast.info('ASG is already enabled');
    }
  };

  const handleRestartCrashed = () => {
    if (crashedInstances.length === 0) {
      toast.info('No crashed instances to restart');
      return;
    }

    crashedInstances.forEach(inst => {
      restartInstance(inst.id);
    });
    toast.success(`🔄 Restarting ${crashedInstances.length} crashed instance(s)`);
  };

  const handleNewDeployment = () => {
    const app = applications[0];
    if (!app) {
      toast.error('No application found');
      return;
    }

    const currentVersion = parseInt(app.activeVersion.replace('v', ''));
    const newVersion = `v${currentVersion + 1}`;
    
    createDeployment(app.id, newVersion, 2);
    toast.success(`🚀 Deploying ${app.name} ${newVersion}`);
  };

  const actions = [
    {
      icon: Server,
      label: 'Add Instance',
      description: 'Provision new server',
      action: handleAddInstance,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      disabled: false,
    },
    {
      icon: TrendingUp,
      label: 'Enable HPA',
      description: 'Auto-scale pods',
      action: handleEnableHPA,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      disabled: hpa.enabled,
    },
    {
      icon: Activity,
      label: 'Enable ASG',
      description: 'Auto-scale instances',
      action: handleEnableASG,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      disabled: asg.enabled,
    },
    {
      icon: RotateCcw,
      label: 'Restart Crashed',
      description: `${crashedInstances.length} crashed`,
      action: handleRestartCrashed,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      disabled: crashedInstances.length === 0,
    },
    {
      icon: Rocket,
      label: 'New Deployment',
      description: 'Deploy new version',
      action: handleNewDeployment,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      disabled: false,
    },
  ];

  return (
    <div className="panel p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Quick Actions
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rapid deployment controls
        </p>
      </div>

      {/* Instance Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Instance Type</label>
        <Select value={selectedInstanceType} onValueChange={(v) => setSelectedInstanceType(v as InstanceTypeId)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="t3.micro">t3.micro (100 RPS)</SelectItem>
            <SelectItem value="t3.small">t3.small (250 RPS)</SelectItem>
            <SelectItem value="m5.large">m5.large (1000 RPS)</SelectItem>
            <SelectItem value="c5.xlarge">c5.xlarge (3000 RPS)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-2">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Button
                onClick={action.action}
                disabled={action.disabled}
                variant="outline"
                className="w-full justify-start h-auto p-3"
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center ${action.bgColor} mr-3`}>
                  <Icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
                {action.disabled && (
                  <span className="text-xs text-green-500 ml-2">✓</span>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
