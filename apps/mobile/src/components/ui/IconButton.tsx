import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.base, disabled && styles.disabled, style]}
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
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  disabled: {
    opacity: 0.5,
  },
});
