import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Search, Plus, CheckCircle, XCircle, Clock, Users, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceTrackerProps {
  collegeId: string;
  role: 'college' | 'coordinator';
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  college_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  session_name: string | null;
  session_type: string;
  hours_logged: number;
  status: string;
  marked_by: string | null;
  remarks: string | null;
  created_at: string;
}

interface StudentInfo {
  id: string;
  usn: string | null;
  department: string | null;
  profile?: { full_name: string; email: string };
}

export const AttendanceTracker = ({ collegeId, role }: AttendanceTrackerProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('all');
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Mark attendance form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [markStatus, setMarkStatus] = useState('present');
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState('regular');
  const [hoursLogged, setHoursLogged] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [collegeId, dateFilter]);

  const fetchData = async () => {
    setLoading(true);

    const [studentsRes, attendanceRes] = await Promise.all([
      supabase
        .from('students')
        .select('id, usn, department, user_id')
        .eq('college_id', collegeId),
      supabase
        .from('student_attendance')
        .select('*')
        .eq('college_id', collegeId)
        .eq('attendance_date', dateFilter)
        .order('created_at', { ascending: false }),
    ]);

    const studentsList = studentsRes.data || [];
    const userIds = studentsList.map(s => s.user_id);
    
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds);
      profiles = data || [];
    }

    const studentsWithProfiles = studentsList.map(s => ({
      ...s,
      profile: profiles.find(p => p.user_id === s.user_id),
    }));

    setStudents(studentsWithProfiles);
    setRecords((attendanceRes.data as AttendanceRecord[]) || []);
    setLoading(false);
  };

  const handleMarkAttendance = async () => {
    if (!selectedStudentId || !user) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('student_attendance')
      .insert({
        student_id: selectedStudentId,
        college_id: collegeId,
        attendance_date: dateFilter,
        session_name: sessionName || null,
        session_type: sessionType,
        hours_logged: parseFloat(hoursLogged) || 0,
        status: markStatus,
        marked_by: user.id,
        remarks: remarks || null,
        check_in_time: markStatus !== 'absent' ? new Date().toISOString() : null,
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Attendance marked successfully' });
      setMarkDialogOpen(false);
      setSelectedStudentId('');
      setSessionName('');
      setRemarks('');
      setHoursLogged('0');
      fetchData();
    }
    setSubmitting(false);
  };

  const handleBulkMark = async (status: string) => {
    if (!user) return;
    const unmarkedStudents = students.filter(s => !records.find(r => r.student_id === s.id));
    if (unmarkedStudents.length === 0) {
      toast({ title: 'All students already marked for today' });
      return;
    }

    const entries = unmarkedStudents.map(s => ({
      student_id: s.id,
      college_id: collegeId,
      attendance_date: dateFilter,
      status,
      marked_by: user.id,
      session_type: 'regular' as const,
      hours_logged: status === 'present' ? 8 : 0,
      check_in_time: status !== 'absent' ? new Date().toISOString() : null,
    }));

    const { error } = await supabase.from('student_attendance').insert(entries);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Marked ${unmarkedStudents.length} students as ${status}` });
      fetchData();
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.profile?.full_name || student?.usn || 'Unknown';
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'late': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'half_day': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'excused': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const statusBadgeVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      default: return 'outline';
    }
  };

  // Stats
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const lateCount = records.filter(r => ['late', 'half_day'].includes(r.status)).length;
  const unmarkedCount = students.length - records.length;
  const totalHours = records.reduce((sum, r) => sum + (r.hours_logged || 0), 0);

  const filteredRecords = records.filter(r => {
    const student = students.find(s => s.id === r.student_id);
    const matchesSearch = student?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.usn?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Attendance Tracker
          </h2>
          <p className="text-sm text-muted-foreground">{students.length} students • {format(new Date(dateFilter), 'PPP')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleBulkMark('present')}>
            <CheckCircle className="h-4 w-4 mr-1" /> Mark All Present
          </Button>
          <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Mark Individual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.profile?.full_name || s.usn || s.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={markStatus} onValueChange={setMarkStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Session Type</Label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Session Name (optional)</Label>
                    <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="e.g. Morning Lecture" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours Logged</Label>
                    <Input type="number" value={hoursLogged} onChange={e => setHoursLogged(e.target.value)} min="0" max="24" step="0.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Remarks (optional)</Label>
                  <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes..." rows={2} maxLength={500} />
                </div>
                <Button onClick={handleMarkAttendance} disabled={submitting || !selectedStudentId} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Mark Attendance
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-lg font-bold">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-lg font-bold">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Late/Half</p>
                <p className="text-lg font-bold">{lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Unmarked</p>
                <p className="text-lg font-bold">{unmarkedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-lg font-bold">{totalHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="half_day">Half Day</SelectItem>
            <SelectItem value="excused">Excused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{getStudentName(record.student_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(record.status)}
                        <Badge variant={statusBadgeVariant(record.status)} className="text-xs">{record.status.replace('_', ' ')}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{record.session_name || '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{record.session_type}</Badge></TableCell>
                    <TableCell>{record.hours_logged}h</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{record.remarks || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
