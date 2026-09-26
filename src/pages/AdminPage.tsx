import { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { AdminStats, type AdminStatsData } from '@/components/admin/AdminStats';
import { AdminAnalytics, type AdminAnalyticsData } from '@/components/admin/AdminAnalytics';
import { UsersTable } from '@/components/admin/UsersTable';
import { BroadcastEmailPanel } from '@/components/admin/BroadcastEmailPanel';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { CommunitySubmissionsTable } from '@/components/admin/CommunitySubmissionsTable';
import { WorkshopRegistrationsTable } from '@/components/admin/WorkshopRegistrationsTable';
import { ManageWorkshopsPanel } from '@/components/admin/ManageWorkshopsPanel';
import { toast } from 'sonner';

export default function AdminPage() {
  const adminRole = useAuthStore((state) => state.user?.adminRole ?? null);
  // A null adminRole is "full admin" -- sees every tab. A scoped role only
  // sees the tabs its role actually has server-side access to (matching
  // the requireAdminRole() gates in admin.ts) -- no point showing a tab
  // whose every request would just 403.
  const isFullAdmin = adminRole == null;
  const canModerate = isFullAdmin || adminRole === 'moderator';
  const canCoordinateWorkshop = isFullAdmin || adminRole === 'workshop_coordinator';

  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const loadStats = () => {
    setLoadingStats(true);
    apiClient
      .getAdminStats()
      .then(setStats)
      .catch((err) => toast.error(err.message || 'Failed to load stats'))
      .finally(() => setLoadingStats(false));
  };

  const loadAnalytics = () => {
    setLoadingAnalytics(true);
    apiClient
      .getAdminAnalytics()
      .then(setAnalytics)
      .catch((err) => toast.error(err.message || 'Failed to load analytics'))
      .finally(() => setLoadingAnalytics(false));
  };

  useEffect(loadStats, []);
  useEffect(loadAnalytics, []);

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
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              {isFullAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
              {isFullAdmin && <TabsTrigger value="notify">Send Notification</TabsTrigger>}
              {canModerate && <TabsTrigger value="submissions">Submissions</TabsTrigger>}
              {canCoordinateWorkshop && <TabsTrigger value="workshop">Workshop</TabsTrigger>}
              {isFullAdmin && <TabsTrigger value="audit">Audit Log</TabsTrigger>}
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

            <TabsContent value="analytics" className="mt-6">
              {loadingAnalytics || !analytics ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AdminAnalytics data={analytics} />
              )}
            </TabsContent>

            {isFullAdmin && (
              <TabsContent value="users" className="mt-6">
                <UsersTable />
              </TabsContent>
            )}

            {isFullAdmin && (
              <TabsContent value="notify" className="mt-6">
                <div className="max-w-3xl bg-card border border-border rounded-xl p-6">
                  <BroadcastEmailPanel stats={stats} />
                </div>
              </TabsContent>
            )}

            {canModerate && (
              <TabsContent value="submissions" className="mt-6">
                <CommunitySubmissionsTable />
              </TabsContent>
            )}

            {canCoordinateWorkshop && (
              <TabsContent value="workshop" className="mt-6">
                <Tabs defaultValue="manage">
                  <TabsList>
                    <TabsTrigger value="manage">Manage</TabsTrigger>
                    <TabsTrigger value="registrations">Registrations</TabsTrigger>
                  </TabsList>
                  <TabsContent value="manage" className="mt-4">
                    <ManageWorkshopsPanel />
                  </TabsContent>
                  <TabsContent value="registrations" className="mt-4">
                    <WorkshopRegistrationsTable />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}

            {isFullAdmin && (
              <TabsContent value="audit" className="mt-6">
                <AuditLogTable />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
