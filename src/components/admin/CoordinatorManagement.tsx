import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Search, CheckCircle, XCircle, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface Coordinator {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  address: string | null;
  college_id: string | null;
  university_id: string | null;
  is_approved: boolean | null;
  is_active: boolean | null;
  created_at: string;
  college?: { name: string } | null;
  university?: { name: string } | null;
}

export const CoordinatorManagement = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('college_coordinators')
      .select(`
        *,
        college:colleges(name),
        university:universities(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setCoordinators(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (coordinator: Coordinator) => {
    const { error } = await supabase
      .from('college_coordinators')
      .update({ is_approved: true })
      .eq('id', coordinator.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coordinator approved successfully' });
      fetchCoordinators();
    }
  };

  const handleRevoke = async (coordinator: Coordinator) => {
    const { error } = await supabase
      .from('college_coordinators')
      .update({ is_approved: false })
      .eq('id', coordinator.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coordinator approval revoked' });
      fetchCoordinators();
    }
  };

  const handleActiveToggle = async (coordinator: Coordinator) => {
    const { error } = await supabase
      .from('college_coordinators')
      .update({ is_active: !coordinator.is_active })
      .eq('id', coordinator.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Success',
        description: `Coordinator ${coordinator.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      fetchCoordinators();
    }
  };

  const handleDelete = async (coordinatorId: string) => {
    const { error } = await supabase.from('college_coordinators').delete().eq('id', coordinatorId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coordinator deleted successfully' });
      fetchCoordinators();
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    
    const { error } = await supabase
      .from('college_coordinators')
      .update({ is_approved: true })
      .in('id', selectedIds);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedIds.length} coordinators approved successfully` });
      setSelectedIds([]);
      fetchCoordinators();
    }
    setBulkProcessing(false);
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    
    const { error } = await supabase
      .from('college_coordinators')
      .delete()
      .in('id', selectedIds);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedIds.length} coordinators rejected and removed` });
      setSelectedIds([]);
      fetchCoordinators();
    }
    setBulkProcessing(false);
  };

  const filteredCoordinators = coordinators.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCoordinators = filteredCoordinators.filter((c) => !c.is_approved);
  const approvedCoordinators = filteredCoordinators.filter((c) => c.is_approved);

  const getDisplayedCoordinators = () => {
    switch (activeTab) {
      case 'pending':
        return pendingCoordinators;
      case 'approved':
        return approvedCoordinators;
      default:
        return filteredCoordinators;
    }
  };

  const displayedCoordinators = getDisplayedCoordinators();

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedCoordinators.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedCoordinators.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Coordinator Management ({coordinators.length})
          </CardTitle>
          <div className="relative flex-1 md:w-64 md:flex-none">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coordinators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Pending Alert Banner */}
        {pendingCoordinators.length > 0 && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                {pendingCoordinators.length} pending coordinator registration{pendingCoordinators.length > 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-sm text-muted-foreground">
                Review and approve registrations to allow coordinators to access the platform.
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingCoordinators.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCoordinators.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved ({approvedCoordinators.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All ({filteredCoordinators.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedIds.length} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={bulkProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                    Approve All
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={bulkProcessing}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Coordinators</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject and delete {selectedIds.length} selected coordinators? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkReject}>
                          Reject All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            {displayedCoordinators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeTab === 'pending' ? 'No pending coordinator registrations.' : 
                 activeTab === 'approved' ? 'No approved coordinators found.' : 
                 'No coordinators found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === displayedCoordinators.length && displayedCoordinators.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>College/University</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedCoordinators.map((coordinator) => (
                      <TableRow key={coordinator.id} className={!coordinator.is_approved ? 'bg-amber-500/5' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(coordinator.id)}
                            onCheckedChange={() => toggleSelect(coordinator.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <p>{coordinator.name}</p>
                            {coordinator.designation && (
                              <p className="text-xs text-muted-foreground">{coordinator.designation}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{coordinator.email}</TableCell>
                        <TableCell>
                          <div>
                            {coordinator.college?.name && (
                              <p className="text-sm">{coordinator.college.name}</p>
                            )}
                            {coordinator.university?.name && (
                              <p className="text-xs text-muted-foreground">{coordinator.university.name}</p>
                            )}
                            {!coordinator.college?.name && !coordinator.university?.name && '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={coordinator.is_active ? 'default' : 'secondary'}>
                            {coordinator.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={coordinator.is_approved ? 'default' : 'outline'} 
                            className={!coordinator.is_approved ? 'border-amber-500 text-amber-600' : ''}
                          >
                            {coordinator.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(coordinator.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!coordinator.is_approved ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(coordinator)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRevoke(coordinator)}
                                title="Revoke approval"
                              >
                                <XCircle className="h-4 w-4 text-amber-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleActiveToggle(coordinator)}
                              title={coordinator.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {coordinator.is_active ? (
                                <XCircle className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Delete">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Coordinator</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{coordinator.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(coordinator.id)}>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
