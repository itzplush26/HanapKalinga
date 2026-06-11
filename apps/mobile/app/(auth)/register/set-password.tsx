import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { passwordSetupSchema } from '@hanapkalinga/shared/validations';
import type { UserRole } from '@hanapkalinga/shared/types';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/contexts/AuthContext';
import { ScreenWrapper } from '../../../src/components/ScreenWrapper';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';

export default function SetPasswordScreen() {
  const router = useRouter();
  const { getRedirectPath } = useAuth();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          router.replace(getRedirectPath((profile as { role: UserRole }).role));
        } else {
          router.replace('/');
        }
      } else {
        router.replace('/(auth)/login');
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
          <Text style={styles.title}>Set your password</Text>
          <Text style={styles.subtitle}>
            Create a password to secure your account
          </Text>
        </View>

        <Input
          label="Password"
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

        <Button onPress={handleCreateAccount} loading={loading} style={styles.button}>
          Create Account
        </Button>

        {email && (
          <Text style={styles.emailNote}>
            Account for: {email}
          </Text>
        )}
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
  emailNote: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
