export interface Review {
  id: string;
  locationId: string;
  userId: string;
  userName: string;
  rating: number;       // 1–5 stars
  comment: string;
  createdAt: string;    // ISO date string
}

export interface AccessibleLocation {
  id: string;
  name: string;
  address: string;
}