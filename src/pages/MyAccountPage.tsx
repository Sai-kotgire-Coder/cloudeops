import { UserCircle2, Crown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
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
            </div>
          </div>

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
