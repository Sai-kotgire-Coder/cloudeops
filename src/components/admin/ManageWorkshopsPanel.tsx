import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Globe, MapPin, Users, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient, type AdminWorkshop } from '@/lib/apiClient';
import { toast } from 'sonner';

interface FormState {
  title: string;
  summary: string;
  highlightsText: string; // one bullet per line, split on submit
  location: string;
  isOnline: boolean;
  startLocal: string; // datetime-local value, interpreted in the admin's own browser timezone
  durationHours: number;
  dailyCount: number;
  isPublished: boolean;
}

const EMPTY_FORM: FormState = {
  title: '',
  summary: '',
  highlightsText: '',
  location: '',
  isOnline: true,
  startLocal: '',
  durationHours: 2,
  dailyCount: 1,
  isPublished: false,
};

function workshopToForm(w: AdminWorkshop): FormState {
  const start = new Date(w.startAt);
  const end = new Date(w.endAt);
  const durationHours = Math.max(0.5, (end.getTime() - start.getTime()) / (60 * 60 * 1000));
  // toISOString gives UTC; slicing to minute precision and trusting the
  // browser to render/parse datetime-local in its own local timezone is
  // the same round-trip used when the value was first created.
  const pad = (n: number) => String(n).padStart(2, '0');
  const startLocal = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;

  return {
    title: w.title,
    summary: w.summary,
    highlightsText: w.highlights.join('\n'),
    location: w.location,
    isOnline: w.isOnline,
    startLocal,
    durationHours: Math.round(durationHours * 4) / 4,
    dailyCount: w.dailyCount,
    isPublished: w.isPublished,
  };
}

function formatDateRange(startAt: string, dailyCount: number): string {
  const start = new Date(startAt);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (dailyCount <= 1) return start.toLocaleDateString(undefined, opts);
  const end = new Date(start);
  end.setDate(end.getDate() + (dailyCount - 1));
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

export const ManageWorkshopsPanel = () => {
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminWorkshop | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminWorkshop | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient
      .getAdminWorkshops()
      .then((data) => setWorkshops(data.workshops))
      .catch((err) => toast.error(err.message || 'Failed to load workshops'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (w: AdminWorkshop) => {
    setEditing(w);
    setForm(workshopToForm(w));
    setFormOpen(true);
  };

  const canSave = form.title.trim().length > 0 && form.summary.trim().length > 0 && form.location.trim().length > 0 && form.startLocal.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const startAt = new Date(form.startLocal);
      const endAt = new Date(startAt.getTime() + form.durationHours * 60 * 60 * 1000);
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        highlights: form.highlightsText.split('\n').map((h) => h.trim()).filter(Boolean),
        location: form.location.trim(),
        isOnline: form.isOnline,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        dailyCount: form.dailyCount,
        isPublished: form.isPublished,
      };

      if (editing) {
        await apiClient.updateWorkshop(editing.id, payload);
        toast.success('Workshop updated');
      } else {
        await apiClient.createWorkshop(payload);
        toast.success(payload.isPublished ? 'Workshop scheduled and published' : 'Workshop saved as draft');
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workshop');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (w: AdminWorkshop) => {
    try {
      await apiClient.updateWorkshop(w.id, { isPublished: !w.isPublished });
      toast.success(!w.isPublished ? 'Published to the public site' : 'Unpublished');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update workshop');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteWorkshop(deleteTarget.id);
      toast.success('Workshop deleted');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete workshop');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          The soonest published, not-yet-finished workshop is what shows on the landing page and <code className="text-xs">/workshop</code>.
        </p>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Workshop
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : workshops.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 rounded-xl border border-dashed border-border">
          No workshops scheduled yet.
        </p>
      ) : (
        <div className="space-y-3">
          {workshops.map((w) => (
            <div key={w.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={w.isPublished ? 'default' : 'secondary'}>{w.isPublished ? 'Published' : 'Draft'}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {formatDateRange(w.startAt, w.dailyCount)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {w.isOnline ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {w.isOnline ? 'Online' : 'In person'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {w._count.registrations} registered
                    </span>
                  </div>
                  <h3 className="font-semibold">{w.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{w.summary}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleTogglePublish(w)}>
                    {w.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(w)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(w)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit workshop' : 'Schedule a workshop'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-title">Title</Label>
              <Input id="ws-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Other Side of Software" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-summary">Summary</Label>
              <Textarea id="ws-summary" rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="One or two sentences shown on the landing page and in the confirmation email." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-highlights">What to expect (one per line)</Label>
              <Textarea id="ws-highlights" rows={3} value={form.highlightsText} onChange={(e) => setForm({ ...form, highlightsText: e.target.value })} placeholder={'Hands-on labs, not slides\nCareer guidance beyond SDE'} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Online</p>
                <p className="text-xs text-muted-foreground">Off = an in-person location instead of a video link</p>
              </div>
              <Switch checked={form.isOnline} onCheckedChange={(v) => setForm({ ...form, isOnline: v })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-location">{form.isOnline ? 'Meeting link' : 'Location'}</Label>
              <Input id="ws-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={form.isOnline ? 'https://meet.google.com/...' : 'Room / address'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ws-start">Start (first day)</Label>
                <Input id="ws-start" type="datetime-local" value={form.startLocal} onChange={(e) => setForm({ ...form, startLocal: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ws-duration">Duration (hours/day)</Label>
                <Input id="ws-duration" type="number" min={0.5} step={0.5} value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: Math.max(0.5, parseFloat(e.target.value) || 0.5) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-days">Number of consecutive days</Label>
              <Input id="ws-days" type="number" min={1} max={14} value={form.dailyCount} onChange={(e) => setForm({ ...form, dailyCount: Math.max(1, Math.min(14, parseInt(e.target.value, 10) || 1)) })} className="w-24" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">Live on the landing page and accepting registrations</p>
              </div>
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Save changes' : 'Schedule workshop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget._count.registrations > 0
                ? `This also deletes all ${deleteTarget._count.registrations} registration(s) for it. This can't be undone.`
                : "This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
