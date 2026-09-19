// The rewards students unlock by winning a game in the Madibaz Arcade. Games know nothing about
// these: they only report a win, and the picker in lib/arcade.ts decides what comes out.
//
// Everything in here is about Nelson Mandela University, and every claim is traceable. Facts carry
// the page they came from so a student who doubts one can check it, and so whoever maintains this
// list later can tell a sourced fact from an invented one.

export type RewardKind = 'fact' | 'madibaz' | 'tip';

export interface RewardSource {
  label: string;
  url: string;
}

interface RewardBase {
  id: string;
  kind: RewardKind;
  title: string;
  body: string;
}

// Did You Know — campus trivia. Sourced from mandela.ac.za.
export interface FactReward extends RewardBase {
  kind: 'fact';
  source: RewardSource;
}

// Meet a Madibaz — a real graduate and where their degree took them.
//
// The source is required on purpose. These are claims about real, named people, so an entry without
// a public page to back it up does not belong here: see the note above MADIBAZ below.
export interface MadibazReward extends RewardBase {
  kind: 'madibaz';
  name: string;
  programme: string;
  source: RewardSource;
}

// First-Year Tip — advice, pointed at the campus service that actually provides the help.
export interface TipReward extends RewardBase {
  kind: 'tip';
  source?: RewardSource;
}

export type Reward = FactReward | MadibazReward | TipReward;

export const KIND_META: Record<RewardKind, { emoji: string; label: string; accent: string }> = {
  fact: { emoji: '🦓', label: 'Did You Know?', accent: '#F8A705' },
  madibaz: { emoji: '🎓', label: 'Meet a Madibaz', accent: '#4FB286' },
  tip: { emoji: '💡', label: 'First-Year Tip', accent: '#5B8DEF' },
};

const CAMPUS_SOURCE = (page: string, label: string): RewardSource => ({
  label,
  url: 'https://www.mandela.ac.za/About-us/Campuses' + page,
});

const TIMELINE_SOURCE: RewardSource = {
  label: 'Mandela University — Timeline of our history',
  url: 'https://www.mandela.ac.za/About-us/Timeline-of-our-history',
};

const SOUTH_CAMPUS = CAMPUS_SOURCE('/South-Campus', 'Mandela University — South Campus');

export const FACTS: FactReward[] = [
  {
    id: 'fact-nature-reserve',
    kind: 'fact',
    title: 'Your campus is a nature reserve',
    body: 'South Campus is built on a private nature reserve covering 830 hectares, and it doubles as a conservation site for fynbos vegetation.',
    source: SOUTH_CAMPUS,
  },
  {
    id: 'fact-game-drives',
    kind: 'fact',
    title: 'Game drives. At university.',
    body: 'Mandela University offers game drives in a 4x4 on its own campus reserve — something no other South African university can offer you.',
    source: SOUTH_CAMPUS,
  },
  {
    id: 'fact-grysbok-trail',
    kind: 'fact',
    title: 'There is a hiking trail on campus',
    body: 'The 4.8km Grysbok Trail starts at the Biological Sciences parking area on South Campus. Free, and open to you between lectures.',
    source: SOUTH_CAMPUS,
  },
  {
    id: 'fact-wildlife-count',
    kind: 'fact',
    title: 'You share campus with springbok',
    body: 'The campus reserve supports 22 mammal species (springbok among them), 16 reptile species, four amphibian species and 66 bird species.',
    source: SOUTH_CAMPUS,
  },
  {
    id: 'fact-electron-microscope',
    kind: 'fact',
    title: 'A microscope found nowhere else in Africa',
    body: 'The campus microscopy centre runs four state-of-the-art electron microscopes, including the only double aberration corrected transmission electron microscope on the African continent.',
    source: SOUTH_CAMPUS,
  },
  {
    id: 'fact-ocean-sciences',
    kind: 'fact',
    title: 'A first for the country',
    body: 'The Ocean Sciences Campus opened in September 2017 as the country’s first dedicated ocean sciences campus. It sits across the road from North Campus.',
    source: CAMPUS_SOURCE('/Ocean-Sciences-Campus', 'Mandela University — Ocean Sciences Campus'),
  },
  {
    id: 'fact-renamed-2017',
    kind: 'fact',
    title: 'The name is newer than you think',
    body: 'On 20 July 2017 Nelson Mandela Metropolitan University was officially renamed Nelson Mandela University, dropping "Metropolitan" after twelve years.',
    source: TIMELINE_SOURCE,
  },
  {
    id: 'fact-merger-2005',
    kind: 'fact',
    title: 'Three institutions became one',
    body: 'The university opened on 1 January 2005, formed by merging PE Technikon, the University of Port Elizabeth, and the Port Elizabeth campus of Vista University.',
    source: TIMELINE_SOURCE,
  },
  {
    id: 'fact-art-school-1882',
    kind: 'fact',
    title: 'Part of your university is 140+ years old',
    body: 'One root of the university is the PE Art School, founded in 1882 — the oldest art school in the country.',
    source: TIMELINE_SOURCE,
  },
  {
    id: 'fact-upe-1964',
    kind: 'fact',
    title: 'A first, back in 1964',
    body: 'The University of Port Elizabeth came into being on 31 January 1964 as the country’s first dual-medium residential university.',
    source: TIMELINE_SOURCE,
  },
  {
    id: 'fact-seven-campuses',
    kind: 'fact',
    title: 'Seven campuses',
    body: 'The university spans seven campuses: South, North, Second Avenue, Bird Street, Missionvale, Ocean Sciences, and George.',
    source: CAMPUS_SOURCE('', 'Mandela University — Campuses'),
  },
];

export const TIPS: TipReward[] = [
  {
    id: 'tip-ask-early',
    kind: 'tip',
    title: 'Ask before you are behind',
    body: 'Your first semester can be overwhelming. Don’t wait until exams to ask for academic support — the students who do best are usually the ones who asked first, not the ones who struggled quietly.',
    source: {
      label: 'Learning Development — Student Success Coaching',
      url: 'https://ld.mandela.ac.za/Student-Success-Coaching',
    },
  },
  {
    id: 'tip-counselling-is-free',
    kind: 'tip',
    title: 'Counselling is free and confidential',
    body: 'Emthonjeni Student Wellness is there for the academic stuff and the personal stuff. You do not need to be in crisis to book — "I am not coping" is a complete reason.',
    source: {
      label: 'Emthonjeni Student Wellness',
      url: 'https://counselling.mandela.ac.za/',
    },
  },
  {
    id: 'tip-supplemental-instruction',
    kind: 'tip',
    title: 'Supplemental Instruction is not remedial',
    body: 'SI sessions run for the modules most students find hardest, led by students who already passed them. Going does not mean you are failing — it usually means you will not.',
    source: {
      label: 'Mandela University — Students',
      url: 'https://www.mandela.ac.za/Students.aspx',
    },
  },
  {
    id: 'tip-know-your-lecturer',
    kind: 'tip',
    title: 'Learn one lecturer’s name properly',
    body: 'Go to one consultation in the first month, even with nothing wrong. When something does go wrong later, you will be a person to them and not a student number.',
  },
  {
    id: 'tip-funda-daily',
    kind: 'tip',
    title: 'Open Funda every day',
    body: 'Most things that catch first-years out — a moved test, a changed venue, an extra submission — were posted on Funda days earlier. Ten seconds a day is the whole trick.',
  },
  {
    id: 'tip-first-test-is-feedback',
    kind: 'tip',
    title: 'Your first test is information, not a verdict',
    body: 'A bad first mark is the cheapest feedback you will ever get. Take it to a success coach while the semester is still long enough to act on it.',
    source: {
      label: 'Learning Development — Student Success Coaching',
      url: 'https://ld.mandela.ac.za/Student-Success-Coaching',
    },
  },
  {
    id: 'tip-find-your-people',
    kind: 'tip',
    title: 'One study partner beats ten study apps',
    body: 'Swap numbers with someone in each module in the first two weeks. Missing a lecture stops being a disaster the moment one person will tell you what happened.',
  },
];

// Meet a Madibaz — intentionally empty.
//
// These cards make claims about real, named graduates. Writing plausible-sounding ones would put
// invented careers in front of students under the university's name, so entries are only added from
// a public page that can be linked. Add them here with a working `source` and they appear in the
// arcade automatically; until then the picker simply never offers this kind, and the Fact Vault
// shows the category as "coming soon" rather than as something the student has failed to unlock.
//
// Good places to source them: the university's alumni pages, graduation coverage on
// news.mandela.ac.za, or a graduate who has agreed in writing to be featured.
export const MADIBAZ: MadibazReward[] = [];

export const ALL_REWARDS: Reward[] = [...FACTS, ...TIPS, ...MADIBAZ];

export const rewardById = (id: string): Reward | undefined =>
  ALL_REWARDS.find((reward) => reward.id === id);

// How many of each kind exist, for the vault's "3 of 11" counters.
export const poolSize = (kind: RewardKind) =>
  ALL_REWARDS.filter((reward) => reward.kind === kind).length;
