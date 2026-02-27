import { useState, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { InternshipCard } from '@/components/internships/InternshipCard';
import { InternshipListItem } from '@/components/internships/InternshipListItem';
import { SearchFilters, FilterValues } from '@/components/filters/SearchFilters';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Internship } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useViewMode } from '@/hooks/use-view-mode';

const ITEMS_PER_PAGE = 24;

const Internships = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useViewMode('internships');
  const [filters, setFilters] = useState<FilterValues>({
    search: '', skills: [], categories: [], domains: [], location: '', internshipType: '', workMode: '', sortBy: 'newest',
  });

  useEffect(() => {
    fetchInternships();
  }, [currentPage, filters]);

  const fetchInternships = async () => {
    setLoading(true);
    let query = supabase
      .from('internships')
      .select('*, company:companies!inner(*)', { count: 'exact' })
      .eq('is_active', true)
      .eq('company.is_verified', true);

    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    if (filters.location && filters.location !== 'Any Location') query = query.ilike('location', `%${filters.location}%`);
    if (filters.internshipType) query = query.eq('internship_type', filters.internshipType as 'free' | 'paid' | 'stipended');
    if (filters.workMode) query = query.eq('work_mode', filters.workMode as 'remote' | 'onsite' | 'hybrid');
    
    // Domain filtering - check if any of the selected domains are in the domain field
    if (filters.domains.length > 0) {
      const domainFilters = filters.domains.map(d => `domain.ilike.%${d}%`).join(',');
      query = query.or(domainFilters);
    }

    if (filters.sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (filters.sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (filters.sortBy === 'stipend_high') query = query.order('stipend', { ascending: false, nullsFirst: false });
    else if (filters.sortBy === 'stipend_low') query = query.order('stipend', { ascending: true, nullsFirst: false });

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    query = query.range(from, from + ITEMS_PER_PAGE - 1);

    const { data, count, error } = await query;
    if (!error && data) {
      setInternships(data as Internship[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-1">Find Internships</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Discover {totalCount} opportunities waiting for you</p>
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

        <SearchFilters filters={filters} onFilterChange={(f) => { setFilters(f); setCurrentPage(1); }} />

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            ) : internships.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">No internships found. Try adjusting your filters.</div>
            ) : (
              internships.map((internship) => <InternshipCard key={internship.id} internship={internship} />)
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="mt-8 flex flex-col gap-3">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
            ) : internships.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No internships found. Try adjusting your filters.</div>
            ) : (
              internships.map((internship) => <InternshipListItem key={internship.id} internship={internship} />)
            )}
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

export default Internships;