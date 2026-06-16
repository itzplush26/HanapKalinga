import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useBookingDetail } from '../../../src/lib/hooks/useBookingDetail';
import { getApiUrl } from '@hanapkalinga/shared/api';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { Separator } from '../../../src/components/ui/Separator';
import { BookingDetailCard } from '../../../src/components/BookingDetailCard';
import { BookingReviewForm } from '../../../src/components/BookingReviewForm';
import { MessageThread } from '../../../src/components/message-thread';
import { CancelBookingModal } from '../../../src/components/CancelBookingModal';
import { ReportUserMenu } from '../../../src/components/ReportUserMenu';
import { getShiftLabel, getStatusColor, formatDate, getInitials } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';

const API_URL = getApiUrl();

export default function FamilyBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const {
    booking, family, nurse, messages, review,
    loading, error, actionLoading, refetch,
    cancel, confirmCompletion, dispute,
  } = useBookingDetail(id);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [disputeText, setDisputeText] = useState('');

  const isPastDate = booking?.requested_date
    ? booking.requested_date <= new Date().toISOString().split('T')[0]
    : false;

  const handleCancelConfirm = async (reason: string) => {
    const result = await cancel(reason, 'family');
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setShowCancelModal(false);
    }
  };

  const handleConfirmCompletion = async () => {
    Alert.alert(
      'Confirm Shift Complete',
      'Are you sure the nurse has completed the shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const result = await confirmCompletion();
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleDispute = async () => {
    if (disputeText.trim().length < 10) {
      Alert.alert('Validation', 'Please provide at least 10 characters describing the issue.');
      return;
    }
    const result = await dispute(disputeText.trim());
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Dispute Submitted', 'An admin will review your dispute.');
      setShowDisputeInput(false);
      setDisputeText('');
    }
  };

  const handleReportUser = async (category: string, description: string) => {
    if (!booking || !user) return;
    const targetId = booking.nurse_id;
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
    const targetId = booking.nurse_id;
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
  const isCompleted = booking.status === 'completed';
  const hasReview = !!review;
  const showReviewForm = isCompleted && !hasReview && !!nurse;
  const canCancel = booking.status === 'pending' || booking.status === 'accepted';
  const showCompletionActions = booking.status === 'pending_completion';

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
          {nurse && (
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

        {nurse && (
          <Card variant="cream" roundedSize="md">
            <View style={styles.nurseRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(nurse.full_name ?? 'Nurse')}</Text>
              </View>
              <View>
                <Text style={styles.nurseName}>{nurse.full_name ?? 'Nurse'}</Text>
                {nurse.city && <Text style={styles.nurseCity}>{nurse.city}</Text>}
              </View>
            </View>
          </Card>
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

        {showCompletionActions && (
          <Card roundedSize="md" variant="cream">
            <Text style={styles.completionTitle}>Shift Completion</Text>
            <Text style={styles.completionText}>
              The nurse has marked this shift as complete. Please confirm or dispute.
            </Text>
            <View style={styles.completionActions}>
              <Button
                variant="primary"
                onPress={handleConfirmCompletion}
                loading={actionLoading}
                style={styles.actionButton}
              >
                Confirm Shift Complete
              </Button>
              <Button
                variant="secondary"
                onPress={() => setShowDisputeInput(!showDisputeInput)}
                style={styles.actionButton}
              >
                Dispute
              </Button>
            </View>
            {showDisputeInput && (
              <View style={styles.disputeSection}>
                <TextInput
                  style={styles.disputeInput}
                  value={disputeText}
                  onChangeText={setDisputeText}
                  placeholder="Describe the issue (min. 10 characters)..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  accessibilityLabel="Dispute description"
                />
                <Button
                  variant="primary"
                  onPress={handleDispute}
                  loading={actionLoading}
                >
                  Submit Dispute
                </Button>
              </View>
            )}
          </Card>
        )}

        <BookingDetailCard notes={booking.notes} />

        {showReviewForm && nurse && (
          <BookingReviewForm
            bookingId={booking.id}
            nurseId={booking.nurse_id}
            onSubmit={refetch}
          />
        )}

        {hasReview && review && (
          <Card roundedSize="md">
            <Text style={styles.sectionTitle}>Your Review</Text>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={[styles.star, star <= review.rating && styles.starFilled]}>
                  ★
                </Text>
              ))}
            </View>
            {review.comment && (
              <Text style={styles.reviewComment}>{review.comment}</Text>
            )}
          </Card>
        )}

        <Separator />

        <Text style={styles.sectionTitle}>Messages</Text>
        {user && (
          <MessageThread
            bookingId={booking.id}
            currentUserId={user.id}
            initialMessages={messages}
          />
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
  nurseRow: {
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
  nurseName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  nurseCity: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  completionTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginBottom: spacing.xxs,
  },
  completionText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    marginBottom: spacing.sm,
  },
  completionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  disputeSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    padding: spacing.sm,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  star: {
    fontSize: 20,
    color: colors.hairline,
  },
  starFilled: {
    color: colors.signature.mustard,
  },
  reviewComment: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    marginTop: spacing.sm,
  },
});
