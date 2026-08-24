// src/components/reviews/CriterionRating.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RatingInput } from './RatingInput';

interface CriterionRatingProps {
  label: string;
  value: number;
  onChange: (rating: number) => void;
}

export const CriterionRating: React.FC<CriterionRatingProps> = ({ label, value, onChange }) => {
  return (
    <View style={styles.row} accessibilityLabel={`${label} accessibility rating`}>
      <Text style={styles.label}>{label}</Text>
      <RatingInput value={value} onChange={onChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
});