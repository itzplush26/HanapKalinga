import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMessagesInbox } from '../../src/lib/hooks/useMessagesInbox';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/domain/EmptyState';
import { getInitials } from '../../src/lib/helpers';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';

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

export default function NurseMessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { conversations, loading, error, refetch } = useMessagesInbox(user?.id);

  return (
    <ScreenWrapper>
      {loading && conversations.length === 0 ? (
        <View style={styles.skeletonRow}>
          <Skeleton variant="rectangle" height={72} />
          <Skeleton variant="rectangle" height={72} />
          <Skeleton variant="rectangle" height={72} />
        </View>
      ) : error ? (
        <EmptyState
          icon={<MessageSquare size={40} color={colors.muted} />}
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try again"
          onAction={refetch}
        />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={40} color={colors.muted} />}
          title="No messages yet"
          subtitle="Messages will appear here when you have booking conversations."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.bookingId}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(nurse)/bookings/${item.bookingId}`)}
              activeOpacity={0.7}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Conversation with ${item.otherUserName}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(item.otherUserName ?? '?')}
                </Text>
              </View>
              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.otherUserName}
                  </Text>
                  <Text style={styles.time}>
                    {formatRelativeTime(item.lastMessageTime)}
                  </Text>
                </View>
                <View style={styles.bottomRow}>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
  },
  skeletonRow: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  unreadBadge: {
    backgroundColor: colors.brand[600],
    borderRadius: rounded.pill,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.canvas,
  },
});
