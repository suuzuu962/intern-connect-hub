import { DateRange } from '@/components/analytics/AnalyticsDateFilter';
import { subDays, differenceInDays } from 'date-fns';

/**
 * Given the current date range, compute the equivalent previous period.
 * E.g. if current = last 7 days, previous = the 7 days before that.
 * If no range is set, defaults to comparing last 30 days vs 30 days before.
 */
export function getPreviousPeriod(dateRange: DateRange): { from: Date; to: Date } {
  const now = new Date();
  const currentFrom = dateRange.from || subDays(now, 30);
  const currentTo = dateRange.to || now;
  const spanDays = Math.max(differenceInDays(currentTo, currentFrom), 1);

  return {
    from: subDays(currentFrom, spanDays),
    to: subDays(currentFrom, 1),
  };
}
