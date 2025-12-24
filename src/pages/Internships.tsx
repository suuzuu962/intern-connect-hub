import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { InternshipCard } from '@/components/internships/InternshipCard';
import { SearchFilters, FilterValues } from '@/components/filters/SearchFilters';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { Internship } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 24;

const Internships = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({
    search: '', skills: [], categories: [], location: '', internshipType: '', workMode: '', sortBy: 'newest',
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
    if (filters.internshipType) query = query.eq('internship_type', filters.internshipType as 'full_time' | 'part_time' | 'contract');
    if (filters.workMode) query = query.eq('work_mode', filters.workMode as 'remote' | 'onsite' | 'hybrid');

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
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Find Internships</h1>
          <p className="text-muted-foreground">Discover {totalCount} opportunities waiting for you</p>
        </div>

        <SearchFilters filters={filters} onFilterChange={(f) => { setFilters(f); setCurrentPage(1); }} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
          ) : internships.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">No internships found. Try adjusting your filters.</div>
          ) : (
            internships.map((internship) => <InternshipCard key={internship.id} internship={internship} />)
          )}
        </div>

        {totalPages > 1 && (
          <Pagination className="mt-12">
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
    </Layout>
  );
};

export default Internships;