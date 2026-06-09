import { Text, TouchableOpacity, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface TextLinkProps {
  onPress?: () => void;
  underline?: boolean;
  children: string;
  style?: TextStyle;
}

export function TextLink({
  onPress,
  underline = false,
  children,
  style,
}: TextLinkProps) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="link">
      <Text
        style={[
          styles.text,
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
  text: {
    color: colors.semantic.link,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
