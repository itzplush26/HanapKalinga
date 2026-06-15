import { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { rounded } from '../../theme/rounded';
import { typography } from '../../theme/typography';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
}

export function Input({
  label,
  error,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          accessibilityLabel={label}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            style={styles.toggleButton}
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            {isSecureVisible ? (
              <EyeOff size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.labelMd,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.body,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.brand[300],
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  input: {
    flex: 1,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    height: '100%',
  },
  toggleButton: {
    padding: spacing.xs,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
  },
});
