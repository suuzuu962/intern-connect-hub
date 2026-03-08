import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  current: number;
  previous: number;
  suffix?: string;
}

export const TrendBadge = ({ current, previous, suffix = '' }: TrendBadgeProps) => {
  if (previous === 0 && current === 0) return null;

  const change = previous === 0
    ? (current > 0 ? 100 : 0)
    : Math.round(((current - previous) / previous) * 100);

  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
        <Minus className="h-2.5 w-2.5" />
        0%
      </span>
    );
  }

  const isPositive = change > 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5',
        isPositive
          ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
          : 'text-red-700 bg-red-500/10 dark:text-red-400'
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-2.5 w-2.5" />
      ) : (
        <ArrowDownRight className="h-2.5 w-2.5" />
      )}
      {isPositive ? '+' : ''}{change}%{suffix}
    </span>
  );
};
