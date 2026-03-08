import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  visible?: boolean;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  header: ReactNode;
  /** Flat item list (legacy support) */
  items?: SidebarItem[];
  /** Grouped item list — takes priority over `items` */
  groups?: SidebarGroup[];
  activeSection: string;
  onNavigate: (id: string) => void;
  footer?: ReactNode;
}

export const DashboardSidebar = ({
  header,
  items,
  groups,
  activeSection,
  onNavigate,
  footer,
}: DashboardSidebarProps) => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Normalize to groups
  const resolvedGroups: SidebarGroup[] = groups
    ? groups.map(g => ({ ...g, items: g.items.filter(i => i.visible !== false) }))
    : [{ label: '', items: (items || []).filter(i => i.visible !== false) }];

  const allItems = resolvedGroups.flatMap(g => g.items);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (isMobile) setDrawerOpen(false);
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const renderItem = (item: SidebarItem, isCollapsed: boolean) => {
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
  };

  const navContent = (isCollapsed: boolean) => (
    <nav className={cn('flex-1 overflow-y-auto', isCollapsed ? 'px-1 py-2' : 'p-2')}>
      {resolvedGroups.map((group) => {
        if (group.items.length === 0) return null;
        const hasLabel = group.label.length > 0;
        const isGroupCollapsed = collapsedGroups[group.label];

        return (
          <div key={group.label || 'default'} className={cn(hasLabel && 'mb-1')}>
            {/* Group Header */}
            {hasLabel && !isCollapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-3 pt-4 pb-1.5 group"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {group.label}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 text-muted-foreground/50 transition-transform duration-200',
                    isGroupCollapsed && '-rotate-90'
                  )}
                />
              </button>
            )}

            {/* Collapsed sidebar: show a thin divider between groups */}
            {hasLabel && isCollapsed && (
              <div className="mx-2 my-2 border-t border-border/50" />
            )}

            {/* Group Items */}
            {(!isGroupCollapsed || isCollapsed) && (
              <div className="space-y-0.5">
                {group.items.map(item => renderItem(item, isCollapsed))}
              </div>
            )}
          </div>
        );
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
            {allItems.find(i => i.id === activeSection)?.label || 'Dashboard'}
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
            <span className="text-xs font-bold text-primary">SA</span>
          </div>
        </div>
      )}

      {navContent(collapsed)}

      {footer && !collapsed && <div className="p-2 border-t">{footer}</div>}
    </aside>
  );
};
