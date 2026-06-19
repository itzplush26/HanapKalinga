import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { colors as flatColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'cream';
  title?: string;
  roundedSize?: 'sm' | 'md' | 'lg';
  testID?: string;
}

export function Card({ children, style, variant = 'default', title, roundedSize = 'lg', testID }: CardProps) {
  const { colors } = useTheme();

  const borderRadius = roundedSize === 'sm' ? rounded.sm : roundedSize === 'md' ? rounded.md : rounded.lg;

  const variantStyle: ViewStyle =
    variant === 'outlined'
      ? {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        }
      : variant === 'cream'
        ? {
            backgroundColor: flatColors.signature?.cream ?? '#f0f7ff',
            borderWidth: 1,
            borderColor: colors.border,
          }
        : {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          };

  return (
    <View
      style={[
        styles.base,
        { borderRadius },
        variantStyle,
        style,
      ]}
      testID={testID}
    >
      {title && (
        <Text style={[styles.title, { color: colors['text-primary'] }]}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing[4],
  },
  title: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    marginBottom: spacing.sm,
  },
});
