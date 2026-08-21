export interface Review {
  id: string;
  locationId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photoUri: string | null;   // new — AC-80
  createdAt: string;
}

export interface AccessibleLocation {
  id: string;
  name: string;
  address: string;
}