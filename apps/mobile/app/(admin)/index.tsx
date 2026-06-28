import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ShieldCheck, Stethoscope, AlertTriangle } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { Separator } from '../../src/components/ui/Separator';
import { useAdminMetrics } from '../../src/lib/hooks/useAdminMetrics';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';

const STATUS_LEGEND = [
  { label: 'Pending', color: 'pending' as const },
  { label: 'Under Review', color: 'info' as const },
  { label: 'Verified', color: 'success' as const },
  { label: 'Rejected', color: 'error' as const },
  { label: 'Resubmission', color: 'pending' as const },
];

export default function AdminDashboardScreen() {
  const { data, loading, error, refetch } = useAdminMetrics();

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          {error ? (
            <View style={styles.errorContainer}>
              <AlertTriangle size={24} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
              <Button variant="primary" onPress={refetch}>Retry</Button>
            </View>
          ) : loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.metricCard}>
                  <Skeleton variant="text" width={40} height={28} />
                  <Skeleton variant="text" width={100} height={14} style={{ marginTop: spacing.xxs }} />
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={[styles.metricCard, styles.metricCardAccent]} testID="dashboard_metrics_pendingVerifications">
                <Text style={styles.metricValue}>{data?.pendingVerifications ?? 0}</Text>
                <Text style={styles.metricLabel}>Pending verifications</Text>
              </View>
              <View style={[styles.metricCard, styles.metricCardAccent]} testID="dashboard_metrics_underReview">
                <Text style={styles.metricValue}>{data?.underReviewCount ?? 0}</Text>
                <Text style={styles.metricLabel}>Under review</Text>
              </View>
              <View style={[styles.metricCard, styles.metricCardAccent]} testID="dashboard_metrics_totalBookings">
                <Text style={styles.metricValue}>{data?.totalBookings ?? 0}</Text>
                <Text style={styles.metricLabel}>Total bookings</Text>
              </View>
              <View style={[styles.metricCard, styles.metricCardAccent]} testID="dashboard_metrics_totalSignups">
                <Text style={styles.metricValue}>{data?.totalSignups ?? 0}</Text>
                <Text style={styles.metricLabel}>Total signups</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            accessibilityRole="button"
            accessibilityLabel="Review verifications"
          >
            <View style={styles.actionIcon}>
              <ShieldCheck size={24} color={colors.brand[600]} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Review verifications</Text>
              <Text style={styles.actionSubtitle}>
                {data?.pendingVerifications ?? 0} pending
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            accessibilityRole="button"
            accessibilityLabel="View all nurses"
          >
            <View style={styles.actionIcon}>
              <Stethoscope size={24} color={colors.brand[600]} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View nurses</Text>
              <Text style={styles.actionSubtitle}>Browse all providers</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Separator style={{ marginVertical: spacing.md }} />

        <Text style={styles.sectionTitle}>Verification status legend</Text>
        <View style={styles.legendRow}>
          {STATUS_LEGEND.map((item) => (
            <Badge key={item.label} color={item.color} label={item.label} />
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    minHeight: 80,
    justifyContent: 'center',
  },
  metricCardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brand[600],
  },
  metricValue: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  metricLabel: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  quickActions: {
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: spacing.md,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: rounded.md,
    backgroundColor: colors.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  actionSubtitle: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  errorContainer: {
    width: '100%',
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
