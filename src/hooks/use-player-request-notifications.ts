import { useState, useEffect } from 'react';
import { supabase, Notification } from '@/lib/supabase';

export interface PlayerRequestNotification extends Notification {
  metadata: {
    requested_nick: string;
  };
}

export function usePlayerRequestNotifications() {
  const [notifications, setNotifications] = useState<PlayerRequestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'player_request')
        .order('created_at', { ascending: false });

      if (err) throw err;

      setNotifications((data || []) as PlayerRequestNotification[]);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `type=eq.player_request`,
        },
        (payload) => {
          if (payload.new) {
            setNotifications((prev) => [payload.new as PlayerRequestNotification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error: err } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (err) throw err;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error: err } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (err) throw err;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return { notifications, loading, error, markAsRead, deleteNotification, refetch: fetchNotifications };
}
