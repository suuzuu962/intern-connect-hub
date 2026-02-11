import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, UserCog } from 'lucide-react';

interface CompanyProfileCompletionProps {
  companyId: string | null;
  companyName: string;
  logoUrl: string | null;
  isVerified: boolean | null;
  onEditProfile: () => void;
}

interface FieldCheck {
  name: string;
  value: any;
}

export const CompanyProfileCompletion = ({
  companyId,
  companyName,
  logoUrl,
  isVerified,
  onEditProfile,
}: CompanyProfileCompletionProps) => {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completedFields, setCompletedFields] = useState(0);
  const [totalFields, setTotalFields] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (companyId) {
      calculateProfileCompletion();
    }
  }, [companyId]);

  const calculateProfileCompletion = async () => {
    if (!companyId) return;

    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!companyData) return;

      const fieldChecks: FieldCheck[] = [
        { name: 'Company Name', value: companyData.name },
        { name: 'About Company', value: companyData.about_company },
        { name: 'Short Description', value: companyData.short_description },
        { name: 'Domain Category', value: companyData.domain_category },
        { name: 'Year Founded', value: companyData.founded_year },
        { name: 'GST/PAN', value: companyData.gst_pan },
        { name: 'Employee Count', value: companyData.employee_count },
        { name: 'Logo', value: companyData.logo_url },
        { name: 'Cover Image', value: companyData.cover_image_url },
        { name: 'Website', value: companyData.website },
        { name: 'Address', value: companyData.address },
        { name: 'Country', value: companyData.country },
        { name: 'State', value: companyData.state },
        { name: 'City', value: companyData.city },
        { name: 'Postal Code', value: companyData.postal_code },
        { name: 'Contact Person Name', value: companyData.contact_person_name },
        { name: 'Contact Person Email', value: companyData.contact_person_email },
        { name: 'Contact Person Phone', value: companyData.contact_person_phone },
        { name: 'Designation', value: companyData.contact_person_designation },
        { name: 'LinkedIn', value: companyData.linkedin_url },
        { name: 'Company Profile PDF', value: companyData.company_profile_url },
        { name: 'Registration Proof', value: companyData.registration_profile_url },
      ];

      let completed = 0;
      const missing: string[] = [];

      fieldChecks.forEach((field) => {
        if (field.value) {
          completed++;
        } else {
          missing.push(field.name);
        }
      });

      setCompletedFields(completed);
      setTotalFields(fieldChecks.length);
      setMissingFields(missing);
      setProfileCompletion(Math.round((completed / fieldChecks.length) * 100));
    } catch (error) {
      console.error('Error calculating profile completion:', error);
    }
  };

  const displayedMissingFields = missingFields.slice(0, 5);
  const remainingCount = missingFields.length - 5;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">Profile Completion</h2>
              <p className="text-sm text-muted-foreground">
                {completedFields} of {totalFields} fields completed
              </p>
            </div>
          </div>
          <span
            className={`text-3xl font-bold ${
              profileCompletion === 100 ? 'text-green-500' : 'text-amber-500'
            }`}
          >
            {profileCompletion}%
          </span>
        </div>

        <Progress
          value={profileCompletion}
          className={`h-2 mt-4 ${
            profileCompletion === 100
              ? '[&>div]:bg-green-500'
              : '[&>div]:bg-amber-500'
          }`}
        />

        {profileCompletion < 100 && missingFields.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
              Required fields missing:
            </p>
            <div className="flex flex-wrap gap-2">
              {displayedMissingFields.map((field) => (
                <Badge
                  key={field}
                  variant="outline"
                  className="bg-white dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                >
                  {field}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-white dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                >
                  +{remainingCount} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={onEditProfile} variant="outline" size="sm">
            <UserCog className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
