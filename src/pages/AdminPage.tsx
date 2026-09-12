import { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/apiClient';
import { AdminStats, type AdminStatsData } from '@/components/admin/AdminStats';
import { UsersTable } from '@/components/admin/UsersTable';
import { BroadcastEmailPanel } from '@/components/admin/BroadcastEmailPanel';
import { toast } from 'sonner';

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = () => {
    setLoadingStats(true);
    apiClient
      .getAdminStats()
      .then(setStats)
      .catch((err) => toast.error(err.message || 'Failed to load stats'))
      .finally(() => setLoadingStats(false));
  };

  useEffect(loadStats, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <ShieldAlert className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg sm:text-xl">Admin Panel</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Users, activity, and platform-wide notifications</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="notify">Send Notification</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {loadingStats || !stats ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AdminStats stats={stats} />
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <UsersTable />
            </TabsContent>

            <TabsContent value="notify" className="mt-6">
              <div className="max-w-2xl bg-card border border-border rounded-xl p-6">
                <BroadcastEmailPanel stats={stats} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
