import { View, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useNurseApplications } from '../../../src/lib/hooks/useNurseApplications';
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
  shortlisted: 'info',
  accepted: 'success',
  declined: 'error',
};

export default function NurseApplicationsScreen() {
  const { user } = useAuth();
  const { applications, loading, error, refreshing, refetch } = useNurseApplications(user?.id);

  return (
    <ScreenWrapper>
      {loading && applications.length === 0 ? (
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
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} color={colors.muted} />}
          title="No applications yet"
          subtitle="Browse open care requests and apply to get started."
        />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] ?? 'neutral';
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.requestTitle} numberOfLines={1}>
                      {item.care_request_title ?? 'Unknown Request'}
                    </Text>
                    {item.care_request_city && (
                      <Text style={styles.requestCity}>{item.care_request_city}</Text>
                    )}
                  </View>
                  <Badge color={statusColor} label={item.status} />
                </View>
              </View>
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
  requestTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  requestCity: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
