import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, TriangleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

export const DangerZoneSection = () => {
  const navigate = useNavigate();
  const hasPassword = useAuthStore((s) => s.user?.hasPassword ?? true);
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiClient.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cloudops-data-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Your data export has started downloading');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const canDelete = (hasPassword ? password.length > 0 : true) && confirmText === 'DELETE';

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await apiClient.deleteAccount(hasPassword ? password : undefined);
      toast.success('Account deleted');
      useAuthStore.getState().logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium">Export your data</p>
          <p className="text-xs text-muted-foreground">
            Download a JSON file of everything tied to your account.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleExport} disabled={exporting} className="gap-2 shrink-0">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Preparing...' : 'Export My Data'}
        </Button>
      </div>

      <div className="pt-4 border-t border-destructive/20 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-destructive">Delete account</p>
          <p className="text-xs text-muted-foreground">
            Permanently deletes your account and everything in it. This cannot be undone.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
          className="gap-2 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPassword('');
            setConfirmText('');
            setError('');
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account, applications, instances, pipelines, tickets, and every
              lab workspace. There is no way to recover this data afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This action is irreversible.</span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-3">
            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="deletePassword">Enter your password</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={deleting}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="deleteConfirmText">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={deleting}
                autoComplete="off"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!canDelete || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Permanently Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
