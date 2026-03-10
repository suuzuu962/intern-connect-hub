import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { UserCheck, Filter, CheckSquare, Loader2, GraduationCap, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShortlistToolProps {
  companyId: string | null;
}

interface Applicant {
  id: string;
  status: string;
  student: {
    id: string;
    university: string | null;
    college: string | null;
    degree: string | null;
    department: string | null;
    skills: string[] | null;
    city: string | null;
    state: string | null;
  };
  profile: {
    full_name: string | null;
    email: string;
  };
  internship_title: string;
}

export const ShortlistTool = ({ companyId }: ShortlistToolProps) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterInternship, setFilterInternship] = useState<string>('all');
  const [internships, setInternships] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (companyId) fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      const { data: companyInternships } = await supabase
        .from('internships')
        .select('id, title')
        .eq('company_id', companyId!);

      setInternships(companyInternships || []);
      const internshipIds = companyInternships?.map(i => i.id) || [];
      if (internshipIds.length === 0) { setLoading(false); return; }

      const { data: applications } = await supabase
        .from('applications')
        .select(`
          id, status, internship_id,
          students:student_id (id, university, college, degree, department, skills, city, state, user_id)
        `)
        .in('internship_id', internshipIds)
        .in('status', ['applied', 'under_review']);

      if (!applications) { setLoading(false); return; }

      const studentUserIds = applications
        .map((a: any) => a.students?.user_id)
        .filter(Boolean);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', studentUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const internshipMap = new Map(companyInternships?.map(i => [i.id, i.title]) || []);

      const mapped: Applicant[] = applications.map((a: any) => ({
        id: a.id,
        status: a.status,
        student: a.students || {},
        profile: profileMap.get(a.students?.user_id) || { full_name: 'Unknown', email: '' },
        internship_title: internshipMap.get(a.internship_id) || 'Unknown',
      }));

      setApplicants(mapped);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const filtered = filteredApplicants;
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const handleBulkShortlist = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        supabase.from('applications').update({ status: 'shortlisted' }).eq('id', id)
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} applicant(s) shortlisted successfully`);
      setSelectedIds(new Set());
      fetchData();
    } catch (error) {
      toast.error('Failed to shortlist applicants');
    } finally {
      setProcessing(false);
    }
  };

  const filteredApplicants = filterInternship === 'all'
    ? applicants
    : applicants.filter(a => a.internship_title === filterInternship);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Shortlist Tool</h2>
        <p className="text-muted-foreground">Quickly review and shortlist applicants in bulk</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterInternship} onValueChange={setFilterInternship}>
          <SelectTrigger className="w-[220px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by internship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Internships</SelectItem>
            {internships.map(i => (
              <SelectItem key={i.id} value={i.title}>{i.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={selectAll}>
          <CheckSquare className="h-4 w-4 mr-1" />
          {selectedIds.size === filteredApplicants.length ? 'Deselect All' : 'Select All'}
        </Button>

        <Button
          onClick={handleBulkShortlist}
          disabled={selectedIds.size === 0 || processing}
          size="sm"
        >
          {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserCheck className="h-4 w-4 mr-1" />}
          Shortlist Selected ({selectedIds.size})
        </Button>
      </div>

      {/* Applicant List */}
      {filteredApplicants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No pending applicants to review.
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {filteredApplicants.map(applicant => (
              <Card
                key={applicant.id}
                className={`cursor-pointer transition-all ${selectedIds.has(applicant.id) ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                onClick={() => toggleSelect(applicant.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(applicant.id)}
                      onCheckedChange={() => toggleSelect(applicant.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold truncate">{applicant.profile.full_name || 'Unnamed'}</h4>
                        <Badge variant="secondary" className="text-xs shrink-0">{applicant.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{applicant.profile.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {applicant.student.degree || 'N/A'} • {applicant.student.department || 'N/A'}
                        </Badge>
                        {applicant.student.city && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {applicant.student.city}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{applicant.internship_title}</Badge>
                      </div>
                      {applicant.student.skills && applicant.student.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {applicant.student.skills.slice(0, 5).map(skill => (
                            <Badge key={skill} className="text-xs bg-primary/10 text-primary border-0">{skill}</Badge>
                          ))}
                          {applicant.student.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">+{applicant.student.skills.length - 5}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
