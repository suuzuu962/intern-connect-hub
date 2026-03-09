import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export interface DrillDownQuery {
  title: string;
  description: string;
  type: 'applications_by_status' | 'applications_by_internship' | 'internships_by_type' | 'internships_by_mode' | 'company_details';
  filterValue: string;
  companyId?: string;
}

interface DrillDownRecord {
  id: string;
  [key: string]: any;
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  applied: 'outline',
  under_review: 'secondary',
  shortlisted: 'default',
  offer_released: 'default',
  offer_accepted: 'default',
  rejected: 'destructive',
  withdrawn: 'secondary',
};

interface AnalyticsDrillDownProps {
  query: DrillDownQuery | null;
  onClose: () => void;
}

export const AnalyticsDrillDown = ({ query, onClose }: AnalyticsDrillDownProps) => {
  const [records, setRecords] = useState<DrillDownRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    const fetchRecords = async () => {
      setLoading(true);
      try {
        let data: any[] = [];

        if (query.type === 'applications_by_status') {
          const statusKey = query.filterValue.toLowerCase().replace(/\s+/g, '_');
          let q = supabase
            .from('applications')
            .select('id, status, applied_at, internship_id, student_id')
            .eq('status', statusKey as any)
            .order('applied_at', { ascending: false })
            .limit(50);

          if (query.companyId) {
            const { data: internships } = await supabase
              .from('internships')
              .select('id')
              .eq('company_id', query.companyId);
            const ids = (internships || []).map(i => i.id);
            if (ids.length > 0) {
              q = q.in('internship_id', ids);
            }
          }

          const { data: apps } = await q;
          // Fetch related internship titles
          const internshipIds = [...new Set((apps || []).map(a => a.internship_id))];
          const { data: internships } = internshipIds.length > 0
            ? await supabase.from('internships').select('id, title').in('id', internshipIds)
            : { data: [] };
          const internMap = Object.fromEntries((internships || []).map(i => [i.id, i.title]));

          // Fetch student names
          const studentIds = [...new Set((apps || []).map(a => a.student_id))];
          const { data: students } = studentIds.length > 0
            ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id',
              (await supabase.from('students').select('id, user_id').in('id', studentIds)).data?.map(s => s.user_id) || []
            )
            : { data: [] };
          const studentUserMap = Object.fromEntries(
            (await supabase.from('students').select('id, user_id').in('id', studentIds)).data?.map(s => [s.id, s.user_id]) || []
          );
          const profileMap = Object.fromEntries((students || []).map(p => [p.user_id, p.full_name || p.email]));

          data = (apps || []).map(a => ({
            id: a.id,
            internship: internMap[a.internship_id] || 'Unknown',
            student: profileMap[studentUserMap[a.student_id]] || a.student_id.slice(0, 8),
            status: a.status,
            applied: format(new Date(a.applied_at), 'MMM d, yyyy'),
          }));
        }

        if (query.type === 'applications_by_internship') {
          // filterValue is the truncated title — need to find the internship
          const { data: internships } = await supabase
            .from('internships')
            .select('id, title')
            .ilike('title', `${query.filterValue.replace('…', '')}%`);

          const ids = (internships || []).map(i => i.id);
          if (ids.length > 0) {
            const { data: apps } = await supabase
              .from('applications')
              .select('id, status, applied_at, student_id')
              .in('internship_id', ids)
              .order('applied_at', { ascending: false })
              .limit(50);

            const studentIds = [...new Set((apps || []).map(a => a.student_id))];
            const studentData = studentIds.length > 0
              ? (await supabase.from('students').select('id, user_id').in('id', studentIds)).data || []
              : [];
            const userIds = studentData.map(s => s.user_id);
            const profiles = userIds.length > 0
              ? (await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)).data || []
              : [];
            const studentUserMap = Object.fromEntries(studentData.map(s => [s.id, s.user_id]));
            const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || p.email]));

            data = (apps || []).map(a => ({
              id: a.id,
              student: profileMap[studentUserMap[a.student_id]] || a.student_id.slice(0, 8),
              status: a.status,
              applied: format(new Date(a.applied_at), 'MMM d, yyyy'),
            }));
          }
        }

        if (query.type === 'internships_by_type' || query.type === 'internships_by_mode') {
          const field = query.type === 'internships_by_type' ? 'internship_type' : 'work_mode';
          const { data: internships } = await supabase
            .from('internships')
            .select('id, title, company_id, is_active, created_at, internship_type, work_mode, location')
            .eq(field, query.filterValue.toLowerCase() as any)
            .order('created_at', { ascending: false })
            .limit(50);

          const companyIds = [...new Set((internships || []).map(i => i.company_id))];
          const { data: companies } = companyIds.length > 0
            ? await supabase.from('companies').select('id, name').in('id', companyIds)
            : { data: [] };
          const companyMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]));

          data = (internships || []).map(i => ({
            id: i.id,
            title: i.title,
            company: companyMap[i.company_id] || 'Unknown',
            type: i.internship_type,
            mode: i.work_mode,
            active: i.is_active ? 'Yes' : 'No',
            created: format(new Date(i.created_at), 'MMM d, yyyy'),
          }));
        }

        if (query.type === 'company_details') {
          const { data: companies } = await supabase
            .from('companies')
            .select('id, name, industry, location, is_verified, created_at')
            .ilike('name', `${query.filterValue.replace('…', '')}%`)
            .limit(1);

          if (companies && companies.length > 0) {
            const company = companies[0];
            const { data: internships } = await supabase
              .from('internships')
              .select('id, title, is_active, created_at')
              .eq('company_id', company.id)
              .order('created_at', { ascending: false })
              .limit(20);

            data = (internships || []).map(i => ({
              id: i.id,
              title: i.title,
              active: i.is_active ? 'Yes' : 'No',
              created: format(new Date(i.created_at), 'MMM d, yyyy'),
            }));
          }
        }

        setRecords(data);
      } catch (err) {
        console.error('Drill-down fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [query]);

  if (!query) return null;

  const columns = records.length > 0 ? Object.keys(records[0]).filter(k => k !== 'id') : [];

  return (
    <Dialog open={!!query} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base">{query.title}</DialogTitle>
          <DialogDescription className="text-sm">{query.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No records found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map(col => (
                    <th key={col} className="text-left py-2 px-3 font-medium text-muted-foreground capitalize">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="py-2 px-3">
                        {col === 'status' ? (
                          <Badge variant={STATUS_BADGE_VARIANT[record[col]] || 'outline'} className="text-xs capitalize">
                            {String(record[col]).replace(/_/g, ' ')}
                          </Badge>
                        ) : col === 'active' ? (
                          <Badge variant={record[col] === 'Yes' ? 'default' : 'secondary'} className="text-xs">
                            {record[col]}
                          </Badge>
                        ) : (
                          <span className="truncate block max-w-[200px]">{record[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-right">
          Showing {records.length} record{records.length !== 1 ? 's' : ''} (max 50)
        </p>
      </DialogContent>
    </Dialog>
  );
};
