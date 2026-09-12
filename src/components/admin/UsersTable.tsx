import { useEffect, useState } from 'react';
import { Search, Loader2, Crown, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { apiClient } from '@/lib/apiClient';
import { MODULE_CATALOG } from '@/data/moduleCatalog';
import { UserDetailDrawer } from './UserDetailDrawer';
import { toast } from 'sonner';

interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  isVerified: boolean;
  isPro: boolean;
  createdAt: string;
  selectedModules: string[];
  lastActiveAt: string | null;
  isActive: boolean;
  resourceCounts: Record<string, number>;
}

export const UsersTable = () => {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState<string>('all');
  const [activity, setActivity] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiClient
      .getAdminUsers({
        search: search || undefined,
        plan: plan === 'all' ? undefined : plan,
        activity: activity === 'all' ? undefined : activity,
        module: moduleFilter === 'all' ? undefined : moduleFilter,
        page,
        limit: 25,
      })
      .then((data) => {
        setRows(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch((err) => toast.error(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 300); // debounce search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, plan, activity, moduleFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, plan, activity, moduleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="sm:w-36"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activity} onValueChange={setActivity}>
          <SelectTrigger className="sm:w-36"><SelectValue placeholder="Activity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Module" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any module</SelectItem>
            {MODULE_CATALOG.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users match these filters.
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.map((u) => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUserId(u.id)}>
                <TableCell>
                  <p className="font-medium text-sm">{u.fullName || u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isPro ? 'default' : 'secondary'} className="gap-1">
                    {u.isPro ? <Crown className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {u.isPro ? 'Pro' : 'Free'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{u.selectedModules.length}</TableCell>
                <TableCell>
                  <span className={`text-xs ${u.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : 'Never'}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} total user{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button size="icon" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onPlanChanged={load}
      />
    </div>
  );
};
