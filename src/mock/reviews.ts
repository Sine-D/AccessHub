// src/mock/reviews.ts
import { Review } from '../types/review';

// In-memory store — resets on app reload. Placeholder until a real backend exists.
export const mockReviews: Review[] = [];

export const addReview = (data: {
  locationId: string;
  rating: number;
  comment: string;
}): Review => {
  const review: Review = {
    id: `r${mockReviews.length + 1}-${Date.now()}`,
    locationId: data.locationId,
    userId: 'u1',           // placeholder — see note below
    userName: 'Current User', // placeholder — see note below
    rating: data.rating,
    comment: data.comment,
    createdAt: new Date().toISOString(),
  };

  mockReviews.push(review);
  return review;
};

export const getReviewsForLocation = (locationId: string): Review[] =>
  mockReviews.filter(r => r.locationId === locationId);