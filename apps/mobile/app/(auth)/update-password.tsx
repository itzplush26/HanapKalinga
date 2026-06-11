import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { passwordSetupSchema } from '@hanapkalinga/shared/validations';
import { supabase } from '../../src/lib/supabase';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { TextLink } from '../../src/components/ui/TextLink';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setError('');
    setFieldErrors({});

    const result = passwordSetupSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const field: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        field[key] = issue.message;
      }
      setFieldErrors(field);
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setUpdated(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (updated) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.description}>
            Your password has been successfully updated. You can now sign in
            with your new password.
          </Text>
          <Button onPress={() => router.push('/(auth)/login')} style={styles.button}>
            Sign In
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.description}>
            Enter your new password below.
          </Text>
        </View>

        <Input
          label="New Password"
          value={password}
          onChangeText={(text) => { setPassword(text); setError(''); }}
          placeholder="At least 8 characters"
          secureTextEntry
          error={fieldErrors.password}
        />

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
          placeholder="Re-enter your password"
          secureTextEntry
          error={fieldErrors.confirmPassword}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button onPress={handleUpdate} loading={loading} style={styles.button}>
          Update Password
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
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
