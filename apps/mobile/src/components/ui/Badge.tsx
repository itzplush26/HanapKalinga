import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

type BadgeColor = 'success' | 'pending' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  color?: BadgeColor;
  label: string;
  style?: ViewStyle;
}

export function Badge({ color = 'neutral', label, style }: BadgeProps) {
  return (
    <View style={[styles.base, badgeStyles[color], style]}>
      <Text style={[styles.text, badgeTextStyles[color]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: rounded.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
});

const badgeStyles: Record<BadgeColor, ViewStyle> = {
  success: {
    backgroundColor: '#d1fae5',
  },
  pending: {
    backgroundColor: '#fef3c7',
  },
  error: {
    backgroundColor: '#fee2e2',
  },
  info: {
    backgroundColor: '#dbeafe',
  },
  neutral: {
    backgroundColor: colors.surface.strong,
  },
};

const badgeTextStyles: Record<BadgeColor, { color: string }> = {
  success: {
    color: '#065f46',
  },
  pending: {
    color: '#92400e',
  },
  error: {
    color: '#991b1b',
  },
  info: {
    color: '#1e40af',
  },
  neutral: {
    color: colors.muted,
  },
};
