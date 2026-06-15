import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useBookingDetail } from '../../../src/lib/hooks/useBookingDetail';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { TouchableOpacity } from 'react-native';
import { Separator } from '../../../src/components/ui/Separator';
import { BookingDetailCard } from '../../../src/components/BookingDetailCard';
import { BookingReviewForm } from '../../../src/components/BookingReviewForm';
import { MessageThread } from '../../../src/components/message-thread';
import { getShiftLabel, getStatusColor, formatDate, getInitials } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';
import { typography } from '../../../src/theme/typography';

export default function FamilyBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { booking, family, nurse, messages, review, loading, error, refetch } = useBookingDetail(id);

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

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>

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
