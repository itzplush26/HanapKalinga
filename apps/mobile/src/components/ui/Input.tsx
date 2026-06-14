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
import { useTheme } from '../../contexts/ThemeContext';
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
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors['text-secondary'] }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? colors.error : isFocused ? colors['border-focus'] : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <RNTextInput
          style={[styles.input, { color: colors['text-primary'] }, style]}
          placeholderTextColor={colors['text-muted']}
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
              <EyeOff size={20} color={colors['text-muted']} />
            ) : (
              <Eye size={20} color={colors['text-muted']} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: rounded.md,
    paddingHorizontal: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.body,
    height: '100%',
  },
  toggleButton: {
    padding: spacing[2],
  },
  errorText: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.body,
  },
});
