import { useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { BookOpen, ExternalLink } from 'lucide-react';
import { DOCS_CATALOG, getDocEntry, PROGRESS_TRACKED_MODULE_IDS } from '@/data/docsCatalog';
import { MODULE_CATALOG } from '@/data/moduleCatalog';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsMarkdown } from '@/components/docs/DocsMarkdown';
import { ModuleLiveStats } from '@/components/docs/ModuleLiveStats';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProgressStore } from '@/store/progressStore';

// Vite bundles every doc's raw markdown text at build time, keyed by its
// file path -- no async fetching needed for content that ships with the app.
const DOC_FILES = import.meta.glob('/src/docs/content/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

function getDocContent(id: string): string | undefined {
  return DOC_FILES[`/src/docs/content/${id}.md`];
}

export default function DocsPage() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const fetchSummary = useProgressStore((s) => s.fetchSummary);
  const summary = useProgressStore((s) => s.summary);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (!docId) {
    return <Navigate to={`/docs/${DOCS_CATALOG[0].id}`} replace />;
  }

  const entry = getDocEntry(docId);
  const content = getDocContent(docId);

  if (!entry || !content) {
    return <Navigate to={`/docs/${DOCS_CATALOG[0].id}`} replace />;
  }

  const moduleProgress = entry.moduleId && PROGRESS_TRACKED_MODULE_IDS.has(entry.moduleId)
    ? summary.find((s) => s.module === entry.moduleId)
    : undefined;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <BookOpen className="w-6 h-6 text-primary" />
        <div className="min-w-0">
          <h1 className="font-bold text-lg sm:text-xl truncate">Documentation</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Deep guides for every module, written for beginners and intermediates</p>
        </div>

        {/* Mobile doc picker -- the sidebar is hidden below md */}
        <div className="ml-auto md:hidden">
          <Select value={docId} onValueChange={(v) => navigate(`/docs/${v}`)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCS_CATALOG.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <DocsSidebar />

        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <entry.icon className="w-7 h-7 text-primary shrink-0" />
                <h2 className="text-2xl font-bold">{entry.title}</h2>
              </div>
              {entry.moduleId && (
                <Button asChild size="sm" className="gap-2 shrink-0">
                  <Link to={MODULE_CATALOG.find((m) => m.id === entry.moduleId)?.url ?? '/'}>
                    Open Module
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">{entry.description}</p>

            {moduleProgress && (
              <div className="rounded-lg border border-border bg-card p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your progress in this module</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {Math.min(moduleProgress.current, moduleProgress.target)}/{moduleProgress.target}
                    {moduleProgress.completed && ' -- completed!'}
                  </p>
                </div>
                <Progress value={Math.min(100, (moduleProgress.current / moduleProgress.target) * 100)} />
              </div>
            )}

            {entry.moduleId && (
              <div className="mb-8">
                <ModuleLiveStats moduleId={entry.moduleId} />
              </div>
            )}

            <DocsMarkdown content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
