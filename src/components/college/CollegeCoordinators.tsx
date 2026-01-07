import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap } from 'lucide-react';
import { CollegeCoordinator } from '@/types/database';

interface CollegeCoordinatorsProps {
  collegeId: string;
}

export const CollegeCoordinators = ({ collegeId }: CollegeCoordinatorsProps) => {
  const [coordinators, setCoordinators] = useState<CollegeCoordinator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoordinators = async () => {
      const { data, error } = await supabase
        .from('college_coordinators')
        .select('*')
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coordinators:', error);
      } else {
        setCoordinators(data || []);
      }
      setLoading(false);
    };

    fetchCoordinators();
  }, [collegeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          College Coordinators
        </CardTitle>
        <CardDescription>
          {coordinators.length} coordinator{coordinators.length !== 1 ? 's' : ''} assigned
        </CardDescription>
      </CardHeader>
      <CardContent>
        {coordinators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No coordinators assigned yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators.map((coordinator) => (
                <TableRow key={coordinator.id}>
                  <TableCell className="font-medium">{coordinator.name}</TableCell>
                  <TableCell>{coordinator.email}</TableCell>
                  <TableCell>{coordinator.phone || '-'}</TableCell>
                  <TableCell>{coordinator.designation || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant={coordinator.is_approved ? 'default' : 'secondary'}>
                        {coordinator.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                      <Badge variant={coordinator.is_active ? 'outline' : 'destructive'}>
                        {coordinator.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
