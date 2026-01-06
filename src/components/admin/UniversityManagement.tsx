import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building, Search, Plus, CheckCircle, XCircle, Pencil, Trash2, ShieldCheck, ShieldX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface University {
  id: string;
  user_id: string;
  name: string;
  email: string;
  logo_url: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  address: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

interface UniversityFormData {
  name: string;
  email: string;
  password: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  contact_person_designation: string;
  address: string;
}

const initialFormData: UniversityFormData = {
  name: '',
  email: '',
  password: '',
  contact_person_name: '',
  contact_person_email: '',
  contact_person_phone: '',
  contact_person_designation: '',
  address: '',
};

export const UniversityManagement = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setUniversities(data || []);
    }
    setLoading(false);
  };

  const handleAddUniversity = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: 'Error', description: 'Name, email and password are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Create user via edge function
      const { data: userData, error: userError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
          role: 'university',
        },
      });

      if (userError) throw userError;
      if (!userData?.user_id) throw new Error('Failed to create user');

      // Create university record
      const { error: uniError } = await supabase.from('universities').insert({
        user_id: userData.user_id,
        name: formData.name,
        email: formData.email,
        contact_person_name: formData.contact_person_name || null,
        contact_person_email: formData.contact_person_email || null,
        contact_person_phone: formData.contact_person_phone || null,
        contact_person_designation: formData.contact_person_designation || null,
        address: formData.address || null,
        is_verified: true,
        is_active: true,
      });

      if (uniError) throw uniError;

      toast({ title: 'Success', description: 'University added successfully' });
      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      fetchUniversities();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditUniversity = async () => {
    if (!selectedUniversity || !formData.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('universities')
      .update({
        name: formData.name,
        contact_person_name: formData.contact_person_name || null,
        contact_person_email: formData.contact_person_email || null,
        contact_person_phone: formData.contact_person_phone || null,
        contact_person_designation: formData.contact_person_designation || null,
        address: formData.address || null,
      })
      .eq('id', selectedUniversity.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'University updated successfully' });
      setIsEditDialogOpen(false);
      setSelectedUniversity(null);
      setFormData(initialFormData);
      fetchUniversities();
    }
    setSaving(false);
  };

  const handleVerifyToggle = async (university: University) => {
    const { error } = await supabase
      .from('universities')
      .update({ is_verified: !university.is_verified })
      .eq('id', university.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Success',
        description: `University ${university.is_verified ? 'unverified' : 'verified'} successfully`,
      });
      fetchUniversities();
    }
  };

  const handleActiveToggle = async (university: University) => {
    const { error } = await supabase
      .from('universities')
      .update({ is_active: !university.is_active })
      .eq('id', university.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Success',
        description: `University ${university.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      fetchUniversities();
    }
  };

  const handleDelete = async (universityId: string) => {
    const { error } = await supabase.from('universities').delete().eq('id', universityId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'University deleted successfully' });
      fetchUniversities();
    }
  };

  const openEditDialog = (university: University) => {
    setSelectedUniversity(university);
    setFormData({
      name: university.name,
      email: university.email,
      password: '',
      contact_person_name: university.contact_person_name || '',
      contact_person_email: university.contact_person_email || '',
      contact_person_phone: university.contact_person_phone || '',
      contact_person_designation: university.contact_person_designation || '',
      address: university.address || '',
    });
    setIsEditDialogOpen(true);
  };

  const filteredUniversities = universities.filter(
    (uni) =>
      uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Building className="h-5 w-5" />
            University Management ({universities.length})
          </CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search universities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add University
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New University</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>University Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter university name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person Name</Label>
                    <Input
                      value={formData.contact_person_name}
                      onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_person_email}
                      onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                      placeholder="Enter contact email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person Phone</Label>
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
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUniversity} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Add University
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUniversities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No universities found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUniversities.map((university) => (
                  <TableRow key={university.id}>
                    <TableCell className="font-medium">{university.name}</TableCell>
                    <TableCell>{university.email}</TableCell>
                    <TableCell>
                      {university.contact_person_name ? (
                        <div>
                          <p className="text-sm">{university.contact_person_name}</p>
                          <p className="text-xs text-muted-foreground">{university.contact_person_phone}</p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={university.is_active ? 'default' : 'secondary'}>
                        {university.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={university.is_verified ? 'default' : 'outline'}>
                        {university.is_verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(university.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVerifyToggle(university)}
                          title={university.is_verified ? 'Revoke verification' : 'Verify'}
                        >
                          {university.is_verified ? (
                            <ShieldX className="h-4 w-4 text-amber-500" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActiveToggle(university)}
                          title={university.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {university.is_active ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(university)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete University</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{university.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(university.id)}>
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
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>University Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter university name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person Name</Label>
              <Input
                value={formData.contact_person_name}
                onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                placeholder="Enter contact name"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Person Email</Label>
              <Input
                type="email"
                value={formData.contact_person_email}
                onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                placeholder="Enter contact email"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Person Phone</Label>
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
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUniversity} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
