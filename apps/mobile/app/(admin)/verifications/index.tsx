import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Badge } from '../../../src/components/ui/Badge';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { useVerificationQueue } from '../../../src/lib/hooks/useVerificationQueue';
import { getInitials, getStatusColor } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';
import type { VerificationFilter } from '../../../src/lib/hooks/useVerificationQueue';

const FILTER_TABS: { value: VerificationFilter; label: string }[] = [
  { value: 'all', label: 'All Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'verified', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resubmission_required', label: 'Resubmission' },
];

export default function VerificationQueueScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<VerificationFilter>('all');
  const { data, loading, loadingMore, error, refetch, loadMore, hasMore } =
    useVerificationQueue(filter);

  const renderFilterTab = useCallback(
    (tab: { value: VerificationFilter; label: string }) => {
      const isActive = filter === tab.value;
      return (
        <TouchableOpacity
          key={tab.value}
          onPress={() => setFilter(tab.value)}
          style={[styles.filterTab, isActive && styles.filterTabActive]}
          accessibilityRole="button"
          accessibilityLabel={`Filter: ${tab.label}`}
          accessibilityState={{ selected: isActive }}
        >
          <Text
            style={[
              styles.filterTabLabel,
              isActive && styles.filterTabLabelActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [filter]
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const initials = getInitials(item.full_name ?? 'Applicant');
      const statusColor = getStatusColor(item.verification_status);

      return (
        <TouchableOpacity
          onPress={() =>
            router.push(`/(admin)/verifications/${item.id}` as any)
          }
          style={styles.applicantCard}
          accessibilityRole="button"
          accessibilityLabel={`Review ${item.full_name ?? 'applicant'}`}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>
          <View style={styles.applicantInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.applicantName} numberOfLines={1}>
                {item.full_name ?? 'Unknown'}
              </Text>
              <Badge
                color={statusColor}
                label={item.verification_status.replace(/_/g, ' ')}
              />
            </View>
            <Text style={styles.applicantMeta}>
              {item.city ?? '—'} {item.provider_type ? `• ${item.provider_type}` : ''}
            </Text>
            {item.submitted_at && (
              <Text style={styles.submittedDate}>
                Submitted {new Date(item.submitted_at).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      );
    },
    [router]
  );

  const renderSkeletons = () => (
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
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <FlatList
          ListHeaderComponent={
            <View style={styles.filterRow}>
              {FILTER_TABS.map(renderFilterTab)}
            </View>
          }
          data={loading && data.length === 0 ? [] : data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            loading ? (
              renderSkeletons()
            ) : (
              <EmptyState
                icon={<Shield size={40} color={colors.muted} />}
                title="No applicants in this status."
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.xs,
  },
  filterTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: rounded.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  filterTabActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  filterTabLabel: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.muted,
  },
  filterTabLabelActive: {
    color: colors.canvas,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  applicantCard: {
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  applicantInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  applicantName: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    flex: 1,
  },
  applicantMeta: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  submittedDate: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  chevron: {
    fontSize: typography.size.titleLg,
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
});
