import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Building2, Clock, CheckCheck, Mail } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_id: string | null;
  sender_name?: string;
  sender_logo?: string;
}

export const StudentMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'company_message')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (notifications && notifications.length > 0) {
        const senderIds = [...new Set(notifications.map(n => n.sender_id).filter(Boolean))];

        let companyMap = new Map<string, { name: string; logo_url: string | null }>();
        if (senderIds.length > 0) {
          const { data: companies } = await supabase
            .from('companies')
            .select('user_id, name, logo_url')
            .in('user_id', senderIds as string[]);
          companies?.forEach(c => companyMap.set(c.user_id, { name: c.name, logo_url: c.logo_url }));
        }

        const enriched: Message[] = notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          created_at: n.created_at,
          is_read: n.is_read ?? false,
          sender_id: n.sender_id,
          sender_name: n.sender_id ? companyMap.get(n.sender_id)?.name || 'Company' : 'Company',
          sender_logo: n.sender_id ? companyMap.get(n.sender_id)?.logo_url || undefined : undefined,
        }));

        setMessages(enriched);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const markAllRead = async () => {
    const unreadIds = messages.filter(m => !m.is_read).map(m => m.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    toast.success('All messages marked as read');
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Messages
          </h2>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All messages read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Messages from companies will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {messages.map(msg => (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  !msg.is_read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
                onClick={() => !msg.is_read && markAsRead(msg.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {msg.sender_logo ? (
                        <img src={msg.sender_logo} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${!msg.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {msg.title}
                          </span>
                          {!msg.is_read && (
                            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">New</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {msg.sender_name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(msg.created_at), 'PPp')} •{' '}
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
