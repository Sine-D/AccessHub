import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';

import { RatingMatrix } from './RatingMatrix';
import { PhotoPicker } from './PhotoPicker';
import { CriteriaRatings } from '../../types/review';

interface ReviewFormProps {
  locationId: string;

  onSubmit: (data: {
    locationId: string;
    criteriaRatings: CriteriaRatings;
    comment: string;
    photoUri: string | null;
  }) => void;
}

export const ReviewForm: React.FC<
  ReviewFormProps
> = ({ locationId, onSubmit }) => {
  const [criteriaRatings, setCriteriaRatings] =
    useState<CriteriaRatings>({
      wheelchairRamp: 0,
      brailleMenu: 0,
      audioSignal: 0,
      accessibleRestroom: 0,
    });

  const [comment, setComment] = useState('');

  const [photoUri, setPhotoUri] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const handleSubmit = () => {
    const allRated = Object.values(
      criteriaRatings,
    ).every(
      (rating) => rating >= 1 && rating <= 5,
    );

    if (!allRated) {
      setError(
        'Please rate all four accessibility criteria.',
      );

      return;
    }

    if (comment.trim().length === 0) {
      setError('Please write a short review.');
      return;
    }

    setError(null);
    setSubmitting(true);

    onSubmit({
      locationId,
      criteriaRatings,
      comment: comment.trim(),
      photoUri,
    });

    setCriteriaRatings({
      wheelchairRamp: 0,
      brailleMenu: 0,
      audioSignal: 0,
      accessibleRestroom: 0,
    });

    setComment('');
    setPhotoUri(null);
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Rate each accessibility feature
      </Text>

      <RatingMatrix
        value={criteriaRatings}
        onChange={setCriteriaRatings}
      />

      <Text style={styles.label}>
        Your review
      </Text>

      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={(value) => {
          setComment(value);

          if (error) {
            setError(null);
          }
        }}
        placeholder="Describe the accessibility of this location..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        accessibilityLabel="Review comment"
        accessibilityHint="Describe the accessibility features of this location"
      />

      {error && (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {error}
        </Text>
      )}

      <PhotoPicker
        value={photoUri}
        onChange={setPhotoUri}
      />

      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={styles.photoPreview}
          accessibilityLabel="Preview of selected accessibility photo"
          resizeMode="cover"
        />
      )}

      <Pressable
        style={[
          styles.button,
          submitting && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel={
          submitting
            ? 'Submitting review'
            : 'Submit accessibility review'
        }
        accessibilityState={{
          disabled: submitting,
          busy: submitting,
        }}
      >
        <Text style={styles.buttonText}>
          {submitting
            ? 'Submitting...'
            : 'Submit Review'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },

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

  error: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 4,
  },

  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
  },

  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});