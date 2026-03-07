import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardSidebarProps {
  header: ReactNode;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    visible?: boolean;
  }[];
  activeSection: string;
  onNavigate: (id: string) => void;
  footer?: ReactNode;
}

export const DashboardSidebar = ({
  header,
  items,
  activeSection,
  onNavigate,
  footer,
}: DashboardSidebarProps) => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const visibleItems = items.filter(i => i.visible !== false);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (isMobile) setDrawerOpen(false);
  };

  const navContent = (isCollapsed: boolean) => (
    <nav className={cn('p-2 space-y-0.5 flex-1 overflow-y-auto', isCollapsed && 'px-1')}>
      {visibleItems.map((item) => {
        const btn = (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
              isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
              activeSection === item.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
            {!isCollapsed && item.badge && item.badge > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {isCollapsed && item.badge && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="relative">{btn}</div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }
        return btn;
      })}
    </nav>
  );

  // Mobile: hamburger + sheet drawer
  if (isMobile) {
    return (
      <>
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-card border-b">
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold truncate">
            {visibleItems.find(i => i.id === activeSection)?.label || 'Dashboard'}
          </span>
        </div>
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="p-5 border-b">{header}</div>
            {navContent(false)}
            {footer && <div className="p-2 border-t">{footer}</div>}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop/Tablet: collapsible sidebar
  return (
    <aside className={cn(
      'bg-card border-r shrink-0 flex flex-col transition-all duration-300 relative',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Profile Header */}
      {!collapsed && <div className="p-5 border-b">{header}</div>}
      {collapsed && (
        <div className="p-2 border-b flex justify-center">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">EL</span>
          </div>
        </div>
      )}

      {navContent(collapsed)}

      {footer && !collapsed && <div className="p-2 border-t">{footer}</div>}
    </aside>
  );
};
