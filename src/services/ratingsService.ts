import { supabase } from './supabaseClient';
import { CriteriaRatings } from '../types/review';

export const saveRating = async (locationId: string, ratings: CriteriaRatings) => {
  const { data, error } = await supabase
    .from('place_accessibility_ratings')
    .insert({
      location_id: locationId,
      user_id: 'u1', // still a placeholder — no real auth yet, same caveat as before
      wheelchair_ramp: ratings.wheelchairRamp,
      braille_menu: ratings.brailleMenu,
      audio_signal: ratings.audioSignal,
      accessible_restroom: ratings.accessibleRestroom,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAverageRatings = async (locationId: string) => {
  const { data, error } = await supabase
    .from('place_accessibility_ratings')
    .select('wheelchair_ramp, braille_menu, audio_signal, accessible_restroom')
    .eq('location_id', locationId);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const avg = (key: keyof typeof data[0]) =>
    data.reduce((sum, r) => sum + r[key], 0) / data.length;

  return {
    wheelchairRamp: avg('wheelchair_ramp'),
    brailleMenu: avg('braille_menu'),
    audioSignal: avg('audio_signal'),
    accessibleRestroom: avg('accessible_restroom'),
    count: data.length,
  };
};