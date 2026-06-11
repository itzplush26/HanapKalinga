import { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

export function StarRating({
  rating,
  maxStars = 5,
  onRate,
  readOnly = false,
  size = 24,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const displayRating = hoveredStar ?? rating;

  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={`Rating: ${rating} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= displayRating;
        const isHalf = !isFilled && starIndex - 0.5 <= displayRating;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => !readOnly && onRate?.(starIndex)}
            onPressIn={() => !readOnly && setHoveredStar(starIndex)}
            onPressOut={() => !readOnly && setHoveredStar(null)}
            disabled={readOnly}
            style={styles.starButton}
            accessibilityRole="button"
            accessibilityLabel={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
            accessibilityState={{ selected: isFilled }}
          >
            <Star
              size={size}
              color={isFilled ? colors.signature.mustard : colors.hairline}
              fill={isFilled ? colors.signature.mustard : 'transparent'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xxs,
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
