// src/components/reviews/RatingInput.tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingInputProps {
  value: number;              // current rating, 0 means none selected
  onChange: (rating: number) => void;
}

const STAR_COUNT = 5;

export const RatingInput: React.FC<RatingInputProps> = ({ value, onChange }) => {
  return (
    <View style={styles.row} accessibilityRole="adjustable">
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const starNumber = index + 1;
        const filled = starNumber <= value;

        return (
          <Pressable
            key={starNumber}
            onPress={() => onChange(starNumber)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${starNumber} out of ${STAR_COUNT} stars`}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={32}
              color={filled ? '#FBBF24' : '#9CA3AF'}
              style={styles.star}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    marginHorizontal: 2,
  },
});