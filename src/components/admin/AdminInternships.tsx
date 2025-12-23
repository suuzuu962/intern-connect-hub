import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Briefcase, Building2, MapPin, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface InternshipWithCompany {
  id: string;
  title: string;
  description: string;
  location: string | null;
  work_mode: string;
  internship_type: string;
  duration: string | null;
  stipend: number | null;
  is_active: boolean;
  views_count: number | null;
  created_at: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

const AdminInternships = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: internships, isLoading } = useQuery({
    queryKey: ['admin-internships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internships')
        .select(`
          *,
          company:companies(id, name, logo_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InternshipWithCompany[];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('internships')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: 'Success',
        description: 'Internship status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update internship status',
        variant: 'destructive',
      });
    },
  });

  const deleteInternshipMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: 'Success',
        description: 'Internship deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete internship',
        variant: 'destructive',
      });
    },
  });

  const filteredInternships = internships?.filter(internship => {
    const matchesSearch = 
      internship.title.toLowerCase().includes(search.toLowerCase()) ||
      internship.company?.name.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'active') return matchesSearch && internship.is_active;
    if (filter === 'inactive') return matchesSearch && !internship.is_active;
    return matchesSearch;
  });

  const formatWorkMode = (mode: string) => {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const formatInternshipType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Internship Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search internships..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={filter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFilter('inactive')}
              size="sm"
            >
              Inactive
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Internship</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInternships?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No internships found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInternships?.map((internship) => (
                  <TableRow key={internship.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{internship.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {internship.duration || 'Duration not specified'}
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
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm">{internship.company?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {internship.location ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {internship.location}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs w-fit">
                          {formatWorkMode(internship.work_mode)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs w-fit">
                          {formatInternshipType(internship.internship_type)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={internship.is_active ? 'default' : 'secondary'}>
                        {internship.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{internship.views_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: internship.id, 
                            is_active: !internship.is_active 
                          })}
                        >
                          {internship.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Show
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
                                onClick={() => deleteInternshipMutation.mutate(internship.id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminInternships;
