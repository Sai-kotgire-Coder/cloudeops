import { useEffect, useState } from 'react';
import { Loader2, Crown, ShieldCheck, Mail, GraduationCap, Briefcase } from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { MODULE_CATALOG } from '@/data/moduleCatalog';

interface UserDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
  onPlanChanged: () => void;
}

export const UserDetailDrawer = ({ userId, onClose, onPlanChanged }: UserDetailDrawerProps) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiClient
      .getAdminUserDetail(userId)
      .then(setDetail)
      .catch((err) => toast.error(err.message || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleTogglePlan = async () => {
    if (!detail) return;
    setUpdatingPlan(true);
    try {
      const result = await apiClient.updateUserPlan(detail.id, !detail.isPro);
      setDetail({ ...detail, isPro: result.isPro, planType: result.planType });
      toast.success(result.message);
      onPlanChanged();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update plan');
    } finally {
      setUpdatingPlan(false);
    }
  };

  return (
    <Drawer open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="max-w-2xl mx-auto w-full overflow-y-auto px-4 pb-6">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {detail?.email ?? 'Loading...'}
            </DrawerTitle>
            <DrawerDescription>Full account detail</DrawerDescription>
          </DrawerHeader>

          {loading || !detail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-5 px-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={detail.isPro ? 'default' : 'secondary'} className="gap-1">
                  {detail.isPro ? <Crown className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                  {detail.isPro ? 'Pro' : 'Free'}
                </Badge>
                <Badge variant={detail.isVerified ? 'outline' : 'destructive'}>
                  {detail.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
                {detail.isAdmin && <Badge variant="outline">Admin</Badge>}
                <Button size="sm" variant="outline" onClick={handleTogglePlan} disabled={updatingPlan}>
                  {updatingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  {detail.isPro ? 'Revoke Pro' : 'Grant Pro (30 days)'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Full name</p>
                  <p className="font-medium">{detail.profile?.fullName || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Occupation</p>
                  <p className="font-medium flex items-center gap-1.5">
                    {detail.profile?.occupation === 'student' ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                    {detail.profile?.occupation || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Institute</p>
                  <p className="font-medium">{detail.profile?.institute || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Joined</p>
                  <p className="font-medium">{new Date(detail.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Last active</p>
                  <p className="font-medium">
                    {detail.gameState?.updatedAt ? new Date(detail.gameState.updatedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Score</p>
                  <p className="font-medium">{detail.gameState?.score ?? 0}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Resources</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(detail._count || {}).map(([key, value]) => (
                    <div key={key} className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-lg font-bold">{String(value)}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Selected modules</p>
                <div className="flex flex-wrap gap-1.5">
                  {(detail.profile?.selectedModules || []).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">None selected</p>
                  )}
                  {(detail.profile?.selectedModules || []).map((id: string) => {
                    const mod = MODULE_CATALOG.find((m) => m.id === id);
                    return (
                      <Badge key={id} variant="outline">{mod?.title ?? id}</Badge>
                    );
                  })}
                </div>
              </div>

              {detail.payments?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent payments</p>
                  <div className="space-y-1.5">
                    {detail.payments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-2">
                        <span>₹{(p.amount / 100).toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs">{p.status}</span>
                        <span className="text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
