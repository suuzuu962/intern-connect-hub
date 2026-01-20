import { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

export const NotificationBell = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      // Fetch user-specific notifications
      const { data: userNotifications, error: userError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('target_role', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch role-based notifications if user has a role
      let roleNotifications: Notification[] = [];
      if (role) {
        const { data: roleData, error: roleError } = await supabase
          .from('notifications')
          .select('*')
          .eq('target_role', role)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!roleError && roleData) {
          roleNotifications = roleData as Notification[];
        }
      }

      // Combine and sort notifications
      const allNotifications = [...(userNotifications || []), ...roleNotifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setNotifications(allNotifications as Notification[]);
      setUnreadCount(allNotifications.filter((n) => !n.is_read).length);
    };

    fetchNotifications();

    // Subscribe to realtime notifications for user-specific
    const userChannel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          if (!newNotification.target_role) {
            setNotifications((prev) => [newNotification, ...prev].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    // Subscribe to role-based notifications
    let roleChannel: ReturnType<typeof supabase.channel> | null = null;
    if (role) {
      roleChannel = supabase
        .channel('role-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `target_role=eq.${role}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(userChannel);
      if (roleChannel) {
        supabase.removeChannel(roleChannel);
      }
    };
  }, [user, role]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Navigate if link exists
    if (notification.link) {
      setOpen(false);
      navigate(notification.link);
    }
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-heading font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                    !notification.is_read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  } ${notification.link ? 'hover:bg-primary/10 hover:translate-x-1' : ''}`}
                >
                <div className="flex items-start gap-3">
                    {(() => {
                      const iconClass = `h-5 w-5 mt-0.5 shrink-0 ${!notification.is_read ? 'opacity-100' : 'opacity-50'}`;
                      switch (notification.type) {
                        case 'success':
                          return <CheckCircle className={`${iconClass} text-green-500`} />;
                        case 'warning':
                          return <AlertTriangle className={`${iconClass} text-amber-500`} />;
                        case 'error':
                          return <AlertCircle className={`${iconClass} text-destructive`} />;
                        case 'info':
                        default:
                          return <Info className={`${iconClass} text-primary`} />;
                      }
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        {notification.link && (
                          <span className="text-xs text-primary">→</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
