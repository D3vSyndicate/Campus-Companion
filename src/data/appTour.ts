import type { Ionicons } from '@expo/vector-icons';

// The first-time tour for students. Each step is one screen of the walkthrough. The wording lives in the
// translation files under tour.steps.<id>.title, .body and (when hasHint is true) .hint, so it can be
// translated. To add or reorder steps, edit this list and add their texts to every language.

// The tabs along the bottom of the student app, in the order students see them.
export type TourTab = 'index' | 'schedule' | 'map' | 'digital' | 'contacts' | 'support' | 'tribe' | 'profile';

export const TOUR_TABS: { key: TourTab; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'index', labelKey: 'common.home', icon: 'home-outline' },
  { key: 'schedule', labelKey: 'common.schedule', icon: 'calendar-outline' },
  { key: 'map', labelKey: 'common.map', icon: 'map-outline' },
  { key: 'digital', labelKey: 'common.digital', icon: 'laptop-outline' },
  { key: 'contacts', labelKey: 'common.contacts', icon: 'people-outline' },
  { key: 'support', labelKey: 'common.support', icon: 'help-buoy-outline' },
  { key: 'tribe', labelKey: 'common.tribe', icon: 'chatbubbles-outline' },
  { key: 'profile', labelKey: 'profile.tab', icon: 'person-outline' },
];

export type TourStep = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  // The tab this step is about. It is highlighted on a small picture of the tab bar, so students learn where to tap.
  tab?: TourTab;
  // The step has a short "where to look" line.
  hasHint?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  { id: 'welcome', icon: 'sparkles', hasHint: true },
  { id: 'home', icon: 'home', tab: 'index', hasHint: true },
  { id: 'search', icon: 'search', tab: 'index', hasHint: true },
  { id: 'schedule', icon: 'calendar', tab: 'schedule' },
  { id: 'map', icon: 'map', tab: 'map' },
  { id: 'checklist', icon: 'checkmark-circle', hasHint: true },
  { id: 'digital', icon: 'laptop', tab: 'digital' },
  { id: 'tribe', icon: 'chatbubbles', tab: 'tribe' },
  { id: 'help', icon: 'help-buoy', tab: 'support' },
  { id: 'profile', icon: 'person', tab: 'profile' },
];
