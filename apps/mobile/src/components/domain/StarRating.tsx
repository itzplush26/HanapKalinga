import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={`Rate ${value} stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          style={styles.starButton}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${star} stars`}
          accessibilityState={{ selected: star <= value }}
        >
          <Text style={[styles.star, star <= value ? styles.filled : styles.empty]}>
            {star <= value ? '\u2605' : '\u2606'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  starButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    fontSize: 24,
    lineHeight: 28,
  },
  filled: {
    color: '#fbbf24',
  },
  empty: {
    color: '#fbbf24',
  },
});
