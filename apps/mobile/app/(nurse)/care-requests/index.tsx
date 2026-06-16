import { View, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, ClipboardList } from 'lucide-react-native';
import { useNurseCareRequests } from '../../../src/lib/hooks/useNurseCareRequests';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { CareRequestCard } from '../../../src/components/CareRequestCard';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';

export default function NurseCareRequestsScreen() {
  const router = useRouter();
  const { careRequests, loading, error, refreshing, refetch } = useNurseCareRequests();

  return (
    <ScreenWrapper>
      {loading && careRequests.length === 0 ? (
        <View style={styles.skeletonRow}>
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
        </View>
      ) : error ? (
        <EmptyState
          icon={<FileText size={40} color={colors.muted} />}
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try again"
          onAction={refetch}
        />
      ) : careRequests.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} color={colors.muted} />}
          title="No open care requests"
          subtitle="Check back later for new care requests from families."
        />
      ) : (
        <FlatList
          data={careRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CareRequestCard
              id={item.id}
              title={item.title}
              location={`${item.city}, ${item.region}`}
              careType={item.care_type}
              budget={item.budget_band}
              status={item.status}
              onPress={() => router.push(`/(nurse)/care-requests/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetch} />
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.headerLink}
              onPress={() => router.push('/(nurse)/applications')}
              accessibilityRole="button"
            >
              <ClipboardList size={18} color={colors.brand[600]} />
              <Text style={styles.headerLinkText}>My Applications</Text>
            </TouchableOpacity>
          }
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
  headerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerLinkText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.brand[600],
  },
});
