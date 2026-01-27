import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Edit, Trash2, School, Search, Eye, EyeOff } from 'lucide-react';
import { College } from '@/types/database';

interface UniversityCollegesProps {
  universityId: string;
}

export const UniversityColleges = ({ universityId }: UniversityCollegesProps) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    contact_person_designation: '',
    address: '',
  });

  useEffect(() => {
    fetchColleges();
  }, [universityId]);

  const fetchColleges = async () => {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('university_id', universityId)
      .order('name');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setColleges(data || []);
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      contact_person_name: '',
      contact_person_email: '',
      contact_person_phone: '',
      contact_person_designation: '',
      address: '',
    });
    setEditingCollege(null);
    setShowPassword(false);
  };

  const handleEdit = (college: College) => {
    setEditingCollege(college);
    setFormData({
      name: college.name || '',
      email: college.email || '',
      password: '', // Don't show password when editing
      contact_person_name: college.contact_person_name || '',
      contact_person_email: college.contact_person_email || '',
      contact_person_phone: college.contact_person_phone || '',
      contact_person_designation: college.contact_person_designation || '',
      address: college.address || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'College name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);

    if (editingCollege) {
      // Update existing college (no password update)
      const { password, ...updateData } = formData;
      const { error } = await supabase
        .from('colleges')
        .update(updateData)
        .eq('id', editingCollege.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'College updated successfully' });
        fetchColleges();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      // Create new college with account
      if (!formData.email.trim()) {
        toast({ title: 'Error', description: 'Email is required for new college', variant: 'destructive' });
        setSaving(false);
        return;
      }
      if (!formData.password.trim() || formData.password.length < 6) {
        toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
        setSaving(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('create-college-account', {
          body: {
            ...formData,
            university_id: universityId,
          },
        });

        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else if (data?.error) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' });
        } else {
          toast({ title: 'College added successfully', description: 'Account created with the provided email and password' });
          fetchColleges();
          setDialogOpen(false);
          resetForm();
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to create college', variant: 'destructive' });
      }
    }

    setSaving(false);
  };

  const handleDelete = async (collegeId: string) => {
    if (!confirm('Are you sure you want to delete this college?')) return;

    const { error } = await supabase.from('colleges').delete().eq('id', collegeId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'College deleted successfully' });
      fetchColleges();
    }
  };

  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          Colleges ({colleges.length})
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add College
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCollege ? 'Edit College' : 'Add New College'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">College Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    disabled={!!editingCollege}
                  />
                  {editingCollege && (
                    <p className="text-xs text-muted-foreground">Email cannot be changed after creation</p>
                  )}
                </div>
                {!editingCollege && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder="Min 6 characters"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">This will be the login password for the college account</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="contact_person_name">Contact Person Name</Label>
                  <Input
                    id="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={(e) => handleChange('contact_person_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person_email">Contact Person Email</Label>
                  <Input
                    id="contact_person_email"
                    type="email"
                    value={formData.contact_person_email}
                    onChange={(e) => handleChange('contact_person_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person_phone">Contact Person Phone</Label>
                  <Input
                    id="contact_person_phone"
                    value={formData.contact_person_phone}
                    onChange={(e) => handleChange('contact_person_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person_designation">Designation</Label>
                  <Input
                    id="contact_person_designation"
                    value={formData.contact_person_designation}
                    onChange={(e) => handleChange('contact_person_designation', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingCollege ? 'Update' : 'Add'} College
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredColleges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No colleges found. Add your first college to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredColleges.map((college) => (
                <TableRow key={college.id}>
                  <TableCell className="font-medium">{college.name}</TableCell>
                  <TableCell>{college.contact_person_name || '-'}</TableCell>
                  <TableCell>{college.email || '-'}</TableCell>
                  <TableCell>{college.contact_person_phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={college.is_active ? 'default' : 'secondary'}>
                      {college.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(college)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(college.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
