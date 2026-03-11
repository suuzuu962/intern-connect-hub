import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Play, Download, Trash2, Copy, FileText, Calendar, Clock, Filter, BarChart3, Table2, Save } from 'lucide-react';

interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  columns: string[];
  filters: ReportFilter[];
  createdAt: string;
  lastRun: string | null;
  schedule: string | null;
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in';
  value: string;
}

interface RunResult {
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

const DATA_SOURCES: Record<string, { label: string; columns: string[] }> = {
  students: {
    label: 'Students',
    columns: ['id', 'user_id', 'college', 'department', 'city', 'state', 'graduation_year', 'skills', 'domain', 'course', 'degree', 'created_at'],
  },
  companies: {
    label: 'Companies',
    columns: ['id', 'name', 'industry', 'city', 'state', 'employee_count', 'is_verified', 'domain_category', 'created_at'],
  },
  internships: {
    label: 'Internships',
    columns: ['id', 'title', 'domain', 'location', 'work_mode', 'internship_type', 'stipend', 'duration', 'is_active', 'positions_available', 'views_count', 'created_at'],
  },
  applications: {
    label: 'Applications',
    columns: ['id', 'internship_id', 'student_id', 'status', 'applied_at', 'updated_at'],
  },
  login_logs: {
    label: 'Login Logs',
    columns: ['id', 'user_email', 'role', 'login_at', 'ip_address'],
  },
};

const SAVED_REPORTS: ReportDefinition[] = [
  {
    id: '1',
    name: 'Active Students by Department',
    description: 'All students grouped by department with skills breakdown',
    dataSource: 'students',
    columns: ['college', 'department', 'city', 'graduation_year', 'skills'],
    filters: [],
    createdAt: '2026-02-15',
    lastRun: '2026-03-10',
    schedule: 'weekly',
  },
  {
    id: '2',
    name: 'Internship Performance',
    description: 'Internship listings with views and application counts',
    dataSource: 'internships',
    columns: ['title', 'domain', 'work_mode', 'stipend', 'views_count', 'positions_available', 'is_active'],
    filters: [{ field: 'is_active', operator: 'equals', value: 'true' }],
    createdAt: '2026-01-20',
    lastRun: '2026-03-11',
    schedule: 'daily',
  },
  {
    id: '3',
    name: 'Verified Companies Report',
    description: 'All verified companies with domain and location data',
    dataSource: 'companies',
    columns: ['name', 'industry', 'city', 'state', 'employee_count', 'domain_category'],
    filters: [{ field: 'is_verified', operator: 'equals', value: 'true' }],
    createdAt: '2026-03-01',
    lastRun: null,
    schedule: null,
  },
];

export const CustomReports = () => {
  const [reports, setReports] = useState<ReportDefinition[]>(SAVED_REPORTS);
  const [showBuilder, setShowBuilder] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Builder state
  const [reportName, setReportName] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [schedule, setSchedule] = useState<string | null>(null);

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const addFilter = () => {
    if (!dataSource) return;
    setFilters(prev => [...prev, { field: DATA_SOURCES[dataSource].columns[0], operator: 'equals', value: '' }]);
  };

  const updateFilter = (index: number, update: Partial<ReportFilter>) => {
    setFilters(prev => prev.map((f, i) => i === index ? { ...f, ...update } : f));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const saveReport = () => {
    if (!reportName || !dataSource || selectedColumns.length === 0) {
      toast.error('Please fill in name, select a data source, and pick at least one column');
      return;
    }
    const newReport: ReportDefinition = {
      id: crypto.randomUUID(),
      name: reportName,
      description: reportDesc,
      dataSource,
      columns: selectedColumns,
      filters,
      createdAt: new Date().toISOString().split('T')[0],
      lastRun: null,
      schedule,
    };
    setReports(prev => [...prev, newReport]);
    resetBuilder();
    toast.success('Report saved successfully');
  };

  const resetBuilder = () => {
    setShowBuilder(false);
    setReportName('');
    setReportDesc('');
    setDataSource('');
    setSelectedColumns([]);
    setFilters([]);
    setSchedule(null);
  };

  const runReport = async (report: ReportDefinition) => {
    setRunningId(report.id);
    try {
      let query = supabase.from(report.dataSource as any).select(report.columns.join(','));

      for (const filter of report.filters) {
        if (!filter.value) continue;
        switch (filter.operator) {
          case 'equals': query = query.eq(filter.field, filter.value); break;
          case 'contains': query = query.ilike(filter.field, `%${filter.value}%`); break;
          case 'gt': query = query.gt(filter.field, filter.value); break;
          case 'lt': query = query.lt(filter.field, filter.value); break;
        }
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      setRunResult({
        columns: report.columns,
        rows: (data || []) as Record<string, any>[],
        totalRows: (data || []).length,
      });

      setReports(prev => prev.map(r => r.id === report.id ? { ...r, lastRun: new Date().toISOString().split('T')[0] } : r));
      toast.success(`Report executed: ${(data || []).length} rows returned`);
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  const exportCSV = (result: RunResult) => {
    const header = result.columns.join(',');
    const rows = result.rows.map(row => result.columns.map(c => {
      const val = row[c];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
    }).join(',')).join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Custom Reports</h2>
          <p className="text-muted-foreground">Build, save, and schedule dynamic data reports</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Report
        </Button>
      </div>

      {/* Report Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={v => { if (!v) resetBuilder(); else setShowBuilder(true); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Builder</DialogTitle>
            <DialogDescription>Configure your custom data report</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="e.g. Monthly Student Analysis" />
              </div>
              <div className="space-y-2">
                <Label>Data Source</Label>
                <Select value={dataSource} onValueChange={v => { setDataSource(v); setSelectedColumns([]); setFilters([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATA_SOURCES).map(([key, ds]) => (
                      <SelectItem key={key} value={key}>{ds.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="What this report tracks..." rows={2} />
            </div>

            {dataSource && (
              <>
                <div className="space-y-2">
                  <Label>Columns</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                    {DATA_SOURCES[dataSource].columns.map(col => (
                      <Badge
                        key={col}
                        variant={selectedColumns.includes(col) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleColumn(col)}
                      >
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Filters</Label>
                    <Button variant="outline" size="sm" onClick={addFilter}><Filter className="h-3 w-3 mr-1" /> Add Filter</Button>
                  </div>
                  {filters.map((filter, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Select value={filter.field} onValueChange={v => updateFilter(i, { field: v })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DATA_SOURCES[dataSource].columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={filter.operator} onValueChange={v => updateFilter(i, { operator: v as any })}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="gt">Greater Than</SelectItem>
                          <SelectItem value="lt">Less Than</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={filter.value} onChange={e => updateFilter(i, { value: e.target.value })} placeholder="Value" className="flex-1" />
                      <Button variant="ghost" size="icon" onClick={() => removeFilter(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Schedule (Optional)</Label>
                  <Select value={schedule || ''} onValueChange={v => setSchedule(v || null)}>
                    <SelectTrigger><SelectValue placeholder="No schedule — run manually" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetBuilder}>Cancel</Button>
            <Button onClick={saveReport} disabled={!reportName || !dataSource || selectedColumns.length === 0}>
              <Save className="h-4 w-4 mr-1" /> Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Saved Reports</CardTitle>
          <CardDescription>{reports.length} report{reports.length !== 1 ? 's' : ''} configured</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Columns</TableHead>
                <TableHead>Filters</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{DATA_SOURCES[report.dataSource]?.label || report.dataSource}</Badge></TableCell>
                  <TableCell><span className="text-sm">{report.columns.length} fields</span></TableCell>
                  <TableCell><span className="text-sm">{report.filters.length || 'None'}</span></TableCell>
                  <TableCell>
                    {report.schedule ? (
                      <Badge variant="outline" className="capitalize"><Clock className="h-3 w-3 mr-1" />{report.schedule}</Badge>
                    ) : <span className="text-xs text-muted-foreground">Manual</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{report.lastRun || 'Never'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => runReport(report)} disabled={runningId === report.id}>
                        <Play className="h-3 w-3 mr-1" /> Run
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setReports(prev => prev.filter(r => r.id !== report.id))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Results */}
      {runResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Table2 className="h-5 w-5" /> Report Results</CardTitle>
              <CardDescription>{runResult.totalRows} row{runResult.totalRows !== 1 ? 's' : ''} returned (limited to 100)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV(runResult)}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {runResult.columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {runResult.rows.slice(0, 50).map((row, i) => (
                  <TableRow key={i}>
                    {runResult.columns.map(col => (
                      <TableCell key={col} className="text-sm max-w-[200px] truncate">
                        {Array.isArray(row[col]) ? row[col].join(', ') : String(row[col] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
