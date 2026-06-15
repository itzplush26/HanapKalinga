import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, CalendarDays, AlertTriangle } from 'lucide-react-native';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { useAdminBookings } from '../../../src/lib/hooks/useAdminBookings';
import { getStatusColor, getShiftLabel, formatDate } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminBookingsScreen() {
  const router = useRouter();
  const { data, loading, loadingMore, error, refetch, loadMore, hasMore } =
    useAdminBookings();

  if (error && data.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <AlertTriangle size={32} color={colors.semantic.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="primary" onPress={refetch}>Retry</Button>
        </View>
      </ScreenWrapper>
    );
  }

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const statusColor = getStatusColor(item.status);

      return (
        <TouchableOpacity
          onPress={() => router.push(`/(admin)/bookings/${item.id}` as any)}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={`Booking ${item.requested_date ?? ''}`}
        >
          <View style={styles.iconBox}>
            <CalendarDays size={20} color={colors.brand[600]} />
          </View>
          <View style={styles.info}>
            <Text style={styles.familyName} numberOfLines={1}>
              {item.family_name ?? 'Unknown'}
            </Text>
            <Text style={styles.nurseName} numberOfLines={1}>
              with {item.nurse_name ?? 'Unknown'}
            </Text>
            {item.requested_date && (
              <Text style={styles.date}>{formatDate(item.requested_date)}</Text>
            )}
            {item.shift && (
              <Text style={styles.shift}>{getShiftLabel(item.shift)}</Text>
            )}
          </View>
          <Badge color={statusColor} label={item.status} />
        </TouchableOpacity>
      );
    },
    [router]
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <FlatList
          data={loading && data.length === 0 ? [] : data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            loading ? (
              <View style={styles.skeletonList}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <Skeleton variant="circle" width={40} height={40} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton variant="text" height={14} />
                      <Skeleton variant="text" height={12} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<CalendarDays size={40} color={colors.muted} />}
                title="No bookings found."
              />
            )
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Skeleton variant="text" height={40} />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xxs,
    padding: spacing.md,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    backgroundColor: colors.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  familyName: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  nurseName: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginTop: 1,
  },
  date: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    marginTop: 2,
  },
  shift: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  skeletonList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingMore: {
    padding: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
    textAlign: 'center',
  },
});
