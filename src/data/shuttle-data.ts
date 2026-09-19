// Shuttle timetable — mock data.
//
// Transcribed from the printed Gqeberha 2026 shuttle schedule. Hardcoded on purpose: it ships with
// the app, works with no network and no database, and is the same for every student.
//
// Grouped by route rather than by departure, because that is how a student thinks about it — "when
// does my stop go?", never "what leaves at 07:45?".

import type { Ionicons } from '@expo/vector-icons';

export type Shift = 'morning' | 'afternoon' | 'night';

export interface ShuttleRoute {
  id: string;
  // The stop as a student would say it out loud.
  name: string;
  // The landmark that tells them where to stand. Shown smaller, under the name.
  detail: string;
  morning: string[];
  afternoon: string[];
  night: string[];
}

// The ten stops that share the standard timetable.
const STANDARD_MORNING = ['06:45', '07:45', '08:45', '09:45'];
const STANDARD_AFTERNOON = ['12:30', '14:30', '16:00', '17:30'];

const standard = (id: string, name: string, detail: string): ShuttleRoute => ({
  id,
  name,
  detail,
  morning: STANDARD_MORNING,
  afternoon: STANDARD_AFTERNOON,
  night: [],
});

export const SHUTTLE_ROUTES: ShuttleRoute[] = [
  standard('korsten', 'Korsten', 'PSA, 163 Durban Road'),
  standard('sydenham', 'Sydenham', 'Klesal / Varsity Park'),
  standard('north-end', 'North End', 'Law Court & Pier 14'),
  standard('kalinga', 'Kalinga House', 'Richmond Hill'),
  standard('suites', 'The Suites', 'Rink Street'),
  standard('russell', 'Russell Road', 'Outside Home Choice'),
  standard('central', 'Central', 'Belmont Terrace'),
  standard('feather-market', 'Feather Market Hall', 'Govan Mbeki Avenue'),
  standard('walmer', 'Walmer', 'Walmer PSA'),
  standard('kings-beach', 'Kings Beach', 'Humewood and Forest Hill'),
  {
    id: 'missionvale',
    name: 'Summerstrand to Missionvale',
    detail: 'For the Medical School',
    morning: ['07:00', '09:00'],
    afternoon: ['13:30', '15:30', '17:30'],
    night: [],
  },
  {
    id: 'hopper',
    name: 'The Hopper',
    detail: 'Campus to campus, all day',
    morning: ['07:00', '08:00', '09:00', '11:00'],
    afternoon: ['12:00', '14:30', '16:00', '17:00'],
    night: [],
  },
  {
    id: 'student-village',
    name: 'Summerstrand Student Village',
    detail: 'Res to campus and back',
    morning: ['07:00', '08:00', '09:00', '11:00'],
    afternoon: ['12:00', '14:00', '16:00', '17:00'],
    night: [],
  },
  {
    id: 'night',
    name: 'Night shuttle',
    detail: 'Campus back to residences',
    morning: [],
    afternoon: [],
    night: ['18:30', '20:30', '22:00'],
  },
];

// Written to sound like a person, not a noticeboard. A first-year reading this is often anxious
// about getting somewhere on time, and a timetable that speaks kindly costs nothing.
export const SHIFTS: {
  key: Shift;
  label: string;
  hint: string;
  // Typed against the icon set so a misspelled name fails to compile rather than rendering blank.
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'morning',
    label: 'Getting to campus',
    hint: 'Morning runs. If you have an 07:45, the 06:45 gets you there calmly.',
    icon: 'sunny-outline',
  },
  {
    key: 'afternoon',
    label: 'Heading home',
    hint: 'Afternoon runs. Aim for the one before the one you need.',
    icon: 'partly-sunny-outline',
  },
  {
    key: 'night',
    label: 'Late nights on campus',
    hint: 'If you are studying late, these are your way back.',
    icon: 'moon-outline',
  },
];

export const routesFor = (shift: Shift): ShuttleRoute[] =>
  SHUTTLE_ROUTES.filter((route) => route[shift].length > 0);

// Where this data is from and what it does not cover — shown on the screen, not hidden in a comment.
export const SHUTTLE_SOURCE_NOTE =
  'These are the Gqeberha times from the 2026 printed schedule. George campus is not included yet. Times can change — the printed schedule at your stop is always the final word.';
