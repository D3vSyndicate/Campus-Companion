import type { Ionicons } from '@expo/vector-icons';

// The first-time tour for students. Each step is one screen of the walkthrough. To change the tour, edit
// this list: steps show in this order, and the progress bar and "Step 3 of 10" adjust by themselves.

// The tabs along the bottom of the student app, in the order students see them.
export type TourTab = 'index' | 'schedule' | 'map' | 'digital' | 'contacts' | 'support' | 'tribe' | 'profile';

export const TOUR_TABS: { key: TourTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'index', label: 'Home', icon: 'home-outline' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline' },
  { key: 'map', label: 'Map', icon: 'map-outline' },
  { key: 'digital', label: 'Digital', icon: 'laptop-outline' },
  { key: 'contacts', label: 'Contacts', icon: 'people-outline' },
  { key: 'support', label: 'Support', icon: 'help-buoy-outline' },
  { key: 'tribe', label: 'Tribe', icon: 'chatbubbles-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
];

export type TourStep = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  // The tab this step is about. It is highlighted on a small picture of the tab bar, so students learn where to tap.
  tab?: TourTab;
  // A short "where to look" line, for things that are not in the tab bar.
  hint?: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    icon: 'sparkles',
    title: 'Welcome to Campus Companion',
    body: "Your first weeks at university can feel like a lot. This app puts what you need in one place. Take a one-minute tour. You can't get anything wrong.",
    hint: 'Skip any time. You can replay this tour from your Profile.',
  },
  {
    id: 'home',
    icon: 'home',
    title: 'Your home base',
    body: "Home shows the latest announcements, shuttle times for your stop, and quick links to everything else. A NEW tag means an announcement went out recently and you haven't opened it yet.",
    tab: 'index',
    hint: 'Scroll down on Home for Sport & gym, programmes and FAQs.',
  },
  {
    id: 'search',
    icon: 'search',
    title: 'Find anything, fast',
    body: "Not sure where to look? Use the search bar. It searches answers, venues, sessions, people to contact and guides, all at once.",
    tab: 'index',
    hint: 'Look for the search bar at the top of Home.',
  },
  {
    id: 'schedule',
    icon: 'calendar',
    title: 'Know where to be, and when',
    body: 'See your orientation sessions with their times and venues. Switch to Campus events to see what is on around campus.',
    tab: 'schedule',
  },
  {
    id: 'map',
    icon: 'map',
    title: 'Never get lost',
    body: 'The campus map shows buildings and venues. Find a place and get walking directions to it.',
    tab: 'map',
  },
  {
    id: 'checklist',
    icon: 'checkmark-circle',
    title: 'Tick off the essentials',
    body: 'The new student checklist lists what to sort out in your first weeks, like registration and your student email. Go at your own pace and tick things off as you finish them.',
    hint: 'Find it on Home: New student checklist.',
  },
  {
    id: 'digital',
    icon: 'laptop',
    title: 'Get digital-ready',
    body: 'Step-by-step guides for Funda, Wi-Fi and printing, plus short lessons on file management, staying safe online, strong passwords and using AI tools responsibly.',
    tab: 'digital',
  },
  {
    id: 'tribe',
    icon: 'chatbubbles',
    title: 'Meet your Tribe',
    body: 'Your Tribe is a chat with your mentor and other first-years. Before you choose a chat name you will agree to keep it respectful. Tap Find groups to browse mentor groups or scan a QR code.',
    tab: 'tribe',
  },
  {
    id: 'help',
    icon: 'help-buoy',
    title: 'Help is always close',
    body: 'Not sure who to ask? Open Support, choose what you need help with, and the app points you to the right person or service. Contacts lists mentors and advisors you can reach directly.',
    tab: 'support',
  },
  {
    id: 'profile',
    icon: 'person',
    title: 'Make it yours',
    body: 'In Profile you can switch between English, isiXhosa and Afrikaans, choose light or dark mode, and make the text bigger. You can replay this tour there whenever you like.',
    tab: 'profile',
  },
];
