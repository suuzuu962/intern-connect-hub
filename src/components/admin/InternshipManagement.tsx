import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Briefcase, Trash2, Search, Eye, EyeOff, Building2 } from 'lucide-react';
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

interface Internship {
  id: string;
  title: string;
  description: string;
  location: string | null;
  is_active: boolean | null;
  created_at: string;
  views_count: number | null;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export const InternshipManagement = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleToggleActive = async (internshipId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from('internships')
        .update({ is_active: !currentStatus })
        .eq('id', internshipId);

      if (error) throw error;
      toast.success(`Internship ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchInternships();
    } catch (error: any) {
      toast.error('Failed to update internship status');
      console.error('Error updating internship:', error);
    }
  };

  const handleDelete = async (internshipId: string) => {
    try {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', internshipId);

      if (error) throw error;
      toast.success('Internship deleted successfully');
      fetchInternships();
    } catch (error: any) {
      toast.error('Failed to delete internship');
      console.error('Error deleting internship:', error);
    }
  };

  const filteredInternships = internships.filter(internship =>
    internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    internship.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
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
                    <TableHead>Location</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInternships.map((internship) => (
                    <TableRow key={internship.id}>
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
                      <TableCell>{internship.location || '-'}</TableCell>
                      <TableCell>{internship.views_count || 0}</TableCell>
                      <TableCell>
                        <Badge variant={internship.is_active ? 'default' : 'secondary'}>
                          {internship.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(internship.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(internship.id, internship.is_active)}
                          >
                            {internship.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
