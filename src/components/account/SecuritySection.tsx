import { useState } from 'react';
import { KeyRound, Check, ShieldOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

// A change-password/logout-all response includes a fresh token for THIS
// session (the backend bumps tokenVersion, which revokes every other
// already-issued token) -- without swapping it in here, this tab's own next
// request would immediately fail as "unauthorized" too.
function applyRefreshedToken(token: string) {
  localStorage.setItem('auth_token', token);
  useAuthStore.setState({ token });
}

export const SecuritySection = () => {
  const hasPassword = useAuthStore((s) => s.user?.hasPassword ?? true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Contains uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
    { label: 'Contains lowercase letter (a-z)', met: /[a-z]/.test(newPassword) },
    { label: 'Contains digit (0-9)', met: /[0-9]/.test(newPassword) },
    { label: 'Contains special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordRequirements.every((r) => r.met)) {
      setError('Please meet all password requirements below');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const { token } = await apiClient.changePassword(hasPassword ? currentPassword : undefined, newPassword);
      applyRefreshedToken(token);
      toast.success(hasPassword ? 'Password changed' : 'Password set', {
        description: hasPassword ? 'Every other signed-in device has been logged out.' : 'You can now also sign in with this password, not just Google.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      const { token } = await apiClient.logoutAllDevices();
      applyRefreshedToken(token);
      toast.success('Logged out of all other devices');
    } catch (err: any) {
      toast.error(err.message || 'Failed to log out other sessions');
    } finally {
      setLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleChangePassword} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!hasPassword && (
          <p className="text-xs text-muted-foreground -mt-1">
            Your account currently signs in with Google only. Set a password below to also enable email/password sign-in.
          </p>
        )}

        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={saving}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={saving}
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword">Confirm new password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={saving}
              minLength={8}
            />
          </div>
        </div>

        {newPassword && (
          <div className="space-y-1">
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-2 text-sm ${
                  req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                <Check className={`h-3 w-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                {req.label}
              </div>
            ))}
          </div>
        )}

        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {saving ? 'Saving...' : hasPassword ? 'Change Password' : 'Set Password'}
        </Button>
      </form>

      <div className="pt-4 border-t border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium">Log out of all other devices</p>
          <p className="text-xs text-muted-foreground">
            Ends every session except this one — useful if you suspect unauthorized access.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogoutAll}
          disabled={loggingOutAll}
          className="gap-2 shrink-0"
        >
          <ShieldOff className="w-4 h-4" />
          {loggingOutAll ? 'Logging out...' : 'Log Out Other Devices'}
        </Button>
      </div>
    </div>
  );
};
