import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreditCard, DollarSign, TrendingUp, Users, Search, Download, RefreshCw, Briefcase, Building2, Calendar, MapPin, Eye, RotateCcw, XCircle, History, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle, AlertCircle, Clock, Filter, X, FileText, FileSpreadsheet } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';

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

interface Transaction {
  id: string;
  internship_id: string | null;
  subscription_id: string | null;
  student_id: string | null;
  company_id: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  status: string;
  payment_method: string | null;
  reference_id: string | null;
  notes: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
  internship?: {
    title: string;
  };
  company?: {
    name: string;
  };
  student?: {
    user_id: string;
  };
}

interface FilterState {
  company: string;
  type: string;
  status: string;
  minFees: string;
  maxFees: string;
}

export const PaymentsManagement = () => {
  const [paidInternships, setPaidInternships] = useState<PaidInternship[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInternship, setSelectedInternship] = useState<PaidInternship | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState('internships');
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    company: 'all',
    type: 'all',
    status: 'all',
    minFees: '',
    maxFees: '',
  });
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  
  // Refund/Cancel states
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundNotes, setRefundNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [internshipTransactions, setInternshipTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch paid internships with company info (only fees > 0, exclude stipended)
      const { data: internshipsData, error: internshipsError } = await supabase
        .from('internships')
        .select(`
          id, title, fees, stipend, is_paid, internship_type, work_mode, 
          location, duration, is_active, created_at,
          company:companies(id, name, logo_url, industry)
        `)
        .or('is_paid.eq.true,internship_type.eq.paid,fees.gt.0')
        .order('created_at', { ascending: false });

      if (internshipsError) throw internshipsError;

      // Fetch subscriptions with profile info
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          internship:internships(title),
          company:companies(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

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
      
      // Extract unique companies for filter
      const uniqueCompanies = new Map<string, { id: string; name: string }>();
      transformedInternships.forEach((i: PaidInternship) => {
        if (i.company?.id && i.company?.name) {
          uniqueCompanies.set(i.company.id, { id: i.company.id, name: i.company.name });
        }
      });
      setCompanies(Array.from(uniqueCompanies.values()));
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInternshipTransactions = async (internshipId: string) => {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('internship_id', internshipId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setInternshipTransactions(data);
    }
  };

  const handleSelectInternship = async (internship: PaidInternship) => {
    setSelectedInternship(internship);
    await fetchInternshipTransactions(internship.id);
  };

  const handleRefund = async () => {
    if (!selectedInternship || !refundAmount) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('payment_transactions')
        .insert({
          internship_id: selectedInternship.id,
          company_id: selectedInternship.company?.id,
          amount: parseFloat(refundAmount),
          transaction_type: 'refund',
          status: 'completed',
          notes: refundNotes || 'Admin initiated refund',
          processed_by: user?.id
        });

      if (error) throw error;
      
      toast.success('Refund processed successfully');
      setRefundDialogOpen(false);
      setRefundNotes('');
      setRefundAmount('');
      await fetchInternshipTransactions(selectedInternship.id);
      await fetchData();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('payment_transactions')
        .insert({
          subscription_id: selectedSubscription.id,
          amount: 0,
          transaction_type: 'cancellation',
          status: 'completed',
          notes: refundNotes || 'Admin cancelled subscription',
          processed_by: user?.id
        });
      
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', selectedSubscription.id);

      if (error) throw error;
      
      toast.success('Subscription cancelled successfully');
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      setRefundNotes('');
      await fetchData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const recordPayment = async (internship: PaidInternship, amount: number) => {
    try {
      const { error } = await supabase
        .from('payment_transactions')
        .insert({
          internship_id: internship.id,
          company_id: internship.company?.id,
          amount: amount,
          transaction_type: 'payment',
          status: 'completed',
          notes: 'Manual payment record'
        });

      if (error) throw error;
      
      toast.success('Payment recorded successfully');
      await fetchInternshipTransactions(internship.id);
      await fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const clearFilters = () => {
    setFilters({
      company: 'all',
      type: 'all',
      status: 'all',
      minFees: '',
      maxFees: '',
    });
  };

  const hasActiveFilters = filters.company !== 'all' || filters.type !== 'all' || filters.status !== 'all' || filters.minFees || filters.maxFees;

  const handleExportCSV = (type: 'internships' | 'transactions') => {
    if (type === 'internships') {
      const data = filteredInternships.map(i => ({
        title: i.title,
        company: i.company?.name || 'N/A',
        type: i.internship_type,
        fees: i.fees || 0,
        status: i.is_active ? 'Active' : 'Inactive',
        location: i.location || 'N/A',
        duration: i.duration || 'N/A',
        created: format(new Date(i.created_at), 'yyyy-MM-dd'),
      }));
      exportToCSV(data, 'paid_internships', ['Title', 'Company', 'Type', 'Fees', 'Status', 'Location', 'Duration', 'Created']);
      toast.success('Internships exported to CSV');
    } else {
      const data = transactions.map(t => ({
        reference_id: t.reference_id || t.id.slice(0, 8),
        type: t.transaction_type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        internship: t.internship?.title || 'N/A',
        company: t.company?.name || 'N/A',
        date: format(new Date(t.created_at), 'yyyy-MM-dd'),
        notes: t.notes || '',
      }));
      exportToCSV(data, 'payment_transactions', ['Reference_ID', 'Type', 'Amount', 'Currency', 'Status', 'Internship', 'Company', 'Date', 'Notes']);
      toast.success('Transactions exported to CSV');
    }
  };

  const handleExportPDF = async (type: 'internships' | 'transactions') => {
    try {
      if (type === 'internships') {
        await exportToPDF(
          'Paid Internships Report',
          filteredInternships,
          [
            { header: 'Title', accessor: 'title' },
            { header: 'Company', accessor: 'company', format: (v) => v?.name || 'N/A' },
            { header: 'Type', accessor: 'internship_type' },
            { header: 'Fees', accessor: 'fees', format: (v) => v ? `₹${v.toLocaleString()}` : '-' },
            { header: 'Status', accessor: 'is_active', format: (v) => v ? 'Active' : 'Inactive' },
            { header: 'Created', accessor: 'created_at', format: (v) => format(new Date(v), 'MMM d, yyyy') },
          ],
          'paid_internships'
        );
        toast.success('PDF report generated - use Print to save');
      } else {
        await exportToPDF(
          'Payment Transactions Report',
          transactions,
          [
            { header: 'Reference', accessor: 'reference_id', format: (v) => v || 'N/A' },
            { header: 'Type', accessor: 'transaction_type' },
            { header: 'Amount', accessor: 'amount', format: (v) => `₹${v.toLocaleString()}` },
            { header: 'Status', accessor: 'status' },
            { header: 'Internship', accessor: 'internship', format: (v) => v?.title || 'N/A' },
            { header: 'Date', accessor: 'created_at', format: (v) => format(new Date(v), 'MMM d, yyyy') },
          ],
          'payment_transactions'
        );
        toast.success('PDF report generated - use Print to save');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate PDF');
    }
  };

  const filteredInternships = paidInternships.filter(internship => {
    const matchesSearch = 
      internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = filters.company === 'all' || internship.company?.id === filters.company;
    const matchesType = filters.type === 'all' || internship.internship_type === filters.type;
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && internship.is_active) ||
      (filters.status === 'inactive' && !internship.is_active);
    const matchesMinFees = !filters.minFees || (internship.fees || 0) >= parseFloat(filters.minFees);
    const matchesMaxFees = !filters.maxFees || (internship.fees || 0) <= parseFloat(filters.maxFees);
    
    return matchesSearch && matchesCompany && matchesType && matchesStatus && matchesMinFees && matchesMaxFees;
  });

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t =>
    t.transaction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.internship?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const totalFees = paidInternships.reduce((sum, i) => sum + (i.fees || 0), 0);
  const activePayments = paidInternships.filter(i => i.is_active).length;
  const totalRefunds = transactions.filter(t => t.transaction_type === 'refund').reduce((sum, t) => sum + t.amount, 0);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Paid</Badge>;
      case 'free':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">Free</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'payment':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"><ArrowDownLeft className="h-3 w-3 mr-1" />Payment</Badge>;
      case 'refund':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"><ArrowUpRight className="h-3 w-3 mr-1" />Refund</Badge>;
      case 'cancellation':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Cancellation</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-600"><RotateCcw className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
    <div className="space-y-6 pr-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Payments Management
          </h2>
          <p className="text-muted-foreground">Track paid internships, subscriptions, and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportCSV('internships')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Internships (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportCSV('transactions')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Transactions (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF('internships')}>
                <FileText className="h-4 w-4 mr-2" />
                Export Internships (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF('transactions')}>
                <FileText className="h-4 w-4 mr-2" />
                Export Transactions (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Paid Internships</CardTitle>
            <Briefcase className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activePayments}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('transactions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunds</CardTitle>
            <RotateCcw className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalRefunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Refunds processed</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('subscriptions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
            <Users className="h-5 w-5 text-indigo-600" />
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
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transaction History ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internships">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Paid Internships</CardTitle>
                    <CardDescription>View internships with fees - click to view details and manage payments</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search internships..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-[250px]"
                      />
                    </div>
                    <Button
                      variant={showFilters ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {hasActiveFilters && <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">Active</Badge>}
                    </Button>
                  </div>
                </div>
                
                {/* Filter Row */}
                {showFilters && (
                  <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Company</label>
                      <Select value={filters.company} onValueChange={(v) => setFilters({ ...filters, company: v })}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Companies</SelectItem>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Type</label>
                      <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Min Fees (₹)</label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minFees}
                        onChange={(e) => setFilters({ ...filters, minFees: e.target.value })}
                        className="w-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Max Fees (₹)</label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxFees}
                        onChange={(e) => setFilters({ ...filters, maxFees: e.target.value })}
                        className="w-[100px]"
                      />
                    </div>
                    
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                )}
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
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInternships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No paid internships found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInternships.map((internship) => (
                      <TableRow 
                        key={internship.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelectInternship(internship)}
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
                              handleSelectInternship(internship);
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
                  <CardDescription>View and manage platform subscriptions</CardDescription>
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
                          <div className="flex items-center justify-end gap-2">
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubscription(subscription);
                                setCancelDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>Complete log of all payment transactions, refunds, and cancellations</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
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
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Internship/Item</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow 
                        key={transaction.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <TableCell>{format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell>{getTransactionTypeBadge(transaction.transaction_type)}</TableCell>
                        <TableCell className={transaction.transaction_type === 'refund' ? 'text-orange-600 font-medium' : 'font-medium'}>
                          {transaction.transaction_type === 'refund' ? '-' : ''}₹{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>{transaction.internship?.title || 'N/A'}</TableCell>
                        <TableCell>{transaction.company?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{transaction.reference_id || '-'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(transaction);
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

      {/* Internship Detail Dialog with Transaction History */}
      <Dialog open={!!selectedInternship} onOpenChange={() => { setSelectedInternship(null); setInternshipTransactions([]); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Internship Payment Details
            </DialogTitle>
            <DialogDescription>
              Complete payment information and transaction history
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
                      <Calendar className="h-4 w-4" />
                      Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="font-medium">
                      {format(new Date(selectedInternship.created_at), 'MMM d, yyyy')}
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
              </div>

              {/* Transaction History for this Internship */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Transaction History
                </h4>
                {internshipTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions recorded for this internship</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {internshipTransactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-3">
                          {getTransactionTypeBadge(t.transaction_type)}
                          <span className="text-sm">{format(new Date(t.created_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${t.transaction_type === 'refund' ? 'text-orange-600' : ''}`}>
                            {t.transaction_type === 'refund' ? '-' : ''}₹{t.amount.toLocaleString()}
                          </span>
                          {getStatusBadge(t.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => selectedInternship.fees && recordPayment(selectedInternship, selectedInternship.fees)}
                  disabled={!selectedInternship.fees}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Record Payment
                </Button>
                <Button
                  variant="outline"
                  className="text-orange-600 hover:text-orange-700"
                  onClick={() => {
                    setRefundAmount(selectedInternship.fees?.toString() || '');
                    setRefundDialogOpen(true);
                  }}
                  disabled={!selectedInternship.fees}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Issue Refund
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Detail Dialog */}
      <Dialog open={!!selectedSubscription && !cancelDialogOpen} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subscription Details
            </DialogTitle>
            <DialogDescription>User subscription information</DialogDescription>
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
              <DialogFooter>
                <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel Subscription
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>Complete transaction information</DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Type</p>
                  {getTransactionTypeBadge(selectedTransaction.transaction_type)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className={`font-bold text-xl ${selectedTransaction.transaction_type === 'refund' ? 'text-orange-600' : ''}`}>
                    {selectedTransaction.transaction_type === 'refund' ? '-' : ''}₹{selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedTransaction.created_at), 'MMM d, yyyy HH:mm:ss')}</p>
                </div>
              </div>
              {selectedTransaction.internship && (
                <div>
                  <p className="text-sm text-muted-foreground">Internship</p>
                  <p className="font-medium">{selectedTransaction.internship.title}</p>
                </div>
              )}
              {selectedTransaction.company && (
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedTransaction.company.name}</p>
                </div>
              )}
              {selectedTransaction.reference_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Reference ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.reference_id}</p>
                </div>
              )}
              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Issue Refund
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will record a refund transaction for this internship.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Refund Amount (₹)</label>
              <Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Enter refund amount" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} placeholder="Enter reason for refund..." />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} disabled={processing || !refundAmount} className="bg-orange-600 hover:bg-orange-700">
              {processing ? 'Processing...' : 'Process Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Cancel Subscription
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription?
              {selectedSubscription && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-medium">{selectedSubscription.profile?.full_name || 'Unknown User'}</p>
                  <p className="text-sm">{selectedSubscription.profile?.email}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Cancellation Reason (Optional)</label>
            <Textarea value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} placeholder="Enter reason for cancellation..." />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription} disabled={processing} className="bg-destructive hover:bg-destructive/90">
              {processing ? 'Cancelling...' : 'Confirm Cancellation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </ScrollArea>
  );
};
