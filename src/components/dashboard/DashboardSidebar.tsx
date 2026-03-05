import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
  const visibleItems = items.filter(i => i.visible !== false);

  return (
    <aside className="w-64 bg-card border-r shrink-0 flex flex-col">
      {/* Profile Header */}
      <div className="p-5 border-b">
        {header}
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeSection === item.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {footer && (
        <div className="p-2 border-t">
          {footer}
        </div>
      )}
    </aside>
  );
};
