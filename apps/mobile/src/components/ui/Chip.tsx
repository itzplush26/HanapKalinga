import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

interface ChipProps {
  selected?: boolean;
  onPress?: () => void;
  label: string;
  style?: ViewStyle;
  testID?: string;
}

export function Chip({
  selected = false,
  onPress,
  label,
  style,
  testID,
}: ChipProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.base,
        selected
          ? {
              backgroundColor: colors['primary-light'],
              borderColor: colors.primary,
            }
          : {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={testID}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? colors.primary : colors['text-secondary'] },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: rounded.pill,
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.bodyMedium,
  },
});
