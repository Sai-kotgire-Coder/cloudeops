import { useState } from 'react';
import { UserCircle2, Crown, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { PersonalInfoForm } from '@/components/account/PersonalInfoForm';
import { ModuleSelector } from '@/components/account/ModuleSelector';
import { SecuritySection } from '@/components/account/SecuritySection';
import { DangerZoneSection } from '@/components/account/DangerZoneSection';
import type { ProfileFields } from '@/store/profileStore';

export default function MyAccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    fullName, phone, linkedinUrl, instagramHandle, dateOfBirth, institute, occupation,
    selectedModules, plan, toggleModule, saveProfile,
  } = useProfileStore();

  const fields: ProfileFields = { fullName, phone, linkedinUrl, instagramHandle, dateOfBirth, institute, occupation };
  const isPro = plan?.isPro ?? false;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await apiClient.cancelSubscription();
      useProfileStore.setState({ plan: { isPro: false, planType: 'free', planExpiry: null } });
      toast.success('Your Pro plan has been cancelled — you are now on the Free plan.');
      setCancelOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <UserCircle2 className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg sm:text-xl">My Account</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Your profile, plan, and active modules</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile / Plan */}
          <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{fullName || user?.email}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${
                  isPro
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {isPro ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                {isPro ? 'Pro Plan' : 'Basic Plan'}
              </div>
              {!isPro && (
                <Button size="sm" onClick={() => navigate('/pricing')}>Upgrade</Button>
              )}
              {isPro && (
                <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>

          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel your Pro plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll immediately lose access to Pro features (unlimited instances, applications, pipelines,
                  containers, and advanced monitoring) and drop to the Free plan's limits. There's no charge for
                  cancelling, and you can upgrade again any time from the Pricing page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelling}>Keep Pro</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleCancelSubscription();
                  }}
                  disabled={cancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Personal Information */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Personal Information</h2>
              <p className="text-sm text-muted-foreground">This helps us tailor learning content to you.</p>
            </div>
            <PersonalInfoForm initial={fields} onSave={(f) => saveProfile(f)} />
          </div>

          {/* Modules */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Modules</h2>
              <p className="text-sm text-muted-foreground">Choose which labs and sections appear in your sidebar.</p>
            </div>
            <ModuleSelector selectedModules={selectedModules} onToggle={toggleModule} />
          </div>

          {/* Security */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Security</h2>
              <p className="text-sm text-muted-foreground">Change your password and manage active sessions.</p>
            </div>
            <SecuritySection />
          </div>

          {/* Danger Zone */}
          <div className="bg-card border border-destructive/30 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Export your data, or permanently delete your account.</p>
            </div>
            <DangerZoneSection />
          </div>
        </div>
      </div>
    </div>
  );
}
