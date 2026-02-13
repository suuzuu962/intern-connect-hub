import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, UserPlus, Eye, EyeOff } from 'lucide-react';
import { CollegeCoordinator } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface CollegeCoordinatorsProps {
  collegeId: string;
}

export const CollegeCoordinators = ({ collegeId }: CollegeCoordinatorsProps) => {
  const [coordinators, setCoordinators] = useState<CollegeCoordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    address: '',
  });

  const fetchCoordinators = async () => {
    const { data, error } = await supabase
      .from('college_coordinators')
      .select('*')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coordinators:', error);
    } else {
      setCoordinators(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoordinators();

    // Get university_id from the college
    const fetchUniversityId = async () => {
      const { data } = await supabase
        .from('colleges')
        .select('university_id')
        .eq('id', collegeId)
        .single();
      if (data) setUniversityId(data.university_id);
    };
    fetchUniversityId();
  }, [collegeId]);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', designation: '', address: '' });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (!universityId) {
      toast({ title: 'Error', description: 'University not found for this college', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-coordinator-account', {
        body: {
          ...formData,
          college_id: collegeId,
          university_id: universityId,
        },
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Coordinator added successfully', description: 'Account created with the provided credentials' });
        setOpen(false);
        resetForm();
        fetchCoordinators();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create coordinator', variant: 'destructive' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              College Coordinators
            </CardTitle>
            <CardDescription>
              {coordinators.length} coordinator{coordinators.length !== 1 ? 's' : ''} assigned
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Coordinator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Coordinator</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coord-name">Full Name *</Label>
                    <Input
                      id="coord-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coord-email">Email *</Label>
                    <Input
                      id="coord-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="coordinator@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coord-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="coord-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                  <p className="text-xs text-muted-foreground">
                    This will be the login password for the coordinator account
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coord-phone">Phone</Label>
                    <Input
                      id="coord-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coord-designation">Designation</Label>
                    <Input
                      id="coord-designation"
                      value={formData.designation}
                      onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                      placeholder="e.g., HOD, Professor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coord-address">Address</Label>
                  <Input
                    id="coord-address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Office address"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Coordinator
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {coordinators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No coordinators assigned yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators.map((coordinator) => (
                <TableRow key={coordinator.id}>
                  <TableCell className="font-medium">{coordinator.name}</TableCell>
                  <TableCell>{coordinator.email}</TableCell>
                  <TableCell>{coordinator.phone || '-'}</TableCell>
                  <TableCell>{coordinator.designation || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant={coordinator.is_approved ? 'default' : 'secondary'}>
                        {coordinator.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                      <Badge variant={coordinator.is_active ? 'outline' : 'destructive'}>
                        {coordinator.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
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
