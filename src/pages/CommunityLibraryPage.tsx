import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library, FileText, FlaskConical, Newspaper, Loader2, ExternalLink, Plus } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DocsMarkdown } from '@/components/docs/DocsMarkdown';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { toast } from 'sonner';

interface Submission {
  id: string;
  title: string;
  type: 'documentation' | 'research_paper' | 'blog';
  summary: string;
  content: string;
  externalUrl: string | null;
  authorName: string;
  reviewedAt: string;
}

const TYPE_META: Record<string, { label: string; icon: typeof FileText }> = {
  documentation: { label: 'Documentation', icon: FileText },
  research_paper: { label: 'Research Paper', icon: FlaskConical },
  blog: { label: 'Blog', icon: Newspaper }
};

export default function CommunityLibraryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = (type?: string) => {
    setLoading(true);
    apiClient
      .getCommunitySubmissions(type ? { type } : {})
      .then((data) => setSubmissions(data.submissions))
      .catch((err) => toast.error(err.message || 'Failed to load community library'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(filter), [filter]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const full = await apiClient.getCommunitySubmission(id);
      setSelected(full);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load submission');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <Library className="w-6 h-6 text-primary" />
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-lg sm:text-xl">Community Library</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Docs, research, and blogs submitted by the community</p>
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
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            {[undefined, 'documentation', 'research_paper', 'blog'].map((t) => (
              <Button
                key={t ?? 'all'}
                size="sm"
                variant={filter === t ? 'default' : 'outline'}
                onClick={() => setFilter(t)}
              >
                {t ? TYPE_META[t].label : 'All'}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border">
              <Library className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nothing published here yet -- be the first to submit something.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => {
                const meta = TYPE_META[s.type];
                return (
                  <button
                    key={s.id}
                    onClick={() => openDetail(s.id)}
                    className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="gap-1">
                            <meta.icon className="w-3 h-3" />
                            {meta.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold truncate">{s.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{s.summary}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          by {s.authorName} · {new Date(s.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      <Dialog open={!!selected || detailLoading} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailLoading || !selected ? (
            <div className="flex items-center justify-center py-16">
              {/* DialogContent must always have a DialogTitle in the DOM
                  for screen readers, even while the real title is still
                  loading -- visually hidden here, replaced by the real
                  (visible) one below once the fetch resolves. */}
              <DialogTitle className="sr-only">Loading submission</DialogTitle>
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="gap-1">
                  {(() => {
                    const Icon = TYPE_META[selected.type].icon;
                    return <Icon className="w-3 h-3" />;
                  })()}
                  {TYPE_META[selected.type].label}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold mb-1">{selected.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mb-4">
                by {selected.authorName} · {new Date(selected.reviewedAt).toLocaleDateString()}
              </p>
              {selected.externalUrl && (
                <a
                  href={selected.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
                >
                  View external link
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <DocsMarkdown content={selected.content} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
