import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Search, Users, AlertTriangle } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/domain/EmptyState';
import { useAdminFamilies } from '../../src/lib/hooks/useAdminFamilies';
import { getInitials } from '../../src/lib/helpers';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';

export default function AdminFamiliesScreen() {
  const { data, loading, loadingMore, error, refetch, loadMore, hasMore, search, setSearch } =
    useAdminFamilies();

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
      const initials = getInitials(item.full_name ?? 'Family');
      return (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.full_name ?? 'Unknown'}
            </Text>
            <Text style={styles.meta}>{item.patient_name ?? 'No patient'}</Text>
            <Text style={styles.city}>{item.city ?? '—'}</Text>
          </View>
        </View>
      );
    },
    []
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <Search size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search families..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search families"
          />
        </View>

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
                icon={<Users size={40} color={colors.muted} />}
                title="No families found."
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.canvas,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
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
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  meta: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    marginTop: 2,
  },
  city: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginTop: 1,
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
