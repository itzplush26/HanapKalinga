import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { resetPasswordRequestSchema } from '@hanapkalinga/shared/validations';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { TextLink } from '../../src/components/ui/TextLink';
import { TurnstileWidget, useTurnstileRequired } from '../../src/components/TurnstileWidget';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const turnstileRequired = useTurnstileRequired();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleSendResetLink = async () => {
    setError('');

    const result = resetPasswordRequestSchema.safeParse({ email });
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: 'hanapkalinga://(auth)/update-password',
          ...(captchaToken ? { captchaToken } : {}),
        },
      );

      if (resetError) {
        const lowered = resetError.message.toLowerCase();
        if (lowered.includes('captcha') || lowered.includes('turnstile')) {
          setError('Verification failed. Please try again.');
          setCaptchaToken(null);
        } else {
          setError(resetError.message);
        }
        return;
      }

      setSent(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.description}>
            We've sent a password reset link to {email}. Please check your inbox
            and follow the instructions.
          </Text>
          <Button onPress={() => router.push('/(auth)/login')} variant="secondary" style={styles.button}>
            Back to Sign In
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you a link to reset your
            password.
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
          testID="forgotPassword_input_email"
        />

        {error ? <Text style={styles.errorText} testID="forgotPassword_text_error">{error}</Text> : null}

        {turnstileRequired ? (
          <TurnstileWidget
            onToken={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
            testIDPrefix="forgotPassword_captcha"
          />
        ) : null}

        <Button
          onPress={handleSendResetLink}
          loading={loading}
          disabled={turnstileRequired && !captchaToken}
          style={styles.button}
          testID="forgotPassword_button_submit"
        >
          Send Reset Link
        </Button>

        <TextLink
          onPress={() => router.push('/(auth)/login')}
          style={styles.backLink}
        >
          Back to Sign In
        </TextLink>
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
  description: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    lineHeight: typography.size.body * typography.lineHeight.relaxed,
  },
  button: {
    marginTop: spacing.lg,
  },
  backLink: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
});
