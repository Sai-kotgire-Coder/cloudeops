import { useState } from 'react';
import { Send, Loader2, Check, FileEdit } from 'lucide-react';
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
import type { AdminStatsData } from './AdminStats';

type Target = 'all' | 'inactive' | 'pro' | 'free';

const TARGET_LABELS: Record<Target, string> = {
  all: 'All verified users',
  inactive: 'Inactive users only',
  pro: 'Pro users only',
  free: 'Free users only',
};

export const BroadcastEmailPanel = ({ stats }: { stats: AdminStatsData | null }) => {
  const [templateId, setTemplateId] = useState<string>(CUSTOM_TEMPLATE_ID);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

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
      setTemplateId(CUSTOM_TEMPLATE_ID);
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
