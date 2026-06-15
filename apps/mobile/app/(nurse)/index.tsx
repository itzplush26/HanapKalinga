import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, Bell } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useNurseDashboard } from '../../src/lib/hooks/useNurseDashboard';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { TextLink } from '../../src/components/ui/TextLink';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/domain/EmptyState';
import { NotificationsPanel } from '../../src/components/notifications-panel';
import { getStatusColor, getShiftLabel, formatDate, getInitials } from '../../src/lib/helpers';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';
import type { VerificationStatus } from '@hanapkalinga/shared/types';

const VERIFICATION_BANNER: Record<VerificationStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Your documents are pending review.' },
  under_review: { bg: '#dbeafe', text: '#1e40af', label: 'Your documents are under review.' },
  verified: { bg: '#d1fae5', text: '#065f46', label: 'Your profile is verified.' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Verification rejected. Please resubmit documents.' },
  resubmission_required: { bg: '#fef3c7', text: '#92400e', label: 'Please resubmit your documents.' },
};

export default function NurseDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useNurseDashboard(user?.id);

  if (loading && !data) {
    return (
      <ScreenWrapper>
        <View style={styles.skeletonContainer}>
          <Skeleton variant="rectangle" height={60} />
          <Skeleton variant="rectangle" height={100} />
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={80} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <EmptyState
          icon={<Bell size={40} color={colors.muted} />}
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try again"
          onAction={refetch}
        />
      </ScreenWrapper>
    );
  }

  const nurse = data?.nurse;
  const status = nurse?.verification_status;
  const banner = status ? VERIFICATION_BANNER[status] : null;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Dashboard</Text>

        {banner && (
          <View style={[styles.verificationBanner, { backgroundColor: banner.bg }]}>
            <Text style={[styles.verificationText, { color: banner.text }]}>
              {banner.label}
            </Text>
          </View>
        )}

        {data?.notifications && data.notifications.length > 0 && (
          <Card roundedSize="md">
            <NotificationsPanel
              userId={user?.id ?? ''}
              maxItems={5}
              showMarkAllRead={false}
            />
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {data && data.recentBookings.length > 0 && (
            <TextLink onPress={() => router.push('/(nurse)/bookings')}>
              View all
            </TextLink>
          )}
        </View>

        {data && data.recentBookings.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={40} color={colors.muted} />}
            title="No bookings yet"
          />
        ) : (
          data?.recentBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              onPress={() => router.push(`/(nurse)/bookings/${booking.id}`)}
              activeOpacity={0.7}
              style={styles.bookingCard}
              accessibilityRole="button"
            >
              <View style={styles.bookingRow}>
                <View style={styles.bookingIcon}>
                  <CalendarDays size={20} color={colors.brand[600]} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingName} numberOfLines={1}>
                    {booking.family_name ?? 'Family'}
                  </Text>
                  {booking.requested_date && (
                    <Text style={styles.bookingDate}>{formatDate(booking.requested_date)}</Text>
                  )}
                  {booking.shift && (
                    <Text style={styles.bookingShift}>{getShiftLabel(booking.shift)}</Text>
                  )}
                </View>
                <Badge color={getStatusColor(booking.status)} label={booking.status.replace('_', ' ')} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.ctaRow}>
          <Button
            variant="secondary"
            onPress={() => router.push('/(nurse)/profile')}
            style={styles.ctaButton}
          >
            Edit profile
          </Button>
          <Button
            variant="secondary"
            onPress={() => router.push('/(nurse)/availability')}
            style={styles.ctaButton}
          >
            Set availability
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  pageTitle: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  verificationBanner: {
    borderRadius: rounded.sm,
    padding: spacing.md,
  },
  verificationText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  bookingCard: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    backgroundColor: colors.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    gap: 2,
  },
  bookingName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  bookingDate: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  bookingShift: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ctaButton: {
    flex: 1,
  },
});
