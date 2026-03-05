import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardWelcomeHeaderProps {
  userName?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const DashboardWelcomeHeader = ({
  userName,
  title,
  subtitle,
  action,
  className,
}: DashboardWelcomeHeaderProps) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
      <div className="flex items-start gap-3">
        <span className="text-3xl mt-0.5">👋</span>
        <div>
          {userName && (
            <p className="text-sm text-muted-foreground">Hi, {userName}</p>
          )}
          <h1 className="text-xl sm:text-2xl font-heading font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
