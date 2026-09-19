// Campus map data for Nelson Mandela University's South and North campuses (Summerstrand, Gqeberha).
//
// Sources
//  - Building numbers and names: the official 2024 campus maps published by the University
//    (mandela.ac.za > About us > Campuses > Campus maps). The map notes that buildings are numbered
//    according to the University's computerised record system.
//  - Positions: OpenStreetMap contributors (ODbL), matched to the official numbers.
//
// Only buildings whose position could be confirmed are listed. The official maps show more, so the
// app also links to them. Coordinators can add more places, for example the School of IT, by giving
// a Venue coordinates in the admin screens.

export type CampusId = 'south' | 'north';

export type PlaceCategory = 'learning' | 'services' | 'residence' | 'food' | 'sport' | 'transport' | 'building' | 'venue';

export type CampusPlace = {
  id: string;
  name: string;
  // Building number as shown on the official map and on signs. Not every place has one.
  number?: string;
  campus: CampusId;
  category: PlaceCategory;
  lat: number;
  lng: number;
  note?: string;
  // Other names people use, so searching "library" or "clinic" finds the right building.
  aka?: string[];
  // Places a first-year is most likely to need in the first week.
  key?: boolean;
  // Short text shown on the map pin when there is no building number.
  symbol?: string;
};

export type CampusInfo = {
  id: CampusId;
  name: string;
  center: [number, number];
  zoom: number;
  intro: string;
  numbering: string;
};

export const CAMPUSES: Record<CampusId, CampusInfo> = {
  south: {
    id: 'south',
    name: 'South Campus',
    center: [-34.009, 25.6705],
    zoom: 16,
    intro: 'The main campus, in Summerstrand.',
    numbering: 'Buildings here have low numbers, starting at 1 (Main Building).',
  },
  north: {
    id: 'north',
    name: 'North Campus',
    center: [-34.0018, 25.6718],
    zoom: 16,
    intro: 'Engineering, science, art and more, north of South Campus.',
    numbering: 'Buildings here are numbered in the 200s (Main Administration Building is 260).',
  },
};

export const CATEGORIES: Record<PlaceCategory, { label: string; color: string; icon: string }> = {
  learning: { label: 'Lectures & labs', color: '#2563EB', icon: 'school-outline' },
  services: { label: 'Services & admin', color: '#0F766E', icon: 'information-circle-outline' },
  residence: { label: 'Residences', color: '#7C3AED', icon: 'bed-outline' },
  food: { label: 'Food & shops', color: '#EA580C', icon: 'restaurant-outline' },
  sport: { label: 'Sport', color: '#16A34A', icon: 'football-outline' },
  transport: { label: 'Transport', color: '#0891B2', icon: 'bus-outline' },
  building: { label: 'Other buildings', color: '#64748B', icon: 'business-outline' },
  venue: { label: 'Orientation venues', color: '#F8A705', icon: 'star-outline' },
};

export const OFFICIAL_MAPS = {
  interactive: 'https://findme-sc.mandela.ac.za/MapBuddy/mapBuddyNavigation.do',
  south: 'https://www.mandela.ac.za/www-new/media/Store/documents/About/campuses/campus%20maps/South-Campus-Map-Final-2024.pdf',
  north: 'https://www.mandela.ac.za/www-new/media/Store/documents/About/campuses/campus%20maps/North-Campus-Map-Final-2024.pdf',
  all: 'https://www.mandela.ac.za/About-us/Campuses/Campus-maps',
};

export const CAMPUS_PLACES: CampusPlace[] = [
  // ---- South Campus -------------------------------------------------------------------------
  { id: 's-1', number: '1', name: 'Main Building', campus: 'south', category: 'services', lat: -34.00904, lng: 25.66978, key: true },
  { id: 's-2', number: '2', name: 'Senate Building', campus: 'south', category: 'services', lat: -34.00886, lng: 25.66979, aka: ['council chamber'] },
  { id: 's-3', number: '3', name: 'Auditorium', campus: 'south', category: 'learning', lat: -34.0093, lng: 25.66979 },
  { id: 's-4', number: '4', name: 'Old Mutual Lecture Halls', campus: 'south', category: 'learning', lat: -34.0087, lng: 25.66904 },
  { id: 's-5', number: '5', name: 'Sanlam Lecture Halls', campus: 'south', category: 'learning', lat: -34.00955, lng: 25.66903 },
  {
    id: 's-6',
    number: '6',
    name: 'Isivuno (Education)',
    campus: 'south',
    category: 'learning',
    lat: -34.00866,
    lng: 25.6683,
    note: 'The official campus map also lists Imbewu (Resource Centre), the Writing Centre and the ABSA Computer Lab here.',
    aka: ['writing centre', 'absa computer lab', 'imbewu', 'computer lab'],
    key: true,
  },
  { id: 's-7', number: '7', name: 'M & P Building', campus: 'south', category: 'learning', lat: -34.00956, lng: 25.66811 },
  {
    id: 's-8',
    number: '8',
    name: 'Library & School of Architecture',
    campus: 'south',
    category: 'learning',
    lat: -34.0091,
    lng: 25.66717,
    aka: ['library', 'study', 'books'],
    key: true,
  },
  { id: 's-9', number: '9', name: 'Embizweni', campus: 'south', category: 'building', lat: -34.00862, lng: 25.66973 },
  { id: 's-10', number: '10', name: 'Ingoma (Music)', campus: 'south', category: 'learning', lat: -34.00959, lng: 25.66957, aka: ['music'] },
  { id: 's-11', number: '11', name: 'Education', campus: 'south', category: 'learning', lat: -34.00831, lng: 25.66815 },
  { id: 's-12', number: '12', name: 'Mvezo (Biological Sciences)', campus: 'south', category: 'learning', lat: -34.00834, lng: 25.66682, aka: ['biology', 'biological sciences'] },
  {
    id: 's-13',
    number: '13',
    name: 'Katherine Johnson (Physics & Chemistry)',
    campus: 'south',
    category: 'learning',
    lat: -34.00991,
    lng: 25.66683,
    aka: ['physics', 'chemistry'],
  },
  {
    id: 's-14',
    number: '14',
    name: 'Food Court',
    campus: 'south',
    category: 'food',
    lat: -34.00892,
    lng: 25.66788,
    note: 'Food outlets here include Flavaz, Madibaz and Rendevouz.',
    aka: ['food', 'eat', 'lunch', 'restaurant', 'coffee', 'flavaz', 'madibaz', 'rendevouz'],
    key: true,
  },
  { id: 's-24', number: '24', name: 'Indoor Sport Centre & Sport Offices', campus: 'south', category: 'sport', lat: -34.0109, lng: 25.67832, aka: ['gym', 'sport'] },
  { id: 's-25', number: '25', name: 'Tennis Clubhouse', campus: 'south', category: 'sport', lat: -34.00763, lng: 25.6787 },
  { id: 's-26', number: '26', name: 'Cricket Clubhouse', campus: 'south', category: 'sport', lat: -34.00671, lng: 25.68201 },
  { id: 's-33', number: '33', name: 'Soccer Clubhouse', campus: 'south', category: 'sport', lat: -34.00882, lng: 25.68023 },
  {
    id: 's-35',
    number: '35',
    name: 'Lecture Halls',
    campus: 'south',
    category: 'learning',
    lat: -34.00973,
    lng: 25.6706,
    aka: ['universet', 'nomhle nkonyeni'],
  },
  { id: 's-86', number: '86', name: 'Goldfields South', campus: 'south', category: 'building', lat: -34.0097, lng: 25.66742 },
  {
    id: 's-87',
    number: '87',
    name: 'Goldfields North (International Office)',
    campus: 'south',
    category: 'services',
    lat: -34.00856,
    lng: 25.66748,
    aka: ['international office', 'international students'],
  },
  {
    id: 's-115',
    number: '115-120',
    name: 'Postgrad Student Village',
    campus: 'south',
    category: 'residence',
    lat: -34.00712,
    lng: 25.67384,
    aka: ['postgraduate', 'residence'],
  },
  {
    id: 's-121',
    number: '121',
    name: 'Housing Administration',
    campus: 'south',
    category: 'services',
    lat: -34.0077,
    lng: 25.67433,
    aka: ['accommodation', 'residence office', 'housing'],
  },
  { id: 's-123', number: '123', name: 'Ulwazi Lecture Hall', campus: 'south', category: 'learning', lat: -34.00928, lng: 25.67185 },
  { id: 's-125', number: '125', name: 'Human Movement Science', campus: 'south', category: 'learning', lat: -34.0067, lng: 25.67583 },
  { id: 's-126', number: '126', name: 'Dietetics', campus: 'south', category: 'learning', lat: -34.00632, lng: 25.67532 },

  // ---- North Campus -------------------------------------------------------------------------
  {
    id: 'n-201',
    number: '201',
    name: 'Charlotte Maxeke Residence',
    campus: 'north',
    category: 'residence',
    lat: -34.00198,
    lng: 25.67393,
    aka: ['lebombo residence', 'residence'],
  },
  { id: 'n-202', number: '202', name: 'Science & Health Sciences', campus: 'north', category: 'learning', lat: -34.00079, lng: 25.67185 },
  { id: 'n-203', number: '203', name: 'Engineering', campus: 'north', category: 'learning', lat: -34.00114, lng: 25.67124 },
  { id: 'n-204', number: '204', name: 'Built Environment & Engineering', campus: 'north', category: 'learning', lat: -34.0015, lng: 25.67125 },
  { id: 'n-205', number: '205', name: 'Laboratories', campus: 'north', category: 'learning', lat: -34.00194, lng: 25.67217, aka: ['labs'] },
  { id: 'n-206', number: '206', name: 'Nursing', campus: 'north', category: 'learning', lat: -34.00054, lng: 25.67078 },
  { id: 'n-207', number: '207', name: 'Lecture Halls (N1 & N2)', campus: 'north', category: 'learning', lat: -34.00065, lng: 25.67108, aka: ['n1', 'n2'] },
  { id: 'n-208', number: '208', name: 'Art', campus: 'north', category: 'learning', lat: -34.00005, lng: 25.67098 },
  {
    id: 'n-209',
    number: '209',
    name: 'Human Resources & Contact Centre',
    campus: 'north',
    category: 'services',
    lat: -34.00056,
    lng: 25.67217,
  },
  { id: 'n-212', number: '212', name: 'Heinz Betz Assessment Centre', campus: 'north', category: 'services', lat: -34.00275, lng: 25.67191, aka: ['assessment', 'exams'] },
  { id: 'n-217', number: '217', name: 'Goldfields Auditorium', campus: 'north', category: 'learning', lat: -34.00115, lng: 25.67237 },
  {
    id: 'n-219',
    number: '219',
    name: 'Student Services Centre',
    campus: 'north',
    category: 'services',
    lat: -34.00174,
    lng: 25.67252,
    aka: ['student services', 'student cards', 'student affairs'],
    key: true,
  },
  {
    id: 'n-222',
    number: '222',
    name: 'D Block & Student Counselling',
    campus: 'north',
    category: 'services',
    lat: -34.00097,
    lng: 25.67242,
    aka: ['counselling', 'wellness', 'support', 'talk'],
    key: true,
  },
  { id: 'n-224', number: '224', name: 'Ceramics Studio', campus: 'north', category: 'learning', lat: -34.00006, lng: 25.67035 },
  { id: 'n-225', number: '225', name: 'K Project', campus: 'north', category: 'building', lat: -34.00176, lng: 25.67286 },
  {
    id: 'n-226',
    number: '226',
    name: 'Goldfields Computer Centre',
    campus: 'north',
    category: 'learning',
    lat: -34.00074,
    lng: 25.6707,
    note: 'The official campus map also lists the Writing Centre and offices here.',
    aka: ['computer lab', 'computer centre', 'computers', 'labs', 'writing centre', 'it'],
    key: true,
  },
  { id: 'n-230', number: '230', name: 'Tennis Clubhouse & Clinic', campus: 'north', category: 'sport', lat: -34.00313, lng: 25.67283 },
  { id: 'n-235', number: '235', name: 'Conference Centre', campus: 'north', category: 'services', lat: -34.00123, lng: 25.67374 },
  {
    id: 'n-252',
    number: '252',
    name: 'Campus Health Services',
    campus: 'north',
    category: 'services',
    lat: -34.00242,
    lng: 25.67398,
    aka: ['clinic', 'doctor', 'nurse', 'health', 'sick'],
    key: true,
  },
  {
    id: 'n-260',
    number: '260',
    name: 'Main Administration Building',
    campus: 'north',
    category: 'services',
    lat: -34.00051,
    lng: 25.67277,
    aka: ['admin', 'administration'],
    key: true,
  },
  {
    id: 'n-261',
    number: '261',
    name: 'MTLC Building',
    campus: 'north',
    category: 'learning',
    lat: -34.0015,
    lng: 25.67048,
    note: 'The official campus map lists eNtsa, a library, CTLM, the Senate Hall and lecture halls here.',
    aka: ['library', 'senate hall', 'study'],
    key: true,
  },
  { id: 'n-264', number: '264', name: 'Indwe Residence', campus: 'north', category: 'residence', lat: -34.00416, lng: 25.66877, aka: ['student village', 'residence'] },
  { id: 'n-ikamva', name: 'Ikamva Residence', campus: 'north', category: 'residence', lat: -34.00315, lng: 25.66769, aka: ['student village', 'residence'] },
  {
    id: 'n-269',
    number: '269',
    name: 'University Shop',
    campus: 'north',
    category: 'food',
    lat: -34.00342,
    lng: 25.66854,
    aka: ['shop', 'stationery', 'snacks'],
  },
  { id: 'n-276', number: '276', name: 'Mapungubwe (Engineering)', campus: 'north', category: 'learning', lat: -34.00242, lng: 25.67092 },
  { id: 'n-286', number: '286', name: 'Bitumen Building', campus: 'north', category: 'learning', lat: -34.00185, lng: 25.67098 },
  { id: 'n-287', number: '287', name: 'Chemin', campus: 'north', category: 'learning', lat: -33.99938, lng: 25.66754 },
  { id: 'n-288', number: '288', name: 'Newtonian (Engineering)', campus: 'north', category: 'learning', lat: -34.00299, lng: 25.67045 },
  {
    id: 'n-bus',
    name: 'North Campus bus stop',
    campus: 'north',
    category: 'transport',
    lat: -34.00332,
    lng: 25.6698,
    symbol: 'Bus',
    aka: ['bus', 'transport', 'stop'],
    key: true,
  },
];

// ---- Helpers ---------------------------------------------------------------------------------

export const placeLabel = (place: CampusPlace) => (place.number ? `${place.number} · ${place.name}` : place.name);

export function distanceMeters(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// Works for "12", "building 12", "Bldg 12" and text like "library" or "sanlam".
export function searchPlaces(places: CampusPlace[], query: string): CampusPlace[] {
  const text = query.trim().toLowerCase();
  if (!text) return [];

  const numberMatch = text.match(/^(?:building|bldg|bld|blk|block)?\s*#?\s*(\d{1,3})$/);
  const wantedNumber = numberMatch?.[1];

  const scored = places
    .map((place) => {
      const name = place.name.toLowerCase();
      const aliases = (place.aka ?? []).map((alias) => alias.toLowerCase());
      const category = CATEGORIES[place.category].label.toLowerCase();
      let score = 0;

      if (wantedNumber && place.number === wantedNumber) score = 100;
      else if (name === text) score = 90;
      else if (name.startsWith(text)) score = 70;
      else if (name.includes(text)) score = 50;
      else if (aliases.some((alias) => alias === text)) score = 60;
      else if (aliases.some((alias) => alias.includes(text) || text.includes(alias))) score = 40;
      else if (category.includes(text)) score = 20;
      else if ((place.note ?? '').toLowerCase().includes(text)) score = 10;

      return { place, score };
    })
    .filter((entry) => entry.score > 0);

  return scored.sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name)).map((entry) => entry.place);
}
