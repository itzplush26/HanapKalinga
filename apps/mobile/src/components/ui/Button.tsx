import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';

interface ButtonProps {
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: string;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  children,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.canvas : colors.brand[600]}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantTextStyles[variant],
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: rounded.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.size.button,
    fontFamily: typography.fontFamily.bodySemiBold,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.brand[600],
  },
  secondary: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
    minHeight: undefined,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: colors.canvas,
  },
  secondary: {
    color: colors.brand[600],
  },
  ghost: {
    color: colors.brand[600],
  },
  link: {
    color: colors.semantic.link,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.size.body,
    textDecorationLine: 'underline',
  },
};
