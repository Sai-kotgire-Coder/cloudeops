import { useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Crown, ShieldOff, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: any; className: string }> = {
  grant_pro: { label: 'Granted Pro', icon: Crown, className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  revoke_pro: { label: 'Revoked Pro', icon: ShieldOff, className: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
  broadcast_email: { label: 'Sent Broadcast', icon: Send, className: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  approve_submission: { label: 'Approved Submission', icon: CheckCircle2, className: 'bg-green-500/10 text-green-600 border-green-500/30' },
  reject_submission: { label: 'Rejected Submission', icon: XCircle, className: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

function describeEntry(entry: AuditEntry): string {
  if (entry.action === 'broadcast_email') {
    const m = entry.metadata || {};
    return `"${m.subject}" to ${m.target} (${m.sent}/${m.recipientCount} sent)`;
  }
  if (entry.action === 'grant_pro' || entry.action === 'revoke_pro') {
    return entry.metadata?.targetEmail || entry.targetId || '';
  }
  if (entry.action === 'approve_submission' || entry.action === 'reject_submission') {
    return entry.metadata?.title || entry.targetId || '';
  }
  return '';
}

export const AuditLogTable = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminAuditLog(page)
      .then((data) => {
        setEntries(data.entries);
        setTotalPages(data.totalPages);
      })
      .catch((err) => toast.error(err.message || 'Failed to load audit log'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No admin actions logged yet.
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.map((e) => {
              const meta = ACTION_META[e.action] ?? { label: e.action, icon: Send, className: '' };
              const Icon = meta.icon;
              return (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{e.actorEmail}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {describeEntry(e)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
        <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span>Page {page} of {totalPages}</span>
        <Button size="icon" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
