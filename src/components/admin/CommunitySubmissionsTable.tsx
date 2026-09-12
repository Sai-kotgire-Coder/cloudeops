import { useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DocsMarkdown } from '@/components/docs/DocsMarkdown';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface Submission {
  id: string;
  title: string;
  type: string;
  summary: string;
  content: string;
  externalUrl: string | null;
  status: string;
  authorEmail: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  documentation: 'Documentation',
  research_paper: 'Research Paper',
  blog: 'Blog'
};

export const CommunitySubmissionsTable = () => {
  const [status, setStatus] = useState('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient
      .getAdminSubmissions({ status })
      .then((data) => setSubmissions(data.submissions))
      .catch((err) => toast.error(err.message || 'Failed to load submissions'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const handleReview = async (id: string, reviewStatus: 'approved' | 'rejected', reviewNote?: string) => {
    setActing(true);
    try {
      await apiClient.reviewSubmission(id, reviewStatus, reviewNote);
      toast.success(reviewStatus === 'approved' ? 'Submission approved and broadcast to all users' : 'Submission rejected');
      setReviewing(null);
      setShowRejectForm(false);
      setRejectNote('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to review submission');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 rounded-xl border border-dashed border-border">
          No {status} submissions.
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{TYPE_LABEL[s.type] ?? s.type}</Badge>
                    <span className="text-xs text-muted-foreground">by {s.authorEmail}</span>
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.summary}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setReviewing(s)}>
                    Review
                  </Button>
                  {status === 'pending' && (
                    <>
                      <Button size="sm" className="gap-1.5" disabled={acting} onClick={() => handleReview(s.id, 'approved')}>
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5"
                        disabled={acting}
                        onClick={() => {
                          setReviewing(s);
                          setShowRejectForm(true);
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!reviewing}
        onOpenChange={(open) => {
          if (!open) {
            setReviewing(null);
            setShowRejectForm(false);
            setRejectNote('');
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {reviewing && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{TYPE_LABEL[reviewing.type] ?? reviewing.type}</Badge>
                <span className="text-xs text-muted-foreground">by {reviewing.authorEmail}</span>
              </div>
              <DialogTitle className="text-xl font-bold mb-4">{reviewing.title}</DialogTitle>
              {reviewing.externalUrl && (
                <p className="text-sm mb-4">
                  External link: <a href={reviewing.externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{reviewing.externalUrl}</a>
                </p>
              )}
              <DocsMarkdown content={reviewing.content} />

              {status === 'pending' && (
                <div className="mt-6 pt-4 border-t border-border space-y-3">
                  {showRejectForm ? (
                    <>
                      <Textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Optional note explaining why this was rejected (visible to the author)"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button variant="destructive" disabled={acting} onClick={() => handleReview(reviewing.id, 'rejected', rejectNote)}>
                          Confirm rejection
                        </Button>
                        <Button variant="outline" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button className="gap-1.5" disabled={acting} onClick={() => handleReview(reviewing.id, 'approved')}>
                        <Check className="w-4 h-4" />
                        Approve &amp; broadcast to all users
                      </Button>
                      <Button variant="destructive" className="gap-1.5" onClick={() => setShowRejectForm(true)}>
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
