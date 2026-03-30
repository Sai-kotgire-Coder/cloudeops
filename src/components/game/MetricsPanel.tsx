import { useGameStore } from '@/store/gameStore';
import { Activity, Cpu, AlertTriangle, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { HintButton } from './HintButton';

const MetricCard = ({ label, value, unit, icon: Icon, status, hint }: {
  label: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  status: 'healthy' | 'warning' | 'critical';
  hint: string;
}) => (
  <div className={`metric-card-${status}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${status === 'healthy' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <HintButton hint={hint} />
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-mono font-bold ${status === 'healthy' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive'}`}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  </div>
);

const getStatus = (val: number, warnAt: number, critAt: number): 'healthy' | 'warning' | 'critical' =>
  val >= critAt ? 'critical' : val >= warnAt ? 'warning' : 'healthy';

export const MetricsPanel = () => {
  const { traffic, cpuAvg, errorRate, instances, metricsHistory } = useGameStore();
  const running = instances.filter(i => i.status === 'running').length;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Live Dashboard</span>
        </div>
        <HintButton topicId="cpu_memory" hint="Monitor your system health in real-time. Green = healthy, Yellow = warning, Red = critical." />
      </div>

      <div className="flex-1 p-4 overflow-auto space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Traffic" value={traffic.toFixed(0)} unit="RPS" icon={Activity} status={getStatus(traffic, 70, 90)} hint="Requests Per Second — how many users are hitting your system." />
          <MetricCard label="CPU Avg" value={cpuAvg.toFixed(1)} unit="%" icon={Cpu} status={getStatus(cpuAvg, 70, 85)} hint="Average CPU usage across running instances. High CPU means servers are under heavy load." />
          <MetricCard label="Error Rate" value={errorRate.toFixed(1)} unit="%" icon={AlertTriangle} status={getStatus(errorRate, 5, 15)} hint="Percentage of requests that fail. High error rate means users are experiencing issues." />
          <MetricCard label="Instances" value={`${running}/${instances.length}`} unit="active" icon={Server} status={running === instances.length ? 'healthy' : running > 0 ? 'warning' : 'critical'} hint="Number of running servers. Crashed instances need to be restarted." />
        </div>

        {/* Chart */}
        {metricsHistory.length > 2 && (
          <div className="panel p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">System Metrics Over Time</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={metricsHistory}>
                <XAxis dataKey="tick" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: 'hsl(210 20% 60%)' }}
                />
                <Line type="monotone" dataKey="cpu" stroke="hsl(175, 80%, 50%)" strokeWidth={2} dot={false} name="CPU %" />
                <Line type="monotone" dataKey="errors" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} name="Errors %" />
                <Line type="monotone" dataKey="rps" stroke="hsl(270, 60%, 60%)" strokeWidth={1.5} dot={false} name="RPS" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
