import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, DollarSign, TrendingUp, Users, Search, Download, RefreshCw, Briefcase, Building2, Calendar, MapPin, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface PaidInternship {
  id: string;
  title: string;
  fees: number | null;
  stipend: number | null;
  is_paid: boolean;
  internship_type: string;
  work_mode: string;
  location: string | null;
  duration: string | null;
  is_active: boolean;
  created_at: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
  };
}

interface Subscription {
  id: string;
  user_id: string;
  type: string;
  created_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
}

export const PaymentsManagement = () => {
  const [paidInternships, setPaidInternships] = useState<PaidInternship[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInternship, setSelectedInternship] = useState<PaidInternship | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState('internships');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch paid/stipended internships with company info
      const { data: internshipsData, error: internshipsError } = await supabase
        .from('internships')
        .select(`
          id, title, fees, stipend, is_paid, internship_type, work_mode, 
          location, duration, is_active, created_at,
          company:companies(id, name, logo_url, industry)
        `)
        .or('is_paid.eq.true,internship_type.eq.paid,internship_type.eq.stipended,fees.gt.0,stipend.gt.0')
        .order('created_at', { ascending: false });

      if (internshipsError) throw internshipsError;

      // Fetch subscriptions with profile info
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Fetch profiles for subscriptions
      if (subscriptionsData && subscriptionsData.length > 0) {
        const userIds = subscriptionsData.map(s => s.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);

        const subscriptionsWithProfiles = subscriptionsData.map(sub => ({
          ...sub,
          profile: profilesData?.find(p => p.user_id === sub.user_id)
        }));
        setSubscriptions(subscriptionsWithProfiles);
      } else {
        setSubscriptions([]);
      }

      // Transform internships data
      const transformedInternships = (internshipsData || []).map((item: any) => ({
        ...item,
        company: Array.isArray(item.company) ? item.company[0] : item.company
      }));

      setPaidInternships(transformedInternships);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInternships = paidInternships.filter(internship =>
    internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    internship.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const totalFees = paidInternships.reduce((sum, i) => sum + (i.fees || 0), 0);
  const totalStipend = paidInternships.reduce((sum, i) => sum + (i.stipend || 0), 0);
  const activePayments = paidInternships.filter(i => i.is_active).length;

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
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Payments Management
          </h2>
          <p className="text-muted-foreground">Track paid internships, stipends, and subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('internships')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fees Collected</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From paid internships</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('internships')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stipend Offered</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalStipend.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly stipend pool</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('internships')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Paid Internships</CardTitle>
            <Briefcase className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activePayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('subscriptions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
            <Users className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different payment types */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="internships">Paid Internships ({paidInternships.length})</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions ({subscriptions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="internships">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Paid & Stipended Internships</CardTitle>
                  <CardDescription>View internships with fees or stipends</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search internships..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[250px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Internship</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Stipend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInternships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No paid internships found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInternships.map((internship) => (
                      <TableRow 
                        key={internship.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedInternship(internship)}
                      >
                        <TableCell className="font-medium">{internship.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {internship.company?.logo_url ? (
                              <img 
                                src={internship.company.logo_url} 
                                alt={internship.company.name} 
                                className="h-6 w-6 rounded object-cover"
                              />
                            ) : (
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            )}
                            <span>{internship.company?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(internship.internship_type)}</TableCell>
                        <TableCell>
                          {internship.fees ? `₹${internship.fees.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          {internship.stipend ? `₹${internship.stipend.toLocaleString()}/mo` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={internship.is_active ? "default" : "secondary"}>
                            {internship.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(internship.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInternship(internship);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Subscriptions</CardTitle>
                  <CardDescription>View all platform subscriptions</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[250px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscription Type</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription) => (
                      <TableRow 
                        key={subscription.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedSubscription(subscription)}
                      >
                        <TableCell className="font-medium">
                          {subscription.profile?.full_name || 'Unknown User'}
                        </TableCell>
                        <TableCell>{subscription.profile?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.type}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(subscription.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubscription(subscription);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Internship Detail Dialog */}
      <Dialog open={!!selectedInternship} onOpenChange={() => setSelectedInternship(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Internship Payment Details
            </DialogTitle>
            <DialogDescription>
              Complete payment and internship information
            </DialogDescription>
          </DialogHeader>
          
          {selectedInternship && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {selectedInternship.company?.logo_url ? (
                  <img 
                    src={selectedInternship.company.logo_url} 
                    alt={selectedInternship.company.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedInternship.title}</h3>
                  <p className="text-muted-foreground">{selectedInternship.company?.name}</p>
                  {selectedInternship.company?.industry && (
                    <Badge variant="outline" className="mt-1">{selectedInternship.company.industry}</Badge>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Internship Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getTypeBadge(selectedInternship.internship_type)}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={selectedInternship.is_active ? "default" : "secondary"}>
                      {selectedInternship.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">
                      {selectedInternship.fees ? `₹${selectedInternship.fees.toLocaleString()}` : 'N/A'}
                    </span>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Monthly Stipend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">
                      {selectedInternship.stipend ? `₹${selectedInternship.stipend.toLocaleString()}` : 'N/A'}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedInternship.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedInternship.duration || 'Duration not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{selectedInternship.work_mode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {format(new Date(selectedInternship.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Detail Dialog */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subscription Details
            </DialogTitle>
            <DialogDescription>
              User subscription information
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User Name</p>
                  <p className="font-medium">{selectedSubscription.profile?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedSubscription.profile?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscription Type</p>
                  <Badge variant="outline" className="mt-1">{selectedSubscription.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscribed On</p>
                  <p className="font-medium">{format(new Date(selectedSubscription.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-xs text-muted-foreground">{selectedSubscription.user_id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
