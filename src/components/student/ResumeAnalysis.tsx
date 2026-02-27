import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { FileSearch, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResumeAnalysisProps {
  studentSkills: string[] | null;
  interestedDomains: string[] | null;
  resumeUrl: string | null;
}

export const ResumeAnalysis = ({ studentSkills, interestedDomains, resumeUrl }: ResumeAnalysisProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: resumeUrl ? `Resume uploaded at: ${resumeUrl}` : 'No resume uploaded',
          skills: studentSkills,
          interestedDomains,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data.analysis);
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      toast.error('Failed to analyze profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            AI Profile Analysis
          </CardTitle>
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            size="sm"
            variant={analysis ? 'outline' : 'default'}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> {analysis ? 'Re-analyze' : 'Analyze My Profile'}</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20" />
          </div>
        ) : analysis ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Get AI-powered feedback</p>
            <p className="text-sm mt-1">
              Click "Analyze My Profile" to get personalized feedback on your skills, resume, and career direction.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
