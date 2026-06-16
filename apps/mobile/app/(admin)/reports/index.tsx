import { View, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Flag } from 'lucide-react-native';
import { useAdminReports } from '../../../src/lib/hooks/useAdminReports';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Badge } from '../../../src/components/ui/Badge';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/domain/EmptyState';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';

const STATUS_COLORS: Record<string, 'success' | 'pending' | 'error' | 'info' | 'neutral'> = {
  pending: 'pending',
  reviewed: 'info',
  resolved: 'success',
};

export default function AdminReportsScreen() {
  const router = useRouter();
  const { reports, loading, error, refreshing, refetch } = useAdminReports();

  return (
    <ScreenWrapper>
      {loading && reports.length === 0 ? (
        <View style={styles.skeletonRow}>
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
        </View>
      ) : error ? (
        <EmptyState
          icon={<Flag size={40} color={colors.muted} />}
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try again"
          onAction={refetch}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<Flag size={40} color={colors.muted} />}
          title="No reports"
          subtitle="All incident reports will appear here."
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] ?? 'neutral';
            return (
              <TouchableOpacity
                onPress={() => router.push(`/(admin)/reports/${item.id}`)}
                activeOpacity={0.7}
                style={styles.card}
                accessibilityRole="button"
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.category} numberOfLines={1}>
                      {item.category}
                    </Text>
                    <Text style={styles.userText} numberOfLines={1}>
                      {item.reporter_name ?? 'Unknown'} → {item.reported_user_name ?? 'Unknown'}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Badge color={statusColor} label={item.status} />
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  category: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  userText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  date: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
