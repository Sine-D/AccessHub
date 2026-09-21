import { supabase } from './supabaseClient';
import { CriteriaRatings } from '../types/review';
import { verifySubmission } from './verificationService';

export const saveRatingWithVerification = async (
  locationId: string,
  ratings: CriteriaRatings,
  comment: string,
  photoUri: string | null
) => {
  // Verify the submission before saving it
  const verification = verifySubmission({
    photoUri,
    criteriaRatings: ratings,
    comment,
    locationId,
  });

  const { data, error } = await supabase
    .from('place_accessibility_ratings')
    .insert({
      location_id: locationId,
      user_id: 'u1', // placeholder — no real auth yet

      wheelchair_ramp: ratings.wheelchairRamp,
      braille_menu: ratings.brailleMenu,
      audio_signal: ratings.audioSignal,
      accessible_restroom: ratings.accessibleRestroom,

      // AC-85: store verification result
      verification_status: verification.status,
      verification_notes: verification.notes,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const saveRating = saveRatingWithVerification;

export const getAverageRatings = async (locationId: string) => {
  const { data, error } = await supabase
    .from('place_accessibility_ratings')
    .select(
      'wheelchair_ramp, braille_menu, audio_signal, accessible_restroom'
    )
    .eq('location_id', locationId);

  if (error) throw error;

  if (!data || data.length === 0) return null;

  const avg = (key: keyof typeof data[0]) =>
  data.reduce((sum: number, r: typeof data[0]) => sum + r[key], 0) / data.length;
  return {
    wheelchairRamp: avg('wheelchair_ramp'),
    brailleMenu: avg('braille_menu'),
    audioSignal: avg('audio_signal'),
    accessibleRestroom: avg('accessible_restroom'),
    count: data.length,
  };
};