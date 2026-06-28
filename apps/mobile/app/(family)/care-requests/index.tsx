import { View, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, FileText } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFamilyCareRequests } from '../../../src/lib/hooks/useFamilyCareRequests';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { CareRequestCard } from '../../../src/components/CareRequestCard';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';

export default function FamilyCareRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { careRequests, loading, error, refreshing, refetch } = useFamilyCareRequests(user?.id);

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
          title="No care requests yet"
          subtitle="Post a care request to find the right nurse for your needs."
          actionLabel="Post a Care Request"
          onAction={() => router.push('/(family)/care-requests/new')}
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
              onPress={() => router.push(`/(family)/care-requests/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetch} />
          }
          contentContainerStyle={styles.list}
        />
      )}
      {careRequests.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(family)/care-requests/new')}
          accessibilityRole="button"
          accessibilityLabel="Post a care request"
        >
          <Plus size={24} color={colors.canvas} />
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  skeletonRow: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[600],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
