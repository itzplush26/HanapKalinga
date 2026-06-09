import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

type CardVariant = 'default' | 'signature' | 'cream';

interface CardProps {
  variant?: CardVariant;
  roundedSize?: keyof typeof rounded;
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function Card({
  variant = 'default',
  roundedSize = 'md',
  title,
  children,
  style,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { borderRadius: rounded[roundedSize] },
        variantStyles[variant],
        style,
      ]}
    >
      {title && (
        <Text
          style={[
            styles.title,
            variant === 'signature' && styles.titleSignature,
          ]}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  titleSignature: {
    color: colors.canvas,
  },
});

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.canvas,
  },
  signature: {
    backgroundColor: colors.brand[600],
  },
  cream: {
    backgroundColor: colors.brand[50],
  },
};
