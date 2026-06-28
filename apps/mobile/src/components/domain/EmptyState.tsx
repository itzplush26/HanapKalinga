import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.title, { color: colors['text-primary'] }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors['text-secondary'] }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button variant="default" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
    gap: spacing[3],
  },
  iconContainer: {
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.bodySemiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
});
