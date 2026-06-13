import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { Button } from './ui/Button';
import { StarRating } from './domain/StarRating';
import { supabase } from '../lib/supabase';

interface BookingReviewFormProps {
  bookingId: string;
  nurseId: string;
  onSubmit?: () => void;
}

export function BookingReviewForm({ bookingId, nurseId, onSubmit }: BookingReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }

    setError(null);
    setSubmitting(true);

    const { error: submitError } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      nurse_id: nurseId,
      rating,
      comment: comment.trim() || null,
    } as any);

    setSubmitting(false);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    setDone(true);
    onSubmit?.();
  };

  if (done) {
    return (
      <View style={styles.successCard}>
        <Text style={styles.successText}>
          Review submitted. Thank you for helping other families choose care.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>How was your experience?</Text>
      <StarRating rating={rating} onRate={setRating} size={28} />
      <TextInput
        style={styles.textarea}
        placeholder="Tell others about your experience (optional)"
        placeholderTextColor={colors.muted}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button
        variant="primary"
        loading={submitting}
        onPress={handleSubmit}
      >
        Submit review
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.size.titleSm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.ink,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.sm,
    padding: spacing.sm,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    minHeight: 80,
  },
  errorText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.semantic.error,
  },
  successCard: {
    backgroundColor: '#d1fae5',
    borderRadius: rounded.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: '#065f46',
  },
});
