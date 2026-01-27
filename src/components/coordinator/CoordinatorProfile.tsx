import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Mail, MapPin, Briefcase, School } from 'lucide-react';
import { CollegeCoordinator } from '@/types/database';
import { PhoneInput } from '@/components/ui/phone-input';

interface CoordinatorProfileProps {
  coordinator: CollegeCoordinator;
  onUpdate: (coordinator: CollegeCoordinator) => void;
}

export const CoordinatorProfile = ({ coordinator, onUpdate }: CoordinatorProfileProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: coordinator.name || '',
    email: coordinator.email || '',
    phone: coordinator.phone || '',
    designation: coordinator.designation || '',
    address: coordinator.address || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data, error } = await supabase
      .from('college_coordinators')
      .update(formData)
      .eq('id', coordinator.id)
      .select('*, college:colleges(*), university:universities(*)')
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Profile updated successfully' });
      onUpdate(data);
    }

    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Coordinator Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* College Info - Read Only */}
          {coordinator.college && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <School className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Assigned College</span>
              </div>
              <p className="text-lg">{coordinator.college.name}</p>
            </div>
          )}

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pl-10 bg-muted cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                value={formData.phone}
                onChange={(v) => handleChange('phone', v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
