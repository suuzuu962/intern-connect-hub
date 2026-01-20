import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  Building2, 
  ChevronRight,
  Target,
  Briefcase
} from 'lucide-react';

interface RecommendedInternship {
  id: string;
  title: string;
  location: string | null;
  duration: string | null;
  work_mode: string;
  skills: string[] | null;
  matchScore: number;
  matchedSkills: string[];
  company: {
    name: string;
    logo_url: string | null;
  };
}

interface InternshipRecommendationsProps {
  studentSkills: string[] | null;
  interestedDomains: string[] | null;
}

export const InternshipRecommendations = ({ 
  studentSkills, 
  interestedDomains 
}: InternshipRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<RecommendedInternship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [studentSkills, interestedDomains]);

  const fetchRecommendations = async () => {
    if (!studentSkills?.length && !interestedDomains?.length) {
      setLoading(false);
      return;
    }

    try {
      const { data: internships, error } = await supabase
        .from('internships')
        .select(`
          id,
          title,
          location,
          duration,
          work_mode,
          skills,
          domain,
          company:companies(name, logo_url, is_verified)
        `)
        .eq('is_active', true)
        .limit(50);

      if (error) throw error;

      // Calculate match scores
      const scoredInternships = (internships || [])
        .filter((internship: any) => internship.company?.is_verified)
        .map((internship: any) => {
          const internshipSkills = internship.skills || [];
          const internshipDomain = internship.domain?.toLowerCase() || '';
          
          // Find matching skills
          const matchedSkills = (studentSkills || []).filter(skill => 
            internshipSkills.some((iSkill: string) => 
              iSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(iSkill.toLowerCase())
            )
          );

          // Check domain match
          const domainMatch = (interestedDomains || []).some(domain =>
            internshipDomain.includes(domain.toLowerCase()) ||
            domain.toLowerCase().includes(internshipDomain)
          );

          // Calculate score (skills match + domain match)
          const skillScore = matchedSkills.length * 20;
          const domainScore = domainMatch ? 30 : 0;
          const matchScore = Math.min(100, skillScore + domainScore);

          return {
            id: internship.id,
            title: internship.title,
            location: internship.location,
            duration: internship.duration,
            work_mode: internship.work_mode,
            skills: internship.skills,
            matchScore,
            matchedSkills,
            company: {
              name: internship.company?.name || 'Unknown',
              logo_url: internship.company?.logo_url,
            },
          };
        })
        .filter((i: RecommendedInternship) => i.matchScore > 0)
        .sort((a: RecommendedInternship, b: RecommendedInternship) => b.matchScore - a.matchScore)
        .slice(0, 5);

      setRecommendations(scoredInternships);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 text-green-600 border-green-200';
    if (score >= 40) return 'bg-amber-500/10 text-amber-600 border-amber-200';
    return 'bg-blue-500/10 text-blue-600 border-blue-200';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentSkills?.length && !interestedDomains?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Complete your profile</p>
            <p className="text-sm mt-1">
              Add your skills and interested domains to get personalized recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No matching internships yet</p>
            <p className="text-sm mt-1">
              Check back later for new opportunities matching your skills.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended for You
          </CardTitle>
          <Link to="/internships">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((internship) => (
          <Link
            key={internship.id}
            to={`/internships/${internship.id}`}
            className="block"
          >
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all group">
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {internship.company.logo_url ? (
                    <img
                      src={internship.company.logo_url}
                      alt={internship.company.name}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {internship.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {internship.company.name}
                      </p>
                    </div>
                    <Badge className={`shrink-0 ${getMatchBadgeColor(internship.matchScore)}`}>
                      {internship.matchScore}% Match
                    </Badge>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {internship.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {internship.location}
                      </span>
                    )}
                    {internship.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {internship.duration}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {internship.work_mode}
                    </Badge>
                  </div>

                  {/* Matched Skills */}
                  {internship.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {internship.matchedSkills.slice(0, 3).map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary" 
                          className="text-xs bg-primary/10 text-primary"
                        >
                          ✓ {skill}
                        </Badge>
                      ))}
                      {internship.matchedSkills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{internship.matchedSkills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
