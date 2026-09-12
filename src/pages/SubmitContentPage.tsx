import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocsMarkdown } from '@/components/docs/DocsMarkdown';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { toast } from 'sonner';

type SubmissionType = 'documentation' | 'research_paper' | 'blog';

export default function SubmitContentPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SubmissionType>('documentation');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.submitCommunityContent({ title, type, summary, content, externalUrl: externalUrl || undefined });
      toast.success('Submitted for review', {
        description: "An admin will review it before it's published to everyone."
      });
      navigate('/docs/community/mine');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 shrink-0">
        <PenSquare className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg sm:text-xl">Submit Content</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Share documentation, research, or a blog post with the community</p>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <DocsSidebar />
        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Your submission is reviewed by an admin before it's visible to anyone else. You'll see its status on{' '}
            <span className="font-medium text-foreground">My Submissions</span>.
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required placeholder="A clear, descriptive title" />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as SubmissionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="research_paper">Research Paper</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={500}
              required
              rows={2}
              placeholder="A short one or two sentence summary shown in the library listing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalUrl">External link (optional)</Label>
            <Input
              id="externalUrl"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://... (a paper, an external blog post, a repo)"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
            {showPreview ? (
              <div className="rounded-lg border border-border bg-card p-4 min-h-[300px]">
                {content ? <DocsMarkdown content={content} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
              </div>
            ) : (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={20000}
                required
                rows={16}
                className="font-mono text-sm"
                placeholder={'# Your title\n\nWrite your documentation, paper summary, or blog post here using Markdown...'}
              />
            )}
          </div>

          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenSquare className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit for review'}
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}
