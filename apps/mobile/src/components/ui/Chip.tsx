import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

interface ChipProps {
  selected?: boolean;
  onPress?: () => void;
  label: string;
  style?: ViewStyle;
}

export function Chip({
  selected = false,
  onPress,
  label,
  style,
}: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.base,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: rounded.pill,
    minHeight: 32,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.brand[600],
  },
  unselected: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  text: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  textSelected: {
    color: colors.canvas,
  },
});
