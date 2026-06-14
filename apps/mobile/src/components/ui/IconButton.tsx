import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { rounded } from '../../theme/rounded';

interface IconButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  accessibilityLabel: string;
  style?: ViewStyle;
}

export function IconButton({
  onPress,
  disabled = false,
  icon,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: rounded.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
