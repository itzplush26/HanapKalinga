import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { getInitials, getStatusColor } from '../../lib/helpers';
import type { NurseListItem } from '../../lib/hooks/useNurses';

interface NurseCardProps {
  nurse: NurseListItem;
  onPress?: () => void;
}

export function NurseCard({ nurse, onPress }: NurseCardProps) {
  const initials = getInitials(nurse.full_name ?? 'Unknown');
  const statusColor = getStatusColor(nurse.verification_status);
  const firstSpecialization = nurse.specializations?.[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`View profile of ${nurse.full_name ?? 'nurse'}`}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {nurse.full_name ?? 'Unknown'}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.muted} />
            <Text style={styles.location} numberOfLines={1}>
              {nurse.city ?? 'Unknown location'}
            </Text>
          </View>
        </View>
        <View style={styles.badges}>
          {nurse.daily_rate_12hr && (
            <Text style={styles.rate}>P{Number(nurse.daily_rate_12hr).toLocaleString('en-PH')}/day</Text>
          )}
          <Badge color={statusColor} label={nurse.verification_status.replace('_', ' ')} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.chipRow}>
          {firstSpecialization && (
            <Chip selected label={firstSpecialization} />
          )}
          {nurse.provider_type && (
            <Chip selected={false} label={nurse.provider_type === 'nurse' ? 'Nurse' : 'Caregiver'} />
          )}
        </View>
        {nurse.specializations && nurse.specializations.length > 1 && (
          <Text style={styles.moreSpecializations}>
            +{nurse.specializations.length - 1} more
          </Text>
        )}
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
  header: {
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
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  badges: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  rate: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.brand[600],
  },
  footer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
    flexWrap: 'wrap',
    flex: 1,
  },
  moreSpecializations: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
