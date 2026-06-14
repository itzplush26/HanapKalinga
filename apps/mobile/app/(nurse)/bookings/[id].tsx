import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useBookingDetail } from '../../../src/lib/hooks/useBookingDetail';
import { supabase } from '../../../src/lib/supabase';
import { getApiUrl } from '@hanapkalinga/shared/api';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { Separator } from '../../../src/components/ui/Separator';
import { BookingDetailCard } from '../../../src/components/BookingDetailCard';
import { MessageThread } from '../../../src/components/message-thread';
import { CancelBookingModal } from '../../../src/components/CancelBookingModal';
import { ReportUserMenu } from '../../../src/components/ReportUserMenu';
import { getShiftLabel, getStatusColor, formatDate, getInitials } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';

const API_URL = getApiUrl();

export default function NurseBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const {
    booking, family, nurse, messages, review,
    loading, error, actionLoading, refetch,
    cancel, markComplete,
  } = useBookingDetail(id);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleAccept = async () => {
    if (!booking) return;
    const { error: updateError } = await (supabase as any)
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', booking.id);

    if (updateError) {
      Alert.alert('Error', updateError.message);
    } else {
      await (supabase as any).from('notifications').insert({
        user_id: booking.family_id,
        title: 'Booking Accepted',
        body: `Your booking request has been accepted.`,
      });
      refetch();
    }
  };

  const handleDecline = () => {
    if (!booking) return;
    Alert.alert(
      'Decline Booking',
      'Are you sure you want to decline this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const { error: updateError } = await (supabase as any)
              .from('bookings')
              .update({ status: 'declined' })
              .eq('id', booking.id);

            if (updateError) {
              Alert.alert('Error', updateError.message);
            } else {
              await (supabase as any).from('notifications').insert({
                user_id: booking.family_id,
                title: 'Booking Declined',
                body: `Your booking request has been declined.`,
              });
              refetch();
            }
          },
        },
      ]
    );
  };

  const handleCancelConfirm = async (reason: string) => {
    const result = await cancel(reason, 'nurse');
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setShowCancelModal(false);
    }
  };

  const handleMarkComplete = () => {
    Alert.alert(
      'Mark Shift Complete',
      'Confirm that you have completed this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: async () => {
            const result = await markComplete();
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleReportUser = async (category: string, description: string) => {
    if (!booking || !user) return;
    const targetId = booking.family_id;
    try {
      const res = await fetch(`${API_URL}/api/incident-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: targetId,
          bookingId: booking.id,
          category,
          description,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.error ?? 'Failed to submit report');
      } else {
        Alert.alert('Report Submitted', 'Thank you. An admin will review your report.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit report');
    }
  };

  const handleBlockUser = async () => {
    if (!booking || !user) return;
    const targetId = booking.family_id;
    try {
      const res = await fetch(`${API_URL}/api/user-blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: targetId }),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.error ?? 'Failed to block user');
      } else {
        Alert.alert('User Blocked', 'This user has been blocked from contacting you.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to block user');
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.skeletonContainer}>
          <Skeleton variant="rectangle" height={100} />
          <Skeleton variant="rectangle" height={150} />
          <Skeleton variant="rectangle" height={200} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !booking) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error ?? 'Booking not found'}</Text>
          <Button variant="primary" onPress={() => router.back()}>Go back</Button>
        </View>
      </ScreenWrapper>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const canCancel = booking.status === 'pending' || booking.status === 'accepted';
  const canMarkComplete = booking.status === 'accepted' && booking.requested_date
    && booking.requested_date <= new Date().toISOString().split('T')[0];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={colors.ink} />
          </TouchableOpacity>
          {family && (
            <ReportUserMenu
              onReport={handleReportUser}
              onBlock={handleBlockUser}
            />
          )}
        </View>

        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.date}>
              {booking.requested_date ? formatDate(booking.requested_date) : 'Date not set'}
            </Text>
            {booking.shift && (
              <Text style={styles.shift}>{getShiftLabel(booking.shift)}</Text>
            )}
          </View>
          <Badge color={statusColor} label={booking.status.replace('_', ' ')} />
        </View>

        {family && (
          <Card variant="cream" roundedSize="md">
            <View style={styles.familyRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(family.full_name ?? 'Family')}</Text>
              </View>
              <View>
                <Text style={styles.familyName}>{family.full_name ?? 'Family'}</Text>
                {family.city && <Text style={styles.familyCity}>{family.city}</Text>}
                {family.phone && <Text style={styles.familyPhone}>{family.phone}</Text>}
              </View>
            </View>
          </Card>
        )}

        {booking.status === 'pending' && (
          <View style={styles.actionRow}>
            <Button
              variant="primary"
              loading={actionLoading}
              onPress={handleAccept}
              style={styles.actionButton}
              testID="nurseBookingDetail_button_accept"
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              loading={actionLoading}
              onPress={handleDecline}
              style={styles.declineButton}
              testID="nurseBookingDetail_button_decline"
            >
              Decline
            </Button>
          </View>
        )}

        {canCancel && (
          <View>
            <Button
              variant="secondary"
              onPress={() => setShowCancelModal(true)}
            >
              Cancel Booking
            </Button>
          </View>
        )}

        {canMarkComplete && (
          <View>
            <Button
              variant="primary"
              onPress={handleMarkComplete}
              loading={actionLoading}
            >
              Mark Shift Complete
            </Button>
          </View>
        )}

        <BookingDetailCard notes={booking.notes} />

        <Separator />

        <Text style={styles.sectionTitle}>Messages</Text>
        {user && (
          <View style={styles.messageContainer}>
            <MessageThread
              bookingId={booking.id}
              currentUserId={user.id}
              initialMessages={messages}
            />
          </View>
        )}
      </ScrollView>

      <CancelBookingModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        loading={actionLoading}
      />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    gap: 2,
  },
  date: {
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  shift: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  errorText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  familyName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  familyCity: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  familyPhone: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  declineButton: {
    borderColor: colors.semantic.error,
  },
  sectionTitle: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  messageContainer: {
    minHeight: 250,
  },
});
