import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, Bell } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNurseDashboard } from '../../src/lib/hooks/useNurseDashboard';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { TextLink } from '../../src/components/ui/TextLink';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { NotificationsPanel } from '../../src/components/notifications-panel';
import { getStatusColor, getShiftLabel, formatDate } from '../../src/lib/helpers';
import { spacing } from '../../src/theme/spacing';
import { rounded } from '../../src/theme/rounded';
import { typography } from '../../src/theme/typography';
import type { VerificationStatus } from '@hanapkalinga/shared/types';

const VERIFICATION_BANNER: Record<VerificationStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: '#fffbeb', text: '#d97706', label: 'Your documents are pending review.' },
  under_review: { bg: '#ccfbf1', text: '#0d9488', label: 'Your documents are under review.' },
  verified: { bg: '#ecfdf5', text: '#059669', label: 'Your profile is verified.' },
  rejected: { bg: '#fef2f2', text: '#dc2626', label: 'Verification rejected. Please resubmit documents.' },
  resubmission_required: { bg: '#fffbeb', text: '#d97706', label: 'Please resubmit your documents.' },
};

export default function NurseDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { data, loading, error, refetch } = useNurseDashboard(user?.id);

  if (loading && !data) {
    return (
      <ScreenWrapper>
        <View style={styles.skeletonContainer}>
          <Skeleton height={60} />
          <Skeleton height={100} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <EmptyState
          icon={<Bell size={40} color={colors['text-muted']} />}
          title="Something went wrong"
          description={error}
          action={
            <Button variant="default" onPress={refetch}>
              Try again
            </Button>
          }
        />
      </ScreenWrapper>
    );
  }

  const nurse = data?.nurse;
  const status = nurse?.verification_status;
  const banner = status ? VERIFICATION_BANNER[status] : null;

  return (
    <ScreenWrapper testID="nurseDashboard_screen">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.pageTitle, { color: colors['text-primary'] }]}>Dashboard</Text>

        {banner && (
          <View style={[styles.verificationBanner, { backgroundColor: banner.bg }]}>
            <Text style={[styles.verificationText, { color: banner.text }]}>
              {banner.label}
            </Text>
          </View>
        )}

        {data?.notifications && data.notifications.length > 0 && (
          <Card>
            <NotificationsPanel
              userId={user?.id ?? ''}
              maxItems={5}
              showMarkAllRead={false}
            />
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors['text-primary'] }]}>
            Recent Bookings
          </Text>
          {data && data.recentBookings.length > 0 && (
            <TextLink onPress={() => router.push('/(nurse)/bookings')}>
              View all
            </TextLink>
          )}
        </View>

        {data && data.recentBookings.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={40} color={colors['text-muted']} />}
            title="No bookings yet"
          />
        ) : (
          data?.recentBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              onPress={() => router.push(`/(nurse)/bookings/${booking.id}`)}
              activeOpacity={0.7}
              style={[
                styles.bookingCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="button"
            >
              <View style={styles.bookingRow}>
                <View
                  style={[
                    styles.bookingIcon,
                    { backgroundColor: colors['primary-light'] },
                  ]}
                >
                  <CalendarDays size={20} color={colors.primary} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text
                    style={[styles.bookingName, { color: colors['text-primary'] }]}
                    numberOfLines={1}
                  >
                    {booking.family_name ?? 'Family'}
                  </Text>
                  {booking.requested_date && (
                    <Text style={[styles.bookingDate, { color: colors['text-secondary'] }]}>
                      {formatDate(booking.requested_date)}
                    </Text>
                  )}
                  {booking.shift && (
                    <Text style={[styles.bookingShift, { color: colors['text-muted'] }]}>
                      {getShiftLabel(booking.shift)}
                    </Text>
                  )}
                </View>
                <Badge
                  color={getStatusColor(booking.status)}
                  label={booking.status.replace('_', ' ')}
                />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.ctaRow}>
          <Button
            variant="outline"
            onPress={() => router.push('/(nurse)/profile')}
            style={styles.ctaButton}
          >
            Edit profile
          </Button>
          <Button
            variant="outline"
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
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[12],
  },
  skeletonContainer: {
    padding: spacing[4],
    gap: spacing[4],
  },
  pageTitle: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  verificationBanner: {
    borderRadius: rounded.lg,
    padding: spacing[4],
  },
  verificationText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  bookingCard: {
    borderRadius: rounded.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    gap: 2,
  },
  bookingName: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  bookingDate: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
  },
  bookingShift: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  ctaButton: {
    flex: 1,
  },
});
