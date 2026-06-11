import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { rounded } from '../../theme/rounded';

type SkeletonVariant = 'text' | 'circle' | 'rectangle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  style,
  testID,
}: SkeletonProps) {
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
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.base,
        variantStyles[variant],
        width ? { width } : undefined,
        height ? { height } : undefined,
        { opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface.strong,
  },
});

const variantStyles: Record<SkeletonVariant, ViewStyle> = {
  text: {
    height: 14,
    borderRadius: rounded.xs,
    width: '100%',
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: rounded.full,
  },
  rectangle: {
    width: '100%',
    height: 100,
    borderRadius: rounded.md,
  },
};
