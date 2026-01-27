import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Building, User, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { University } from '@/types/database';

interface UniversityProfileProps {
  university: University;
  onUpdate: (university: University) => void;
}

export const UniversityProfile = ({ university, onUpdate }: UniversityProfileProps) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: university.name || '',
    email: university.email || '',
    contact_person_name: university.contact_person_name || '',
    contact_person_email: university.contact_person_email || '',
    contact_person_phone: university.contact_person_phone || '',
    contact_person_designation: university.contact_person_designation || '',
    address: university.address || '',
    logo_url: university.logo_url || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `university-logos/${university.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Upload Failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from('company-files')
      .getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, logo_url: publicUrl.publicUrl }));
    setUploading(false);
    toast({ title: 'Logo uploaded successfully' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data, error } = await supabase
      .from('universities')
      .update(formData)
      .eq('id', university.id)
      .select()
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
          <Building className="h-5 w-5" />
          University Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="University Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label htmlFor="logo" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </div>
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>

          {/* University Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">University Name *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
              <Label htmlFor="email">University Email *</Label>
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
          </div>

          {/* Contact Person Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Person Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person_name">Name</Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={(e) => handleChange('contact_person_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person_email">Email</Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  value={formData.contact_person_email}
                  onChange={(e) => handleChange('contact_person_email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person_phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_person_phone"
                    value={formData.contact_person_phone}
                    onChange={(e) => handleChange('contact_person_phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person_designation">Designation</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_person_designation"
                    value={formData.contact_person_designation}
                    onChange={(e) => handleChange('contact_person_designation', e.target.value)}
                    className="pl-10"
                  />
                </div>
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
