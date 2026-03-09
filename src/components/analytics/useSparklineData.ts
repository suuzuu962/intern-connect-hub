import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';
import { DateRange } from './AnalyticsDateFilter';

/**
 * Generates daily counts for the last N days (or within date range)
 * for given tables, returning arrays suitable for sparklines.
 */
export function useSparklineData(
  dateRange: DateRange,
  tables: { table: string; dateCol: string; key: string; filter?: Record<string, any> }[],
  deps: any[] = []
) {
  const [sparkData, setSparkData] = useState<Record<string, number[]>>({});

  const fetch = useCallback(async () => {
    const now = new Date();
    const from = dateRange.from || subDays(now, 30);
    const to = dateRange.to || now;

    // Generate day buckets
    const days: string[] = [];
    let d = startOfDay(from);
    while (d <= to) {
      days.push(format(d, 'yyyy-MM-dd'));
      d = new Date(d.getTime() + 86400000);
    }
    // Cap at 60 buckets for performance
    const buckets = days.length > 60 ? days.filter((_, i) => i % Math.ceil(days.length / 60) === 0) : days;

    const result: Record<string, number[]> = {};

    await Promise.all(
      tables.map(async (t) => {
        const { data } = await supabase
          .from(t.table as any)
          .select(t.dateCol)
          .gte(t.dateCol, from.toISOString())
          .lte(t.dateCol, to.toISOString());

        const counts: Record<string, number> = {};
        (data || []).forEach((row: any) => {
          const day = format(new Date(row[t.dateCol]), 'yyyy-MM-dd');
          counts[day] = (counts[day] || 0) + 1;
        });

        result[t.key] = buckets.map(b => counts[b] || 0);
      })
    );

    setSparkData(result);
  }, [dateRange, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  return sparkData;
}
