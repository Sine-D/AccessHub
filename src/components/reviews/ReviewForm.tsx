import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { RatingMatrix } from './RatingMatrix';
import { PhotoPicker } from './PhotoPicker';
import { CriteriaRatings } from '../../types/review';

interface ReviewFormProps {
  locationId: string;
  onCancel?: () => void;

  onSubmit: (data: {
    locationId: string;
    criteriaRatings: CriteriaRatings;
    comment: string;
    photoUri: string | null;
  }) => void | Promise<void>;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  locationId,
  onCancel,
  onSubmit,
}) => {
  const [criteriaRatings, setCriteriaRatings] =
    useState<CriteriaRatings>({
      wheelchairRamp: 0,
      brailleMenu: 0,
      audioSignal: 0,
      accessibleRestroom: 0,
    });

  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const allRated = Object.values(criteriaRatings).every(
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
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await onSubmit({
        locationId,
        criteriaRatings,
        comment: comment.trim(),
        photoUri,
      });

      setSuccessMsg('🎉 Thank you! Your accessibility review has been submitted successfully.');

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('🎉 Thank you!\nYour accessibility review has been submitted successfully.');
      } else {
        Alert.alert('Thank you!', 'Your accessibility review has been submitted successfully.');
      }

      setCriteriaRatings({
        wheelchairRamp: 0,
        brailleMenu: 0,
        audioSignal: 0,
        accessibleRestroom: 0,
      });

      setComment('');
      setPhotoUri(null);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(
        'Failed to submit the review. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          Write Accessibility Review
        </Text>
        {onCancel && (
          <Pressable
            style={styles.cancelHeaderBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Close review form without submitting"
            accessibilityHint="Discards changes and returns to map"
          >
            <Text style={styles.cancelHeaderBtnText}>✕ Close</Text>
          </Pressable>
        )}
      </View>

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
        placeholderTextColor="#94A3B8"
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

      {successMsg && (
        <View
          style={styles.successBanner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
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

      <View style={styles.buttonRow}>
        {onCancel && (
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back without submitting"
          >
            <Text style={styles.cancelButtonText}>Back / Cancel</Text>
          </Pressable>
        )}

        <Pressable
          style={[
            styles.button,
            onCancel && { flex: 1 },
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
  },

  cancelHeaderBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#334155',
  },

  cancelHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9FAFB',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#F9FAFB',
    textAlignVertical: 'top',
    minHeight: 90,
  },

  error: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 4,
  },

  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },

  successText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#F9FAFB',
    fontWeight: '700',
    fontSize: 14,
  },

  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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