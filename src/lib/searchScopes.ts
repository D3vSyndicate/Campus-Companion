import i18n from '../i18n';
import type { SearchKind } from './search';

// Search happens at two levels:
//  - "all": the search on the Home screen looks across everything in the app.
//  - every other scope: the search on a screen only looks at what that screen shows.
export type SearchScopeId = 'all' | 'schedule' | 'contacts' | 'support' | 'digital' | 'checklist' | 'programmes' | 'sport' | 'profile';

export type SearchScope = {
  id: SearchScopeId;
  // "Schedule", used in "Searching Schedule only".
  label: string;
  placeholder: string;
  hint: string;
  // Which kinds of result belong to this screen. null means everything the role can see.
  kinds: SearchKind[] | null;
  suggestions: string[];
};

export const SEARCH_SCOPES: Record<SearchScopeId, SearchScope> = {
  all: {
    id: 'all',
    label: 'the whole app',
    placeholder: 'Search everything in the app...',
    hint: 'Search everything in the app: the schedule and events, answers, contacts, venues and buildings, guides, programmes, sport and more.',
    kinds: null,
    suggestions: ['Wi-Fi', 'Printing', 'Funda', 'Gym sign-up', 'Events', 'Library', 'Registration', 'Counselling'],
  },
  schedule: {
    id: 'schedule',
    label: 'Schedule',
    placeholder: 'Search the schedule...',
    hint: 'Search orientation sessions and campus events by name, day, time or venue.',
    kinds: ['schedule', 'event'],
    suggestions: ['Registration', 'Workshop', 'Mentor', 'Sport'],
  },
  contacts: {
    id: 'contacts',
    label: 'Contacts',
    placeholder: 'Search contacts...',
    hint: 'Search the people you can contact by name, role or support area.',
    kinds: ['contact'],
    suggestions: ['Counselling', 'Registration', 'Clinic', 'Lecturer'],
  },
  support: {
    id: 'support',
    label: 'Support',
    placeholder: 'Search support...',
    hint: 'Search the "I need help with..." options and the support information published by your coordinators.',
    kinds: ['support', 'info'],
    suggestions: ['Counselling', 'Financial aid', 'Registration', 'Clinic'],
  },
  digital: {
    id: 'digital',
    label: 'Digital guides',
    placeholder: 'Search the digital guides...',
    hint: 'Search the step-by-step guides for Funda, Wi-Fi, printing, email and more.',
    kinds: ['guide'],
    suggestions: ['Wi-Fi', 'Printing', 'Funda', 'Email', 'Laptop'],
  },
  checklist: {
    id: 'checklist',
    label: 'Checklist',
    placeholder: 'Search your checklist...',
    hint: 'Search the tasks on your new student checklist.',
    kinds: ['checklist'],
    suggestions: ['Registration', 'Student card', 'Email', 'Orientation'],
  },
  programmes: {
    id: 'programmes',
    label: 'Programmes',
    placeholder: 'Search the programmes...',
    hint: 'Search School of IT programmes by name, module, career or advisor.',
    kinds: ['programme'],
    suggestions: ['Diploma', 'Software', 'Networks', 'Advisor'],
  },
  sport: {
    id: 'sport',
    label: 'Sport & gym',
    placeholder: 'Search sport and gym...',
    hint: 'Search sports, clubs, facilities and how to sign up for the gym.',
    kinds: ['sport'],
    suggestions: ['Gym', 'Soccer', 'Netball', 'Sign up'],
  },
  profile: {
    id: 'profile',
    label: 'Profile & settings',
    placeholder: 'Search settings...',
    hint: 'Search your settings, like language, text size and appearance.',
    kinds: ['setting'],
    suggestions: ['Language', 'Text size', 'Dark mode', 'Log out'],
  },
};

export const parseScope = (value: string | undefined | null): SearchScopeId =>
  value && value in SEARCH_SCOPES ? (value as SearchScopeId) : 'all';

// The screen a header search box sits on decides its scope. A screen that is not listed here has no
// header search box, rather than quietly searching the whole app.
const SCOPE_BY_SCREEN: Record<string, SearchScopeId> = {
  schedule: 'schedule',
  contacts: 'contacts',
  support: 'support',
  digital: 'digital',
  checklist: 'checklist',
  'it-programmes': 'programmes',
  'sport-gym': 'sport',
  profile: 'profile',
};

export const scopeForScreen = (screen: string | undefined): SearchScopeId | null => (screen && SCOPE_BY_SCREEN[screen]) || null;

export const searchHref = (area: 'student' | 'mentor', scope: SearchScopeId = 'all') =>
  `/(${area})/search${scope === 'all' ? '' : `?scope=${scope}`}`;

// The words a scope shows, in the student's language. The English in SEARCH_SCOPES is the fallback.
// The suggestions stay in English on purpose: they are search words, and the searchable content is English.
export const scopeText = (scope: SearchScope, field: 'label' | 'placeholder' | 'hint') =>
  i18n.t(`search.scopes.${scope.id}.${field}`, { defaultValue: scope[field] });
