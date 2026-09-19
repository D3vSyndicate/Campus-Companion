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
  faqs: Row[];
  contacts: Row[];
  support: Row[];
  venues: Row[];
  schedule: Row[];
  // Rows of the digital_readiness table: the guides on the Digital screen.
  guides: Row[];
  // ISO date (YYYY-MM-DD) used to lift upcoming sessions above past ones.
  today: string;
};

export function buildSearchDocs(sources: SearchSources, options: { includeGuides: boolean }): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // FAQs
  for (const row of sources.faqs) {
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
  for (const row of sources.support) {
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

  // Contacts
  for (const row of sources.contacts) {
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
  const venueNames = new Map<string, string>();
  for (const row of sources.venues) {
    const name = str(row.venue_name);
    venueNames.set(str(row.venue_id), name);
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
  for (const row of sources.schedule) {
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
  if (options.includeGuides) {
    for (const row of sources.guides) {
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
  }

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
