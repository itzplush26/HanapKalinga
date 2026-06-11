import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { APP_NAME } from '@hanapkalinga/shared/constants';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { Button } from '../src/components/ui/Button';
import { TextLink } from '../src/components/ui/TextLink';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

export default function LandingScreen() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user && profile) {
      const redirectMap: Record<string, Href> = {
        family: '/(family)',
        nurse: '/(nurse)',
        admin: '/(admin)',
      };
      const path = redirectMap[profile.role] || '/';
      router.replace(path);
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) return null;
  if (user && profile) return null;

  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>
            Find the right care for your loved ones or offer your expertise
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={() => router.push('/(auth)/register?role=family')}
          >
            I need a nurse or caregiver
          </Button>

          <Button
            variant="secondary"
            onPress={() => router.push('/(auth)/register?role=nurse')}
            style={styles.secondaryButton}
          >
            I am a nurse or caregiver
          </Button>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TextLink onPress={() => router.push('/(auth)/login')}>
            Log in
          </TextLink>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.canvas,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  appName: {
    fontSize: typography.size.displayXl,
    fontFamily: typography.fontFamily.display,
    color: colors.brand[600],
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
    textAlign: 'center',
    lineHeight: typography.size.body * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    marginTop: 0,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
});
