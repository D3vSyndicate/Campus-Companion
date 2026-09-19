import { CAMPUS_PLACES, CAMPUSES, CATEGORIES } from '../data/campus';
import type { SearchDoc } from './search';

type Row = Record<string, unknown>;

const str = (value: unknown) => String(value ?? '').trim();
const isLink = (value: string) => /^https?:\/\//i.test(value);

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "2027-02-04" -> { label: "Thu 4 Feb", words: ["Thursday", "February"] }. Done by hand so it never
// depends on the phone's language settings.
function describeDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (!year || Number.isNaN(date.getTime())) return { label: iso, words: [] as string[] };
  const weekday = WEEKDAYS[date.getDay()];
  const monthName = MONTHS[date.getMonth()];
  return { label: `${weekday.slice(0, 3)} ${date.getDate()} ${monthName.slice(0, 3)}`, words: [weekday, monthName] };
}

export type SearchSources = {
  faqs?: Row[];
  contacts?: Row[];
  support?: Row[];
  venues?: Row[];
  schedule?: Row[];
  // Rows of the digital_readiness table: the guides on the Digital screen.
  guides?: Row[];
  // Rows of the event table (what is on around campus) and of sport_recreation (student area only).
  events?: Row[];
  sport?: Row[];
  // Rows of it_programmes (student area only).
  programmes?: Row[];
  // Announcement, checklist_item, coordinator_content (support notes) and shuttle_times rows.
  announcements?: Row[];
  checklist?: Row[];
  info?: Row[];
  shuttle?: Row[];
  // ISO date (YYYY-MM-DD) used to lift upcoming sessions above past ones.
  today: string;
};

// Settings screens have no database rows, so these are written here.
const SETTING_DOCS: SearchDoc[] = [
  { id: 'setting:language', kind: 'setting', title: 'Language', subtitle: 'Profile & settings', body: 'Change the app language. English, isiXhosa and Afrikaans are available.', keywords: ['language translate isixhosa xhosa afrikaans english'], data: {} },
  { id: 'setting:appearance', kind: 'setting', title: 'Appearance', subtitle: 'Profile & settings', body: 'Choose light, dark or match your phone. Dark mode is gentler on the eyes at night.', keywords: ['dark mode light theme night colour'], data: {} },
  { id: 'setting:text-size', kind: 'setting', title: 'Text size', subtitle: 'Profile & settings', body: 'Make the text in the app bigger or smaller so it is easier to read.', keywords: ['font bigger larger smaller accessibility readable zoom'], data: {} },
  { id: 'setting:account', kind: 'setting', title: 'My account and log out', subtitle: 'Profile & settings', body: 'See the email and role you are signed in with, or log out.', keywords: ['logout sign out account email role'], data: {} },
  { id: 'setting:about', kind: 'setting', title: 'About Campus Companion', subtitle: 'Profile & settings', body: 'Learn about the project and the team behind the app.', keywords: ['about project team credits'], data: {} },
];

// Builds a searchable document for everything the given sources contain. Callers pick the kinds they
// want afterwards, so a screen can search only its own content.
export function buildSearchDocs(sources: SearchSources): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // Events and schedule items only store a venue_id, so keep the venue names to hand.
  const venueNames = new Map<string, string>();
  for (const row of sources.venues ?? []) venueNames.set(str(row.venue_id), str(row.venue_name));

  // FAQs
  for (const row of sources.faqs ?? []) {
    const question = str(row.question);
    if (!question) continue;
    const category = str(row.category) || 'General';
    docs.push({
      id: `faq:${str(row.faq_id ?? row.id ?? question)}`,
      kind: 'faq',
      title: question,
      subtitle: category,
      body: str(row.answer),
      keywords: [category],
      data: { question, category },
    });
  }

  // Support pathways ("I need help with...")
  for (const row of sources.support ?? []) {
    const need = str(row.student_need);
    if (!need) continue;
    const resource = str(row.related_resource);
    docs.push({
      id: `support:${str(row.support_pathway_Id ?? need)}`,
      kind: 'support',
      title: need,
      subtitle: str(row.recommended_contact),
      body: [str(row.recommended_action), isLink(resource) ? '' : resource].filter(Boolean).join(' '),
      keywords: [str(row.related_faq), resource, str(row.recommended_contact), 'help support'],
      data: {
        action: str(row.recommended_action),
        contact: str(row.recommended_contact),
        relatedFaq: str(row.related_faq),
        resource,
      },
    });
  }

  // Campus events. Past ones are left out, because a search should not send a student to something over.
  // An event with no date yet is still found.
  for (const row of sources.events ?? []) {
    const title = str(row.title);
    const date = str(row.event_date ?? row.date ?? row.start_date).slice(0, 10);
    if (!title || row.is_active === false || (date && date < sources.today)) continue;
    const category = str(row.category) || 'Event';
    const when = date ? describeDate(date) : { label: 'Date to be announced', words: [] as string[] };
    const start = str(row.start_time).slice(0, 5);
    const venue = venueNames.get(str(row.venue_id)) ?? '';
    const organizer = str(row.organizer);
    docs.push({
      id: `event:${str(row.id ?? row.event_id ?? `${title}-${date}`)}`,
      kind: 'event',
      title,
      subtitle: [when.label, start, venue].filter(Boolean).join(' · '),
      body: [str(row.description), str(row.cost) && `Cost: ${str(row.cost)}`, organizer && `Organised by ${organizer}`].filter(Boolean).join(' '),
      keywords: [category, organizer, 'event events on happening', ...when.words],
      boost: 1,
      data: { id: str(row.id ?? row.event_id), tab: 'events', venue },
    });
  }

  // Sport, clubs, facilities and the gym
  for (const row of sources.sport ?? []) {
    const name = str(row.name);
    if (!name || row.is_active === false) continue;
    const kind = str(row.kind);
    const gym = kind === 'gym';
    const steps = str(row.how_to_join).replace(/\s+/g, ' ');
    docs.push({
      id: `sport:${str(row.item_id ?? name)}`,
      kind: 'sport',
      title: name,
      subtitle: [gym ? 'Gym' : kind === 'facility' ? 'Sports facility' : 'Sport / club', str(row.campus)].filter(Boolean).join(' · '),
      body: [str(row.description), str(row.schedule), str(row.cost), steps, str(row.what_to_bring)].filter(Boolean).join(' '),
      keywords: gym
        ? ['gym fitness workout membership sign up join register sport']
        : ['sport sports recreation', kind === 'facility' ? 'facility' : 'club team join training'],
      boost: gym ? 2 : 0,
      data: { id: str(row.item_id), tab: gym ? 'gym' : 'sport', venue: str(row.venue) },
    });
  }

  // School of IT programmes
  for (const row of sources.programmes ?? []) {
    const name = str(row.programme_name);
    if (!name) continue;
    const list = (value: unknown) => (Array.isArray(value) ? value.map(str).filter(Boolean) : []);
    const modules = list(row.key_modules);
    const careers = list(row.career_possibilities);
    docs.push({
      id: `programme:${str(row.id ?? name)}`,
      kind: 'programme',
      title: name,
      subtitle: str(row.advisor_name) ? `Academic advisor: ${str(row.advisor_name)}` : 'School of IT programme',
      body: [str(row.description), str(row.year_structure), modules.join(' '), careers.join(' '), str(row.academic_expectations)]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' '),
      keywords: ['programme program degree diploma qualification academic advice advisor career careers jobs', ...modules, ...careers],
      boost: 1,
      data: { id: str(row.id), name },
    });
  }

  // Contacts
  for (const row of sources.contacts ?? []) {
    const name = `${str(row.name)} ${str(row.surname)}`.replace(/\s+/g, ' ').trim();
    const role = str(row.role);
    const category = str(row.support_category);
    if (!name && !role) continue;
    docs.push({
      id: `contact:${str(row.contact_id ?? name)}`,
      kind: 'contact',
      title: name || role,
      subtitle: [role, category].filter(Boolean).join(' · '),
      body: str(row.email),
      keywords: [role, category, str(row.email), 'contact'],
      data: { email: str(row.email), role, category },
    });
  }

  // Venues (rooms staff have published)
  for (const row of sources.venues ?? []) {
    const name = str(row.venue_name);
    if (!name) continue;
    const building = str(row.building);
    const room = str(row.room_number);
    docs.push({
      id: `venue:${str(row.venue_id ?? name)}`,
      kind: 'venue',
      title: name,
      subtitle: [building, room].filter(Boolean).join(' · '),
      body: [str(row.directions), str(row.accessibilty_notes)].filter(Boolean).join(' '),
      keywords: [building, room, 'venue room where'],
      // Rooms staff have published for orientation are the likeliest thing a student is looking for.
      boost: 3,
      data: { name, mapLink: str(row.map_link), directions: str(row.directions) },
    });
  }

  // Schedule
  for (const row of sources.schedule ?? []) {
    const title = str(row.title);
    if (!title) continue;
    const date = str(row.date);
    const { label, words } = describeDate(date);
    const start = str(row.start_time).slice(0, 5);
    const end = str(row.end_time).slice(0, 5);
    const venue = venueNames.get(str(row.venue_id)) ?? '';
    docs.push({
      id: `schedule:${str(row.id ?? title)}`,
      kind: 'schedule',
      title,
      subtitle: [label, start && end ? `${start}-${end}` : start, venue].filter(Boolean).join(' · '),
      body: str(row.description),
      keywords: [str(row.category), str(row.responsible_person), venue, ...words, 'session event orientation'],
      boost: date && date >= sources.today ? 1.5 : 0,
      data: { venue, date, category: str(row.category) },
    });
  }

  // Digital readiness guides
  for (const row of sources.guides ?? []) {
    const title = str(row.name);
    const description = str(row.description);
    const rawSteps = row.steps;
    const steps = Array.isArray(rawSteps)
      ? rawSteps.filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
      : typeof rawSteps === 'string' && rawSteps.trim()
        ? [rawSteps]
        : [];
    // Skip unfinished rows (a title with nothing to read).
    if (!title || (!steps.length && !description)) continue;
    docs.push({
      id: `guide:${str(row.id ?? title)}`,
      kind: 'guide',
      title,
      subtitle: `Digital readiness guide${steps.length ? ` · ${steps.length} steps` : ''}`,
      body: [description, ...steps].filter(Boolean).join(' '),
      keywords: ['digital readiness tutorial guide how to'],
      data: { id: str(row.id), title },
    });
  }

  // Announcements
  for (const row of sources.announcements ?? []) {
    const title = str(row.title);
    if (!title) continue;
    const priority = str(row.priority_level);
    docs.push({
      id: `announcement:${str(row.announcement_id ?? title)}`,
      kind: 'announcement',
      title,
      subtitle: priority ? `${priority} priority announcement` : 'Announcement',
      body: str(row.message),
      keywords: ['announcement news update notice'],
      boost: 1,
      data: { title },
    });
  }

  // Checklist tasks
  for (const row of sources.checklist ?? []) {
    const task = str(row.task_description);
    if (!task) continue;
    const category = str(row.category);
    docs.push({
      id: `checklist:${str(row.checklist_item_id ?? row.id ?? task)}`,
      kind: 'checklist',
      title: task,
      subtitle: category,
      keywords: [category, 'checklist task to do'],
      data: { task },
    });
  }

  // Support information written by coordinators (the Support screen)
  for (const row of sources.info ?? []) {
    if (str(row.module) !== 'support') continue;
    const content = str(row.content).replace(/\s+/g, ' ');
    if (!content) continue;
    const title = content.length > 80 ? `${content.slice(0, 77).trim()}...` : content;
    docs.push({
      id: `info:${str(row.id ?? content)}`,
      kind: 'info',
      title,
      subtitle: 'Support information',
      body: content.length > 80 ? content : '',
      keywords: ['support help'],
      data: {},
    });
  }

  // Shuttle times (shown on the Home screen)
  for (const row of sources.shuttle ?? []) {
    const time = str(row.departure_time).slice(0, 5);
    const route = str(row.route_name);
    if (!time || !route || row.is_active === false) continue;
    const shift = str(row.shift);
    const pickup = str(row.pickup_point);
    const dropoff = str(row.dropoff_point);
    docs.push({
      id: `shuttle:${str(row.shuttle_id ?? `${route}-${time}`)}`,
      kind: 'shuttle',
      title: `${time} · ${route}`,
      subtitle: [shift ? `${shift.charAt(0).toUpperCase()}${shift.slice(1)} shuttle` : 'Shuttle', str(row.days)].filter(Boolean).join(' · '),
      body: [pickup && dropoff ? `${pickup} to ${dropoff}.` : pickup || dropoff, str(row.notes)].filter(Boolean).join(' '),
      keywords: ['shuttle bus transport residence ride', shift],
      data: { time, route },
    });
  }

  // Settings
  docs.push(...SETTING_DOCS);

  // Campus buildings
  for (const place of CAMPUS_PLACES) {
    const category = CATEGORIES[place.category].label;
    docs.push({
      id: `place:${place.id}`,
      kind: 'place',
      title: place.name,
      subtitle: `${CAMPUSES[place.campus].name} · ${place.number ? `Building ${place.number}` : category}`,
      body: place.note,
      keywords: [place.number ?? '', place.number ? `building ${place.number}` : '', ...(place.aka ?? []), category, CAMPUSES[place.campus].name],
      data: { name: place.name, placeId: place.id, number: place.number ?? '' },
    });
  }

  return docs;
}
