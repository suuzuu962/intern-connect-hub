import { useState, useEffect } from 'react';
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
import { Loader2, GraduationCap, Search, Plus, CheckCircle, XCircle, Pencil, Trash2, Eye, Link2, Building, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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

interface Coordinator {
  id: string;
  name: string;
  email: string;
  is_approved: boolean | null;
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
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUniversity, setFilterUniversity] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CollegeFormData>(initialFormData);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedNewUniversity, setSelectedNewUniversity] = useState<string>('');
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

  const fetchCollegeCoordinators = async (collegeId: string) => {
    const { data, error } = await supabase
      .from('college_coordinators')
      .select('id, name, email, is_approved')
      .eq('college_id', collegeId);

    if (!error) {
      setCoordinators(data || []);
    }
  };

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
    await fetchCollegeCoordinators(college.id);
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

                  {/* Coordinators */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      ASSIGNED COORDINATORS ({coordinators.length})
                    </h4>
                    {coordinators.length > 0 ? (
                      <div className="space-y-2">
                        {coordinators.map(coord => (
                          <div key={coord.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium">{coord.name}</p>
                              <p className="text-sm text-muted-foreground">{coord.email}</p>
                            </div>
                            <Badge variant={coord.is_approved ? 'default' : 'outline'}>
                              {coord.is_approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No coordinators assigned to this college.</p>
                    )}
                  </div>
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
                    This will move the college and all its associated coordinators and students to the new university.
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
      </CardContent>
    </Card>
  );
};
