import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { ProfileAvatar } from '../ui/ProfileAvatar';
import { getStatusColor } from '../../lib/helpers';
import type { NurseListItem } from '../../lib/hooks/useNurses';

interface NurseCardProps {
  nurse: NurseListItem;
  onPress?: () => void;
}

const MAX_VISIBLE_SPECIALIZATIONS = 3;

export function NurseCard({ nurse, onPress }: NurseCardProps) {
  const { colors } = useTheme();
  const statusColor = getStatusColor(nurse.verification_status);
  const visibleSpecializations = (nurse.specializations ?? []).slice(0, MAX_VISIBLE_SPECIALIZATIONS);
  const hiddenCount = Math.max(0, (nurse.specializations ?? []).length - MAX_VISIBLE_SPECIALIZATIONS);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View profile of ${nurse.full_name ?? 'nurse'}`}
    >
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <ProfileAvatar name={nurse.full_name} size="md" />
          <View style={styles.headerInfo}>
            <Text style={[styles.name, { color: colors['text-primary'] }]} numberOfLines={2}>
              {nurse.full_name ?? 'Unknown'}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors['text-muted']} />
              <Text style={[styles.location, { color: colors['text-secondary'] }]} numberOfLines={1}>
                {nurse.city ?? 'Unknown location'}
              </Text>
            </View>
          </View>
          <Badge color={statusColor} label={nurse.provider_type === 'caregiver' ? 'Caregiver' : 'Nurse'} />
        </View>

        <View style={styles.specializations}>
          {visibleSpecializations.map((spec) => (
            <Chip key={spec} selected label={spec} />
          ))}
          {hiddenCount > 0 && (
            <View style={[styles.moreChip, { borderColor: colors.border }]}>
              <Text style={[styles.moreText, { color: colors['text-muted'] }]}>
                +{hiddenCount} more
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.rateLabel, { color: colors['text-secondary'] }]}>Daily rate</Text>
          <Text style={[styles.rateValue, { color: colors['text-primary'] }]}>
            {nurse.daily_rate_12hr
              ? `P${Number(nurse.daily_rate_12hr).toLocaleString('en-PH')}`
              : 'Open to discuss'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Badge
            color={statusColor}
            label={nurse.verification_status.replace('_', ' ')}
          />
          <Text style={[styles.rating, { color: colors['text-secondary'] }]}>
            {nurse.average_rating != null && (nurse.review_count ?? 0) > 0
              ? `\u2605 ${Number(nurse.average_rating).toFixed(1)} (${nurse.review_count})`
              : 'No reviews yet'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: rounded.lg,
    borderWidth: 1,
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
  },
  inner: {
    padding: spacing[4],
    gap: spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodySemiBold,
    lineHeight: typography.size.base * 1.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
  },
  specializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  moreChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: rounded.pill,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  moreText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLabel: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
  },
  rateValue: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
  },
});
