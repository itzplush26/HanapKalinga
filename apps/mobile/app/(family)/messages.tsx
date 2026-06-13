import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { NotificationsPanel } from '../../src/components/notifications-panel';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function FamilyMessagesScreen() {
  const { user } = useAuth();

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Messages & Notifications</Text>
        {user && <NotificationsPanel userId={user.id} />}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
});
