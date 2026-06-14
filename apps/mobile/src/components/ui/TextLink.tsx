import { Text, TouchableOpacity, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme/typography';

interface TextLinkProps {
  onPress?: () => void;
  underline?: boolean;
  children: string;
  style?: TextStyle;
  testID?: string;
}

export function TextLink({
  onPress,
  underline = false,
  children,
  style,
  testID,
}: TextLinkProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="link" testID={testID}>
      <Text
        style={[
          { color: colors.primary, fontSize: typography.size.base, fontFamily: typography.fontFamily.body },
          underline && styles.underline,
          style,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  underline: {
    textDecorationLine: 'underline',
  },
});
