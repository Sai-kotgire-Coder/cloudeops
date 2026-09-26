import { useEffect, useState } from 'react';
import { Send, Loader2, Check, FileEdit, Clock, CalendarClock, X } from 'lucide-react';
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
import { EMAIL_TEMPLATES, CUSTOM_TEMPLATE_ID } from '@/data/emailTemplates';
import { UsersTable } from './UsersTable';
import type { AdminStatsData } from './AdminStats';

interface ScheduledJob {
  id: string;
  subject: string;
  target: string;
  sendAt: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
}

type Target = 'all' | 'inactive' | 'pro' | 'free' | 'recent' | 'custom';

const TARGET_LABELS: Record<Target, string> = {
  all: 'All verified users',
  inactive: 'Inactive users only',
  pro: 'Pro users only',
  free: 'Free users only',
  recent: 'Recently joined',
  custom: 'Custom selection',
};

export const BroadcastEmailPanel = ({ stats }: { stats: AdminStatsData | null }) => {
  const [templateId, setTemplateId] = useState<string>(CUSTOM_TEMPLATE_ID);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [recentDays, setRecentDays] = useState(7);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [sendAt, setSendAt] = useState('');
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const loadJobs = () => {
    setLoadingJobs(true);
    apiClient
      .getScheduledBroadcasts()
      .then((data) => setJobs(data.jobs))
      .catch(() => {}) // non-critical -- the send form still works without this list
      .finally(() => setLoadingJobs(false));
  };

  useEffect(loadJobs, []);

  const handleCancelJob = async (id: string) => {
    try {
      await apiClient.cancelScheduledBroadcast(id);
      toast.success('Scheduled broadcast cancelled');
      loadJobs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const handleSelectTemplate = (id: string) => {
    setTemplateId(id);
    if (id === CUSTOM_TEMPLATE_ID) {
      setSubject('');
      setMessage('');
      return;
    }
    const template = EMAIL_TEMPLATES.find((t) => t.id === id);
    if (template) {
      setSubject(template.subject);
      setMessage(template.message);
    }
  };

  // "recent" is estimated from the same 14-day signups histogram the
  // Overview tab already charts -- exact if recentDays <= 14, a lower
  // bound (labelled as such below) otherwise, rather than adding a new
  // endpoint just for a preview count.
  const recentCountIsExact = recentDays <= 14;
  const recentCount = stats
    ? stats.signups.slice(Math.max(0, stats.signups.length - recentDays)).reduce((sum, d) => sum + d.count, 0)
    : null;

  const targetCount = stats
    ? {
        all: stats.verifiedUsers,
        inactive: stats.inactiveUsers,
        pro: stats.proUsers,
        free: stats.freeUsers,
        recent: recentCount,
        custom: selectedIds.size,
      }[target]
    : target === 'custom'
      ? selectedIds.size
      : null;

  const sendAtDate = sendAt ? new Date(sendAt) : null;
  const scheduleIsValid = !scheduleForLater || (sendAtDate !== null && sendAtDate.getTime() > Date.now());

  const canSend =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    (target !== 'custom' || selectedIds.size > 0) &&
    scheduleIsValid;

  const handleSend = async () => {
    setSending(true);
    try {
      const result = await apiClient.sendBroadcastEmail({
        subject: subject.trim(),
        message: message.trim(),
        target,
        ...(target === 'recent' && { recentDays }),
        ...(target === 'custom' && { userIds: Array.from(selectedIds) }),
        ...(scheduleForLater && sendAtDate && { sendAt: sendAtDate.toISOString() }),
      });
      toast.success(result.message);
      setSubject('');
      setMessage('');
      setTemplateId(CUSTOM_TEMPLATE_ID);
      setSelectedIds(new Set());
      setScheduleForLater(false);
      setSendAt('');
      setConfirmOpen(false);
      if (scheduleForLater) loadJobs();
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
        {targetCount !== null && target !== 'custom' && (
          <p className="text-xs text-muted-foreground">
            {target === 'recent' && !recentCountIsExact ? 'at least ' : '~'}
            {targetCount} recipient{targetCount === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {target === 'recent' && (
        <div className="space-y-1.5">
          <Label htmlFor="broadcast-recent-days">Joined within the last</Label>
          <div className="flex items-center gap-2">
            <Input
              id="broadcast-recent-days"
              type="number"
              min={1}
              max={365}
              value={recentDays}
              onChange={(e) => setRecentDays(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 1)))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">day{recentDays === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}

      {target === 'custom' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Pick recipients</Label>
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          </div>
          <div className="border border-border rounded-lg p-3 max-h-96 overflow-y-auto">
            <UsersTable selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Template</Label>
        <p className="text-xs text-muted-foreground -mt-1 mb-1">
          Pick a starting point, or write your own from scratch -- either way you can edit before sending.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSelectTemplate(CUSTOM_TEMPLATE_ID)}
            className={`text-left rounded-lg border p-3 transition-colors ${
              templateId === CUSTOM_TEMPLATE_ID
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5" />
                Custom
              </span>
              {templateId === CUSTOM_TEMPLATE_ID && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Write your own message from a blank draft</p>
          </button>
          {EMAIL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTemplate(t.id)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                templateId === t.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{t.label}</span>
                {templateId === t.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
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
          Sent in the branded CloudOps email design -- no need to write HTML. Wrap text in **double asterisks** to make it bold.
        </p>
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setScheduleForLater((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Clock className="w-3.5 h-3.5" />
          {scheduleForLater ? 'Sending later — switch to send now' : 'Send now — click to schedule for later instead'}
        </button>
        {scheduleForLater && (
          <Input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            className="w-64"
          />
        )}
      </div>

      <Button onClick={() => setConfirmOpen(true)} disabled={!canSend} className="gap-2">
        {scheduleForLater ? <CalendarClock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        {scheduleForLater ? 'Schedule Notification' : 'Send Notification'}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{scheduleForLater ? 'Schedule this email?' : 'Send this email now?'}</AlertDialogTitle>
            <AlertDialogDescription>
              This will email{' '}
              <strong>
                {target === 'recent'
                  ? `users who joined in the last ${recentDays} day${recentDays === 1 ? '' : 's'}`
                  : target === 'custom'
                    ? `${selectedIds.size} hand-picked user${selectedIds.size === 1 ? '' : 's'}`
                    : TARGET_LABELS[target].toLowerCase()}
              </strong>
              {targetCount !== null && target !== 'custom' ? ` (${recentCountIsExact || target !== 'recent' ? '~' : 'at least '}${targetCount} people)` : ''} with the subject "{subject}".{' '}
              {scheduleForLater && sendAtDate
                ? `It will send at ${sendAtDate.toLocaleString()}.`
                : `This can't be recalled once sent.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleSend(); }} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? (scheduleForLater ? 'Scheduling...' : 'Sending...') : (scheduleForLater ? 'Yes, schedule it' : 'Yes, send it')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="pt-4 border-t border-border space-y-2">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-muted-foreground" />
          Scheduled sends
        </p>
        {loadingJobs ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : jobs.filter((j) => j.status === 'pending').length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing queued.</p>
        ) : (
          <div className="space-y-2">
            {jobs.filter((j) => j.status === 'pending').map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{j.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    To {TARGET_LABELS[j.target as Target] ?? j.target} &middot; {new Date(j.sendAt).toLocaleString()}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="shrink-0" onClick={() => handleCancelJob(j.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
