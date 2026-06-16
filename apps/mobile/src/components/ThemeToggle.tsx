import { View, Text, Switch, StyleSheet } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';

export function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.iconContainer}>
          {isDark ? (
            <Moon size={18} color={colors.ink} />
          ) : (
            <Sun size={18} color={colors.ink} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Appearance</Text>
          <Text style={styles.subtitle}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
        </View>
      </View>
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: colors.hairline, true: colors.brand[300] }}
        thumbColor={isDark ? colors.brand[600] : colors.muted}
        accessibilityLabel="Toggle theme"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: rounded.sm,
    backgroundColor: colors.surface.soft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: 2,
  },
  title: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
