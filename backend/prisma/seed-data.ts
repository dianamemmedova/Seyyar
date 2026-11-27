// Seyyar — development seed data
// NOTE: hotel and restaurant names are fictional.
// Attraction ticket prices, opening hours and transport prices are SAMPLE values
// for development only. Verify real values before launch.

export type T = { en: string; ru: string; az: string };

export const t = (en: string, ru: string, az: string): T => ({ en, ru, az });

const photos = (slug: string, count = 3) =>
  Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${slug}-${i + 1}/1200/800`);

// ─────────────────────────────────────────────
// Regions and areas
// ─────────────────────────────────────────────

export const regions = [
  { slug: 'baku', name: t('Baku', 'Баку', 'Bakı'), isActive: true },
  { slug: 'gabala', name: t('Gabala', 'Габала', 'Qəbələ'), isActive: false },
  { slug: 'sheki', name: t('Sheki', 'Шеки', 'Şəki'), isActive: false },
  { slug: 'guba', name: t('Guba', 'Губа', 'Quba'), isActive: false },
];

export const areas = [
  { slug: 'old-city', name: t('Old City', 'Старый город', 'İçərişəhər'), lat: 40.3664, lng: 49.8357 },
  { slug: 'sabail', name: t('Sabail (Seaside)', 'Сабаиль (Приморье)', 'Səbail (Dənizkənarı)'), lat: 40.364, lng: 49.845 },
  { slug: 'nasimi', name: t('Nasimi', 'Насими', 'Nəsimi'), lat: 40.385, lng: 49.828 },
  { slug: 'yasamal', name: t('Yasamal', 'Ясамал', 'Yasamal'), lat: 40.38, lng: 49.81 },
  { slug: 'narimanov', name: t('Narimanov', 'Нариманов', 'Nərimanov'), lat: 40.403, lng: 49.87 },
  { slug: 'khatai', name: t('Khatai', 'Хатаи', 'Xətai'), lat: 40.383, lng: 49.91 },
];

// ─────────────────────────────────────────────
// Amenities
// ─────────────────────────────────────────────

export const amenities = [
  { code: 'wifi', icon: 'wifi', name: t('Free Wi-Fi', 'Бесплатный Wi-Fi', 'Pulsuz Wi-Fi') },
  { code: 'parking', icon: 'local_parking', name: t('Parking', 'Парковка', 'Parkinq') },
  { code: 'breakfast', icon: 'free_breakfast', name: t('Breakfast', 'Завтрак', 'Səhər yeməyi') },
  { code: 'airport-transfer', icon: 'airport_shuttle', name: t('Airport transfer', 'Трансфер из аэропорта', 'Aeroport transferi') },
  { code: 'pool', icon: 'pool', name: t('Swimming pool', 'Бассейн', 'Hovuz') },
  { code: 'gym', icon: 'fitness_center', name: t('Gym', 'Тренажёрный зал', 'İdman zalı') },
  { code: 'spa', icon: 'spa', name: t('Spa', 'Спа', 'Spa') },
  { code: 'family-rooms', icon: 'family_restroom', name: t('Family rooms', 'Семейные номера', 'Ailə otaqları') },
  { code: 'air-conditioning', icon: 'ac_unit', name: t('Air conditioning', 'Кондиционер', 'Kondisioner') },
  { code: 'kitchen', icon: 'kitchen', name: t('Kitchen', 'Кухня', 'Mətbəx') },
  { code: 'terrace', icon: 'deck', name: t('Terrace', 'Терраса', 'Terras') },
  { code: 'sea-view', icon: 'waves', name: t('Sea view', 'Вид на море', 'Dəniz mənzərəsi') },
  { code: 'kids-menu', icon: 'child_care', name: t('Kids menu', 'Детское меню', 'Uşaq menyusu') },
  { code: 'halal', icon: 'verified', name: t('Halal', 'Халяль', 'Halal') },
  { code: 'live-music', icon: 'music_note', name: t('Live music', 'Живая музыка', 'Canlı musiqi') },
  { code: 'delivery', icon: 'delivery_dining', name: t('Delivery', 'Доставка', 'Çatdırılma') },
  { code: 'card-payment', icon: 'credit_card', name: t('Card payment', 'Оплата картой', 'Kartla ödəniş') },
  { code: 'family-friendly', icon: 'family_restroom', name: t('Family friendly', 'Подходит для семей', 'Ailə üçün uyğun') },
  { code: 'wheelchair', icon: 'accessible', name: t('Wheelchair accessible', 'Доступно для колясок', 'Əlil arabası üçün əlçatan') },
  { code: 'audio-guide', icon: 'headphones', name: t('Audio guide', 'Аудиогид', 'Audio bələdçi') },
];

// ─────────────────────────────────────────────
// Shared helpers for places
// ─────────────────────────────────────────────

type Hours = { dayOfWeek: number; opensAt?: string; closesAt?: string; isClosed?: boolean };

const everyDay = (opensAt: string, closesAt: string): Hours[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt, closesAt }));

// Monday closed, Tuesday-Sunday open
const closedMonday = (opensAt: string, closesAt: string): Hours[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) =>
    dayOfWeek === 0 ? { dayOfWeek, isClosed: true } : { dayOfWeek, opensAt, closesAt },
  );

export type OfferSeed = { title: T; discountPercent: number };

export type RoomSeed = {
  name: T;
  sizeM2: number;
  bedType: string;
  maxGuests: number;
  pricePerNight: number;
  freeCancellation: boolean;
  breakfastIncluded: boolean;
};

export type MenuItemSeed = [name: T, price: number, weightGrams: number | null, tags: string[], isSet?: boolean];
export type MenuCategorySeed = { name: T; items: MenuItemSeed[] };

type BasePlace = {
  slug: string;
  name: T;
  description: T;
  area: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  amenities: string[];
  categories: string[];
  isFeatured?: boolean;
  featuredOrder?: number;
  offer?: OfferSeed;
  photos: string[];
};

export type HotelSeed = BasePlace & {
  type: 'HOTEL';
  stars: number | null;
  priceFrom: number;
  checkInTime: string;
  checkOutTime: string;
  rooms: RoomSeed[];
};

export type RestaurantSeed = BasePlace & {
  type: 'RESTAURANT';
  priceLevel: number;
  priceFrom: number;
  hours: Hours[];
  menu: MenuCategorySeed[];
};

export type AttractionSeed = BasePlace & {
  type: 'ATTRACTION';
  recommendedMinutes: number;
  officialTicketUrl?: string;
  hours: Hours[];
  tickets: { label: T; price: number }[];
};

export type PlaceSeed = HotelSeed | RestaurantSeed | AttractionSeed;

const room = (
  name: T,
  sizeM2: number,
  bedType: string,
  maxGuests: number,
  pricePerNight: number,
  freeCancellation = true,
  breakfastIncluded = true,
): RoomSeed => ({ name, sizeM2, bedType, maxGuests, pricePerNight, freeCancellation, breakfastIncluded });

const STANDARD = t('Standard Double', 'Стандартный двухместный', 'Standart ikinəfərlik');
const DELUXE = t('Deluxe Room', 'Номер делюкс', 'Delüks otaq');
const FAMILY = t('Family Room', 'Семейный номер', 'Ailə otağı');
const SUITE = t('Suite', 'Люкс', 'Lüks');

// ─────────────────────────────────────────────
// Hotels (fictional names)
// ─────────────────────────────────────────────

export const hotels: HotelSeed[] = [
  {
    type: 'HOTEL',
    slug: 'shirvanshah-boutique-hotel',
    name: t('Shirvanshah Boutique Hotel', 'Бутик-отель Ширваншах', 'Şirvanşah Butik Otel'),
    description: t(
      'A quiet boutique hotel inside the Old City walls, a few steps from the Maiden Tower.',
      'Тихий бутик-отель внутри стен Старого города, в нескольких шагах от Девичьей башни.',
      'İçərişəhər divarları içində, Qız qalasına bir neçə addım məsafədə sakit butik otel.',
    ),
    area: 'old-city',
    lat: 40.3667,
    lng: 49.835,
    address: 'Old City, Baku',
    stars: 4,
    priceFrom: 120,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    categories: ['hotel'],
    amenities: ['wifi', 'breakfast', 'airport-transfer', 'air-conditioning', 'family-rooms'],
    isFeatured: true,
    featuredOrder: 1,
    offer: { title: t('Stay 3 nights, get 15% off', '3 ночи — скидка 15%', '3 gecə qal, 15% endirim'), discountPercent: 15 },
    photos: photos('shirvanshah-boutique-hotel'),
    rooms: [room(STANDARD, 22, 'Double', 2, 120), room(DELUXE, 30, 'King', 2, 160), room(FAMILY, 38, 'Double + 2 Single', 4, 190)],
  },
  {
    type: 'HOTEL',
    slug: 'caspian-breeze-hotel',
    name: t('Caspian Breeze Hotel', 'Отель Каспийский Бриз', 'Xəzər Mehi Otel'),
    description: t(
      'Five-star seaside hotel on the Boulevard with a pool, spa and Caspian views.',
      'Пятизвёздочный отель на Бульваре с бассейном, спа и видом на Каспий.',
      'Bulvarda hovuzu, spası və Xəzər mənzərəsi olan beşulduzlu otel.',
    ),
    area: 'sabail',
    lat: 40.3595,
    lng: 49.842,
    address: 'Neftchilar Ave, Baku',
    stars: 5,
    priceFrom: 220,
    checkInTime: '15:00',
    checkOutTime: '12:00',
    categories: ['hotel'],
    amenities: ['wifi', 'parking', 'breakfast', 'airport-transfer', 'pool', 'gym', 'spa', 'sea-view', 'air-conditioning'],
    isFeatured: true,
    featuredOrder: 2,
    photos: photos('caspian-breeze-hotel'),
    rooms: [room(DELUXE, 34, 'King', 2, 220), room(SUITE, 60, 'King', 3, 380), room(FAMILY, 45, 'King + Sofa bed', 4, 290)],
  },
  {
    type: 'HOTEL',
    slug: 'maiden-gate-inn',
    name: t('Maiden Gate Inn', 'Гостиница Девичьи Ворота', 'Qız Qapısı Mehmanxanası'),
    description: t(
      'Cozy three-star inn in a restored stone house in the Old City.',
      'Уютная трёхзвёздочная гостиница в отреставрированном каменном доме в Старом городе.',
      'İçərişəhərdə bərpa olunmuş daş evdə rahat üçulduzlu mehmanxana.',
    ),
    area: 'old-city',
    lat: 40.366,
    lng: 49.838,
    address: 'Old City, Baku',
    stars: 3,
    priceFrom: 75,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    categories: ['hotel'],
    amenities: ['wifi', 'breakfast', 'air-conditioning'],
    photos: photos('maiden-gate-inn'),
    rooms: [room(STANDARD, 18, 'Double', 2, 75), room(FAMILY, 28, 'Double + Single', 3, 105, false)],
  },
  {
    type: 'HOTEL',
    slug: 'nizami-street-suites',
    name: t('Nizami Street Suites', 'Апартаменты на Низами', 'Nizami Küçəsi Süitləri'),
    description: t(
      'Modern suites on the famous Nizami pedestrian street, close to Fountain Square.',
      'Современные номера на знаменитой пешеходной улице Низами, рядом с Фонтанной площадью.',
      'Məşhur Nizami piyada küçəsində, Fəvvarələr meydanına yaxın müasir süitlər.',
    ),
    area: 'nasimi',
    lat: 40.378,
    lng: 49.842,
    address: 'Nizami St, Baku',
    stars: 4,
    priceFrom: 110,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    categories: ['hotel'],
    amenities: ['wifi', 'breakfast', 'air-conditioning', 'kitchen', 'family-rooms'],
    isFeatured: true,
    featuredOrder: 3,
    offer: { title: t('Early booking: 10% off', 'Раннее бронирование: −10%', 'Erkən rezerv: 10% endirim'), discountPercent: 10 },
    photos: photos('nizami-street-suites'),
    rooms: [room(STANDARD, 24, 'Queen', 2, 110), room(SUITE, 45, 'King + Sofa bed', 4, 175)],
  },
  {
    type: 'HOTEL',
    slug: 'flame-view-residence',
    name: t('Flame View Residence', 'Резиденция с видом на Пламя', 'Alov Mənzərəli Rezidensiya'),
    description: t(
      'Upper-floor rooms with views of the Flame Towers and the bay.',
      'Номера на верхних этажах с видом на Пламенные башни и бухту.',
      'Alov qüllələrinə və buxtaya baxan yuxarı mərtəbə otaqları.',
    ),
    area: 'sabail',
    lat: 40.359,
    lng: 49.827,
    address: 'Highland area, Baku',
    stars: 4,
    priceFrom: 140,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    categories: ['hotel'],
    amenities: ['wifi', 'parking', 'breakfast', 'gym', 'sea-view', 'air-conditioning'],
    photos: photos('flame-view-residence'),
    rooms: [room(STANDARD, 26, 'Double', 2, 140), room(DELUXE, 32, 'King', 2, 180)],
  },
  {
    type: 'HOTEL',
    slug: 'yasamal-family-apartments',
    name: t('Yasamal Family Apartments', 'Семейные апартаменты Ясамал', 'Yasamal Ailə Mənzilləri'),
    description: t(
      'Spacious apartments with a kitchen, ideal for families staying longer.',
      'Просторные апартаменты с кухней, идеальны для семей на длительный срок.',
      'Mətbəxli geniş mənzillər, uzun müddət qalan ailələr üçün ideal.',
    ),
    area: 'yasamal',
    lat: 40.382,
    lng: 49.805,
    address: 'Yasamal district, Baku',
    stars: null,
    priceFrom: 65,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    categories: ['apartment'],
    amenities: ['wifi', 'parking', 'kitchen', 'family-rooms', 'air-conditioning'],
    photos: photos('yasamal-family-apartments'),
    rooms: [
      room(t('One-bedroom Apartment', 'Апартаменты с 1 спальней', 'Birotaqlı mənzil'), 45, 'Double + Sofa bed', 4, 65, true, false),
      room(t('Two-bedroom Apartment', 'Апартаменты с 2 спальнями', 'İkiotaqlı mənzil'), 70, '2 Double', 6, 95, true, false),
    ],
  },
  {
    type: 'HOTEL',
    slug: 'narimanov-business-hotel',
    name: t('Narimanov Business Hotel', 'Бизнес-отель Нариманов', 'Nərimanov Biznes Otel'),
    description: t(
      'Practical four-star hotel near the metro, convenient for the airport road.',
      'Практичный четырёхзвёздочный отель у метро, удобно для дороги в аэропорт.',
      'Metroya yaxın, aeroport yolu üçün rahat dördulduzlu otel.',
    ),
    area: 'narimanov',
    lat: 40.404,
    lng: 49.872,
    address: 'Narimanov district, Baku',
    stars: 4,
    priceFrom: 95,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    categories: ['hotel'],
    amenities: ['wifi', 'parking', 'breakfast', 'airport-transfer', 'gym', 'air-conditioning'],
    photos: photos('narimanov-business-hotel'),
    rooms: [room(STANDARD, 24, 'Double', 2, 95), room(DELUXE, 30, 'King', 2, 125)],
  },
  {
    type: 'HOTEL',
    slug: 'silk-road-hostel',
    name: t('Silk Road Hostel', 'Хостел Шёлковый путь', 'İpək Yolu Hosteli'),
    description: t(
      'Friendly hostel with dorms and private rooms, walking distance to the center.',
      'Дружелюбный хостел с общими и отдельными номерами, пешком до центра.',
      'Ümumi və fərdi otaqları olan, mərkəzə piyada məsafədə dostcanlı hostel.',
    ),
    area: 'nasimi',
    lat: 40.38,
    lng: 49.835,
    address: 'Nasimi district, Baku',
    stars: null,
    priceFrom: 25,
    checkInTime: '13:00',
    checkOutTime: '11:00',
    categories: ['hostel'],
    amenities: ['wifi', 'kitchen', 'air-conditioning'],
    photos: photos('silk-road-hostel'),
    rooms: [
      room(t('Bed in 6-bed dorm', 'Место в 6-местном номере', '6 nəfərlik otaqda çarpayı'), 24, 'Bunk bed', 1, 25, true, false),
      room(t('Private Double', 'Отдельный двухместный', 'Fərdi ikinəfərlik'), 14, 'Double', 2, 60, true, false),
    ],
  },
  {
    type: 'HOTEL',
    slug: 'boulevard-garden-hotel',
    name: t('Boulevard Garden Hotel', 'Отель Бульварный сад', 'Bulvar Bağı Otel'),
    description: t(
      'Simple three-star hotel one street from the seaside Boulevard.',
      'Простой трёхзвёздочный отель в одном квартале от Бульвара.',
      'Dənizkənarı bulvardan bir küçə aralıda sadə üçulduzlu otel.',
    ),
    area: 'sabail',
    lat: 40.37,
    lng: 49.85,
    address: 'Sabail district, Baku',
    stars: 3,
    priceFrom: 85,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    categories: ['hotel'],
    amenities: ['wifi', 'breakfast', 'air-conditioning', 'family-rooms'],
    photos: photos('boulevard-garden-hotel'),
    rooms: [room(STANDARD, 20, 'Double', 2, 85), room(FAMILY, 32, 'Double + 2 Single', 4, 130)],
  },
  {
    type: 'HOTEL',
    slug: 'white-city-hotel',
    name: t('White City Hotel', 'Отель Белый город', 'Ağ Şəhər Otel'),
    description: t(
      'New four-star hotel in the modern White City district with a rooftop pool.',
      'Новый четырёхзвёздочный отель в современном районе Белый город с бассейном на крыше.',
      'Müasir Ağ Şəhər ərazisində, damında hovuz olan yeni dördulduzlu otel.',
    ),
    area: 'khatai',
    lat: 40.379,
    lng: 49.89,
    address: 'White City, Baku',
    stars: 4,
    priceFrom: 105,
    checkInTime: '15:00',
    checkOutTime: '12:00',
    categories: ['hotel'],
    amenities: ['wifi', 'parking', 'breakfast', 'pool', 'gym', 'air-conditioning'],
    photos: photos('white-city-hotel'),
    rooms: [room(STANDARD, 25, 'Queen', 2, 105), room(DELUXE, 33, 'King', 2, 140), room(SUITE, 55, 'King', 3, 230)],
  },
];

// ─────────────────────────────────────────────
// Menus (shared templates)
// ─────────────────────────────────────────────

const azerbaijaniMenu: MenuCategorySeed[] = [
  {
    name: t('Starters', 'Закуски', 'Qəlyanaltılar'),
    items: [
      [t('Qutab with greens', 'Кутабы с зеленью', 'Göyərti qutabı'), 3, 150, ['vegetarian']],
      [t('Grape leaf dolma', 'Долма в виноградных листьях', 'Yarpaq dolması'), 9, 250, []],
      [t('Shepherd salad', 'Салат по-пастушьи', 'Çoban salatı'), 5, 250, ['vegetarian']],
    ],
  },
  {
    name: t('Soups', 'Супы', 'Şorbalar'),
    items: [
      [t('Dushbara', 'Дюшбара', 'Düşbərə'), 6, 300, []],
      [t('Piti', 'Пити', 'Piti'), 12, 450, []],
    ],
  },
  {
    name: t('Main dishes', 'Основные блюда', 'Əsas yeməklər'),
    items: [
      [t('Shah plov', 'Шах-плов', 'Şah plov'), 22, 400, []],
      [t('Lamb kebab', 'Шашлык из баранины', 'Quzu kababı'), 14, 300, []],
      [t('Chicken lyulya kebab', 'Люля-кебаб из курицы', 'Toyuq lülə kababı'), 9, 250, []],
      [t('Saj with lamb and vegetables', 'Садж с бараниной и овощами', 'Quzu ətli sac'), 25, 800, [], false],
    ],
  },
  {
    name: t('Desserts and drinks', 'Десерты и напитки', 'Desertlər və içkilər'),
    items: [
      [t('Pakhlava', 'Пахлава', 'Paxlava'), 4, 100, ['vegetarian']],
      [t('Tea set with jam', 'Чайный набор с вареньем', 'Mürəbbəli çay dəsti'), 8, null, ['vegetarian']],
      [t('Ayran', 'Айран', 'Ayran'), 2, 300, ['vegetarian']],
      [t('Family set for 4', 'Семейный сет на 4', '4 nəfərlik ailə seti'), 85, null, [], true],
    ],
  },
];

const seafoodMenu: MenuCategorySeed[] = [
  {
    name: t('Starters', 'Закуски', 'Qəlyanaltılar'),
    items: [
      [t('Caspian sprat with lemon', 'Каспийская килька с лимоном', 'Limonlu Xəzər kilkəsi'), 7, 200, []],
      [t('Seafood salad', 'Салат с морепродуктами', 'Dəniz məhsulları salatı'), 16, 250, []],
      [t('Lavash with herbs', 'Лаваш с зеленью', 'Göyərtili lavaş'), 3, 150, ['vegetarian']],
    ],
  },
  {
    name: t('Fish', 'Рыба', 'Balıq'),
    items: [
      [t('Grilled sturgeon kebab', 'Шашлык из осетрины', 'Nərə balığı kababı'), 38, 300, []],
      [t('Fried kutum with narsharab', 'Жареный кутум с наршарабом', 'Narşərablı qızardılmış kütüm'), 24, 350, []],
      [t('Grilled sea bass', 'Сибас на гриле', 'Qrildə levrek'), 28, 350, []],
    ],
  },
  {
    name: t('Sides and drinks', 'Гарниры и напитки', 'Qarnirlər və içkilər'),
    items: [
      [t('Grilled vegetables', 'Овощи на гриле', 'Qrildə tərəvəz'), 6, 250, ['vegetarian']],
      [t('Herb rice', 'Рис с зеленью', 'Göyərtili düyü'), 5, 200, ['vegetarian']],
      [t('Lemonade', 'Лимонад', 'Limonad'), 5, 400, ['vegetarian']],
    ],
  },
];

const europeanMenu: MenuCategorySeed[] = [
  {
    name: t('Starters', 'Закуски', 'Qəlyanaltılar'),
    items: [
      [t('Caesar salad', 'Салат Цезарь', 'Sezar salatı'), 12, 250, []],
      [t('Tomato soup', 'Томатный суп', 'Pomidor şorbası'), 8, 300, ['vegetarian']],
      [t('Bruschetta', 'Брускетта', 'Brusketta'), 9, 180, ['vegetarian']],
    ],
  },
  {
    name: t('Main dishes', 'Основные блюда', 'Əsas yeməklər'),
    items: [
      [t('Beef steak', 'Говяжий стейк', 'Mal əti steyki'), 42, 300, []],
      [t('Pasta with mushrooms', 'Паста с грибами', 'Göbələkli pasta'), 16, 300, ['vegetarian']],
      [t('Grilled chicken breast', 'Куриная грудка на гриле', 'Qrildə toyuq döşü'), 18, 250, []],
    ],
  },
  {
    name: t('Desserts and drinks', 'Десерты и напитки', 'Desertlər və içkilər'),
    items: [
      [t('Cheesecake', 'Чизкейк', 'Çizkeyk'), 9, 150, ['vegetarian']],
      [t('Cappuccino', 'Капучино', 'Kapuçino'), 6, 250, ['vegetarian']],
      [t('Fresh orange juice', 'Свежевыжатый апельсиновый сок', 'Təzə portağal şirəsi'), 8, 300, ['vegetarian']],
    ],
  },
];

const turkishMenu: MenuCategorySeed[] = [
  {
    name: t('Starters', 'Закуски', 'Qəlyanaltılar'),
    items: [
      [t('Mercimek soup', 'Чечевичный суп', 'Mərci şorbası'), 5, 300, ['vegetarian']],
      [t('Hummus', 'Хумус', 'Humus'), 6, 200, ['vegetarian']],
      [t('Ezme salad', 'Салат эзме', 'Ezme salatı'), 5, 200, ['vegetarian', 'spicy']],
    ],
  },
  {
    name: t('Grill', 'Гриль', 'Manqal'),
    items: [
      [t('Adana kebab', 'Адана-кебаб', 'Adana kababı'), 13, 250, ['spicy']],
      [t('Iskender', 'Искендер', 'İsgəndər'), 15, 350, []],
      [t('Lahmacun', 'Лахмаджун', 'Lahmacun'), 5, 200, []],
    ],
  },
  {
    name: t('Desserts and drinks', 'Десерты и напитки', 'Desertlər və içkilər'),
    items: [
      [t('Kunefe', 'Кюнефе', 'Künəfə'), 8, 150, ['vegetarian']],
      [t('Turkish coffee', 'Турецкий кофе', 'Türk qəhvəsi'), 4, 80, ['vegetarian']],
      [t('Ayran', 'Айран', 'Ayran'), 2, 300, ['vegetarian']],
    ],
  },
];

const teaRoomMenu: MenuCategorySeed[] = [
  {
    name: t('Tea', 'Чай', 'Çay'),
    items: [
      [t('Black tea in armudu glass', 'Чёрный чай в армуду', 'Armudu stəkanda qara çay'), 2, null, ['vegetarian']],
      [t('Thyme tea', 'Чай с чабрецом', 'Kəklikotu çayı'), 3, null, ['vegetarian']],
      [t('Tea set for 2 with jams', 'Чайный набор на двоих с вареньем', '2 nəfərlik mürəbbəli çay dəsti'), 12, null, ['vegetarian'], true],
    ],
  },
  {
    name: t('Sweets', 'Сладости', 'Şirniyyat'),
    items: [
      [t('Sheki pakhlava', 'Шекинская пахлава', 'Şəki paxlavası'), 5, 100, ['vegetarian']],
      [t('Shakarbura', 'Шекербура', 'Şəkərbura'), 3, 80, ['vegetarian']],
      [t('Gogal', 'Гогал', 'Kətə (qoğal)'), 2, 100, ['vegetarian']],
    ],
  },
  {
    name: t('Jams', 'Варенье', 'Mürəbbələr'),
    items: [
      [t('Fig jam', 'Инжирное варенье', 'Əncir mürəbbəsi'), 3, 100, ['vegetarian']],
      [t('White cherry jam', 'Варенье из белой черешни', 'Ağ gilas mürəbbəsi'), 3, 100, ['vegetarian']],
    ],
  },
];

const streetFoodMenu: MenuCategorySeed[] = [
  {
    name: t('Qutab', 'Кутабы', 'Qutablar'),
    items: [
      [t('Qutab with greens', 'Кутаб с зеленью', 'Göyərti qutabı'), 1.5, 120, ['vegetarian']],
      [t('Qutab with meat', 'Кутаб с мясом', 'Ətli qutab'), 2, 120, []],
      [t('Qutab with pumpkin', 'Кутаб с тыквой', 'Balqabaqlı qutab'), 1.5, 120, ['vegetarian']],
    ],
  },
  {
    name: t('Doner and wraps', 'Донер и роллы', 'Dönər və dürümlər'),
    items: [
      [t('Chicken doner', 'Куриный донер', 'Toyuq dönəri'), 4, 300, []],
      [t('Beef doner', 'Говяжий донер', 'Mal əti dönəri'), 5, 300, []],
      [t('Lavash wrap with cheese', 'Лаваш с сыром', 'Pendirli lavaş dürümü'), 3, 200, ['vegetarian']],
    ],
  },
  {
    name: t('Drinks', 'Напитки', 'İçkilər'),
    items: [
      [t('Ayran', 'Айран', 'Ayran'), 1, 250, ['vegetarian']],
      [t('Black tea', 'Чёрный чай', 'Qara çay'), 1, null, ['vegetarian']],
    ],
  },
];

// ─────────────────────────────────────────────
// Restaurants (fictional names)
// ─────────────────────────────────────────────

const restaurant = (
  data: Omit<RestaurantSeed, 'type' | 'photos' | 'hours'> & { hours?: Hours[] },
): RestaurantSeed => ({
  type: 'RESTAURANT',
  photos: photos(data.slug),
  hours: data.hours ?? everyDay('11:00', '23:00'),
  ...data,
});

export const restaurants: RestaurantSeed[] = [
  restaurant({
    slug: 'dolma-kitchen-tea-house',
    name: t('Dolma Kitchen & Tea House', 'Долма Кухня и Чайхана', 'Dolma Mətbəxi və Çayxana'),
    description: t(
      'Home-style Azerbaijani cooking and a traditional tea room in the Old City.',
      'Домашняя азербайджанская кухня и традиционная чайхана в Старом городе.',
      'İçərişəhərdə ev üslubunda Azərbaycan mətbəxi və ənənəvi çayxana.',
    ),
    area: 'old-city',
    lat: 40.3672,
    lng: 49.8362,
    address: 'Old City, Baku',
    priceLevel: 2,
    priceFrom: 25,
    categories: ['azerbaijani'],
    amenities: ['terrace', 'kids-menu', 'halal', 'card-payment', 'family-friendly'],
    isFeatured: true,
    featuredOrder: 1,
    offer: { title: t('Lunch set -20%', 'Бизнес-ланч −20%', 'Nahar seti -20%'), discountPercent: 20 },
    menu: azerbaijaniMenu,
  }),
  restaurant({
    slug: 'caravan-plov-house',
    name: t('Caravan Plov House', 'Плов-хаус Караван', 'Karvan Plov Evi'),
    description: t(
      'Specialists in Azerbaijani plov, served under a stone caravanserai-style arch.',
      'Специалисты по азербайджанскому плову под каменной аркой в стиле караван-сарая.',
      'Karvansara üslubunda daş tağ altında Azərbaycan plovu ustaları.',
    ),
    area: 'old-city',
    lat: 40.3655,
    lng: 49.8345,
    address: 'Old City, Baku',
    priceLevel: 2,
    priceFrom: 30,
    categories: ['azerbaijani'],
    amenities: ['halal', 'live-music', 'card-payment', 'family-friendly'],
    menu: azerbaijaniMenu,
  }),
  restaurant({
    slug: 'caspian-fish-house',
    name: t('Caspian Fish House', 'Каспийский рыбный дом', 'Xəzər Balıq Evi'),
    description: t(
      'Fresh Caspian fish and sea views on the Boulevard.',
      'Свежая каспийская рыба и вид на море на Бульваре.',
      'Bulvarda təzə Xəzər balığı və dəniz mənzərəsi.',
    ),
    area: 'sabail',
    lat: 40.362,
    lng: 49.848,
    address: 'Seaside Boulevard, Baku',
    priceLevel: 3,
    priceFrom: 55,
    categories: ['seafood'],
    amenities: ['terrace', 'sea-view', 'card-payment'],
    isFeatured: true,
    featuredOrder: 2,
    menu: seafoodMenu,
  }),
  restaurant({
    slug: 'nizami-kebab-grill',
    name: t('Nizami Kebab Grill', 'Кебаб-гриль Низами', 'Nizami Kabab Qril'),
    description: t(
      'Quick and affordable kebabs in the heart of the city.',
      'Быстрые и недорогие кебабы в самом центре города.',
      'Şəhərin mərkəzində sürətli və münasib kabablar.',
    ),
    area: 'nasimi',
    lat: 40.3775,
    lng: 49.84,
    address: 'Nizami St, Baku',
    priceLevel: 1,
    priceFrom: 15,
    categories: ['azerbaijani', 'kebab'],
    amenities: ['halal', 'delivery', 'card-payment'],
    hours: everyDay('10:00', '00:00'),
    menu: azerbaijaniMenu,
  }),
  restaurant({
    slug: 'anatolia-table',
    name: t('Anatolia Table', 'Анатолийский стол', 'Anadolu Süfrəsi'),
    description: t(
      'Turkish grill, lahmacun and kunefe in a bright family restaurant.',
      'Турецкий гриль, лахмаджун и кюнефе в светлом семейном ресторане.',
      'İşıqlı ailə restoranında türk manqalı, lahmacun və künəfə.',
    ),
    area: 'nasimi',
    lat: 40.3835,
    lng: 49.832,
    address: 'Nasimi district, Baku',
    priceLevel: 2,
    priceFrom: 22,
    categories: ['turkish'],
    amenities: ['halal', 'kids-menu', 'delivery', 'card-payment', 'family-friendly'],
    menu: turkishMenu,
  }),
  restaurant({
    slug: 'boulevard-terrace-cafe',
    name: t('Boulevard Terrace Cafe', 'Кафе Бульварная терраса', 'Bulvar Terras Kafe'),
    description: t(
      'European cafe with a large terrace, great for coffee after a walk.',
      'Европейское кафе с большой террасой — идеально для кофе после прогулки.',
      'Böyük terrası olan Avropa kafesi, gəzintidən sonra qəhvə üçün əla yer.',
    ),
    area: 'sabail',
    lat: 40.3655,
    lng: 49.852,
    address: 'Seaside Boulevard, Baku',
    priceLevel: 2,
    priceFrom: 28,
    categories: ['european', 'cafe'],
    amenities: ['terrace', 'sea-view', 'kids-menu', 'card-payment'],
    hours: everyDay('09:00', '23:00'),
    menu: europeanMenu,
  }),
  restaurant({
    slug: 'sheki-pakhlava-tea-room',
    name: t('Sheki Pakhlava Tea Room', 'Чайная Шекинская пахлава', 'Şəki Paxlavası Çayxanası'),
    description: t(
      'Tea in armudu glasses, Sheki pakhlava and homemade jams.',
      'Чай в стаканах армуду, шекинская пахлава и домашнее варенье.',
      'Armudu stəkanda çay, Şəki paxlavası və ev mürəbbələri.',
    ),
    area: 'yasamal',
    lat: 40.381,
    lng: 49.812,
    address: 'Yasamal district, Baku',
    priceLevel: 1,
    priceFrom: 12,
    categories: ['tea-house', 'desserts'],
    amenities: ['family-friendly', 'halal'],
    hours: everyDay('10:00', '22:00'),
    menu: teaRoomMenu,
  }),
  restaurant({
    slug: 'qutab-corner',
    name: t('Qutab Corner', 'Кутаб-корнер', 'Qutab Küncü'),
    description: t(
      'Street-food spot for fresh qutab and doner, open late.',
      'Уличная еда: свежие кутабы и донер, открыто допоздна.',
      'Təzə qutab və dönər üçün gec saatlara qədər açıq küçə yeməyi məkanı.',
    ),
    area: 'narimanov',
    lat: 40.4025,
    lng: 49.869,
    address: 'Narimanov district, Baku',
    priceLevel: 1,
    priceFrom: 8,
    categories: ['street-food', 'azerbaijani'],
    amenities: ['halal', 'delivery'],
    hours: everyDay('08:00', '02:00'),
    menu: streetFoodMenu,
  }),
  restaurant({
    slug: 'flame-towers-sky-lounge',
    name: t('Sky Lounge Baku', 'Скай Лаунж Баку', 'Sky Lounge Bakı'),
    description: t(
      'Fine dining with a panoramic view over the bay and the city lights.',
      'Изысканная кухня с панорамным видом на бухту и огни города.',
      'Buxtaya və şəhər işıqlarına panoram mənzərəli zərif restoran.',
    ),
    area: 'sabail',
    lat: 40.3585,
    lng: 49.8285,
    address: 'Highland area, Baku',
    priceLevel: 3,
    priceFrom: 70,
    categories: ['european'],
    amenities: ['sea-view', 'live-music', 'card-payment'],
    hours: everyDay('18:00', '01:00'),
    menu: europeanMenu,
  }),
  restaurant({
    slug: 'family-saj-house',
    name: t('Family Saj House', 'Семейный садж-хаус', 'Ailə Sac Evi'),
    description: t(
      'Large portions of saj and kebab, with a play corner for kids.',
      'Большие порции саджа и кебаба, детский уголок.',
      'Böyük porsiya sac və kabab, uşaqlar üçün oyun guşəsi.',
    ),
    area: 'khatai',
    lat: 40.3815,
    lng: 49.905,
    address: 'Khatai district, Baku',
    priceLevel: 2,
    priceFrom: 24,
    categories: ['azerbaijani'],
    amenities: ['halal', 'kids-menu', 'family-friendly', 'card-payment'],
    menu: azerbaijaniMenu,
  }),
];

// ─────────────────────────────────────────────
// Attractions (real places, SAMPLE prices and hours)
// ─────────────────────────────────────────────

const ADULT = t('Adult', 'Взрослый', 'Böyük');
const STUDENT = t('Student', 'Студент', 'Tələbə');
const CHILD = t('Child (under 7)', 'Ребёнок (до 7 лет)', 'Uşaq (7 yaşadək)');

const attraction = (data: Omit<AttractionSeed, 'type' | 'photos'>): AttractionSeed => ({
  type: 'ATTRACTION',
  photos: photos(data.slug),
  ...data,
});

export const attractions: AttractionSeed[] = [
  attraction({
    slug: 'old-city-icherisheher',
    name: t('Old City (Icherisheher)', 'Старый город (Ичеришехер)', 'İçərişəhər'),
    description: t(
      'The walled historic heart of Baku, a UNESCO World Heritage Site.',
      'Окружённое стенами историческое сердце Баку, объект Всемирного наследия ЮНЕСКО.',
      'Bakının divarlarla əhatə olunmuş tarixi mərkəzi, UNESCO Dünya İrsi abidəsi.',
    ),
    area: 'old-city',
    lat: 40.3664,
    lng: 49.8357,
    address: 'Old City, Baku',
    categories: ['historic'],
    amenities: ['family-friendly'],
    recommendedMinutes: 180,
    hours: [],
    tickets: [],
    isFeatured: true,
    featuredOrder: 1,
  }),
  attraction({
    slug: 'maiden-tower',
    name: t('Maiden Tower', 'Девичья башня', 'Qız qalası'),
    description: t(
      'The iconic tower of the Old City with a museum and a rooftop view.',
      'Символ Старого города с музеем и видом с крыши.',
      'İçərişəhərin simvolu, içində muzey və damından mənzərə.',
    ),
    area: 'old-city',
    lat: 40.366,
    lng: 49.8374,
    address: 'Old City, Baku',
    categories: ['historic', 'museum', 'viewpoint'],
    amenities: ['audio-guide'],
    recommendedMinutes: 60,
    hours: everyDay('10:00', '18:00'),
    tickets: [{ label: ADULT, price: 15 }, { label: STUDENT, price: 7 }, { label: CHILD, price: 0 }],
    isFeatured: true,
    featuredOrder: 2,
  }),
  attraction({
    slug: 'palace-of-the-shirvanshahs',
    name: t('Palace of the Shirvanshahs', 'Дворец Ширваншахов', 'Şirvanşahlar sarayı'),
    description: t(
      '15th-century palace complex of the Shirvanshah dynasty.',
      'Дворцовый комплекс династии Ширваншахов XV века.',
      'Şirvanşahlar sülaləsinin XV əsr saray kompleksi.',
    ),
    area: 'old-city',
    lat: 40.3666,
    lng: 49.8336,
    address: 'Old City, Baku',
    categories: ['historic', 'museum'],
    amenities: ['audio-guide'],
    recommendedMinutes: 90,
    hours: everyDay('10:00', '18:00'),
    tickets: [{ label: ADULT, price: 15 }, { label: STUDENT, price: 7 }, { label: CHILD, price: 0 }],
  }),
  attraction({
    slug: 'heydar-aliyev-center',
    name: t('Heydar Aliyev Center', 'Центр Гейдара Алиева', 'Heydər Əliyev Mərkəzi'),
    description: t(
      'Landmark cultural center by Zaha Hadid with exhibitions and a park.',
      'Культурный центр-символ работы Захи Хадид с выставками и парком.',
      'Zaha Hadidin layihəsi olan, sərgiləri və parkı ilə məşhur mədəniyyət mərkəzi.',
    ),
    area: 'narimanov',
    lat: 40.3958,
    lng: 49.8678,
    address: 'Heydar Aliyev Ave, Baku',
    categories: ['modern', 'museum'],
    amenities: ['wheelchair', 'family-friendly'],
    recommendedMinutes: 120,
    hours: closedMonday('11:00', '19:00'),
    tickets: [{ label: ADULT, price: 15 }, { label: STUDENT, price: 7 }, { label: CHILD, price: 0 }],
    isFeatured: true,
    featuredOrder: 3,
  }),
  attraction({
    slug: 'flame-towers-highland-park',
    name: t('Highland Park & Flame Towers view', 'Нагорный парк и вид на Пламенные башни', 'Dağüstü park və Alov qüllələri'),
    description: t(
      'Hilltop park with the best panoramic view of Baku Bay and the Flame Towers.',
      'Парк на холме с лучшим панорамным видом на Бакинскую бухту и Пламенные башни.',
      'Bakı buxtasına və Alov qüllələrinə ən gözəl panoram mənzərəli təpə parkı.',
    ),
    area: 'sabail',
    lat: 40.3578,
    lng: 49.8273,
    address: 'Highland Park, Baku',
    categories: ['viewpoint', 'park'],
    amenities: ['family-friendly'],
    recommendedMinutes: 60,
    hours: [],
    tickets: [],
    isFeatured: true,
    featuredOrder: 4,
  }),
  attraction({
    slug: 'baku-boulevard',
    name: t('Baku Boulevard', 'Бакинский бульвар', 'Bakı bulvarı'),
    description: t(
      'Long seaside promenade with cafes, parks and evening lights.',
      'Длинная набережная с кафе, парками и вечерней подсветкой.',
      'Kafeləri, parkları və axşam işıqları olan uzun dənizkənarı gəzinti yolu.',
    ),
    area: 'sabail',
    lat: 40.364,
    lng: 49.845,
    address: 'Neftchilar Ave, Baku',
    categories: ['park'],
    amenities: ['family-friendly', 'wheelchair'],
    recommendedMinutes: 90,
    hours: [],
    tickets: [],
  }),
  attraction({
    slug: 'azerbaijan-carpet-museum',
    name: t('Azerbaijan Carpet Museum', 'Музей азербайджанского ковра', 'Azərbaycan Xalça Muzeyi'),
    description: t(
      'Museum shaped like a rolled carpet, with centuries of carpet weaving art.',
      'Музей в форме свёрнутого ковра с многовековым искусством ковроткачества.',
      'Bükülmüş xalça formasında, əsrlik xalçaçılıq sənətini nümayiş etdirən muzey.',
    ),
    area: 'sabail',
    lat: 40.3605,
    lng: 49.8355,
    address: 'Seaside Boulevard, Baku',
    categories: ['museum'],
    amenities: ['wheelchair', 'audio-guide'],
    recommendedMinutes: 90,
    hours: closedMonday('10:00', '18:00'),
    tickets: [{ label: ADULT, price: 10 }, { label: STUDENT, price: 5 }, { label: CHILD, price: 0 }],
  }),
  attraction({
    slug: 'ateshgah-fire-temple',
    name: t('Ateshgah Fire Temple', 'Храм огнепоклонников Атешгях', 'Atəşgah məbədi'),
    description: t(
      'Historic fire temple on the Absheron peninsula.',
      'Исторический храм огнепоклонников на Апшеронском полуострове.',
      'Abşeron yarımadasında tarixi atəşpərəstlər məbədi.',
    ),
    area: 'khatai',
    lat: 40.4155,
    lng: 50.008,
    address: 'Surakhani, Baku',
    categories: ['historic', 'museum'],
    amenities: ['audio-guide'],
    recommendedMinutes: 60,
    hours: everyDay('09:00', '18:00'),
    tickets: [{ label: ADULT, price: 10 }, { label: STUDENT, price: 5 }, { label: CHILD, price: 0 }],
  }),
  attraction({
    slug: 'yanar-dag',
    name: t('Yanar Dag (Burning Mountain)', 'Янардаг (Горящая гора)', 'Yanardağ'),
    description: t(
      'A hillside where natural gas has been burning for decades. Best after sunset.',
      'Склон холма, где природный газ горит десятилетиями. Лучше всего после заката.',
      'Təbii qazın onilliklərdir yandığı yamac. Ən gözəl vaxtı gün batandan sonradır.',
    ),
    area: 'narimanov',
    lat: 40.502,
    lng: 49.891,
    address: 'Absheron, near Baku',
    categories: ['nature'],
    amenities: ['family-friendly'],
    recommendedMinutes: 60,
    hours: everyDay('09:00', '23:00'),
    tickets: [{ label: ADULT, price: 10 }, { label: STUDENT, price: 5 }, { label: CHILD, price: 0 }],
  }),
  attraction({
    slug: 'gobustan-national-park',
    name: t('Gobustan National Park', 'Национальный парк Гобустан', 'Qobustan Milli Parkı'),
    description: t(
      'Ancient rock carvings and a museum, about an hour south of Baku. Mud volcanoes nearby.',
      'Древние наскальные рисунки и музей примерно в часе езды к югу от Баку. Рядом грязевые вулканы.',
      'Bakıdan təxminən bir saat cənubda qədim qayaüstü təsvirlər və muzey. Yaxınlıqda palçıq vulkanları var.',
    ),
    area: 'khatai',
    lat: 40.111,
    lng: 49.375,
    address: 'Gobustan, Baku region',
    categories: ['historic', 'nature', 'day-trip'],
    amenities: ['audio-guide'],
    recommendedMinutes: 240,
    hours: everyDay('09:00', '18:00'),
    tickets: [{ label: ADULT, price: 15 }, { label: STUDENT, price: 7 }, { label: CHILD, price: 0 }],
  }),
];

export const places: PlaceSeed[] = [...hotels, ...restaurants, ...attractions];

// ─────────────────────────────────────────────
// Transport routes (SAMPLE prices)
// ─────────────────────────────────────────────

type Mode = 'WALK' | 'METRO' | 'BUS' | 'AIRPORT_EXPRESS' | 'TAXI' | 'TRAIN';

export type RouteSeed = {
  slug: string;
  fromKey: string;
  toKey: string;
  fromLabel: T;
  toLabel: T;
  mode: Mode;
  priceMin: number;
  priceMax?: number;
  priceUnit: 'PER_PERSON' | 'PER_VEHICLE';
  durationMin: number;
  transfers?: number;
  walkMeters?: number;
  tags: T[];
  isPopular?: boolean;
  steps: { mode: Mode; instruction: T; durationMin: number; price?: number }[];
};

const AIRPORT = t('Heydar Aliyev Airport', 'Аэропорт им. Гейдара Алиева', 'Heydər Əliyev Hava Limanı');
const CENTER = t('City center (28 May)', 'Центр города (28 Мая)', 'Şəhər mərkəzi (28 May)');
const BUS_STATION = t('Baku Bus Station', 'Бакинский автовокзал', 'Bakı Avtovağzalı');
const OLD_CITY = t('Old City', 'Старый город', 'İçərişəhər');
const GOBUSTAN = t('Gobustan', 'Гобустан', 'Qobustan');

const TAG_LUGGAGE = t('Best with luggage', 'Удобно с багажом', 'Baqajla rahatdır');
const TAG_CHEAPEST = t('Cheapest', 'Дешевле всего', 'Ən ucuz');
const TAG_24_7 = t('24/7', 'Круглосуточно', '24/7');
const TAG_CARD = t('Needs BakuCard', 'Нужна BakuCard', 'BakuCard lazımdır');

export const routes: RouteSeed[] = [
  {
    slug: 'airport-to-center-taxi',
    fromKey: 'airport',
    toKey: 'city-center',
    fromLabel: AIRPORT,
    toLabel: CENTER,
    mode: 'TAXI',
    priceMin: 25,
    priceMax: 35,
    priceUnit: 'PER_VEHICLE',
    durationMin: 35,
    tags: [TAG_LUGGAGE, TAG_24_7],
    isPopular: true,
    steps: [
      {
        mode: 'TAXI',
        instruction: t(
          'Order Bolt or Yango from the arrivals hall and meet the driver at the pickup zone.',
          'Закажите Bolt или Yango в зале прилёта и встретьте водителя в зоне посадки.',
          'Gəliş zalından Bolt və ya Yango sifariş edin, sürücü ilə götürülmə zonasında görüşün.',
        ),
        durationMin: 35,
        price: 30,
      },
    ],
  },
  {
    slug: 'airport-to-center-express-bus',
    fromKey: 'airport',
    toKey: 'city-center',
    fromLabel: AIRPORT,
    toLabel: CENTER,
    mode: 'AIRPORT_EXPRESS',
    priceMin: 1.5,
    priceUnit: 'PER_PERSON',
    durationMin: 45,
    walkMeters: 200,
    tags: [TAG_CHEAPEST, TAG_CARD],
    isPopular: true,
    steps: [
      {
        mode: 'WALK',
        instruction: t(
          'Buy a BakuCard at the machine in the arrivals hall and walk to the express bus stop.',
          'Купите BakuCard в автомате в зале прилёта и пройдите к остановке экспресс-автобуса.',
          'Gəliş zalındakı aparatdan BakuCard alın və ekspres avtobus dayanacağına keçin.',
        ),
        durationMin: 5,
      },
      {
        mode: 'AIRPORT_EXPRESS',
        instruction: t(
          'Take the airport express bus to 28 May station.',
          'Сядьте на экспресс-автобус до станции 28 Мая.',
          'Ekspres avtobusla 28 May stansiyasına qədər gedin.',
        ),
        durationMin: 40,
        price: 1.5,
      },
    ],
  },
  {
    slug: 'center-to-bus-station-metro',
    fromKey: 'city-center',
    toKey: 'bus-station',
    fromLabel: CENTER,
    toLabel: BUS_STATION,
    mode: 'METRO',
    priceMin: 0.6,
    priceUnit: 'PER_PERSON',
    durationMin: 25,
    transfers: 1,
    walkMeters: 300,
    tags: [TAG_CHEAPEST, TAG_CARD],
    isPopular: true,
    steps: [
      {
        mode: 'METRO',
        instruction: t(
          'From 28 May take the metro towards Avtovaghzal (change lines if needed).',
          'От 28 Мая поезжайте на метро в сторону станции Автовокзал (с пересадкой при необходимости).',
          '28 May stansiyasından Avtovağzal istiqamətində metroya minin (lazım olsa xətt dəyişin).',
        ),
        durationMin: 20,
        price: 0.6,
      },
      {
        mode: 'WALK',
        instruction: t(
          'Exit at Avtovaghzal station; the bus station is next to the exit.',
          'Выйдите на станции Автовокзал — автовокзал рядом с выходом.',
          'Avtovağzal stansiyasında çıxın, avtovağzal çıxışın yanındadır.',
        ),
        durationMin: 5,
      },
    ],
  },
  {
    slug: 'center-to-bus-station-taxi',
    fromKey: 'city-center',
    toKey: 'bus-station',
    fromLabel: CENTER,
    toLabel: BUS_STATION,
    mode: 'TAXI',
    priceMin: 6,
    priceMax: 10,
    priceUnit: 'PER_VEHICLE',
    durationMin: 20,
    tags: [TAG_LUGGAGE],
    steps: [
      {
        mode: 'TAXI',
        instruction: t(
          'Order Bolt or Yango to Baku International Bus Terminal.',
          'Закажите Bolt или Yango до Бакинского международного автовокзала.',
          'Bolt və ya Yango ilə Bakı Beynəlxalq Avtovağzalına sifariş verin.',
        ),
        durationMin: 20,
        price: 8,
      },
    ],
  },
  {
    slug: 'center-to-old-city-walk',
    fromKey: 'city-center',
    toKey: 'old-city',
    fromLabel: CENTER,
    toLabel: OLD_CITY,
    mode: 'WALK',
    priceMin: 0,
    priceUnit: 'PER_PERSON',
    durationMin: 20,
    walkMeters: 1500,
    tags: [TAG_CHEAPEST],
    steps: [
      {
        mode: 'WALK',
        instruction: t(
          'Walk along Nizami Street to Fountain Square, then to the Old City gates.',
          'Пройдите по улице Низами до Фонтанной площади, затем к воротам Старого города.',
          'Nizami küçəsi ilə Fəvvarələr meydanına, oradan İçərişəhərin darvazasına piyada gedin.',
        ),
        durationMin: 20,
      },
    ],
  },
  {
    slug: 'center-to-gobustan-taxi',
    fromKey: 'city-center',
    toKey: 'gobustan',
    fromLabel: CENTER,
    toLabel: GOBUSTAN,
    mode: 'TAXI',
    priceMin: 30,
    priceMax: 45,
    priceUnit: 'PER_VEHICLE',
    durationMin: 60,
    tags: [TAG_LUGGAGE],
    steps: [
      {
        mode: 'TAXI',
        instruction: t(
          'Order a taxi to Gobustan Rock Art Museum; agree on a return trip with the driver.',
          'Закажите такси до музея наскальных рисунков Гобустана; договоритесь с водителем об обратной дороге.',
          'Qobustan qayaüstü təsvirlər muzeyinə taksi sifariş edin; qayıdışı sürücü ilə razılaşdırın.',
        ),
        durationMin: 60,
        price: 40,
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Itineraries
// ─────────────────────────────────────────────

export const itineraries = [
  {
    slug: 'one-day-in-baku',
    title: t('One day in Baku', 'Один день в Баку', 'Bakıda bir gün'),
    description: t(
      'The classic first day: Old City in the morning, the seaside after lunch, the view at sunset.',
      'Классический первый день: утром Старый город, после обеда набережная, на закате — панорама.',
      'Klassik ilk gün: səhər İçərişəhər, nahardan sonra dənizkənarı, gün batanda mənzərə.',
    ),
    days: 1,
    stops: [
      { place: 'old-city-icherisheher', day: 1, time: '09:30' },
      { place: 'maiden-tower', day: 1, time: '10:00' },
      { place: 'palace-of-the-shirvanshahs', day: 1, time: '11:30' },
      { place: 'dolma-kitchen-tea-house', day: 1, time: '13:00' },
      { place: 'baku-boulevard', day: 1, time: '15:00' },
      { place: 'azerbaijan-carpet-museum', day: 1, time: '16:00' },
      { place: 'flame-towers-highland-park', day: 1, time: '18:30' },
    ],
  },
  {
    slug: 'baku-with-kids',
    title: t('Two days in Baku with kids', 'Два дня в Баку с детьми', 'Uşaqlarla Bakıda iki gün'),
    description: t(
      'A relaxed pace with parks, short museum visits and family-friendly food.',
      'Спокойный темп: парки, короткие музеи и еда для всей семьи.',
      'Sakit temp: parklar, qısa muzey ziyarətləri və ailə üçün yeməklər.',
    ),
    days: 2,
    stops: [
      { place: 'baku-boulevard', day: 1, time: '10:00' },
      { place: 'boulevard-terrace-cafe', day: 1, time: '12:30' },
      { place: 'heydar-aliyev-center', day: 1, time: '15:00' },
      { place: 'old-city-icherisheher', day: 2, time: '10:00' },
      { place: 'family-saj-house', day: 2, time: '13:30' },
      { place: 'yanar-dag', day: 2, time: '18:00' },
    ],
  },
];

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

export const faqItems = [
  {
    category: 'money',
    question: t('Which currency is used?', 'Какая валюта используется?', 'Hansı valyuta işlədilir?'),
    answer: t(
      'The Azerbaijani manat (AZN, ₼). Cards are accepted in most hotels and restaurants; keep some cash for small shops and taxis.',
      'Азербайджанский манат (AZN, ₼). Карты принимают в большинстве отелей и ресторанов; держите немного наличных для мелких магазинов и такси.',
      'Azərbaycan manatı (AZN, ₼). Əksər otel və restoranlarda kart qəbul olunur; kiçik mağazalar və taksi üçün bir az nağd saxlayın.',
    ),
  },
  {
    category: 'transport',
    question: t('What is a BakuCard?', 'Что такое BakuCard?', 'BakuCard nədir?'),
    answer: t(
      'A reusable card for the metro and city buses. You can buy and top it up at machines in metro stations and at the airport.',
      'Многоразовая карта для метро и городских автобусов. Купить и пополнить её можно в автоматах на станциях метро и в аэропорту.',
      'Metro və şəhər avtobusları üçün təkrar istifadə olunan kart. Onu metro stansiyalarında və hava limanında aparatlardan almaq və artırmaq olar.',
    ),
  },
  {
    category: 'safety',
    question: t('Emergency numbers', 'Экстренные номера', 'Təcili nömrələr'),
    answer: t(
      'General emergency 112, police 102, ambulance 103.',
      'Единый номер 112, полиция 102, скорая помощь 103.',
      'Ümumi təcili xidmət 112, polis 102, təcili yardım 103.',
    ),
  },
  {
    category: 'sim',
    question: t('How do I get mobile internet?', 'Как получить мобильный интернет?', 'Mobil internetə necə qoşulum?'),
    answer: t(
      'Local SIM cards are sold at the airport and in operator shops; bring your passport.',
      'Местные SIM-карты продаются в аэропорту и в салонах операторов; возьмите паспорт.',
      'Yerli SIM kartlar hava limanında və operator mağazalarında satılır; pasportunuzu götürün.',
    ),
  },
];
