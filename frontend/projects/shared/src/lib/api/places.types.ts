export type PlaceType = 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';

// One card in lists, on the home page and in favorites (GET /api/places, /api/home ...)
export type PlaceListItem = {
  id: number;
  slug: string;
  type: PlaceType;
  name: string;
  area: { slug: string; name: string } | null;
  lat: number;
  lng: number;
  coverPhoto: string | null;
  priceFrom: number | null;
  priceLevel: number | null;
  stars: number | null;
  categories: string[];
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  amenities: string[];
  offer: { title: string; discountPercent: number | null } | null;
  isOpenNow: boolean | null;
  distanceKm: number | null;
};

// GET /api/home
export type HomeData = {
  recommendedHotels: PlaceListItem[];
  whereToEat: PlaceListItem[];
  popularPlaces: PlaceListItem[];
  offers: PlaceListItem[];
  comingSoonRegions: { slug: string; name: string }[];
};
