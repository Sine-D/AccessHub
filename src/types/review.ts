export interface CriteriaRatings {
  wheelchairRamp: number;
  brailleMenu: number;
  audioSignal: number;
  accessibleRestroom: number;
}

export interface Review {
  id: string;
  locationId: string;
  userId: string;
  userName: string;
  criteriaRatings: CriteriaRatings;   // replaces old `rating: number`
  comment: string;
  photoUri: string | null;
  createdAt: string;
}
export interface AccessibleLocation {
  id: string;
  name: string;
  address: string;
}