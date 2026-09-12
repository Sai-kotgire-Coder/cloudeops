import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileStack, Loader2, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { toast } from 'sonner';

interface MySubmission {
  id: string;
  title: string;
  type: string;
  summary: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  createdAt: string;
}

const STATUS_META = {
  pending: { label: 'Pending review', icon: Clock, className: 'text-amber-600 bg-amber-500/10' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'text-green-600 bg-green-500/10' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'text-red-600 bg-red-500/10' }
};

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getMyCommunitySubmissions()
      .then((data) => setSubmissions(data.submissions))
      .catch((err) => toast.error(err.message || 'Failed to load your submissions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <FileStack className="w-6 h-6 text-primary" />
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-lg sm:text-xl">My Submissions</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Everything you've submitted to the community library</p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link to="/docs/community/submit">
            <Plus className="w-4 h-4" />
            Submit
          </Link>
        </Button>
      </header>

      <div className="flex-1 flex min-h-0">
        <DocsSidebar />
        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border">
              <FileStack className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">You haven't submitted anything yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => {
                const meta = STATUS_META[s.status];
                return (
                  <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold">{s.title}</h3>
                      <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${meta.className}`}>
                        <meta.icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{s.summary}</p>
                    {s.status === 'rejected' && s.reviewNote && (
                      <div className="mt-2 rounded-md bg-red-500/5 border border-red-500/20 px-3 py-2 text-xs text-red-600">
                        <span className="font-medium">Admin note:</span> {s.reviewNote}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Submitted {new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
