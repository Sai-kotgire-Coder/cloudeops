import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

// Renders documentation markdown with two things layered on top of plain
// prose: internal "app:" links become real client-side <Link> buttons
// (no full page reload) instead of dead anchors, and every heading/table/
// code block gets consistent typographic styling matching the rest of
// the app instead of react-markdown's unstyled defaults.
export const DocsMarkdown = ({ content }: { content: string }) => {
  return (
    <div className="docs-markdown max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // react-markdown's default sanitizer strips any URI scheme it
        // doesn't recognize (including our internal "app:" scheme) before
        // the custom `a` renderer below ever sees the href -- allow-list
        // "app:" through unchanged and defer everything else to the
        // default transform (which still blocks javascript: etc).
        urlTransform={(url) => (url.startsWith('app:') ? url : defaultUrlTransform(url))}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-8 mb-3 pb-2 border-b border-border">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-6 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-sm leading-relaxed text-foreground/90 mb-4">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-1.5 text-sm mb-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-foreground/90">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          code: ({ children, className }) => {
            // A fenced block (```) gets a className like "language-xxx" from
            // remark; an inline `code span` has no className -- style them
            // differently rather than both looking like inline code.
            if (className) {
              return <code className={className}>{children}</code>;
            }
            return <code className="px-1.5 py-0.5 rounded bg-muted text-primary text-[13px] font-mono">{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="bg-[#0f172a] border border-gray-700 rounded-lg p-4 overflow-x-auto mb-4 text-[13px] font-mono text-gray-200">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 bg-primary/5 rounded-r-lg px-4 py-3 mb-4 text-sm [&>p]:mb-0">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
          hr: () => <hr className="border-border my-6" />,
          a: ({ href, children }) => {
            if (href?.startsWith('app:')) {
              const to = href.slice('app:'.length);
              return (
                <Link
                  to={to}
                  className="inline-flex items-center gap-1 text-primary font-medium hover:underline underline-offset-2"
                >
                  {children}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-2">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
