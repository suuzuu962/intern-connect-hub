import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save } from 'lucide-react';
import { College } from '@/types/database';

interface CollegeProfileProps {
  college: College;
  onUpdate: (college: College) => void;
}

export const CollegeProfile = ({ college, onUpdate }: CollegeProfileProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: college.name || '',
    email: college.email || '',
    address: college.address || '',
    contact_person_name: college.contact_person_name || '',
    contact_person_email: college.contact_person_email || '',
    contact_person_phone: college.contact_person_phone || '',
    contact_person_designation: college.contact_person_designation || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('colleges')
      .update(formData)
      .eq('id', college.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update college profile',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'College profile updated successfully',
      });
      onUpdate(data);
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>College Profile</CardTitle>
        <CardDescription>Update your college information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">College Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">College Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Contact Person Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_person_name">Name</Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person_designation">Designation</Label>
                <Input
                  id="contact_person_designation"
                  value={formData.contact_person_designation}
                  onChange={(e) => setFormData({ ...formData, contact_person_designation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person_email">Email</Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  value={formData.contact_person_email}
                  onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person_phone">Phone</Label>
                <Input
                  id="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
