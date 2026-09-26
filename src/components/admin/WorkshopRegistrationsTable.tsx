import { useEffect, useState } from 'react';
import { Loader2, Download, ChevronLeft, ChevronRight, Link2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { apiClient, type AdminWorkshop } from '@/lib/apiClient';
import { toast } from 'sonner';

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  userId: string | null;
  workshopTitle: string;
  createdAt: string;
}

export const WorkshopRegistrationsTable = () => {
  const [rows, setRows] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [linkedCount, setLinkedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [workshopId, setWorkshopId] = useState<string>('all');

  useEffect(() => {
    apiClient.getAdminWorkshops().then((data) => setWorkshops(data.workshops)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getAdminWorkshopRegistrations(page, workshopId === 'all' ? undefined : workshopId)
      .then((data) => {
        setRows(data.registrations);
        setTotal(data.total);
        setLinkedCount(data.linkedCount);
        setTotalPages(data.totalPages);
      })
      .catch((err) => toast.error(err.message || 'Failed to load workshop registrations'))
      .finally(() => setLoading(false));
  }, [page, workshopId]);

  useEffect(() => setPage(1), [workshopId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await apiClient.exportWorkshopRegistrationsCsv(workshopId === 'all' ? undefined : workshopId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to export registrations');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={workshopId} onValueChange={setWorkshopId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="All workshops" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workshops</SelectItem>
              {workshops.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span> registered &middot;{' '}
            <span className="font-semibold text-foreground">{linkedCount}</span> with a CloudOps account
          </p>
        </div>
        <Button variant="outline" className="gap-1.5" disabled={exporting} onClick={handleExport}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Workshop</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No one has registered yet.
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-sm">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.workshopTitle}</TableCell>
                <TableCell className="text-sm flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {r.email}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.phone || '—'}</TableCell>
                <TableCell>
                  {r.userId ? (
                    <Badge variant="default" className="gap-1"><Link2 className="w-3 h-3" /> Linked</Badge>
                  ) : (
                    <Badge variant="secondary">No account</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
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
