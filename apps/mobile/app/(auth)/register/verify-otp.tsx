import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Button } from '../../../src/components/ui/Button';
import { TextLink } from '../../../src/components/ui/TextLink';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { rounded } from '../../../src/theme/rounded';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{ email: string; role?: string }>();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!canResend && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0) setCanResend(true);
  }, [countdown, canResend]);

  const handleCodeChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError('');
    const token = code.join('');
    if (token.length !== CODE_LENGTH) {
      setError('Please enter the complete verification code');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email!,
        token,
        type: 'email',
      });

      if (verifyError) {
        setError('Invalid verification code');
        return;
      }

      const params = new URLSearchParams({ email: email! });
      if (role) params.set('role', role);
      router.push(`/(auth)/register/choose-role?${params.toString()}`);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');

    try {
      await supabase.auth.signInWithOtp({
        email: email!,
        options: { shouldCreateUser: true },
      });
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
    } catch {
      setError('Failed to resend code');
    }
  };

  return (
    <ScreenWrapper scroll>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {email}
          </Text>
        </View>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              accessibilityLabel={`Digit ${index + 1}`}
              testID={`verifyOtp_input_${index}`}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText} testID="verifyOtp_text_error">{error}</Text> : null}

        <Button onPress={handleVerify} loading={loading} style={styles.button} testID="verifyOtp_button_verify">
          Verify
        </Button>

        <View style={styles.resendRow}>
          {canResend ? (
            <TextLink onPress={handleResend}>Resend code</TextLink>
          ) : (
            <Text style={styles.countdownText}>
              Resend code in {countdown}s
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
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
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    textAlign: 'center',
    fontSize: typography.size.titleLg,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  codeInputFilled: {
    borderColor: colors.brand[300],
    borderWidth: 2,
  },
  button: {
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  resendRow: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
