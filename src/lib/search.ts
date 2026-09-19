// The search engine behind FR11. It is deliberately independent of React and the database: it
// takes a list of documents and a query, and returns ranked hits. That keeps it easy to test.
//
// Students rarely type the exact words on the page, so it is forgiving:
//  - punctuation and spacing do not matter ("wifi" finds "Wi-fi")
//  - common student words map to each other ("stressed" finds "overwhelmed")
//  - small typos are tolerated ("libary")
//  - every word must match, but if nothing does, the closest partial matches are still offered

export type SearchKind = 'schedule' | 'faq' | 'contact' | 'venue' | 'place' | 'support' | 'guide' | 'event' | 'sport' | 'programme' | 'announcement' | 'checklist' | 'info' | 'shuttle' | 'setting';

export type SearchDoc = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  body?: string;
  // Extra words that should find this document (category, role, building number...).
  keywords?: string[];
  // Nudges a result up, for example an upcoming session over a past one.
  boost?: number;
  // What the result needs for its action button (an email address, a venue name...).
  data: Record<string, string>;
};

export type SearchHit = {
  doc: SearchDoc;
  score: number;
  // Only some of the words matched. Shown only when nothing matches fully.
  partial: boolean;
};

export type PreparedDoc = {
  doc: SearchDoc;
  title: string[];
  subtitle: string[];
  keywords: string[];
  body: string[];
  // Each field's text with spaces removed, so "wifi" can still find "Wi-fi".
  compact: { title: string; subtitle: string; keywords: string; body: string };
};

// ---- Text helpers ---------------------------------------------------------------------------

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const wordsOf = (text: string | undefined) => {
  const clean = normalise(text ?? '');
  return clean ? clean.split(' ') : [];
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'is', 'are', 'am', 'i', 'me', 'my', 'we', 'you', 'it',
  'do', 'does', 'how', 'what', 'where', 'when', 'who', 'can', 'should', 'need', 'want', 'get', 'with', 'about', 'if', 'not', 'up',
]);

// Groups of words that mean nearly the same thing to a first-year student.
const SYNONYM_GROUPS: string[][] = [
  ['wifi', 'eduroam', 'internet', 'wireless'],
  ['print', 'printing', 'printer', 'printers'],
  ['timetable', 'timetables', 'schedule', 'schedules', 'calendar'],
  ['fees', 'fee', 'money', 'financial', 'finance', 'bursary', 'nsfas', 'funding', 'afford'],
  ['counselling', 'counseling', 'counsellor', 'counselor', 'wellness', 'anxious', 'anxiety', 'stress', 'stressed', 'overwhelmed', 'sad'],
  ['clinic', 'doctor', 'nurse', 'health', 'sick', 'ill', 'medical'],
  ['register', 'registration', 'registering', 'enrol', 'enrolment', 'enroll'],
  ['library', 'books', 'study', 'studying'],
  ['lab', 'labs', 'laboratory', 'computer', 'computers'],
  ['lost', 'directions', 'venue', 'venues', 'location'],
  ['mentor', 'mentors', 'buddy', 'buddies', 'how2buddy'],
  ['miss', 'missed', 'missing', 'absent'],
  ['assessment', 'assessments', 'test', 'tests', 'exam', 'exams', 'assignment', 'assignments'],
  ['module', 'modules', 'course', 'courses', 'subject', 'subjects'],
  ['disability', 'disabilities', 'accessibility', 'accessible', 'wheelchair'],
  ['funda', 'lms'],
  ['email', 'emails', 'mail'],
  ['gym', 'gyms', 'fitness', 'workout', 'exercise'],
  ['sport', 'sports', 'athletics'],
  ['event', 'events', 'happening'],
  ['shuttle', 'shuttles', 'bus', 'transport', 'ride'],
  ['dark', 'night', 'theme', 'appearance'],
  ['font', 'text', 'bigger', 'larger', 'smaller'],
  ['logout', 'signout'],
];

const SYNONYMS = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) SYNONYMS.set(word, group.filter((other) => other !== word));
}

// True when two words differ by at most one inserted, deleted or changed letter.
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (a.length < b.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// ---- Scoring -----------------------------------------------------------------------------------

const FIELD_WEIGHT = { title: 10, keywords: 6, subtitle: 5, body: 2 } as const;

// 1 = whole word, then prefix, then inside a word, then a one-letter typo. 0 = no match.
function strength(word: string, candidates: string[], allowTypos: boolean): number {
  let best = 0;
  for (const candidate of candidates) {
    if (candidate === word) return 1;
    if (word.length >= 2 && candidate.startsWith(word)) best = Math.max(best, 0.85);
    else if (word.length >= 3 && candidate.includes(word)) best = Math.max(best, 0.6);
    else if (allowTypos && withinOneEdit(candidate, word)) best = Math.max(best, 0.45);
  }
  return best;
}

// How well a word fits one field of a document, times how much that field matters.
function fieldScore(word: string, weight: number, words: string[], compact: string, allowTypos: boolean): number {
  if (!words.length) return 0;
  let value = strength(word, words, allowTypos);
  // "wifi" against "Wi-fi": the words are split, but the letters run together.
  if (value < 0.6 && word.length >= 4 && compact.includes(word)) value = Math.max(value, 0.7);
  return weight * value;
}

export function prepare(docs: SearchDoc[]): PreparedDoc[] {
  return docs.map((doc) => {
    const title = wordsOf(doc.title);
    const subtitle = wordsOf(doc.subtitle);
    const keywords = wordsOf((doc.keywords ?? []).join(' '));
    const body = wordsOf(doc.body);
    return {
      doc,
      title,
      subtitle,
      keywords,
      body,
      compact: { title: title.join(''), subtitle: subtitle.join(''), keywords: keywords.join(''), body: body.join('') },
    };
  });
}

function scoreToken(token: string, prepared: PreparedDoc): number {
  // Numbers are building numbers. They must match exactly, and only against titles and keywords, so
  // "12" finds building 12 and not a session that ends at 12:30.
  if (/^\d+$/.test(token)) {
    if (prepared.title.includes(token)) return FIELD_WEIGHT.title;
    return prepared.keywords.includes(token) ? FIELD_WEIGHT.keywords : 0;
  }

  let best = 0;

  for (const alternative of [token, ...(SYNONYMS.get(token) ?? [])]) {
    const factor = alternative === token ? 1 : 0.8;
    // Typos are forgiven only in words the student typed themselves (6+ letters), and never in long
    // body text, where they match unrelated words ("print" and "point").
    const typos = alternative === token && token.length >= 6;
    const score =
      Math.max(
        fieldScore(alternative, FIELD_WEIGHT.title, prepared.title, prepared.compact.title, typos),
        fieldScore(alternative, FIELD_WEIGHT.keywords, prepared.keywords, prepared.compact.keywords, typos),
        fieldScore(alternative, FIELD_WEIGHT.subtitle, prepared.subtitle, prepared.compact.subtitle, typos),
        fieldScore(alternative, FIELD_WEIGHT.body, prepared.body, prepared.compact.body, false),
      ) * factor;
    best = Math.max(best, score);
  }

  return best;
}

export function queryTokens(query: string): string[] {
  const all = wordsOf(query);
  const meaningful = all.filter((word) => !STOP_WORDS.has(word));
  return meaningful.length ? meaningful : all;
}

export function search(prepared: PreparedDoc[], query: string, limit = 80): { hits: SearchHit[]; tokens: string[] } {
  const tokens = queryTokens(query);
  if (!tokens.length) return { hits: [], tokens };

  const phrase = normalise(query);
  const hits: SearchHit[] = [];

  for (const entry of prepared) {
    let total = 0;
    let matched = 0;

    for (const token of tokens) {
      const score = scoreToken(token, entry);
      if (score > 0) {
        matched += 1;
        total += score;
      }
    }
    if (matched === 0) continue;

    const full = matched === tokens.length;
    if (full) {
      const title = entry.title.join(' ');
      if (phrase.length > 2 && title.includes(phrase)) total += 8;
      if (tokens.every((token) => entry.title.some((word) => word.startsWith(token)))) total += 4;
      total += entry.doc.boost ?? 0;
      // Searching for a building's number should put that building first.
      const number = entry.doc.data.number;
      if (number && tokens.includes(number)) total += 20;
    } else {
      total *= 0.4;
    }

    hits.push({ doc: entry.doc, score: total, partial: !full });
  }

  hits.sort((a, b) => Number(a.partial) - Number(b.partial) || b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return { hits: hits.slice(0, limit), tokens };
}

// ---- Showing results -------------------------------------------------------------------------

export type Segment = { text: string; match: boolean };

// Splits text into pieces so the words the student typed can be shown in bold.
export function highlight(text: string, tokens: string[]): Segment[] {
  // Allow punctuation between the letters, so "wifi" also lights up "Wi-Fi".
  const escape = (char: string) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const usable = tokens.filter((token) => token.length >= 2).map((token) => token.split('').map(escape).join('[^a-zA-Z0-9]*'));
  if (!usable.length || !text) return [{ text, match: false }];

  // Splitting on a pattern with one capture group puts every match at an odd position.
  return text
    .split(new RegExp(`(${usable.join('|')})`, 'gi'))
    .map((piece, index) => ({ text: piece, match: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

// A short piece of text centred on the first match, so a long answer stays readable.
export function snippet(text: string | undefined, tokens: string[], max = 150): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const lower = clean.toLowerCase();
  const positions = tokens.map((token) => lower.indexOf(token)).filter((index) => index >= 0);
  const start = positions.length ? Math.max(0, Math.min(...positions) - 40) : 0;
  const piece = clean.slice(start, start + max).trim();
  return `${start > 0 ? '...' : ''}${piece}${start + max < clean.length ? '...' : ''}`;
}
