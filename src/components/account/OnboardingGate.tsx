import { useEffect, useState, type ReactNode } from 'react';
import { Rocket, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfileStore } from '@/store/profileStore';
import { PersonalInfoForm } from '@/components/account/PersonalInfoForm';
import { ModuleSelector } from '@/components/account/ModuleSelector';
import type { ProfileFields } from '@/store/profileStore';

interface OnboardingGateProps {
  children: ReactNode;
}

const HydrationSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

// Mandatory first-run screen for brand-new registrations (onboardingComplete
// starts false only for accounts created via /auth/register after this
// feature shipped -- every pre-existing account defaults to true and never
// sees this). Renders instead of the whole app shell until submitted, so
// there's no way to reach a Lab page with zero modules selected.
export const OnboardingGate = ({ children }: OnboardingGateProps) => {
  const hydrated = useProfileStore((s) => s.hydrated);
  const onboardingComplete = useProfileStore((s) => s.onboardingComplete);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const timer = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, [hydrated]);

  // Wait for the profile fetch to land before mounting anything stateful.
  // authStore flips isLoading to false (letting the app shell start
  // rendering) before it finishes awaiting hydrateUserData(), so without this
  // guard, both the wizard below and My Account's form would seed their
  // local editable state from this store's pre-fetch defaults at mount time
  // and never pick up the real values once the fetch actually resolves.
  // Bounded by a timeout so a slow/failed fetch degrades to "show the app"
  // rather than an indefinite blank screen.
  if (!hydrated && !timedOut) return <HydrationSpinner />;
  if (onboardingComplete) return <>{children}</>;
  return <OnboardingWizard />;
};

// A separate component so its useState calls only ever run for the first
// time after the guard above has confirmed the store holds real data.
const OnboardingWizard = () => {
  const {
    fullName, phone, linkedinUrl, instagramHandle, dateOfBirth, institute, occupation,
    selectedModules: savedModules, completeOnboarding,
  } = useProfileStore();

  const [fields, setFields] = useState<ProfileFields>({
    fullName, phone, linkedinUrl, instagramHandle, dateOfBirth, institute, occupation,
  });
  const [modules, setModules] = useState<string[]>(savedModules);
  const [submitting, setSubmitting] = useState(false);

  const toggleModule = (id: string) =>
    setModules((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const handleFinish = async () => {
    setSubmitting(true);
    await completeOnboarding(fields, modules);
    setSubmitting(false);
  };

  return (
    <div className="h-screen overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2 pt-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <PartyPopper className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to CloudOps Simulator</h1>
          <p className="text-muted-foreground">
            Tell us a bit about yourself and pick the modules you want to start with — you can change either any time from My Account.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Personal Information</h2>
          <PersonalInfoForm
            initial={fields}
            onChange={setFields}
            hideSubmit
          />
          <p className="text-xs text-muted-foreground italic">
            Optional — fill in what you're comfortable sharing. You can always update this later.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Choose your modules</h2>
          <ModuleSelector selectedModules={modules} onToggle={toggleModule} />
        </div>

        <div className="flex items-center justify-between pb-8">
          <p className="text-sm text-muted-foreground">
            {modules.length === 0
              ? 'Pick at least one module to get started.'
              : `${modules.length} module${modules.length === 1 ? '' : 's'} selected.`}
          </p>
          <Button onClick={handleFinish} disabled={modules.length === 0 || submitting} size="lg" className="gap-2">
            <Rocket className="w-4 h-4" />
            {submitting ? 'Setting up...' : 'Finish Setup'}
          </Button>
        </div>
      </div>
    </div>
  );
};
