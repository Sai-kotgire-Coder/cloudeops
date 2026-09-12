import { TrendingUp, Users, IndianRupee, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Progress } from '@/components/ui/progress';

export interface AdminAnalyticsData {
  windowDays: number;
  signups: { date: string; count: number }[];
  dailyActive: { date: string; count: number }[];
  revenuePaise: { date: string; count: number }[];
  moduleCompletionRates: { module: string; completedCount: number; completionRate: number }[];
  proConversionRate: number;
  totalUsers: number;
  proUsers: number;
}

const MODULE_LABELS: Record<string, string> = {
  terraform: 'Terraform Lab',
  ansible: 'Ansible Lab',
  vault: 'Vault Lab',
  gitops: 'GitOps Lab',
  kubectl: 'kubectl Lab',
  monitoring: 'Monitoring Lab'
};

const StatCard = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone?: string }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tone || 'bg-primary/10 text-primary'}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

function TrendChart({ title, data, formatValue }: { title: string; data: { date: string; count: number }[]; formatValue?: (v: number) => string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-sm font-semibold mb-3">{title}</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-muted-foreground"
              width={36}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => (formatValue ? formatValue(value) : value)}
            />
            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const AdminAnalytics = ({ data }: { data: AdminAnalyticsData }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total users" value={data.totalUsers} />
        <StatCard icon={TrendingUp} label="Pro conversion" value={`${(data.proConversionRate * 100).toFixed(1)}%`} tone="bg-amber-500/10 text-amber-500" />
        <StatCard icon={IndianRupee} label={`Revenue (${data.windowDays}d)`} value={`₹${(data.revenuePaise.reduce((s, r) => s + r.count, 0) / 100).toLocaleString('en-IN')}`} tone="bg-blue-500/10 text-blue-500" />
        <StatCard icon={Award} label="Modules with certs" value={data.moduleCompletionRates.length} tone="bg-green-500/10 text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChart title={`Signups, last ${data.windowDays} days`} data={data.signups} />
        <TrendChart title="Last-active trend" data={data.dailyActive} />
        <TrendChart
          title={`Revenue, last ${data.windowDays} days`}
          data={data.revenuePaise}
          formatValue={(v) => `₹${(v / 100).toLocaleString('en-IN')}`}
        />

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-3">Module completion rate</p>
          {data.moduleCompletionRates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No modules completed by any user yet.</p>
          ) : (
            <div className="space-y-3">
              {data.moduleCompletionRates.map((m) => (
                <div key={m.module}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium">{MODULE_LABELS[m.module] ?? m.module}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {m.completedCount} ({(m.completionRate * 100).toFixed(0)}%)
                    </p>
                  </div>
                  <Progress value={m.completionRate * 100} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
