import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Briefcase, Shield, Eye, Star, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyRoleAssignmentDialog } from './CompanyRoleAssignmentDialog';

interface CompanyApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    user_id: string;
  };
  onApproved: () => void;
}

interface CompanyLimits {
  max_internships: number;
  max_active_internships: number;
  max_applications_per_internship: number;
  can_post_paid_internships: boolean;
  can_post_free_internships: boolean;
  can_view_student_contact: boolean;
  can_view_resumes: boolean;
  can_feature_listings: boolean;
  notes: string;
}

interface RolePermission {
  feature_key: string;
  is_enabled: boolean;
  settings: Record<string, unknown>;
}

const COMPANY_FEATURES = [
  { key: 'post_internships', label: 'Post Internships', description: 'Create and manage internship listings' },
  { key: 'view_applications', label: 'View Applications', description: 'Access to student applications' },
  { key: 'view_students', label: 'Browse Students', description: 'Search and view student profiles' },
];

const defaultLimits: CompanyLimits = {
  max_internships: 5,
  max_active_internships: 3,
  max_applications_per_internship: 100,
  can_post_paid_internships: true,
  can_post_free_internships: true,
  can_view_student_contact: true,
  can_view_resumes: true,
  can_feature_listings: false,
  notes: '',
};

export const CompanyApprovalDialog = ({
  open,
  onOpenChange,
  company,
  onApproved,
}: CompanyApprovalDialogProps) => {
  const [limits, setLimits] = useState<CompanyLimits>(defaultLimits);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [existingLimits, setExistingLimits] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  const [activeInternships, setActiveInternships] = useState(0);
  const [totalInternships, setTotalInternships] = useState(0);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, company.id]);

  const fetchData = async () => {
    // Fetch role permissions for company, existing limits, and internship counts in parallel
    const [permRes, limitsRes, internshipsRes] = await Promise.all([
      supabase.from('role_permissions').select('*').eq('role', 'company'),
      supabase.from('company_limits').select('*').eq('company_id', company.id).maybeSingle(),
      supabase.from('internships').select('id, is_active').eq('company_id', company.id),
    ]);

    if (permRes.data) {
      setRolePermissions(permRes.data as unknown as RolePermission[]);
    }

    if (limitsRes.data) {
      setExistingLimits(limitsRes.data);
      setLimits({
        max_internships: limitsRes.data.max_internships,
        max_active_internships: limitsRes.data.max_active_internships,
        max_applications_per_internship: limitsRes.data.max_applications_per_internship,
        can_post_paid_internships: limitsRes.data.can_post_paid_internships,
        can_post_free_internships: limitsRes.data.can_post_free_internships,
        can_view_student_contact: limitsRes.data.can_view_student_contact,
        can_view_resumes: limitsRes.data.can_view_resumes,
        can_feature_listings: limitsRes.data.can_feature_listings,
        notes: limitsRes.data.notes || '',
      });
    } else {
      setLimits(defaultLimits);
      setExistingLimits(null);
    }

    if (internshipsRes.data) {
      setTotalInternships(internshipsRes.data.length);
      setActiveInternships(internshipsRes.data.filter((i: any) => i.is_active).length);
    }
  };

  const getPermissionStatus = (featureKey: string) => {
    const perm = rolePermissions.find(p => p.feature_key === featureKey);
    return perm ? perm.is_enabled : true;
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upsert company limits
      if (existingLimits) {
        const { error: limitsError } = await supabase
          .from('company_limits')
          .update({
            ...limits,
            set_by: user?.id,
          })
          .eq('company_id', company.id);
        if (limitsError) throw limitsError;
      } else {
        const { error: limitsError } = await supabase
          .from('company_limits')
          .insert({
            company_id: company.id,
            ...limits,
            set_by: user?.id,
          });
        if (limitsError) throw limitsError;
      }

      // Approve the company
      const { error: approveError } = await supabase
        .from('companies')
        .update({ is_verified: true })
        .eq('id', company.id);

      if (approveError) throw approveError;

      toast.success(`${company.name} approved with configured limits`);
      onOpenChange(false);
      // Show role assignment dialog
      setShowRoleAssignment(true);
    } catch (error: any) {
      toast.error('Failed to approve company: ' + error.message);
      console.error(error);
    } finally {
      setApproving(false);
    }
  };

  const remainingInternships = limits.max_internships - totalInternships;
  const remainingActive = limits.max_active_internships - activeInternships;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Approve Company: {company.name}
          </DialogTitle>
          <DialogDescription>
            Set permissions and limits before approving this company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Role Permissions Display */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Company Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {COMPANY_FEATURES.map(feature => {
                const enabled = getPermissionStatus(feature.key);
                return (
                  <div key={feature.key} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                    <Badge variant={enabled ? 'default' : 'secondary'}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground pt-1">
                These are global role permissions. Manage them in the Permissions tab.
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Internship Limits */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-primary" />
              Internship Limits
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="max-internships" className="text-xs">Max Total Internships</Label>
                <Input
                  id="max-internships"
                  type="number"
                  min={0}
                  value={limits.max_internships}
                  onChange={e => setLimits({ ...limits, max_internships: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-active" className="text-xs">Max Active Internships</Label>
                <Input
                  id="max-active"
                  type="number"
                  min={0}
                  value={limits.max_active_internships}
                  onChange={e => setLimits({ ...limits, max_active_internships: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-apps" className="text-xs">Max Applications/Internship</Label>
                <Input
                  id="max-apps"
                  type="number"
                  min={0}
                  value={limits.max_applications_per_internship}
                  onChange={e => setLimits({ ...limits, max_applications_per_internship: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Current Usage Stats */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Total Posted</p>
                <p className="text-lg font-semibold">{totalInternships}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Active Now</p>
                <p className="text-lg font-semibold">{activeInternships}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Remaining Slots</p>
                <p className={`text-lg font-semibold ${remainingInternships <= 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {remainingInternships}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Access Permissions */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              Access Permissions
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'can_post_paid_internships', label: 'Post Paid Internships' },
                { key: 'can_post_free_internships', label: 'Post Free Internships' },
                { key: 'can_view_student_contact', label: 'View Student Contact' },
                { key: 'can_view_resumes', label: 'View Resumes' },
                { key: 'can_feature_listings', label: 'Feature Listings' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <Label htmlFor={item.key} className="text-sm cursor-pointer">{item.label}</Label>
                  <Switch
                    id={item.key}
                    checked={limits[item.key as keyof CompanyLimits] as boolean}
                    onCheckedChange={v => setLimits({ ...limits, [item.key]: v })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="approval-notes" className="text-xs">Admin Notes (optional)</Label>
            <Textarea
              id="approval-notes"
              value={limits.notes}
              onChange={e => setLimits({ ...limits, notes: e.target.value })}
              placeholder="Any notes about this approval..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            {approving ? 'Approving...' : 'Confirm & Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <CompanyRoleAssignmentDialog
      open={showRoleAssignment}
      onOpenChange={setShowRoleAssignment}
      company={company}
      onComplete={onApproved}
    />
    </>
  );
};
