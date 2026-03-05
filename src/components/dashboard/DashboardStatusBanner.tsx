import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStatusBannerProps {
  variant: 'warning' | 'info' | 'success';
  message: string;
  className?: string;
}

export const DashboardStatusBanner = ({ variant, message, className }: DashboardStatusBannerProps) => {
  const variants = {
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  };

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-lg border text-sm",
      variants[variant],
      className
    )}>
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
};
