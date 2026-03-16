import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Clock, Users, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface SentMessage {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user_id: string;
  recipient_name?: string;
  recipient_email?: string;
}

export const SentMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSentMessages();
  }, [user]);

  const fetchSentMessages = async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', user?.id)
        .eq('type', 'company_message')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (notifications && notifications.length > 0) {
        const recipientIds = [...new Set(notifications.map(n => n.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', recipientIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const enriched: SentMessage[] = notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          created_at: n.created_at,
          is_read: n.is_read ?? false,
          user_id: n.user_id,
          recipient_name: profileMap.get(n.user_id)?.full_name || 'Unknown',
          recipient_email: profileMap.get(n.user_id)?.email || '',
        }));

        setMessages(enriched);
      }
    } catch (error) {
      console.error('Error fetching sent messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group messages by title + created_at (batch)
  const grouped = messages.reduce<Record<string, SentMessage[]>>((acc, msg) => {
    const key = `${msg.title}__${msg.created_at}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const batches = Object.values(grouped).sort(
    (a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          Sent Messages
        </h2>
        <p className="text-muted-foreground">View all messages you've sent to applicants</p>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No messages sent yet</p>
            <p className="text-sm">Use Bulk Message to send notifications to your applicants</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 pr-4">
            {batches.map((batch, idx) => {
              const readCount = batch.filter(m => m.is_read).length;
              return (
                <Card key={idx} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          {batch[0].title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(batch[0].created_at), 'PPp')} •{' '}
                          {formatDistanceToNow(new Date(batch[0].created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {batch.length} recipient{batch.length > 1 ? 's' : ''}
                        </Badge>
                        <Badge variant={readCount === batch.length ? 'default' : 'outline'} className="flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" />
                          {readCount}/{batch.length} read
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">{batch[0].message}</p>
                    <div className="flex flex-wrap gap-1">
                      {batch.map(m => (
                        <Badge
                          key={m.id}
                          variant={m.is_read ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {m.recipient_name}
                          {m.is_read && <CheckCheck className="h-2.5 w-2.5 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
