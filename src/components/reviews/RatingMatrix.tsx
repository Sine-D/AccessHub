import React from 'react';
import { View } from 'react-native';
import { CriterionRating } from './CriterionRating';
import { CriteriaRatings } from '../../types/review';

interface RatingMatrixProps {
  value: CriteriaRatings;
  onChange: (ratings: CriteriaRatings) => void;
}

export const RatingMatrix: React.FC<RatingMatrixProps> = ({ value, onChange }) => {
  const update = (key: keyof CriteriaRatings, rating: number) => {
    onChange({ ...value, [key]: rating });
  };

  return (
    <View>
      <CriterionRating
        label="Wheelchair Ramp"
        value={value.wheelchairRamp}
        onChange={(r) => update('wheelchairRamp', r)}
      />
      <CriterionRating
        label="Braille Menu"
        value={value.brailleMenu}
        onChange={(r) => update('brailleMenu', r)}
      />
      <CriterionRating
        label="Audio Signal"
        value={value.audioSignal}
        onChange={(r) => update('audioSignal', r)}
      />
      <CriterionRating
        label="Accessible Restroom"
        value={value.accessibleRestroom}
        onChange={(r) => update('accessibleRestroom', r)}
      />
    </View>
  );
};