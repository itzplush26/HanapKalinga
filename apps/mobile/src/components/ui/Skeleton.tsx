import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { rounded } from '../../theme/rounded';

interface SkeletonProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circle' | 'rectangle';
  testID?: string;
}

export function Skeleton({ width, height = 20, style, variant, testID }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.base,
        {
          width,
          height,
          backgroundColor: colors['surface-alt'],
          opacity,
          borderRadius: variant === 'circle' ? 9999 : variant === 'text' ? 4 : rounded.md,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: rounded.md,
  },
});
