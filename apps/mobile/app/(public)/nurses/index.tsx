import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SlidersHorizontal, Search } from 'lucide-react-native';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { NurseCard } from '../../../src/components/domain/NurseCard';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { NurseFiltersSheet } from '../../../src/components/nurse-filters';
import { useNurses } from '../../../src/lib/hooks/useNurses';
import type { NurseFilters, NurseListItem } from '../../../src/lib/hooks/useNurses';

export default function BrowseNursesScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState<NurseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data, loading, loadingMore, error, refetch, loadMore, hasMore } = useNurses(filters);

  const handleNursePress = useCallback(
    (nurse: NurseListItem) => {
      router.push(`/(public)/nurses/${nurse.id}`);
    },
    [router]
  );

  const handleApplyFilters = useCallback((newFilters: NurseFilters) => {
    setFilters(newFilters);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: NurseListItem }) => (
      <NurseCard nurse={item} onPress={() => handleNursePress(item)} />
    ),
    [handleNursePress]
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.brand[600]} />
        </View>
      );
    }
    if (!hasMore && data.length > 0) {
      return <Text style={styles.endText}>All nurses loaded</Text>;
    }
    return null;
  };

  const renderSkeletons = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <Skeleton variant="circle" width={48} height={48} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton variant="text" style={{ width: '60%' }} />
              <Skeleton variant="text" style={{ width: '40%' }} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Skeleton variant="text" style={{ width: 60 }} />
              <Skeleton variant="text" style={{ width: 50 }} />
            </View>
          </View>
          <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: spacing.xxs }}>
            <Skeleton variant="text" width={80} />
            <Skeleton variant="text" width={70} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenWrapper>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Find a Nurse',
          headerTitleStyle: {
            fontFamily: typography.fontFamily.bodySemiBold,
            fontSize: typography.size.titleMd,
            color: colors.ink,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              accessibilityLabel="Open filters"
              accessibilityRole="button"
              style={styles.filterButton}
            >
              <SlidersHorizontal size={22} color={colors.brand[600]} />
              {Object.keys(filters).length > 0 && (
                <View style={styles.filterDot} />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        renderSkeletons()
      ) : error ? (
        <EmptyState
          icon={<Search size={48} color={colors.muted} />}
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try Again"
          onAction={refetch}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Search size={48} color={colors.muted} />}
          title="No nurses found"
          subtitle="No nurses found matching your filters. Try adjusting your search criteria."
          actionLabel="Reset Filters"
          onAction={() => setFilters({})}
        />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.brand[600]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <NurseFiltersSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[600],
  },
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: 'center',
  },
  endText: {
    textAlign: 'center',
    padding: spacing.md,
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonCard: {
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: spacing.sm,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
