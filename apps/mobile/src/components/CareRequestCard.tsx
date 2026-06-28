import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Briefcase, Wallet } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { Badge } from './ui/Badge';

interface CareRequestCardProps {
  id: string;
  title: string;
  location: string;
  careType: string;
  budget?: string;
  status: string;
  onPress?: () => void;
}

export function CareRequestCard({
  title,
  location,
  careType,
  budget,
  status,
  onPress,
}: CareRequestCardProps) {
  const statusColor = status === 'open' ? 'success' : status === 'cancelled' ? 'error' : 'neutral';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Care request: ${title}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Badge color={statusColor} label={status.replace('_', ' ')} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={colors.muted} />
          <Text style={styles.detailText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Briefcase size={14} color={colors.muted} />
          <Text style={styles.detailText}>{careType}</Text>
        </View>
        {budget && (
          <View style={styles.detailRow}>
            <Wallet size={14} color={colors.muted} />
            <Text style={styles.detailText}>{budget}</Text>
          </View>
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
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  details: {
    gap: spacing.xxs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  detailText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    flex: 1,
  },
});
