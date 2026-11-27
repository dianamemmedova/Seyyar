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

// GET /api/places/filters?type=HOTEL — what the filter sidebar can offer
export type PlaceFilterOptions = {
  type: PlaceType;
  areas: { slug: string; name: string }[];
  amenities: {
    code: string;
    name: string;
    icon: string | null;
    count: number;
  }[];
  categories: { value: string; count: number }[];
  price: { min: number | null; max: number | null };
  stars: number[];
  priceLevels: number[];
};

export type OpeningHours = {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type Room = {
  id: number;
  name: string;
  description: string | null;
  sizeM2: number | null;
  bedType: string | null;
  maxGuests: number;
  pricePerNight: number;
  freeCancellation: boolean;
  breakfastIncluded: boolean;
  photos: string[];
};

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  weightGrams: number | null;
  photo: string | null;
  tags: string[];
  isSet: boolean;
  isAvailable: boolean;
};

// GET /api/places/:slug
export type PlaceDetail = {
  id: number;
  slug: string;
  type: PlaceType;
  name: string;
  description: string | null;
  area: { slug: string; name: string } | null;
  address: string | null;
  lat: number;
  lng: number;
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
  };
  priceFrom: number | null;
  priceLevel: number | null;
  stars: number | null;
  categories: string[];
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  bookingUrl: string | null;
  officialTicketUrl: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  recommendedMinutes: number | null;
  photos: { url: string; alt: string | null; isCover: boolean }[];
  amenities: { code: string; name: string; icon: string | null }[];
  openingHours: OpeningHours[];
  isOpenNow: boolean | null;
  today: {
    opensAt: string | null;
    closesAt: string | null;
    isClosed: boolean;
  } | null;
  rooms: Room[];
  menu: { id: number; name: string; items: MenuItem[] }[];
  tickets: { label: string; price: number; isFree: boolean }[];
  offers: {
    title: string;
    description: string | null;
    discountPercent: number | null;
    endsAt: string;
  }[];
};

export type TravelType = 'family' | 'couple' | 'solo' | 'friends';

// GET /api/places/:slug/reviews
export type PlaceReview = {
  id: number;
  author: string;
  rating: number;
  categoryRatings: Record<string, number> | null;
  text: string | null;
  photos: string[];
  travelType: TravelType | null;
  partnerReply: string | null;
  partnerRepliedAt: string | null;
  createdAt: string;
};

export type ReviewsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  ratingAvg: number;
  ratingCount: number;
};
