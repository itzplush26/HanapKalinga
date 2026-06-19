import { Text, StyleSheet } from 'react-native';

interface StarDisplayProps {
  rating: number;
  size?: 'sm' | 'md';
}

export function StarDisplay({ rating, size = 'md' }: StarDisplayProps) {
  const rounded = Math.round(rating * 2) / 2;
  const fontSize = size === 'sm' ? 14 : 16;

  return (
    <Text
      style={[styles.stars, { fontSize }]}
      accessibilityLabel={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star}>{star <= rounded ? '\u2605' : '\u2606'}</Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  stars: {
    color: '#fbbf24',
    letterSpacing: 1,
  },
});
