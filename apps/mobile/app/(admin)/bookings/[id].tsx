import { useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { BookingDetailCard } from '../../../src/components/BookingDetailCard';
import { MessageThread } from '../../../src/components/message-thread';
import { useBookingDetail } from '../../../src/lib/hooks/useBookingDetail';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import { getStatusColor, getShiftLabel, formatDate } from '../../../src/lib/helpers';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';

export default function AdminBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { booking, family, nurse, messages, loading, error, refetch } = useBookingDetail(id);
  const [completing, setCompleting] = useState(false);

  const handleMarkComplete = useCallback(async () => {
    if (!id) return;
    Alert.alert('Mark completed', 'Override booking status to completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark completed',
        onPress: async () => {
          setCompleting(true);
          const { error: updateError }: any = await (supabase as any)
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', id);

          if (updateError) {
            Alert.alert('Error', updateError.message);
          } else {
            refetch();
          }
          setCompleting(false);
        },
      },
    ]);
  }, [id, refetch]);

  if (loading) {
    return (
      <ScreenWrapper scroll>
        <View style={styles.loadingContainer}>
          <Skeleton variant="rectangle" height={80} />
          <Skeleton variant="rectangle" height={120} style={{ marginTop: spacing.md }} />
          <Skeleton variant="rectangle" height={300} style={{ marginTop: spacing.md }} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="secondary" onPress={refetch}>
            Retry
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  if (!booking) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const familyName = family?.full_name ?? 'Family';
  const nurseName = nurse?.full_name ?? 'Nurse';

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        <Card variant="default" style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.bookingDate}>
                {booking.requested_date ? formatDate(booking.requested_date) : 'No date'}
              </Text>
              {booking.shift && (
                <Text style={styles.bookingShift}>{getShiftLabel(booking.shift)}</Text>
              )}
              <View style={styles.parties}>
                <Text style={styles.partyText}>{familyName} → {nurseName}</Text>
              </View>
            </View>
            <Badge color={statusColor} label={booking.status} />
          </View>
        </Card>

        <BookingDetailCard notes={booking.notes} />

        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
          <Button
            variant="secondary"
            onPress={handleMarkComplete}
            loading={completing}
            style={styles.completeButton}
          >
            Mark completed
          </Button>
        )}

        {booking.status === 'completed' && (
          <Text style={styles.completedNote}>
            Booking marked complete. Family will be prompted to leave a review.
          </Text>
        )}

        {user && (
          <View style={styles.messageSection}>
            <Text style={styles.sectionTitle}>Messages</Text>
            <MessageThread
              bookingId={booking.id}
              currentUserId={user.id}
              initialMessages={messages}
              readOnly
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  loadingContainer: {
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
  headerCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brand[600],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  bookingDate: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  bookingShift: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  parties: {
    marginTop: spacing.xs,
  },
  partyText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  completeButton: {
    marginTop: spacing.sm,
  },
  completedNote: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageSection: {
    minHeight: 300,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
});
