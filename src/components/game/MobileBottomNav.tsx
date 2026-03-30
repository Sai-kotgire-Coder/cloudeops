import { useLocation, useNavigate } from 'react-router-dom';
import { Server, Terminal, Layers, Target, Container } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Scenarios', url: '/scenarios', icon: Target },
  { title: 'Apps', url: '/apps', icon: Layers },
  { title: 'Containers', url: '/containers', icon: Container },
  { title: 'Instances', url: '/instances', icon: Server },
  { title: 'CLI', url: '/cli', icon: Terminal },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.url || 
                          (item.url !== '/' && location.pathname.startsWith(item.url));

          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all min-w-[64px] min-h-[48px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <Icon className={cn("w-5 h-5 relative z-10", isActive && "scale-110")} />
              <span className={cn(
                "text-[10px] font-medium relative z-10 leading-tight",
                isActive && "font-bold"
              )}>
                {item.title}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
            </button>
          );
        })}
      </div>
      {/* Safe area for devices with notch/home indicator */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </div>
  );
};
