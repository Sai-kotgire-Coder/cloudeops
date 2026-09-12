import { Zap, LogOut, User, Rocket, ShieldAlert, Trophy, Award, Gift, BookOpen } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { useProfileStore } from '@/store/profileStore';
import { MODULE_CATALOG } from '@/data/moduleCatalog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const upgradeSectionItems = [
  { title: 'Pricing & Plans', url: '/pricing', icon: Rocket, badge: 'Pro' },
];

const communityItems = [
  { title: 'Documentation', url: '/docs', icon: BookOpen },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Certificates', url: '/certificates', icon: Award },
  { title: 'Refer & Earn', url: '/referrals', icon: Gift },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const criticalCount = useAlertStore((state) => state.getCriticalCount());
  const highCount = useAlertStore((state) => state.getHighCount());
  const selectedModuleIds = useProfileStore((s) => s.selectedModules);
  const menuItems = MODULE_CATALOG.filter((m) => selectedModuleIds.includes(m.id));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const urgentAlertsCount = criticalCount + highCount;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 border-b border-sidebar-border">
        {/* Present on every route since AppSidebar itself is mounted
            globally -- previously this toggle only existed inside
            TopNavBar, which is Dashboard-only, so every other page had no
            way to collapse/expand the sidebar. Collapsed rail is only
            3rem wide, too narrow for the logo and trigger side by side
            (same reason the footer below stacks its icons vertically when
            collapsed), so this layout switches between the two shapes. */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <SidebarTrigger />
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight">CloudOps</span>
                <span className="text-muted-foreground text-xs ml-1">Sim</span>
              </div>
            </div>
            <SidebarTrigger />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isIssues = item.id === 'issues';
                const showBadge = isIssues && urgentAlertsCount > 0;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <div className="relative flex items-center flex-1">
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                          {!collapsed && showBadge && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                              {urgentAlertsCount > 9 ? '9+' : urgentAlertsCount}
                            </span>
                          )}
                          {collapsed && showBadge && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 animate-pulse">
                              <span className="sr-only">{urgentAlertsCount} urgent alerts</span>
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Upgrade</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {upgradeSectionItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <div className="flex items-center flex-1 gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Community</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <div className="flex items-center flex-1 gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user?.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/admin'}>
                    <NavLink
                      to="/admin"
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <div className="flex items-center flex-1 gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        {!collapsed && <span>Admin Panel</span>}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex-1 justify-start px-2 min-w-0">
                  <User className="mr-2 h-4 w-4 shrink-0" />
                  <span className="text-sm truncate">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/account')}>
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationBell />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/account')}
              className="w-8 h-8"
              title="My Account"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-8 h-8"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
