import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface UniversityAnalyticsProps {
  universityId: string;
}

interface CollegeStats {
  name: string;
  students: number;
  applied: number;
  placed: number;
  placementRate: number;
}

export const UniversityAnalytics = ({ universityId }: UniversityAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [collegeStats, setCollegeStats] = useState<CollegeStats[]>([]);
  const [domainData, setDomainData] = useState<{ name: string; count: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; count: number }[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; applications: number; placements: number }[]>([]);
  const [totals, setTotals] = useState({ students: 0, applied: 0, placed: 0, internships: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, [universityId]);

  const fetchAnalytics = async () => {
    // Get colleges
    const { data: colleges } = await supabase
      .from('colleges')
      .select('id, name')
      .eq('university_id', universityId);

    if (!colleges || colleges.length === 0) {
      setLoading(false);
      return;
    }

    const collegeIds = colleges.map(c => c.id);

    // Get all students in these colleges
    const { data: students } = await supabase
      .from('students')
      .select('id, college_id, domain, department')
      .in('college_id', collegeIds);

    const studentIds = (students || []).map(s => s.id);

    // Get all applications for these students
    const { data: applications } = await supabase
      .from('applications')
      .select('id, student_id, status, applied_at, internship_id')
      .in('student_id', studentIds.length > 0 ? studentIds : ['none']);

    // Get internship domains
    const internshipIds = [...new Set((applications || []).map(a => a.internship_id))];
    const { data: internships } = await supabase
      .from('internships')
      .select('id, domain, title')
      .in('id', internshipIds.length > 0 ? internshipIds : ['none']);

    // Calculate college-wise stats
    const cStats: CollegeStats[] = colleges.map(college => {
      const collegeStudents = (students || []).filter(s => s.college_id === college.id);
      const collegeStudentIds = collegeStudents.map(s => s.id);
      const collegeApps = (applications || []).filter(a => collegeStudentIds.includes(a.student_id));
      const appliedCount = new Set(collegeApps.map(a => a.student_id)).size;
      const placedCount = new Set(
        collegeApps.filter(a => a.status === 'offer_accepted').map(a => a.student_id)
      ).size;

      return {
        name: college.name.length > 20 ? college.name.substring(0, 20) + '...' : college.name,
        students: collegeStudents.length,
        applied: appliedCount,
        placed: placedCount,
        placementRate: collegeStudents.length > 0 ? Math.round((placedCount / collegeStudents.length) * 100) : 0,
      };
    });
    setCollegeStats(cStats);

    // Domain breakdown
    const domainCounts = new Map<string, number>();
    (internships || []).forEach(i => {
      const domain = i.domain || 'Other';
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    });
    setDomainData(Array.from(domainCounts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8));

    // Application status breakdown
    const statusCounts = new Map<string, number>();
    (applications || []).forEach(a => {
      const status = a.status.replace('_', ' ');
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });
    setStatusData(Array.from(statusCounts.entries()).map(([name, count]) => ({ name, count })));

    // Monthly trend (last 6 months)
    const monthlyTrend: { month: string; applications: number; placements: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      const monthApps = (applications || []).filter(a => a.applied_at?.startsWith(monthKey)).length;
      const monthPlacements = (applications || []).filter(
        a => a.status === 'offer_accepted' && a.applied_at?.startsWith(monthKey)
      ).length;

      monthlyTrend.push({ month: monthLabel, applications: monthApps, placements: monthPlacements });
    }
    setTrendData(monthlyTrend);

    // Totals
    const totalApplied = new Set((applications || []).map(a => a.student_id)).size;
    const totalPlaced = new Set(
      (applications || []).filter(a => a.status === 'offer_accepted').map(a => a.student_id)
    ).size;

    setTotals({
      students: (students || []).length,
      applied: totalApplied,
      placed: totalPlaced,
      internships: internshipIds.length,
    });

    setLoading(false);
  };

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2, 160 60% 45%))',
    'hsl(var(--chart-3, 30 80% 55%))',
    'hsl(var(--chart-4, 280 65% 60%))',
    'hsl(var(--chart-5, 340 75% 55%))',
    'hsl(200, 70%, 50%)',
    'hsl(120, 60%, 40%)',
    'hsl(45, 90%, 50%)',
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> University Analytics
        </h2>
        <p className="text-sm text-muted-foreground">Placement rates, internship trends, and college comparisons</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totals.students}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Applied</p>
                <p className="text-2xl font-bold">{totals.applied}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><Award className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Placed</p>
                <p className="text-2xl font-bold">{totals.placed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Placement Rate</p>
                <p className="text-2xl font-bold">{totals.students > 0 ? Math.round((totals.placed / totals.students) * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* College Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">College-wise Placement Rates</CardTitle>
            <CardDescription>Comparison across affiliated colleges</CardDescription>
          </CardHeader>
          <CardContent>
            {collegeStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No college data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={collegeStats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="hsl(var(--primary))" name="Students" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applied" fill="hsl(200, 70%, 50%)" name="Applied" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="placed" fill="hsl(140, 60%, 45%)" name="Placed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Internship Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Internship Trends (6 Months)</CardTitle>
            <CardDescription>Applications vs placements over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="hsl(var(--primary))" strokeWidth={2} name="Applications" />
                <Line type="monotone" dataKey="placements" stroke="hsl(140, 60%, 45%)" strokeWidth={2} name="Placements" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Internship Domain Distribution</CardTitle>
            <CardDescription>Popular internship domains</CardDescription>
          </CardHeader>
          <CardContent>
            {domainData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No domain data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={domainData} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {domainData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Application Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Status Breakdown</CardTitle>
            <CardDescription>Current status of all student applications</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No application data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* College Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">College Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">College</th>
                  <th className="text-center py-2 px-3 font-medium">Students</th>
                  <th className="text-center py-2 px-3 font-medium">Applied</th>
                  <th className="text-center py-2 px-3 font-medium">Placed</th>
                  <th className="text-center py-2 px-3 font-medium">Placement Rate</th>
                </tr>
              </thead>
              <tbody>
                {collegeStats.map((c, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="text-center py-2.5 px-3">{c.students}</td>
                    <td className="text-center py-2.5 px-3">{c.applied}</td>
                    <td className="text-center py-2.5 px-3">{c.placed}</td>
                    <td className="text-center py-2.5 px-3">
                      <Badge variant={c.placementRate >= 50 ? 'default' : c.placementRate >= 25 ? 'secondary' : 'outline'}>
                        {c.placementRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
