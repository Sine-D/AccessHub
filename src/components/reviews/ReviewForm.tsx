// src/components/reviews/ReviewForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { RatingInput } from './RatingInput';

interface ReviewFormProps {
  locationId: string;
  onSubmit: (data: { locationId: string; rating: number; comment: string }) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ locationId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    if (comment.trim().length === 0) {
      setError('Please write a short review.');
      return;
    }

    setError(null);
    setSubmitting(true);

    onSubmit({ locationId, rating, comment: comment.trim() });

    // Reset form after submit
    setRating(0);
    setComment('');
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How accessible is this place?</Text>
      <RatingInput value={rating} onChange={setRating} />

      <Text style={styles.label}>Your review</Text>
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Describe the accessibility of this location..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        accessibilityLabel="Review comment"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Submit review"
      >
        <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  error: { color: '#DC2626', fontSize: 13, marginTop: 4 },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});