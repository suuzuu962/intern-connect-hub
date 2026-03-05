import { useState, useEffect } from 'react';
import { LayoutGrid, List, Briefcase, Search, Bell } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { CompanyCard } from '@/components/companies/CompanyCard';
import { CompanyListItem } from '@/components/companies/CompanyListItem';
import { SearchFilters, FilterValues } from '@/components/filters/SearchFilters';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useViewMode } from '@/hooks/use-view-mode';

const ITEMS_PER_PAGE = 24;

interface CompanyWithCount extends Company {
  internshipCount: number;
}

const Companies = () => {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useViewMode('companies');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    search: '', skills: [], categories: [], domains: [], location: '', internshipType: '', workMode: '', sortBy: 'newest',
  });

  useEffect(() => { fetchCompanies(); }, [currentPage, filters, showActiveOnly]);

  const fetchCompanies = async () => {
    setLoading(true);
    
    if (showActiveOnly) {
      const { data: activeInternships } = await supabase
        .from('internships')
        .select('company_id')
        .eq('is_active', true);
      
      if (!activeInternships || activeInternships.length === 0) {
        setCompanies([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const activeCompanyIds = [...new Set(activeInternships.map(i => i.company_id))];
      
      let query = supabase.from('companies').select('*', { count: 'exact' })
        .eq('is_verified', true)
        .in('id', activeCompanyIds);
      
      if (filters.search) query = query.or(`name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`);
      if (filters.location && filters.location !== 'Any Location') query = query.ilike('location', `%${filters.location}%`);
      query = query.order('created_at', { ascending: filters.sortBy === 'oldest' });
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);
      const { data, count, error } = await query;
      
      if (!error && data) {
        const countMap: Record<string, number> = {};
        activeInternships.forEach(i => {
          countMap[i.company_id] = (countMap[i.company_id] || 0) + 1;
        });

        const companiesWithCount = data.map(company => ({
          ...company,
          internshipCount: countMap[company.id] || 0,
        })) as CompanyWithCount[];

        setCompanies(companiesWithCount);
        setTotalCount(count || 0);
      }
    } else {
      let query = supabase.from('companies').select('*', { count: 'exact' }).eq('is_verified', true);
      if (filters.search) query = query.or(`name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`);
      if (filters.location && filters.location !== 'Any Location') query = query.ilike('location', `%${filters.location}%`);
      query = query.order('created_at', { ascending: filters.sortBy === 'oldest' });
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);
      const { data, count, error } = await query;
      
      if (!error && data) {
        const companyIds = data.map(c => c.id);
        const { data: internships } = await supabase
          .from('internships')
          .select('company_id')
          .in('company_id', companyIds)
          .eq('is_active', true);

        const countMap: Record<string, number> = {};
        internships?.forEach(i => {
          countMap[i.company_id] = (countMap[i.company_id] || 0) + 1;
        });

        const companiesWithCount = data.map(company => ({
          ...company,
          internshipCount: countMap[company.id] || 0,
        })) as CompanyWithCount[];

        setCompanies(companiesWithCount);
        setTotalCount(count || 0);
      }
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-1">Companies</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Explore {totalCount}+ companies</p>
        </div>

        {/* Search & Filters Card */}
        <div className="bg-card rounded-xl border p-5 mb-6">
          <SearchFilters filters={filters} onFilterChange={(f) => { setFilters(f); setCurrentPage(1); }} />
        </div>

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              {totalCount} companies found
            </p>
            <div className="flex items-center gap-2">
              <Switch
                id="active-internships"
                checked={showActiveOnly}
                onCheckedChange={(checked) => {
                  setShowActiveOnly(checked);
                  setCurrentPage(1);
                }}
              />
              <Label htmlFor="active-internships" className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                Active only
              </Label>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
            {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />) : companies.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">No companies found.</div>
            ) : companies.map((company) => <CompanyCard key={company.id} company={company} internshipCount={company.internshipCount} />)}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-3">
            {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />) : companies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No companies found.</div>
            ) : companies.map((company) => <CompanyListItem key={company.id} company={company} internshipCount={company.internshipCount} />)}
          </div>
        )}

        {totalPages > 0 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
            </p>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} /></PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}><PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)}>{page}</PaginationLink></PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Companies;
