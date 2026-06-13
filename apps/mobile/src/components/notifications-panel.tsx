import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { supabase } from '../lib/supabase';
import { EmptyState } from './domain/EmptyState';
import { TextLink } from './ui/TextLink';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsPanelProps {
  userId: string;
  maxItems?: number;
  onNotificationPress?: (notification: Notification) => void;
  showMarkAllRead?: boolean;
}

export function NotificationsPanel({
  userId,
  maxItems,
  onNotificationPress,
  showMarkAllRead = true,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      setLoading(true);
      let query = (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (maxItems) {
        query = query.limit(maxItems);
      }

      const { data } = await query;
      setNotifications(data ?? []);
      setLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotification.id)) return prev;
            const updated = [newNotification, ...prev];
            return maxItems ? updated.slice(0, maxItems) : updated;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, maxItems]);

  const handleMarkAllRead = async () => {
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    setNotifications((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true }))
    );
  };

  const handlePress = async (notification: Notification) => {
    if (!notification.is_read) {
      await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    }

    onNotificationPress?.(notification);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!loading && notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={40} color={colors.muted} />}
        title="No notifications yet."
      />
    );
  }

  return (
    <View style={styles.container}>
      {showMarkAllRead && unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
          <TextLink onPress={handleMarkAllRead}>Mark all read</TextLink>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            style={[styles.item, !item.is_read && styles.itemUnread]}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}: ${item.body}`}
          >
            <View style={styles.dot}>
              {!item.is_read && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, !item.is_read && styles.titleUnread]}>
                {item.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.time}>
                {formatRelativeTime(item.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  unreadLabel: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.muted,
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  itemUnread: {
    backgroundColor: colors.brand[50],
  },
  dot: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[600],
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.ink,
  },
  titleUnread: {
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  body: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  time: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginTop: 2,
  },
});
