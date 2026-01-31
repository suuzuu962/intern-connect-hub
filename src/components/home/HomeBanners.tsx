import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  position: string;
  target_roles: string[];
  target_regions: string[];
  target_cities: string[];
  display_hours_start: number;
  display_hours_end: number;
}

interface HomeBannersProps {
  position: 'hero' | 'sidebar';
  className?: string;
}

export const HomeBanners = ({ position, className }: HomeBannersProps) => {
  const { role } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, [role]);

  const fetchBanners = async () => {
    setLoading(true);
    const currentHour = new Date().getHours();
    
    const { data, error } = await supabase
      .from('advertisement_banners')
      .select('*')
      .eq('position', position)
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .order('priority', { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Filter banners based on role and time
    const filteredBanners = data.filter(banner => {
      // Check time constraints
      if (currentHour < banner.display_hours_start || currentHour > banner.display_hours_end) {
        return false;
      }

      // Check end date
      if (banner.end_date && new Date(banner.end_date) < new Date()) {
        return false;
      }

      // Check role targeting
      if (banner.target_roles && banner.target_roles.length > 0) {
        const userRole = role || 'guest';
        if (!banner.target_roles.includes(userRole)) {
          return false;
        }
      }

      return true;
    });

    setBanners(filteredBanners);
    setLoading(false);
  };

  const trackView = async (bannerId: string) => {
    try {
      const banner = banners.find(b => b.id === bannerId);
      if (banner) {
        await supabase
          .from('advertisement_banners')
          .update({ view_count: (banner as any).view_count + 1 })
          .eq('id', bannerId);
      }
    } catch {
      // Silent fail for view tracking
    }
  };

  const trackClick = async (bannerId: string) => {
    try {
      const banner = banners.find(b => b.id === bannerId);
      if (banner) {
        await supabase
          .from('advertisement_banners')
          .update({ click_count: (banner as any).click_count + 1 })
          .eq('id', bannerId);
      }
    } catch {
      // Silent fail for click tracking
    }
  };

  const handleBannerClick = async (banner: Banner) => {
    await trackClick(banner.id);
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (position === 'hero' && banners.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [position, banners.length, nextSlide]);

  // Track view on banner change
  useEffect(() => {
    if (banners[currentIndex]) {
      trackView(banners[currentIndex].id);
    }
  }, [currentIndex, banners]);

  if (loading || banners.length === 0) {
    return null;
  }

  if (position === 'hero') {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-2xl", className)}>
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="w-full flex-shrink-0 cursor-pointer relative group"
              onClick={() => handleBannerClick(banner)}
            >
              <div className="aspect-[4/1] md:aspect-[5/1] relative overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center p-8">
                  <div className="text-white max-w-xl">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h3>
                    {banner.description && (
                      <p className="text-sm md:text-base opacity-90 line-clamp-2">{banner.description}</p>
                    )}
                    {banner.link_url && (
                      <Button variant="secondary" size="sm" className="mt-4">
                        Learn More <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full"
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full"
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex ? "bg-white w-6" : "bg-white/50"
                  )}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Sidebar banners
  return (
    <div className={cn("space-y-4", className)}>
      {banners.slice(0, 3).map((banner) => (
        <div
          key={banner.id}
          className="rounded-xl overflow-hidden cursor-pointer group border bg-card hover:shadow-lg transition-shadow"
          onClick={() => handleBannerClick(banner)}
        >
          <div className="aspect-[3/2] relative overflow-hidden">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
          <div className="p-3">
            <h4 className="font-semibold text-sm line-clamp-1">{banner.title}</h4>
            {banner.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{banner.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
