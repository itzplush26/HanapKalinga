import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors['surface-alt'] }]}>
        {icon}
      </View>
      <Text style={[styles.title, { color: colors['text-primary'] }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors['text-secondary'] }]}>
          {description}
        </Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: rounded.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[10],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: rounded.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bodySemiBold,
    marginTop: spacing[4],
  },
  description: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
    marginTop: spacing[2],
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: spacing[4],
  },
});
