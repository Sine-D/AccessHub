export interface MapPoint {
  lat: number;
  lng: number;
}

export interface PlaceSearchResult extends MapPoint {
  address: string;
  name: string;
  placeId: string;
}