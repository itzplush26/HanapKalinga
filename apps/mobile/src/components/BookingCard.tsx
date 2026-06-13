import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarDays, MessageCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { Badge } from './ui/Badge';
import { getShiftLabel, getStatusColor, formatDate } from '../lib/helpers';
import type { FamilyBookingItem } from '../lib/hooks/useFamilyBookings';

interface BookingCardProps {
  booking: FamilyBookingItem;
  onPress?: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const statusColor = getStatusColor(booking.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Booking on ${booking.requested_date ?? 'unknown date'}, status ${booking.status}`}
    >
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <CalendarDays size={20} color={colors.brand[600]} />
        </View>
        <View style={styles.info}>
          <Text style={styles.nurseName} numberOfLines={1}>
            {booking.nurse_name ?? 'Nurse'}
          </Text>
          {booking.requested_date && (
            <Text style={styles.date}>{formatDate(booking.requested_date)}</Text>
          )}
          {booking.shift && (
            <Text style={styles.shift}>{getShiftLabel(booking.shift)}</Text>
          )}
        </View>
        <View style={styles.badgeRow}>
          <Badge color={statusColor} label={booking.status.replace('_', ' ')} />
          {booking.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <MessageCircle size={14} color={colors.canvas} fill={colors.semantic.error} />
              <Text style={styles.unreadCount}>
                {booking.unread_count > 99 ? '99+' : booking.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    backgroundColor: colors.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nurseName: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  date: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
  shift: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  badgeRow: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  unreadCount: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.semantic.error,
  },
});
