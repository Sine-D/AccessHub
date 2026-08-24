import { Review, CriteriaRatings } from '../types/review';

// In-memory store — resets on app reload. Placeholder until a real backend exists.
export const mockReviews: Review[] = [];

export const addReview = (data: {
  locationId: string;
  criteriaRatings: CriteriaRatings;
  comment: string;
  photoUri: string | null;
}): Review => {
  const review: Review = {
    id: `r${mockReviews.length + 1}-${Date.now()}`,
    locationId: data.locationId,
    userId: 'u1',
    userName: 'Current User',
    criteriaRatings: data.criteriaRatings,
    comment: data.comment,
    photoUri: data.photoUri,
    createdAt: new Date().toISOString(),
  };

  mockReviews.push(review);
  return review;
};

export const getReviewsForLocation = (locationId: string): Review[] =>
  mockReviews.filter(r => r.locationId === locationId);