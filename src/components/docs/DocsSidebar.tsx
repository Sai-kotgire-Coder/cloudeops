import { NavLink } from 'react-router-dom';
import { DOCS_CATALOG, DOC_GROUPS } from '@/data/docsCatalog';
import { cn } from '@/lib/utils';

export const DocsSidebar = () => {
  return (
    <nav className="w-64 shrink-0 border-r border-border bg-card h-full overflow-y-auto hidden md:block">
      <div className="p-4 space-y-6">
        {DOC_GROUPS.map((group) => {
          const entries = DOCS_CATALOG.filter((d) => d.group === group);
          if (entries.length === 0) return null;
          return (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">{group}</p>
              <div className="space-y-0.5">
                {entries.map((entry) => (
                  <NavLink
                    key={entry.id}
                    to={`/docs/${entry.id}`}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    <entry.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{entry.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
