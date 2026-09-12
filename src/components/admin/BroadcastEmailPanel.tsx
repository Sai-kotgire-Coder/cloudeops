import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import type { AdminStatsData } from './AdminStats';

type Target = 'all' | 'inactive' | 'pro' | 'free';

const TARGET_LABELS: Record<Target, string> = {
  all: 'All verified users',
  inactive: 'Inactive users only',
  pro: 'Pro users only',
  free: 'Free users only',
};

export const BroadcastEmailPanel = ({ stats }: { stats: AdminStatsData | null }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const targetCount = stats
    ? { all: stats.verifiedUsers, inactive: stats.inactiveUsers, pro: stats.proUsers, free: stats.freeUsers }[target]
    : null;

  const canSend = subject.trim().length > 0 && message.trim().length > 0;

  const handleSend = async () => {
    setSending(true);
    try {
      const result = await apiClient.sendBroadcastEmail(subject.trim(), message.trim(), target);
      toast.success(result.message);
      setSubject('');
      setMessage('');
      setConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="broadcast-target">Send to</Label>
        <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
          <SelectTrigger id="broadcast-target" className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TARGET_LABELS) as Target[]).map((t) => (
              <SelectItem key={t} value={t}>{TARGET_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {targetCount !== null && (
          <p className="text-xs text-muted-foreground">~{targetCount} recipient{targetCount === 1 ? '' : 's'}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="broadcast-subject">Subject</Label>
        <Input
          id="broadcast-subject"
          placeholder="e.g. New labs just landed on CloudOps Simulator"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="broadcast-message">Message</Label>
        <Textarea
          id="broadcast-message"
          placeholder="Write your announcement here. Separate paragraphs with a blank line."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
        />
        <p className="text-xs text-muted-foreground">
          Sent as plain text wrapped in the CloudOps email template -- no need to write HTML.
        </p>
      </div>

      <Button onClick={() => setConfirmOpen(true)} disabled={!canSend} className="gap-2">
        <Send className="w-4 h-4" />
        Send Notification
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this email now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email <strong>{TARGET_LABELS[target].toLowerCase()}</strong>
              {targetCount !== null ? ` (~${targetCount} people)` : ''} with the subject "{subject}". This can't be
              recalled once sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleSend(); }} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Yes, send it'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
