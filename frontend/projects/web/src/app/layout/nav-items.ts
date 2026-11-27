// Main menu of the website (header, mobile drawer and footer use the same list)
export const NAV_ITEMS = [
  { path: 'hotels', icon: 'hotel', label: 'nav.stay' },
  { path: 'restaurants', icon: 'restaurant', label: 'nav.eat' },
  { path: 'places', icon: 'explore', label: 'nav.explore' },
  { path: 'transport', icon: 'commute', label: 'nav.gettingAround' },
  { path: 'rides', icon: 'directions_car', label: 'nav.rides' },
] as const;
