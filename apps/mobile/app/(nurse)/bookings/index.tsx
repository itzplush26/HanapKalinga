import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useNurseBookings } from '../../../src/lib/hooks/useNurseBookings';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Badge } from '../../../src/components/ui/Badge';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { getShiftLabel, getStatusColor, formatDate } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';

export default function NurseBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookings, loading, error, refreshing, refetch } = useNurseBookings(user?.id);

  return (
    <ScreenWrapper>
      {loading && bookings.length === 0 ? (
        <View style={styles.skeletonRow}>
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
        </View>
      ) : error ? (
        <EmptyState
          icon={<CalendarDays size={40} color={colors.muted} />}
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try again"
          onAction={refetch}
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={40} color={colors.muted} />}
          title="No booking requests yet"
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          testID="nurseBookings_list_bookings"
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status);
            return (
              <TouchableOpacity
                onPress={() => router.push(`/(nurse)/bookings/${item.id}`)}
                activeOpacity={0.7}
                style={styles.card}
                accessibilityRole="button"
                testID={`nurseBookings_card_${item.id}`}
              >
                <View style={styles.row}>
                  <View style={styles.iconContainer}>
                    <CalendarDays size={20} color={colors.brand[600]} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.familyName} numberOfLines={1}>
                      {item.family_name ?? 'Family'}
                    </Text>
                    {item.requested_date && (
                      <Text style={styles.date}>{formatDate(item.requested_date)}</Text>
                    )}
                    {item.shift && (
                      <Text style={styles.shift}>{getShiftLabel(item.shift)}</Text>
                    )}
                  </View>
                  <View style={styles.badgeRow}>
                    <Badge color={statusColor} label={item.status.replace('_', ' ')} />
                    {item.unread_count > 0 && (
                      <View style={styles.unreadBadge}>
                        <MessageCircle size={14} color={colors.canvas} fill={colors.semantic.error} />
                        <Text style={styles.unreadCount}>
                          {item.unread_count > 99 ? '99+' : item.unread_count}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetch} />
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
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    backgroundColor: colors.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  familyName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  date: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  shift: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  badgeRow: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  unreadCount: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.semantic.error,
  },
});
