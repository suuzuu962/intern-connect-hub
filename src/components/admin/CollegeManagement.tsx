import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, Search, Plus, CheckCircle, XCircle, Pencil, Trash2, Eye, Link2, Building, Users, Upload, FileSpreadsheet, AlertCircle, Check, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface College {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  university_id: string;
  is_active: boolean | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  created_at: string;
  university?: { id: string; name: string } | null;
}

interface University {
  id: string;
  name: string;
}


interface CollegeFormData {
  name: string;
  email: string;
  address: string;
  university_id: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  contact_person_designation: string;
}

interface CSVCollegeRow {
  name: string;
  email?: string;
  address?: string;
  university_name?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  contact_person_designation?: string;
}

interface Student {
  id: string;
  user_id: string;
  department: string | null;
  graduation_year: number | null;
  skills: string[] | null;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string;
  } | null;
}

const initialFormData: CollegeFormData = {
  name: '',
  email: '',
  address: '',
  university_id: '',
  contact_person_name: '',
  contact_person_email: '',
  contact_person_phone: '',
  contact_person_designation: '',
};

export const CollegeManagement = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUniversity, setFilterUniversity] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CollegeFormData>(initialFormData);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedNewUniversity, setSelectedNewUniversity] = useState<string>('');
  const [csvData, setCsvData] = useState<CSVCollegeRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [collegeResult, uniResult] = await Promise.all([
      supabase
        .from('colleges')
        .select('*, university:universities(id, name)')
        .order('name', { ascending: true }),
      supabase
        .from('universities')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })
    ]);

    if (collegeResult.error) {
      toast({ title: 'Error', description: collegeResult.error.message, variant: 'destructive' });
    } else {
      setColleges(collegeResult.data || []);
    }

    if (!uniResult.error) {
      setUniversities(uniResult.data || []);
    }
    setLoading(false);
  };


  const fetchCollegeStudents = async (collegeId: string) => {
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('id, user_id, department, graduation_year, skills, created_at')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    const userIds = (studentsData || []).map(s => s.user_id);
    if (userIds.length === 0) {
      setStudents([]);
      return;
    }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    const profilesMap = new Map((profilesData || []).map(p => [p.user_id, p]));

    setStudents((studentsData || []).map(student => ({
      ...student,
      profile: profilesMap.get(student.user_id) || null
    })));
  };

  const parseCSV = (text: string): { rows: CSVCollegeRow[], errors: string[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { rows: [], errors: ['CSV file must have a header row and at least one data row'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const requiredHeaders = ['name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return { rows: [], errors: [`Missing required columns: ${missingHeaders.join(', ')}`] };
    }

    const rows: CSVCollegeRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      if (!row.name) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      rows.push({
        name: row.name,
        email: row.email || undefined,
        address: row.address || undefined,
        university_name: row.university_name || row.university || undefined,
        contact_person_name: row.contact_person_name || undefined,
        contact_person_email: row.contact_person_email || undefined,
        contact_person_phone: row.contact_person_phone || undefined,
        contact_person_designation: row.contact_person_designation || undefined,
      });
    }

    return { rows, errors };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Error', description: 'Please upload a CSV file', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setCsvData(rows);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (csvData.length === 0) {
      toast({ title: 'Error', description: 'No valid data to import', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let successCount = 0;
    let errorCount = 0;
    const totalRows = csvData.length;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      // Find university by name if provided
      let universityId: string | null = null;
      if (row.university_name) {
        const university = universities.find(u => 
          u.name.toLowerCase() === row.university_name?.toLowerCase()
        );
        if (university) {
          universityId = university.id;
        }
      }

      if (!universityId) {
        // Use the first university if none matched
        universityId = universities[0]?.id || null;
      }

      if (!universityId) {
        errorCount++;
        continue;
      }

      const { error } = await supabase.from('colleges').insert({
        name: row.name,
        email: row.email || null,
        address: row.address || null,
        university_id: universityId,
        contact_person_name: row.contact_person_name || null,
        contact_person_email: row.contact_person_email || null,
        contact_person_phone: row.contact_person_phone || null,
        contact_person_designation: row.contact_person_designation || null,
        is_active: true,
      });

      if (error) {
        errorCount++;
      } else {
        successCount++;
      }

      setImportProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    setIsImporting(false);
    setCsvData([]);
    setCsvErrors([]);
    setIsBulkImportDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    toast({
      title: 'Import Complete',
      description: `Successfully imported ${successCount} colleges. ${errorCount} failed.`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    fetchData();
  };

  const openStudentsDialog = async (college: College) => {
    setSelectedCollege(college);
    await fetchCollegeStudents(college.id);
    setStudentSearchTerm('');
    setIsStudentsDialogOpen(true);
  };

  const filteredStudents = students.filter(s => 
    s.profile?.full_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.profile?.email?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const handleAddCollege = async () => {
    if (!formData.name || !formData.university_id) {
      toast({ title: 'Error', description: 'Name and university are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('colleges').insert({
      name: formData.name,
      email: formData.email || null,
      address: formData.address || null,
      university_id: formData.university_id,
      contact_person_name: formData.contact_person_name || null,
      contact_person_email: formData.contact_person_email || null,
      contact_person_phone: formData.contact_person_phone || null,
      contact_person_designation: formData.contact_person_designation || null,
      is_active: true,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'College added successfully' });
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleEditCollege = async () => {
    if (!selectedCollege || !formData.name || !formData.university_id) {
      toast({ title: 'Error', description: 'Name and university are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('colleges')
      .update({
        name: formData.name,
        email: formData.email || null,
        address: formData.address || null,
        university_id: formData.university_id,
        contact_person_name: formData.contact_person_name || null,
        contact_person_email: formData.contact_person_email || null,
        contact_person_phone: formData.contact_person_phone || null,
        contact_person_designation: formData.contact_person_designation || null,
      })
      .eq('id', selectedCollege.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'College updated successfully' });
      setIsEditDialogOpen(false);
      setSelectedCollege(null);
      setFormData(initialFormData);
      fetchData();
    }
    setSaving(false);
  };

  const handleActiveToggle = async (college: College) => {
    const { error } = await supabase
      .from('colleges')
      .update({ is_active: !college.is_active })
      .eq('id', college.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Success',
        description: `College ${college.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      fetchData();
    }
  };

  const handleDelete = async (collegeId: string) => {
    const { error } = await supabase.from('colleges').delete().eq('id', collegeId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'College deleted successfully' });
      fetchData();
    }
  };

  const handleReassign = async () => {
    if (!selectedCollege || !selectedNewUniversity) {
      toast({ title: 'Error', description: 'Please select a university', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('colleges')
      .update({ university_id: selectedNewUniversity })
      .eq('id', selectedCollege.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'College reassigned to new university' });
      setIsReassignDialogOpen(false);
      setSelectedCollege(null);
      setSelectedNewUniversity('');
      fetchData();
    }
    setSaving(false);
  };

  const openEditDialog = (college: College) => {
    setSelectedCollege(college);
    setFormData({
      name: college.name,
      email: college.email || '',
      address: college.address || '',
      university_id: college.university_id,
      contact_person_name: college.contact_person_name || '',
      contact_person_email: college.contact_person_email || '',
      contact_person_phone: college.contact_person_phone || '',
      contact_person_designation: college.contact_person_designation || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = async (college: College) => {
    setSelectedCollege(college);
    setIsDetailDialogOpen(true);
  };

  const openReassignDialog = (college: College) => {
    setSelectedCollege(college);
    setSelectedNewUniversity(college.university_id);
    setIsReassignDialogOpen(true);
  };

  const filteredColleges = colleges.filter((college) => {
    const matchesSearch = college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (college.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesUniversity = filterUniversity === 'all' || college.university_id === filterUniversity;
    return matchesSearch && matchesUniversity;
  });

  const getCoordinatorCount = (collegeId: string) => {
    return colleges.find(c => c.id === collegeId) ? 0 : 0; // Will be calculated from coordinators if needed
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
    <div className="pr-4">
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            College Management ({colleges.length})
          </CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search colleges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterUniversity} onValueChange={setFilterUniversity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map(uni => (
                  <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Bulk Import Button */}
            <Dialog open={isBulkImportDialogOpen} onOpenChange={(open) => {
              setIsBulkImportDialogOpen(open);
              if (!open) {
                setCsvData([]);
                setCsvErrors([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Bulk Import Colleges from CSV
                  </DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with college data. Required column: name. Optional columns: email, address, university_name, contact_person_name, contact_person_email, contact_person_phone, contact_person_designation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload CSV file</p>
                      <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                    </label>
                  </div>

                  {csvErrors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Validation Errors
                      </div>
                      <ul className="text-sm text-destructive space-y-1">
                        {csvErrors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {csvData.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="font-medium">{csvData.length} colleges ready to import</span>
                      </div>
                      <ScrollArea className="h-48 border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>University</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Contact</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvData.slice(0, 10).map((row, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell>{row.university_name || 'Default'}</TableCell>
                                <TableCell>{row.email || '-'}</TableCell>
                                <TableCell>{row.contact_person_name || '-'}</TableCell>
                              </TableRow>
                            ))}
                            {csvData.length > 10 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  ... and {csvData.length - 10} more
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Importing...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(false)} disabled={isImporting}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImport} disabled={csvData.length === 0 || isImporting}>
                    {isImporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Import {csvData.length} Colleges
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add College Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add College
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New College</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4 p-1">
                    <div className="space-y-2">
                      <Label>College Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter college name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>University *</Label>
                      <Select value={formData.university_id} onValueChange={(value) => setFormData({ ...formData, university_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a university" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map(uni => (
                            <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter address"
                      />
                    </div>
                    <Separator />
                    <h4 className="font-medium text-sm">Contact Person</h4>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={formData.contact_person_name}
                        onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                        placeholder="Enter contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.contact_person_email}
                        onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                        placeholder="Enter contact email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.contact_person_phone}
                        onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                        placeholder="Enter contact phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input
                        value={formData.contact_person_designation}
                        onChange={(e) => setFormData({ ...formData, contact_person_designation: e.target.value })}
                        placeholder="Enter designation"
                      />
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCollege} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Add College
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredColleges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No colleges found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>College</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColleges.map((college) => (
                  <TableRow key={college.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{college.name}</p>
                        <p className="text-sm text-muted-foreground">{college.email || 'No email'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{college.university?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {college.contact_person_name || '-'}
                        {college.contact_person_phone && (
                          <p className="text-muted-foreground">{college.contact_person_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={college.is_active ? 'default' : 'secondary'}>
                        {college.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(college.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {/* View Students */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openStudentsDialog(college)}
                          title="View Students"
                        >
                          <Users className="h-4 w-4 text-primary" />
                        </Button>

                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailDialog(college)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Reassign to University */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openReassignDialog(college)}
                          title="Reassign to University"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        
                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(college)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {/* Toggle Active */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActiveToggle(college)}
                          title={college.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {college.is_active ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        
                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete College</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{college.name}"? This will also affect any coordinators and students linked to this college. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(college.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Detail View Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                College Details
              </DialogTitle>
              <DialogDescription>
                Full details for {selectedCollege?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedCollege && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 p-1">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">BASIC INFORMATION</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">College Name</Label>
                        <p className="font-medium">{selectedCollege.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p>{selectedCollege.email || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">University</Label>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{selectedCollege.university?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          <Badge variant={selectedCollege.is_active ? 'default' : 'secondary'}>
                            {selectedCollege.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <p>{selectedCollege.address || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Created On</Label>
                        <p>{new Date(selectedCollege.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Person */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">CONTACT PERSON</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p>{selectedCollege.contact_person_name || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Designation</Label>
                        <p>{selectedCollege.contact_person_designation || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p>{selectedCollege.contact_person_email || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p>{selectedCollege.contact_person_phone || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                </div>
              </ScrollArea>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                if (selectedCollege) openReassignDialog(selectedCollege);
                setIsDetailDialogOpen(false);
              }}>
                <Link2 className="h-4 w-4 mr-2" />
                Reassign University
              </Button>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reassign Dialog */}
        <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Reassign College
              </DialogTitle>
              <DialogDescription>
                Move "{selectedCollege?.name}" to a different university
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Current University</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {selectedCollege?.university?.name || 'Unknown'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>New University</Label>
                <Select value={selectedNewUniversity} onValueChange={setSelectedNewUniversity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(uni => (
                      <SelectItem key={uni.id} value={uni.id} disabled={uni.id === selectedCollege?.university_id}>
                        {uni.name} {uni.id === selectedCollege?.university_id ? '(current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedNewUniversity && selectedNewUniversity !== selectedCollege?.university_id && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    This will move the college and all its associated students to the new university.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleReassign} 
                disabled={saving || !selectedNewUniversity || selectedNewUniversity === selectedCollege?.university_id}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Reassign College
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit College</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-1">
                <div className="space-y-2">
                  <Label>College Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>University *</Label>
                  <Select value={formData.university_id} onValueChange={(value) => setFormData({ ...formData, university_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map(uni => (
                        <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <Separator />
                <h4 className="font-medium text-sm">Contact Person</h4>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.contact_person_name}
                    onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_person_email}
                    onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.contact_person_phone}
                    onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={formData.contact_person_designation}
                    onChange={(e) => setFormData({ ...formData, contact_person_designation: e.target.value })}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCollege} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Students Dialog */}
        <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students at {selectedCollege?.name}
              </DialogTitle>
              <DialogDescription>
                View and manage students enrolled at this college
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, email, or department..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {students.length === 0 
                    ? 'No students enrolled at this college.' 
                    : 'No students match your search.'}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Graduation Year</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{student.profile?.full_name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.department || '-'}</TableCell>
                          <TableCell>{student.graduation_year || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-48">
                              {student.skills?.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {(student.skills?.length || 0) > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(student.skills?.length || 0) - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(student.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total: {students.length} students</span>
                {studentSearchTerm && (
                  <span>Showing: {filteredStudents.length} results</span>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStudentsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </div>
    <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
