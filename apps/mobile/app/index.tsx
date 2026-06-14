import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { APP_NAME } from '@hanapkalinga/shared/constants';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { Button } from '../src/components/ui/Button';
import { TextLink } from '../src/components/ui/TextLink';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

export default function LandingScreen() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const { colors } = useTheme();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (user && profile && !hasRedirected.current) {
      hasRedirected.current = true;
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
          <Text style={[styles.appName, { color: colors.primary }]}>
            {APP_NAME}
          </Text>
          <Text style={[styles.tagline, { color: colors['text-secondary'] }]}>
            Find the right care for your loved ones or offer your expertise
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            variant="default"
            onPress={() => router.push('/(auth)/register?role=family')}
            testID="landing_button_register"
          >
            I need a nurse or caregiver
          </Button>

          <Button
            variant="outline"
            onPress={() => router.push('/(auth)/register?role=nurse')}
            style={styles.secondaryButton}
            testID="landing_button_register_nurse"
          >
            I am a nurse or caregiver
          </Button>
        </View>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors['text-secondary'] }]}>
            Already have an account?{' '}
          </Text>
          <TextLink onPress={() => router.push('/(auth)/login')} testID="landing_button_login">
            Log in
          </TextLink>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  appName: {
    fontSize: typography.size['3xl'],
    fontFamily: typography.fontFamily.bodySemiBold,
    marginBottom: spacing[3],
  },
  tagline: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
    paddingHorizontal: spacing[4],
  },
  actions: {
    gap: spacing[3],
    marginBottom: spacing[6],
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
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
  },
});
