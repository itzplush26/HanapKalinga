import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography } from '../../theme/typography';

type BadgeColor = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'pending';

interface BadgeProps {
  color?: BadgeColor;
  label: string;
  style?: ViewStyle;
  testID?: string;
}

const badgeStyles: Record<BadgeColor, { bg: string; text: string }> = {
  neutral: { bg: '#f1f5f9', text: '#475569' },
  success: { bg: '#ecfdf5', text: '#059669' },
  warning: { bg: '#fffbeb', text: '#d97706' },
  error: { bg: '#fef2f2', text: '#dc2626' },
  info: { bg: '#ccfbf1', text: '#0d9488' },
  pending: { bg: '#fffbeb', text: '#d97706' },
};

export function Badge({ color = 'neutral', label, style, testID }: BadgeProps) {
  const palette = badgeStyles[color] ?? badgeStyles.neutral;

  return (
    <View style={[styles.base, { backgroundColor: palette.bg }, style]} testID={testID}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.bodyMedium,
  },
});
