import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
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
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button variant="primary" onPress={onAction}>
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
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.titleMd,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
