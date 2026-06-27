import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'default' | 'outline';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'default' | 'outline';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  variant = 'default',
  size = 'default',
  onPress,
  disabled = false,
  loading = false,
  children,
  style,
  testID,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const height = size === 'sm' ? 36 : size === 'lg' ? 48 : 44;
  const paddingHorizontal = size === 'sm' ? spacing[3] : size === 'lg' ? spacing[6] : spacing[4];

  const variantStyle = getVariantStyle(variant, colors);
  const variantTextStyle = getVariantTextStyle(variant, colors);

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
        testID={testID}
      >
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
        testID={testID}
      >
      {loading ? (
        <ActivityIndicator
          color={variant === 'default' || variant === 'destructive' ? '#ffffff' : colors.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: size === 'sm' ? 14 : 15 },
            variantTextStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function getVariantStyle(variant: ButtonVariant, colors: any): ViewStyle {
  switch (variant) {
    case 'default':
    case 'primary':
      return { backgroundColor: colors.primary };
    case 'secondary':
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'ghost':
    case 'link':
      return { backgroundColor: 'transparent' };
    case 'destructive':
      return { backgroundColor: colors.error };
  }
}

function getVariantTextStyle(variant: ButtonVariant, colors: any): TextStyle {
  switch (variant) {
    case 'default':
    case 'primary':
      return { color: colors['on-primary'] };
    case 'secondary':
    case 'outline':
      return { color: colors.primary };
    case 'ghost':
    case 'link':
      return { color: colors.primary };
    case 'destructive':
      return { color: colors['on-primary'] };
  }
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: rounded.md,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.fontFamily.bodyMedium,
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
  default: {
    backgroundColor: colors.brand[600],
  },
  outline: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  default: {
    backgroundColor: colors.brand[600],
  },
  outline: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.brand[200],
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
  default: {
    color: colors.canvas,
  },
  outline: {
    color: colors.brand[600],
  },
  default: {
    color: colors.canvas,
  },
  outline: {
    color: colors.brand[600],
  },
};
