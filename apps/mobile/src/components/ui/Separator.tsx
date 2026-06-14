import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

export function Separator({
  orientation = 'horizontal',
  style,
}: SeparatorProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        { backgroundColor: colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
