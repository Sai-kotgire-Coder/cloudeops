import { useGameStore } from '@/store/gameStore';
import {useAlertStore } from '@/store/alertStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Gauge, 
  Zap, 
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

export function GlobalControlPanel() {
  const {
    isRunning,
    toggleSimulation,
    traffic,
    targetTraffic,
    setTargetTraffic,
    hpa,
    asg,
    updateHPA,
    updateASG,
    resetSimulation,
    score,
    totalCost,
  } = useGameStore();

  const criticalAlerts = useAlertStore(s => s.getCriticalCount());
  const highAlerts = useAlertStore(s => s.getHighCount());
  const [showSettings, setShowSettings] = useState(false);

  const handleTrafficChange = (value: number[]) => {
    const newTraffic = value[0];
    setTargetTraffic(newTraffic);
    
    if (newTraffic > traffic) {
      toast.info(`🚀 Ramping traffic to ${newTraffic} RPS`);
    } else if (newTraffic < traffic) {
      toast.info(`📉 Reducing traffic to ${newTraffic} RPS`);
    }
  };

  const handleReset = () => {
    if (confirm('Reset entire simulation? All progress will be lost.')) {
      resetSimulation();
      toast.success('Simulation reset');
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="panel p-3 sm:p-4"
    >
      <div className="flex flex-col gap-4">
        {/* Top Row: Title & Main Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base">Control Center</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Global system controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation Toggle */}
            <Button
              onClick={toggleSimulation}
              variant={isRunning ? 'destructive' : 'default'}
              size="sm"
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Start</span>
                </>
              )}
            </Button>

            {/* Reset */}
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            {/* Settings Popover */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h3 className="font-semibold">Auto-Scaling Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">HPA (Pod Autoscaler)</label>
                        <p className="text-xs text-muted-foreground">
                          Auto-scale pod replicas
                        </p>
                      </div>
                      <Switch
                        checked={hpa.enabled}
                        onCheckedChange={(checked) => {
                          updateHPA({ enabled: checked });
                          toast.success(checked ? 'HPA enabled' : 'HPA disabled');
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">ASG (Cluster Autoscaler)</label>
                        <p className="text-xs text-muted-foreground">
                          Auto-scale instances
                        </p>
                      </div>
                      <Switch
                        checked={asg.enabled}
                        onCheckedChange={(checked) => {
                          updateASG({ enabled: checked });
                          toast.success(checked ? 'ASG enabled' : 'ASG disabled');
                        }}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Middle Row: Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="text-sm font-bold">{score}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Traffic</p>
              <p className="text-sm font-bold">{Math.round(traffic)} RPS</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              criticalAlerts > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
            }`}>
              <Zap className={`w-4 h-4 ${
                criticalAlerts > 0 ? 'text-red-500' : 'text-green-500'
              }`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alerts</p>
              <p className="text-sm font-bold">
                {criticalAlerts + highAlerts === 0 ? '✓ None' : `${criticalAlerts + highAlerts}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cost/hr</p>
              <p className="text-sm font-bold">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Bottom Row: Traffic Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Traffic Load (RPS)</label>
            <span className="text-sm text-muted-foreground">
              Target: {targetTraffic} RPS
            </span>
          </div>
          <Slider
            value={[targetTraffic]}
            onValueChange={handleTrafficChange}
            min={0}
            max={1000}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1000</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
