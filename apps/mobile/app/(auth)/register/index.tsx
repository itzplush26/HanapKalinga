import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { signupOtpSchema } from '@hanapkalinga/shared/validations';
import { supabase } from '../../../src/lib/supabase';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { TextLink } from '../../../src/components/ui/TextLink';
import { TurnstileWidget, useTurnstileRequired } from '../../../src/components/TurnstileWidget';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';

export default function RegisterStep1Screen() {
  const router = useRouter();
  const { role: preselectedRole } = useLocalSearchParams<{ role?: string }>();
  const turnstileRequired = useTurnstileRequired();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleNext = async () => {
    setError('');

    const result = signupOtpSchema.safeParse({ email });
    if (!result.success) {
      setError('Please enter a valid email address');
      return;
    }

    if (turnstileRequired && !captchaToken) {
      setError('Please complete the verification challenge.');
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          ...(captchaToken ? { captchaToken } : {}),
        },
      });

      if (otpError) {
        const lowered = otpError.message.toLowerCase();
        if (lowered.includes('captcha') || lowered.includes('turnstile')) {
          setError('Verification failed. Please try again.');
          setCaptchaToken(null);
        } else {
          setError(otpError.message);
        }
        return;
      }

      const params = new URLSearchParams({ email: email.trim() });
      if (preselectedRole) params.set('role', preselectedRole);
      router.push(`/(auth)/register/verify-otp?${params.toString()}`);
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
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Enter your email to get started
          </Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={(text) => { setEmail(text); setError(''); }}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          testID="register_input_email"
        />

        {error ? <Text style={styles.errorText} testID="register_text_error">{error}</Text> : null}

        {turnstileRequired ? (
          <TurnstileWidget
            onToken={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
            testIDPrefix="register_captcha"
          />
        ) : null}

        <Button
          onPress={handleNext}
          loading={loading}
          disabled={turnstileRequired && !captchaToken}
          style={styles.button}
          testID="register_button_sendOtp"
        >
          Next
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TextLink onPress={() => router.push('/(auth)/login')}>
            Sign In
          </TextLink>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.displayMd,
    fontFamily: typography.fontFamily.display,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
  button: {
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.body,
  },
});
