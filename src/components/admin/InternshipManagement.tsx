import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Briefcase, Trash2, Search, Eye, EyeOff, Building2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Internship {
  id: string;
  title: string;
  description: string;
  location: string | null;
  is_active: boolean | null;
  created_at: string;
  views_count: number | null;
  internship_type: string;
  work_mode: string;
  fees: number | null;
  stipend: number | null;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

// Track admin-deactivated internships in localStorage
const ADMIN_DEACTIVATED_KEY = 'admin_deactivated_internships';

const getAdminDeactivatedIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(ADMIN_DEACTIVATED_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

const saveAdminDeactivatedIds = (ids: Set<string>) => {
  localStorage.setItem(ADMIN_DEACTIVATED_KEY, JSON.stringify([...ids]));
};

export const InternshipManagement = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminDeactivatedIds, setAdminDeactivatedIds] = useState<Set<string>>(getAdminDeactivatedIds());

  const fetchInternships = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select(`
          *,
          company:companies(id, name, logo_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch internships');
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleDeactivate = async (internshipId: string) => {
    try {
      const { error } = await supabase
        .from('internships')
        .update({ is_active: false })
        .eq('id', internshipId);

      if (error) throw error;
      
      // Mark as admin-deactivated
      const newIds = new Set(adminDeactivatedIds);
      newIds.add(internshipId);
      setAdminDeactivatedIds(newIds);
      saveAdminDeactivatedIds(newIds);
      
      toast.success('Internship deactivated by admin. Only super admin can reactivate.');
      fetchInternships();
    } catch (error: any) {
      toast.error('Failed to deactivate internship');
      console.error('Error deactivating internship:', error);
    }
  };

  const handleActivate = async (internshipId: string) => {
    try {
      const { error } = await supabase
        .from('internships')
        .update({ is_active: true })
        .eq('id', internshipId);

      if (error) throw error;
      
      // Remove from admin-deactivated list
      const newIds = new Set(adminDeactivatedIds);
      newIds.delete(internshipId);
      setAdminDeactivatedIds(newIds);
      saveAdminDeactivatedIds(newIds);
      
      toast.success('Internship activated successfully');
      fetchInternships();
    } catch (error: any) {
      toast.error('Failed to activate internship');
      console.error('Error activating internship:', error);
    }
  };

  const handleDelete = async (internshipId: string) => {
    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', internshipId);

      if (error) throw error;
      
      // Remove from admin-deactivated list if present
      const newIds = new Set(adminDeactivatedIds);
      newIds.delete(internshipId);
      setAdminDeactivatedIds(newIds);
      saveAdminDeactivatedIds(newIds);
      
      toast.success('Internship deleted successfully');
      fetchInternships();
    } catch (error: any) {
      toast.error('Failed to delete internship');
      console.error('Error deleting internship:', error);
    }
  };

  const isAdminDeactivated = (id: string) => adminDeactivatedIds.has(id);

  const filteredInternships = internships.filter(internship =>
    internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    internship.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Paid</Badge>;
      case 'stipended':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Stipended</Badge>;
      case 'free':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">Free</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                All Internships ({internships.length})
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search internships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInternships.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchQuery ? 'No matching internships found' : 'No internships available'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Internship</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInternships.map((internship) => {
                      const adminLocked = isAdminDeactivated(internship.id);
                      return (
                        <TableRow key={internship.id} className={adminLocked ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{internship.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {internship.description.substring(0, 50)}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {internship.company?.logo_url ? (
                                <img 
                                  src={internship.company.logo_url} 
                                  alt={internship.company.name} 
                                  className="h-8 w-8 rounded object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <span>{internship.company?.name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(internship.internship_type)}</TableCell>
                          <TableCell>{internship.location || '-'}</TableCell>
                          <TableCell>{internship.views_count || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant={internship.is_active ? 'default' : 'secondary'}>
                                {internship.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {adminLocked && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3 w-3 text-red-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Deactivated by Admin - Only Super Admin can reactivate</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(internship.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {internship.is_active ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-orange-600 hover:text-orange-700">
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Deactivate
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        Deactivate Internship
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will deactivate "{internship.title}" and mark it as <strong>admin-locked</strong>. 
                                        The company will <strong>NOT</strong> be able to reactivate it. 
                                        Only a Super Admin can reactivate this internship.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeactivate(internship.id)}
                                        className="bg-orange-600 hover:bg-orange-700"
                                      >
                                        <Lock className="h-4 w-4 mr-1" />
                                        Deactivate & Lock
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleActivate(internship.id)}
                                >
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Activate
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Internship</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{internship.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(internship.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
