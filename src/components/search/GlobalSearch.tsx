import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FlaskConical, Newspaper } from 'lucide-react';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import { MODULE_CATALOG } from '@/data/moduleCatalog';
import { DOCS_CATALOG } from '@/data/docsCatalog';
import { apiClient } from '@/lib/apiClient';

const SUBMISSION_TYPE_ICON: Record<string, typeof FileText> = {
  documentation: FileText,
  research_paper: FlaskConical,
  blog: Newspaper,
};

interface SubmissionHit { id: string; title: string; type: string; summary: string }

// Mounted once, globally (see App.tsx) -- owns its own open state and the
// Cmd/Ctrl+K shortcut, so any page can trigger it without prop-drilling.
// Module/docs matches are pure client-side filtering over data already in
// memory (cmdk's own fuzzy match on CommandInput); community submissions
// are the one thing that needs a server round-trip (see apiClient.search),
// debounced so it doesn't fire on every keystroke.
export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [submissionHits, setSubmissionHits] = useState<SubmissionHit[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    // A sidebar button can't reach this component's state directly (it's
    // mounted once, high up in App.tsx) -- this event is that button's way
    // of opening it without lifting state into a store just for this.
    const openHandler = () => setOpen(true);
    document.addEventListener('keydown', handler);
    window.addEventListener('open-global-search', openHandler);
    return () => {
      document.removeEventListener('keydown', handler);
      window.removeEventListener('open-global-search', openHandler);
    };
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSubmissionHits([]);
      return;
    }
    const timer = setTimeout(() => {
      apiClient.search(query.trim()).then((data) => setSubmissionHits(data.submissions)).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search modules, docs, and community library..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Modules">
          {MODULE_CATALOG.map((m) => (
            <CommandItem key={m.id} value={`${m.title} ${m.description}`} onSelect={() => go(m.url)}>
              <m.icon className="mr-2 h-4 w-4" />
              {m.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Documentation">
          {DOCS_CATALOG.map((d) => (
            <CommandItem key={d.id} value={`${d.title} ${d.description}`} onSelect={() => go(`/docs/${d.id}`)}>
              <d.icon className="mr-2 h-4 w-4" />
              {d.title}
            </CommandItem>
          ))}
        </CommandGroup>
        {submissionHits.length > 0 && (
          <CommandGroup heading="Community Library">
            {submissionHits.map((s) => {
              const Icon = SUBMISSION_TYPE_ICON[s.type] ?? FileText;
              return (
                // value is the searched-against text for cmdk's own client-side
                // filter -- these hits are already server-filtered by query, so
                // this must be text the current query actually matches (the
                // title), not an opaque id, or cmdk's filter would hide them.
                <CommandItem key={s.id} value={s.title} onSelect={() => go('/docs/community')}>
                  <Icon className="mr-2 h-4 w-4" />
                  {s.title}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
