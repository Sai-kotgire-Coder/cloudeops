import { Users, ShieldCheck, Crown, Activity, IndianRupee, MoonStar, Send, CircleCheck, CircleAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export interface AdminStatsData {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  proUsers: number;
  freeUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  activeWindowDays: number;
  totalRevenuePaise: number;
  completedPaymentCount: number;
  signups: { date: string; count: number }[];
  lastBroadcast: {
    subject: string | null;
    target: string | null;
    recipientCount: number;
    sent: number;
    failed: number;
    createdAt: string;
  } | null;
}

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

export const AdminStats = ({ stats }: { stats: AdminStatsData }) => {
  const revenueRupees = (stats.totalRevenuePaise / 100).toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} />
        <StatCard icon={ShieldCheck} label="Verified" value={stats.verifiedUsers} />
        <StatCard icon={Crown} label="Pro plan" value={stats.proUsers} tone="bg-amber-500/10 text-amber-500" />
        <StatCard icon={Activity} label={`Active (${stats.activeWindowDays}d)`} value={stats.activeUsers} tone="bg-green-500/10 text-green-500" />
        <StatCard icon={MoonStar} label={`Inactive (${stats.activeWindowDays}d)`} value={stats.inactiveUsers} tone="bg-gray-500/10 text-gray-500" />
        <StatCard icon={IndianRupee} label={`Revenue (${stats.completedPaymentCount} payments)`} value={`₹${revenueRupees}`} tone="bg-blue-500/10 text-blue-500" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold mb-3">Signups, last 14 days</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.signups}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" width={24} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-muted-foreground" />
          Last broadcast
        </p>
        {stats.lastBroadcast ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{stats.lastBroadcast.subject}</p>
              <p className="text-xs text-muted-foreground">
                To {stats.lastBroadcast.target} &middot; {new Date(stats.lastBroadcast.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm shrink-0">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CircleCheck className="w-4 h-4" /> {stats.lastBroadcast.sent} sent
              </span>
              {stats.lastBroadcast.failed > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <CircleAlert className="w-4 h-4" /> {stats.lastBroadcast.failed} failed
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No broadcast has been sent yet.</p>
        )}
      </div>
    </div>
  );
};
