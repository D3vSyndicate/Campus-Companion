// Student societies you can join at Nelson Mandela University.
//
// SOURCE: transcribed from the printed society sign-up sheet supplied by the user. Each entry keeps
// the sheet's own account code and fee, because that code is what a student quotes when paying.
//
// WHAT THIS LIST IS NOT:
//   * COMPLETE. The photograph of the sheet is clipped at the bottom of the page, so the Academic
//     and Developmental columns end mid-list. Societies exist that are not here.
//   * VERIFIED FOR THE CURRENT YEAR. Fees and codes change. The sheet carries no year.
//
// Both of those are said out loud on the screen rather than hidden, so a student who cannot find
// their society knows to go and ask rather than concluding it does not exist.

// Shown at the top of the screen. A lot of first-years have never heard the word "society" used
// this way and quietly assume it is not for them, so this says plainly what one is, what joining
// actually involves, and that the fee is small.
export const WHAT_IS_A_SOCIETY =
  'A society is a student-run club you can join for the year. Some are built around a faith, some around what you study, and some around a cause or a skill that has nothing to do with your degree. You pay a small once-off fee, and in return you get people who already know what you are going through. You do not need to be good at anything, know anyone, or commit to every meeting — turning up once is enough to start.';

export type SocietyCategory = 'religious' | 'academic' | 'developmental';

export interface Society {
  name: string;
  category: SocietyCategory;
  // The account code from the sheet, e.g. "A702-4275". Empty when the sheet did not show one.
  code: string;
  // Rands. null where the sheet showed no amount (or showed a dash).
  fee: number | null;
  note?: string;
}

export const CATEGORY_META: Record<SocietyCategory, { label: string; blurb: string }> = {
  religious: {
    label: 'Religious',
    blurb: 'Faith communities on campus, across many traditions.',
  },
  academic: {
    label: 'Academic',
    blurb: 'Tied to a field of study — good for contacts in your industry before you graduate.',
  },
  developmental: {
    label: 'Developmental',
    blurb: 'Skills, causes and networks that are not about your degree.',
  },
};

export const SOCIETIES: Society[] = [
  // --- Religious ---------------------------------------------------------
  { name: 'ACTS (Assoc of Catholic Tertiary Students)', category: 'religious', code: 'A702-4275', fee: 100 },
  { name: 'Anglican Society', category: 'religious', code: 'A742-4275', fee: 70 },
  { name: 'Apostolic Faith Mission', category: 'religious', code: 'A819-4275', fee: 50 },
  { name: 'Association for Tertiary Zion Students', category: 'religious', code: 'A839-4275', fee: 200 },
  { name: 'Bantu Church of Christ Association', category: 'religious', code: 'A757-4275', fee: 50 },
  { name: 'Believers Love World', category: 'religious', code: 'A837-4275', fee: 50 },
  { name: 'Chi Alpha Campus Ministries', category: 'religious', code: 'A821-4275', fee: 50 },
  { name: 'Christian Revival Church', category: 'religious', code: 'A726-4275', fee: 50 },
  { name: 'Christian Students Association', category: 'religious', code: 'A711-4275', fee: 20 },
  { name: 'Christian Students Fellowship', category: 'religious', code: 'A895-4275', fee: 100 },
  { name: 'Complete Life in Christ', category: 'religious', code: 'A882-4275', fee: 20 },
  {
    name: 'Conquerors Covenant Student Ministry',
    category: 'religious',
    code: 'A893-4275',
    fee: null,
    note: 'The sheet shows a dash instead of a fee. Ask before you pay anything.',
  },
  { name: 'ELCSASO Nelson Mandela University', category: 'religious', code: 'A737-4275', fee: 50 },
  { name: 'Family Christian Fellowship', category: 'religious', code: 'A716-4275', fee: 80 },
  { name: "God's Revival Movement", category: 'religious', code: 'A876-4275', fee: 50 },
  { name: 'JOS (Jesus the Only Solution)', category: 'religious', code: 'A703-4275', fee: 50 },
  { name: 'Lighthouse Chapel International', category: 'religious', code: 'A899-4275', fee: 50 },
  { name: 'Love House Uni', category: 'religious', code: 'A713-4275', fee: 100 },
  { name: 'METHSOC', category: 'religious', code: 'A833-4275', fee: 90 },
  { name: 'Muslim Student Association', category: 'religious', code: 'A723-4275', fee: 50 },
  { name: 'NATESA', category: 'religious', code: 'A756-4275', fee: 60 },
  {
    name: 'Recreating Your World Student Fellowship',
    category: 'religious',
    code: '',
    fee: 30,
    note: 'No account code was printed on the sheet for this one.',
  },
  { name: 'RUCC Force Campus Ministries', category: 'religious', code: 'A878-4275', fee: 80 },
  { name: 'SCO', category: 'religious', code: 'A736-4275', fee: 70 },
  { name: 'SDASM', category: 'religious', code: 'A701-4275', fee: 100 },
  { name: 'TASA (Twelve Apostles)', category: 'religious', code: 'A748-4275', fee: 40 },
  { name: 'The Beloved International Gathering', category: 'religious', code: 'A755-4275', fee: 50 },
  { name: 'THOTASA', category: 'religious', code: 'A708-4275', fee: 20 },
  { name: 'True Vine Society', category: 'religious', code: 'A836-4275', fee: 50 },
  { name: 'TTACCSO', category: 'religious', code: 'A889-4275', fee: 50 },
  { name: 'Wells of Life', category: 'religious', code: 'A858-4275', fee: 100 },
  { name: 'Word of Life', category: 'religious', code: 'A874-4275', fee: 30 },
  { name: 'World Mission Society', category: 'religious', code: 'A864-4275', fee: 50 },
  { name: 'YOTKOG', category: 'religious', code: 'A859-4275', fee: 50 },
  { name: 'Zion Christian Church Student Fellowship', category: 'religious', code: 'A752-4275', fee: 150 },

  // --- Academic ----------------------------------------------------------
  { name: 'Agriculture Society', category: 'academic', code: 'A810-4275', fee: 70 },
  { name: 'Black Lawyers Association', category: 'academic', code: 'A753-4275', fee: 100 },
  { name: 'Computer Society', category: 'academic', code: 'A712-4275', fee: 50 },
  { name: 'Human Resources', category: 'academic', code: 'A812-4275', fee: 35 },
  { name: 'Industrial & Organisational Psychology', category: 'academic', code: 'A856-4275', fee: 70 },
  {
    name: 'Industrial Engineering Nexus',
    category: 'academic',
    code: 'A746-4275',
    fee: null,
    note: 'No fee was printed on the sheet.',
  },
  { name: 'INTACC', category: 'academic', code: 'A884-4275', fee: 100 },
  { name: 'Law Student Society', category: 'academic', code: 'A725-4275', fee: 150 },
  { name: 'Life Diet Society', category: 'academic', code: 'A869-4275', fee: 20 },
  { name: 'Logistics', category: 'academic', code: 'A804-4275', fee: 35 },
  { name: 'Management Society', category: 'academic', code: 'A897-4275', fee: 35 },
  { name: 'Marketing Society', category: 'academic', code: 'A811-4275', fee: 35 },
  { name: 'Medical Society', category: 'academic', code: 'A758-4275', fee: 50 },
  { name: 'PEPSA (Mandela University Pharmacy)', category: 'academic', code: 'A729-4275', fee: 100 },
  { name: 'Psychology Society', category: 'academic', code: 'A881-4275', fee: 75 },
  { name: 'Quantity Surveying', category: 'academic', code: 'A732-4275', fee: 100 },
  { name: 'Rethinking Economics for Africa NMU', category: 'academic', code: 'A814-4275', fee: 75 },
  { name: 'SAPASA (SA Public Admin Student Association)', category: 'academic', code: 'A744-4275', fee: 120 },
  { name: "SCISA (Science Students' Association)", category: 'academic', code: 'A793-4275', fee: 80 },
  { name: 'Social Work', category: 'academic', code: 'A873-4275', fee: 80 },
  { name: 'South African Medical Student Union', category: 'academic', code: 'A728-4275', fee: 50 },
  { name: 'SPACE (Architecture)', category: 'academic', code: 'A707-4275', fee: 50 },
  { name: 'Student Association', category: 'academic', code: 'A729-4275', fee: 100 },
  { name: 'Student Law Enforcement Society', category: 'academic', code: 'A902-4275', fee: 100 },
  { name: 'Tourism', category: 'academic', code: 'A806-4275', fee: 60 },

  // --- Developmental -----------------------------------------------------
  {
    name: 'ABASA',
    category: 'developmental',
    code: 'A747-4275',
    fee: 100,
    note: 'The printed sheet abbreviates this name and cuts it off mid-word. Ask for the full name at sign-up.',
  },
  { name: 'ABSIP', category: 'developmental', code: 'A828-4275', fee: 65 },
  { name: 'AIDED', category: 'developmental', code: 'A796-4275', fee: 50 },
  {
    name: 'African Women Chartered Accountants Forum',
    category: 'developmental',
    code: 'A871-4275',
    fee: null,
    note: 'No fee was printed on the sheet.',
  },
  { name: 'BMF Chapter', category: 'developmental', code: 'A709-4275', fee: 100 },
  { name: 'Business & Economic Sciences Forum', category: 'developmental', code: 'A735-4275', fee: 50 },
  { name: 'ENACTUS', category: 'developmental', code: 'A750-4275', fee: 100 },
  { name: 'French Society', category: 'developmental', code: 'A849-4275', fee: 100 },
  { name: 'Green Campus Initiative', category: 'developmental', code: 'A879-4275', fee: 100 },
  { name: 'Higher Education Transformation Network', category: 'developmental', code: 'A862-4275', fee: 150 },
  { name: 'International Student Society', category: 'developmental', code: 'A869-4275', fee: 20 },
  { name: "Madiba's Debate Union", category: 'developmental', code: 'A715-4275', fee: 100 },
  { name: 'PROMATHS Alumni Society', category: 'developmental', code: 'A754-4275', fee: 200 },
  { name: 'Start Small Foundation', category: 'developmental', code: 'A868-4275', fee: 150 },
  {
    name: 'Youth Alive Soul Healing International',
    category: 'developmental',
    code: '',
    fee: 50,
    note: 'No account code was printed on the sheet for this one.',
  },
];

// Two account codes appear against two different societies on the printed sheet (A729-4275 and
// A869-4275). Since the code is what a student quotes when paying, a clash is worth surfacing
// rather than quietly picking a winner.
export function duplicateCodes(): string[] {
  const seen = new Map<string, number>();
  for (const society of SOCIETIES) {
    if (!society.code) continue;
    seen.set(society.code, (seen.get(society.code) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([code]) => code).sort();
}

export const feeLabel = (fee: number | null) => (fee === null ? 'Fee not listed' : `R${fee}`);
