import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CompanyCard } from '@/components/companies/CompanyCard';
import { SearchFilters, FilterValues } from '@/components/filters/SearchFilters';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 24;

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({
    search: '', skills: [], categories: [], location: '', internshipType: '', workMode: '', sortBy: 'newest',
  });

  useEffect(() => { fetchCompanies(); }, [currentPage, filters]);

  const fetchCompanies = async () => {
    setLoading(true);
    let query = supabase.from('companies').select('*', { count: 'exact' });
    if (filters.search) query = query.or(`name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`);
    if (filters.location && filters.location !== 'Any Location') query = query.ilike('location', `%${filters.location}%`);
    query = query.order('created_at', { ascending: filters.sortBy === 'oldest' });
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    query = query.range(from, from + ITEMS_PER_PAGE - 1);
    const { data, count, error } = await query;
    if (!error && data) { setCompanies(data as Company[]); setTotalCount(count || 0); }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Explore Companies</h1>
          <p className="text-muted-foreground">Discover {totalCount} companies hiring interns</p>
        </div>
        <SearchFilters filters={filters} onFilterChange={(f) => { setFilters(f); setCurrentPage(1); }} />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />) : companies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">No companies found.</div>
          ) : companies.map((company) => <CompanyCard key={company.id} company={company} />)}
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

export default Companies;