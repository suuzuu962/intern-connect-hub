import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BookOpen, Calendar, Clock, Loader2, X, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java',
  'Problem Solving', 'Communication', 'Team Work', 'Time Management', 'Project Management',
  'Technical Writing', 'Data Analysis', 'Testing', 'Debugging', 'Code Review'
];

interface ApprovedApplication {
  id: string;
  internship: {
    id: string;
    title: string;
    company: {
      name: string;
    };
  };
}

interface DiaryEntry {
  id: string;
  entry_date: string;
  title: string;
  content: string;
  hours_worked: number | null;
  skills_learned: string[] | null;
  created_at: string;
}

interface InternshipDiaryProps {
  studentId: string | null;
}

export const InternshipDiary = ({ studentId }: InternshipDiaryProps) => {
  const [applications, setApplications] = useState<ApprovedApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workSummary, setWorkSummary] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [blockers, setBlockers] = useState('');
  const [skillsLearned, setSkillsLearned] = useState<string[]>([]);

  useEffect(() => {
    if (studentId) {
      fetchApprovedApplications();
    }
  }, [studentId]);

  useEffect(() => {
    if (selectedApplication) {
      fetchDiaryEntries();
    }
  }, [selectedApplication]);

  const fetchApprovedApplications = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          internship:internships(
            id,
            title,
            company:companies(name)
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'approved');

      if (data) {
        const formatted = data.map((app: any) => ({
          id: app.id,
          internship: {
            id: app.internship?.id || '',
            title: app.internship?.title || 'Unknown',
            company: {
              name: app.internship?.company?.name || 'Unknown',
            },
          },
        }));
        setApplications(formatted);
        if (formatted.length > 0) {
          setSelectedApplication(formatted[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiaryEntries = async () => {
    try {
      const { data } = await supabase
        .from('internship_diary')
        .select('*')
        .eq('application_id', selectedApplication)
        .order('entry_date', { ascending: false });

      if (data) {
        setDiaryEntries(data);
      }
    } catch (error) {
      console.error('Error fetching diary entries:', error);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkillsLearned(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const resetForm = () => {
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
    setWorkSummary('');
    setHoursWorked('');
    setWorkDescription('');
    setOutcomes('');
    setBlockers('');
    setSkillsLearned([]);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedApplication || !workSummary || !workDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const content = `
## What I Worked On
${workDescription}

## Outcomes
${outcomes || 'N/A'}

## Blockers & Risks
${blockers || 'None'}
      `.trim();

      const { error } = await supabase
        .from('internship_diary')
        .insert({
          student_id: studentId,
          application_id: selectedApplication,
          entry_date: entryDate,
          title: workSummary,
          content,
          hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
          skills_learned: skillsLearned.length > 0 ? skillsLearned : null,
        });

      if (error) throw error;

      toast.success('Diary entry added successfully');
      resetForm();
      fetchDiaryEntries();
    } catch (error) {
      console.error('Error adding diary entry:', error);
      toast.error('Failed to add diary entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Internship Diary</h2>
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Internship Diary</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No approved internships yet</p>
            <p className="text-sm text-muted-foreground">
              You need to have an approved internship to start your diary.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedApp = applications.find(a => a.id === selectedApplication);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Internship Diary</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Label className="shrink-0">Select Internship:</Label>
            <Select value={selectedApplication} onValueChange={setSelectedApplication}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select an internship" />
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.internship.title} - {app.internship.company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Diary Entry Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                New Diary Entry
              </span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Date *</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="e.g., 8"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workSummary">Work Summary (Title) *</Label>
                <Input
                  id="workSummary"
                  placeholder="Brief summary of today's work"
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workDescription">What I Worked On *</Label>
                <Textarea
                  id="workDescription"
                  placeholder="Describe what you worked on today..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcomes">Outcomes / Achievements</Label>
                <Textarea
                  id="outcomes"
                  placeholder="What did you achieve or complete?"
                  value={outcomes}
                  onChange={(e) => setOutcomes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockers">Blockers & Risks</Label>
                <Textarea
                  id="blockers"
                  placeholder="Any challenges, blockers, or risks you faced?"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Skills Applied / Learned</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="inline-block"
                    >
                      <Badge
                        variant={skillsLearned.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer transition-colors hover:opacity-80"
                      >
                        {skill}
                        {skillsLearned.includes(skill) && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Entry'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Diary Entries List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Diary Entries for {selectedApp?.internship.title}
        </h3>

        {diaryEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No diary entries yet</p>
              <p className="text-sm text-muted-foreground">Start documenting your internship journey!</p>
            </CardContent>
          </Card>
        ) : (
          diaryEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.entry_date), 'PPP')}
                      </span>
                      {entry.hours_worked && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.hours_worked} hours
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg">
                    {entry.content}
                  </pre>
                </div>
                {entry.skills_learned && entry.skills_learned.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Skills Applied:</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.skills_learned.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};