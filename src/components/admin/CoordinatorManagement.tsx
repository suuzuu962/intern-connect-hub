import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Search, CheckCircle, XCircle, Trash2, Clock, AlertCircle, Eye, Link2, Building, GraduationCap, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
  college?: { id: string; name: string } | null;
  university?: { id: string; name: string } | null;
}

interface College {
  id: string;
  name: string;
  university_id: string;
  university?: { name: string } | null;
}

interface University {
  id: string;
  name: string;
}

export const CoordinatorManagement = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [coordinatorRoles, setCoordinatorRoles] = useState<Record<string, { roleId: string; roleName: string }>>({});
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [coordResult, collegeResult, uniResult] = await Promise.all([
      supabase
        .from('college_coordinators')
        .select(`
          *,
          college:colleges(id, name),
          university:universities(id, name)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('colleges')
        .select('id, name, university_id, university:universities(name)')
        .order('name', { ascending: true }),
      supabase
        .from('universities')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })
    ]);

    if (coordResult.error) {
      toast({ title: 'Error', description: coordResult.error.message, variant: 'destructive' });
    } else {
      setCoordinators(coordResult.data || []);
    }

    if (!collegeResult.error) {
      setColleges(collegeResult.data || []);
    }

    if (!uniResult.error) {
      setUniversities(uniResult.data || []);
    }

    // Fetch coordinator roles
    const coordUserIds = (coordResult.data || []).map(c => c.user_id);
    if (coordUserIds.length > 0) {
      const { data: roleData } = await supabase
        .from('user_custom_roles')
        .select('user_id, role_id, custom_roles(id, name)')
        .in('user_id', coordUserIds);

      if (roleData) {
        const roleMap: Record<string, { roleId: string; roleName: string }> = {};
        for (const item of roleData as any[]) {
          const coord = (coordResult.data || []).find(c => c.user_id === item.user_id);
          if (coord && item.custom_roles) {
            roleMap[coord.id] = { roleId: item.custom_roles.id, roleName: item.custom_roles.name };
          }
        }
        setCoordinatorRoles(roleMap);
      }
    }

    // Fetch available coordinator-scoped roles
    const { data: rolesData } = await supabase
      .from('custom_roles')
      .select('id, name')
      .eq('scope', 'coordinator')
      .order('name');
    setAvailableRoles(rolesData || []);

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
      fetchData();
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
      fetchData();
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
      fetchData();
    }
  };

  const handleDelete = async (coordinatorId: string) => {
    const { error } = await supabase.from('college_coordinators').delete().eq('id', coordinatorId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coordinator deleted successfully' });
      fetchData();
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
      fetchData();
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
      fetchData();
    }
    setBulkProcessing(false);
  };

  const openDetailDialog = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);
    setIsDetailDialogOpen(true);
  };

  const openMappingDialog = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);
    setSelectedUniversityId(coordinator.university_id || '');
    setSelectedCollegeId(coordinator.college_id || '');
    setIsMappingDialogOpen(true);
  };

  const handleSaveMapping = async () => {
    if (!selectedCoordinator) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('college_coordinators')
      .update({
        university_id: selectedUniversityId || null,
        college_id: selectedCollegeId || null
      })
      .eq('id', selectedCoordinator.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coordinator mapping updated successfully' });
      setIsMappingDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleChangeCoordinatorRole = async (coordinatorId: string, userId: string, newRoleId: string) => {
    try {
      await supabase.from('user_custom_roles').delete().eq('user_id', userId);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('user_custom_roles').insert({
        user_id: userId,
        role_id: newRoleId,
        assigned_by: user?.id,
      });
      if (error) throw error;
      const roleName = availableRoles.find(r => r.id === newRoleId)?.name || '';
      toast({ title: 'Success', description: `Role updated to "${roleName}"` });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to change role: ' + error.message, variant: 'destructive' });
    }
  };

  const handleRemoveMapping = async () => {
    if (!selectedCoordinator) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('college_coordinators')
      .update({
        university_id: null,
        college_id: null
      })
      .eq('id', selectedCoordinator.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Coordinator mapping removed' });
      setIsMappingDialogOpen(false);
      fetchData();
    }
    setSaving(false);
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

  // Filter colleges based on selected university
  const filteredColleges = selectedUniversityId 
    ? colleges.filter(c => c.university_id === selectedUniversityId)
    : colleges;

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
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
    <div className="pr-4">
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
                      <TableHead>Role</TableHead>
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
                            {coordinator.college?.name ? (
                              <p className="text-sm flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {coordinator.college.name}
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground">No college</span>
                            )}
                            {coordinator.university?.name ? (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {coordinator.university.name}
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground">No university</span>
                            )}
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
                        <TableCell>
                          {availableRoles.length > 0 ? (
                            <Select
                              value={coordinatorRoles[coordinator.id]?.roleId || ''}
                              onValueChange={(val) => handleChangeCoordinatorRole(coordinator.id, coordinator.user_id, val)}
                            >
                              <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Assign role">
                                  {coordinatorRoles[coordinator.id] ? (
                                    <span className="flex items-center gap-1">
                                      <Shield className="h-3 w-3" />
                                      {coordinatorRoles[coordinator.id].roleName}
                                    </span>
                                  ) : 'Assign role'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map(role => (
                                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground">No roles</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(coordinator.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* View Details Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDetailDialog(coordinator)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Map to College/University Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openMappingDialog(coordinator)}
                              title="Map to College/University"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            
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

        {/* Detail View Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Coordinator Details
              </DialogTitle>
              <DialogDescription>
                Full registration details for {selectedCoordinator?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedCoordinator && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 p-1">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">PERSONAL INFORMATION</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{selectedCoordinator.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="font-medium">{selectedCoordinator.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p>{selectedCoordinator.phone || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Designation</Label>
                        <p>{selectedCoordinator.designation || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <p>{selectedCoordinator.address || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Registered On</Label>
                        <p>{new Date(selectedCoordinator.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Mapping Info */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">ASSIGNMENT</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">University</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p>{selectedCoordinator.university?.name || 'Not assigned'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">College</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <p>{selectedCoordinator.college?.name || 'Not assigned'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Status */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">STATUS</h4>
                    <div className="flex gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Approval Status</Label>
                        <div className="mt-1">
                          <Badge variant={selectedCoordinator.is_approved ? 'default' : 'outline'} className={!selectedCoordinator.is_approved ? 'border-amber-500 text-amber-600' : ''}>
                            {selectedCoordinator.is_approved ? 'Approved' : 'Pending Approval'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Status</Label>
                        <div className="mt-1">
                          <Badge variant={selectedCoordinator.is_active ? 'default' : 'secondary'}>
                            {selectedCoordinator.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
            <DialogFooter>
              {selectedCoordinator && !selectedCoordinator.is_approved && (
                <Button
                  onClick={() => {
                    handleApprove(selectedCoordinator);
                    setIsDetailDialogOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Coordinator
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  openMappingDialog(selectedCoordinator!);
                  setIsDetailDialogOpen(false);
                }}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Manage Mapping
              </Button>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mapping Dialog */}
        <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Map Coordinator
              </DialogTitle>
              <DialogDescription>
                Assign {selectedCoordinator?.name} to a university and college
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>University</Label>
                <Select value={selectedUniversityId || "none"} onValueChange={(value) => {
                  setSelectedUniversityId(value === "none" ? '' : value);
                  setSelectedCollegeId(''); // Reset college when university changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a university" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No university</SelectItem>
                    {universities.map(uni => (
                      <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>College</Label>
                <Select value={selectedCollegeId || "none"} onValueChange={(value) => setSelectedCollegeId(value === "none" ? '' : value)} disabled={!selectedUniversityId}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedUniversityId ? "Select a college" : "Select university first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No college</SelectItem>
                    {filteredColleges.map(college => (
                      <SelectItem key={college.id} value={college.id}>{college.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUniversityId && filteredColleges.length === 0 && (
                  <p className="text-xs text-muted-foreground">No colleges found for this university</p>
                )}
              </div>

              {selectedCoordinator?.university_id && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Current Assignment</p>
                  <p className="text-xs text-muted-foreground">
                    University: {selectedCoordinator.university?.name || 'None'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    College: {selectedCoordinator.college?.name || 'None'}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                variant="destructive"
                onClick={handleRemoveMapping}
                disabled={saving || (!selectedCoordinator?.university_id && !selectedCoordinator?.college_id)}
              >
                Remove Mapping
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMapping} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Mapping
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </div>
    <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
