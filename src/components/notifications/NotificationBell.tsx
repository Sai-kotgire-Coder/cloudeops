import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/apiClient';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// In-app notifications, distinct from the game/system "Alerts" bell already
// on the Dashboard's TopNavBar (CPU spikes, crashes, etc). This one lives in
// the sidebar footer so it's visible from every page, not just the
// dashboard, and covers account-level events -- currently, admin broadcasts.
export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    apiClient.getUnreadNotificationCount().then((r) => setUnreadCount(r.count)).catch(() => {});
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      apiClient.getNotifications().then((r) => setNotifications(r.notifications)).catch(() => {});
    }
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    apiClient.markNotificationRead(id).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    apiClient.markAllNotificationsRead().catch(() => {});
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-8 h-8" title="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <p className="text-sm font-semibold">Notifications</p>
          {notifications.some((n) => !n.isRead) && (
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={handleMarkAllRead}>
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className={n.isRead ? 'pl-3.5' : ''}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
