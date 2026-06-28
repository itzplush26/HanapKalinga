import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { loginSchema } from '@hanapkalinga/shared/validations';
import type { UserRole } from '@hanapkalinga/shared/types';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { TextLink } from '../../src/components/ui/TextLink';
import { TurnstileWidget, useTurnstileRequired } from '../../src/components/TurnstileWidget';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const { getRedirectPath } = useAuth();
  const { colors } = useTheme();
  const turnstileRequired = useTurnstileRequired();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleLogin = async () => {
    setError('');
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const field: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        field[key] = issue.message;
      }
      setFieldErrors(field);
      return;
    }

    if (turnstileRequired && !captchaToken) {
      setError('Please complete the verification challenge.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (authError) {
        const lowered = authError.message.toLowerCase();
        if (lowered.includes('captcha') || lowered.includes('turnstile')) {
          setError('Verification failed. Please try again.');
          setCaptchaToken(null);
        } else if (__DEV__) {
          // Show the real error in dev for debugging (e.g., "Email not confirmed")
          console.warn('[Login] Auth error:', authError.message);
          setError(authError.message);
        } else {
          setError('Invalid email or password');
        }
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          router.replace(getRedirectPath((profile as { role: UserRole }).role));
        } else {
          router.replace('/');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors['text-primary'] }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: colors['text-muted'] }]}>
            Sign in to your account
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={fieldErrors.email}
            testID="login_input_email"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            placeholder="Enter your password"
            secureTextEntry
            error={fieldErrors.password}
            testID="login_input_password"
          />

          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]} testID="login_text_error">
              {error}
            </Text>
          ) : null}

          {turnstileRequired ? (
            <TurnstileWidget
              onToken={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
              testIDPrefix="login_captcha"
            />
          ) : null}

          <Button
            onPress={handleLogin}
            loading={loading}
            disabled={turnstileRequired && !captchaToken}
            style={styles.submit}
            testID="login_button_submit"
          >
            Sign In
          </Button>

          <TextLink
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotPassword}
            underline
            testID="login_link_forgotPassword"
          >
            Forgot password?
          </TextLink>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors['text-secondary'] }]}>
            Don&apos;t have an account?{' '}
          </Text>
          <TextLink onPress={() => router.push('/(auth)/register')}>
            Create an account
          </TextLink>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[5],
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing[8],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.bodySemiBold,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
  },
  form: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  submit: {
    marginTop: spacing[3],
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: spacing[3],
  },
  errorText: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
  },
});
