import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserCheck, Search, Filter, CheckCircle, XCircle, MoreHorizontal, Power, PowerOff, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { CollegeCoordinator, College } from '@/types/database';
import { AddCoordinatorDialog } from './AddCoordinatorDialog';

interface UniversityCoordinatorsProps {
  universityId: string;
}

export const UniversityCoordinators = ({ universityId }: UniversityCoordinatorsProps) => {
  const [coordinators, setCoordinators] = useState<(CollegeCoordinator & { college?: College })[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [universityId]);

  const fetchData = async () => {
    // Fetch colleges
    const { data: collegesData } = await supabase
      .from('colleges')
      .select('*')
      .eq('university_id', universityId);
    
    setColleges(collegesData || []);

    // Fetch coordinators
    const { data: coordinatorsData, error } = await supabase
      .from('college_coordinators')
      .select('*, college:colleges(*)')
      .or(`university_id.eq.${universityId},college_id.in.(${(collegesData || []).map(c => c.id).join(',')})`);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setCoordinators(coordinatorsData || []);
    }
    setLoading(false);
  };

  const handleApprove = async (coordinatorId: string) => {
    const { error } = await supabase
      .from('college_coordinators')
      .update({ is_approved: true, university_id: universityId })
      .eq('id', coordinatorId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Coordinator approved successfully' });
      fetchData();
    }
  };

  const handleReject = async (coordinatorId: string) => {
    if (!confirm('Are you sure you want to reject this coordinator?')) return;

    const { error } = await supabase
      .from('college_coordinators')
      .update({ is_approved: false, is_active: false })
      .eq('id', coordinatorId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Coordinator rejected' });
      fetchData();
    }
  };

  const handleAssignCollege = async (coordinatorId: string, collegeId: string) => {
    const { error } = await supabase
      .from('college_coordinators')
      .update({ college_id: collegeId })
      .eq('id', coordinatorId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'College assigned successfully' });
      fetchData();
    }
  };

  const handleToggleActive = async (coordinator: CollegeCoordinator) => {
    setActionLoading(coordinator.id);
    const newStatus = !coordinator.is_active;

    const { error } = await supabase
      .from('college_coordinators')
      .update({ is_active: newStatus })
      .eq('id', coordinator.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update coordinator status', variant: 'destructive' });
    } else {
      toast({
        title: newStatus ? 'Coordinator activated' : 'Coordinator deactivated',
        description: `${coordinator.name} has been ${newStatus ? 'activated' : 'deactivated'}`,
      });
      fetchData();
    }
    setActionLoading(null);
  };

  const handleRemove = async (coordinator: CollegeCoordinator) => {
    setActionLoading(coordinator.id);

    const { error } = await supabase
      .from('college_coordinators')
      .delete()
      .eq('id', coordinator.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to remove coordinator', variant: 'destructive' });
    } else {
      toast({ title: 'Coordinator removed', description: `${coordinator.name} has been removed` });
      fetchData();
    }
    setActionLoading(null);
  };

  const filteredCoordinators = coordinators.filter((coord) => {
    const matchesSearch = coord.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coord.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !coord.is_approved) ||
      (statusFilter === 'approved' && coord.is_approved);
    return matchesSearch && matchesStatus;
  });

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
          <UserCheck className="h-5 w-5" />
          College Coordinators ({coordinators.length})
        </CardTitle>
        <AddCoordinatorDialog
          universityId={universityId}
          colleges={colleges}
          onSuccess={fetchData}
        />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'approved') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredCoordinators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No coordinators found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoordinators.map((coordinator) => (
                <TableRow key={coordinator.id}>
                  <TableCell className="font-medium">{coordinator.name}</TableCell>
                  <TableCell>{coordinator.email}</TableCell>
                  <TableCell>{coordinator.phone || '-'}</TableCell>
                  <TableCell>
                    {coordinator.college ? (
                      coordinator.college.name
                    ) : colleges.length > 0 ? (
                      <Select
                        value={coordinator.college_id || undefined}
                        onValueChange={(value) => handleAssignCollege(coordinator.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign college" />
                        </SelectTrigger>
                        <SelectContent>
                          {colleges.filter(college => college.id).map((college) => (
                            <SelectItem key={college.id} value={college.id}>
                              {college.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground text-sm">No colleges</span>
                    )}
                  </TableCell>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!coordinator.is_approved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(coordinator.id)}
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoading === coordinator.id}>
                            {actionLoading === coordinator.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {coordinator.is_approved && (
                            <DropdownMenuItem onClick={() => handleReject(coordinator.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Revoke Approval
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleActive(coordinator)}>
                            {coordinator.is_active ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Coordinator</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove <strong>{coordinator.name}</strong>?
                                  This will remove their coordinator record. Their login account will remain but they won't have coordinator access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleRemove(coordinator)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
