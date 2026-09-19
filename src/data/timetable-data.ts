// First-year lecture timetable — mock data.
//
// Transcribed from the printed School of IT timetable. Hardcoded on purpose: it ships with the app
// and needs no database.
//
// The printed grid's 14 periods:
//   1  07:45-08:20    6  11:00-11:35   11  14:25-15:00
//   2  08:20-08:55    7  11:45-12:20   12  15:00-15:35
//   3  09:05-09:40    8  12:20-12:55   13  15:45-16:20
//   4  09:40-10:15    9  13:05-13:40   14  16:20-16:55
//   5  10:25-11:00   10  13:40-14:15
//
// WHAT IS MISSING: there is no Friday. No Friday sheet was supplied and inventing one would put
// students in the wrong room, so Friday is left empty and the calendar says so plainly rather than
// showing an empty day that looks like a day off.

export interface TimetableSlot {
  id: string;
  // The printed grid's row label.
  stream: string;
  // 1 = Monday ... 5 = Friday.
  weekday: number;
  start: string; // HH:MM
  end: string;
  moduleCode: string;
  activity: string; // LECT, PRAC, TUT, TEST
  venue: string;
}

const slot = (
  id: string,
  stream: string,
  weekday: number,
  start: string,
  end: string,
  moduleCode: string,
  activity: string,
  venue: string,
): TimetableSlot => ({ id, stream, weekday, start, end, moduleCode, activity, venue });

const DIPLOMA_LABS = 'LAB M104, R128, R226, R126, M119';
const WCI_LABS = 'LAB R126, R128, R226, R227, M104';
const FOUNDATION = 'ONT1030/SDS1010';
const SYSTEMS = 'ITS1110/ITS1010/SIS1000/SIS1010';

export const TIMETABLE_SLOTS: TimetableSlot[] = [
  // --- Monday -------------------------------------------------------------
  slot('mon-1', 'DIP SD 1st', 1, '07:45', '08:55', FOUNDATION, 'PRAC', DIPLOMA_LABS),
  slot('mon-2', 'DIP CN 1st', 1, '07:45', '08:55', FOUNDATION, 'PRAC', DIPLOMA_LABS),
  slot('mon-3', 'DIP SS 1st', 1, '07:45', '08:55', FOUNDATION, 'PRAC', DIPLOMA_LABS),
  slot('mon-4', 'DIP SD 1st', 1, '09:05', '10:15', FOUNDATION, 'PRAC', DIPLOMA_LABS),
  slot('mon-5', 'DIP CN 1st', 1, '09:05', '10:15', FOUNDATION, 'PRAC', DIPLOMA_LABS),
  slot('mon-6', 'DIP SS 1st', 1, '09:05', '10:15', FOUNDATION, 'PRAC', DIPLOMA_LABS),
  slot('mon-7', 'DIP SD 1st', 1, '10:25', '11:35', 'WCI1010', 'PRAC', WCI_LABS),
  slot('mon-8', 'DIP CN 1st', 1, '10:25', '11:35', 'WCI1010', 'PRAC', WCI_LABS),
  slot('mon-9', 'DIP SS 1st', 1, '10:25', '11:35', 'WCI1010', 'PRAC', WCI_LABS),
  slot('mon-10', 'DIP SD 1st', 1, '11:45', '12:55', 'WCI1010', 'PRAC', WCI_LABS),
  slot('mon-11', 'DIP CN 1st', 1, '11:45', '12:55', 'WCI1010', 'PRAC', WCI_LABS),
  slot('mon-12', 'DIP SS 1st', 1, '11:45', '12:55', 'WCI1010', 'PRAC', WCI_LABS),
  slot('mon-13', 'DIP SD 1st', 1, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119'),
  slot('mon-14', 'DIP CN 1st', 1, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119'),
  slot('mon-15', 'DIP SS 1st', 1, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB R128, M119'),
  slot('mon-16', 'DIP SD 1st', 1, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230'),
  slot('mon-17', 'DIP CN 1st', 1, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230'),
  slot('mon-18', 'DIP SS 1st', 1, '14:25', '15:35', 'WIH1040', 'PRAC', 'LAB R128, M119, R230'),
  slot('mon-19', 'BIT 1st', 1, '07:45', '08:55', 'MABN112', 'LECT', 'J018'),
  slot('mon-20', 'BIT 1st', 1, '10:25', '11:35', 'ITPP100', 'LECT', 'J018'),
  slot('mon-21', 'BIT 1st', 1, '13:05', '14:15', 'IITP102', 'PRAC', 'M104'),

  // --- Tuesday ------------------------------------------------------------
  slot('tue-1', 'DIP SD 1st', 2, '07:45', '08:55', 'WCI1010', 'LECT', 'N2'),
  slot('tue-2', 'DIP SD 1st', 2, '11:45', '12:55', FOUNDATION, 'TUT', 'N2'),
  slot('tue-3', 'DIP CN 1st', 2, '09:05', '10:15', FOUNDATION, 'TUT', 'N2'),
  slot('tue-4', 'DIP CN 1st', 2, '10:25', '11:35', 'WCI1010', 'LECT', 'Newtonian 10'),
  slot('tue-5', 'DIP SS 1st', 2, '10:25', '11:35', FOUNDATION, 'TUT', 'N2'),
  slot('tue-6', 'DIP SS 1st', 2, '11:45', '12:55', 'WCI1010', 'LECT', 'Newtonian 10'),
  slot('tue-7', 'DIP SD 1st', 2, '14:25', '15:35', 'Tests', 'TEST', ''),
  slot('tue-8', 'DIP CN 1st', 2, '14:25', '15:35', 'Tests', 'TEST', ''),
  slot('tue-9', 'DIP SS 1st', 2, '14:25', '15:35', 'Tests', 'TEST', ''),
  slot('tue-10', 'BIT 1st', 2, '09:05', '10:15', 'IITP102', 'PRAC', 'LAB R128'),
  slot('tue-11', 'BIT 1st', 2, '13:05', '14:15', 'WRAV102', 'LECT', 'M154'),

  // --- Wednesday ----------------------------------------------------------
  slot('wed-1', 'DIP SD 1st', 3, '07:45', '10:15', FOUNDATION, 'PRAC', 'R128, R126'),
  slot('wed-2', 'DIP CN 1st', 3, '07:45', '10:15', FOUNDATION, 'PRAC', 'R128, R126'),
  slot('wed-3', 'DIP SS 1st', 3, '07:45', '10:15', FOUNDATION, 'PRAC', 'R128, R126'),
  slot('wed-4', 'DIP SD 1st', 3, '10:25', '11:35', SYSTEMS, 'LECT', 'N2'),
  slot('wed-5', 'DIP CN 1st', 3, '11:45', '12:55', SYSTEMS, 'LECT', 'N2'),
  slot('wed-6', 'DIP SD 1st', 3, '13:05', '14:15', SYSTEMS, 'PRAC', 'LAB M004, R230'),
  slot('wed-7', 'DIP CN 1st', 3, '13:05', '14:15', SYSTEMS, 'PRAC', 'LAB M004, R230'),
  slot('wed-8', 'DIP SS 1st', 3, '13:05', '14:15', SYSTEMS, 'PRAC', 'LAB M004, R230'),
  slot('wed-9', 'BIT 1st', 3, '07:45', '08:55', 'ICNF102', 'PRAC', 'LAB M104'),
  slot('wed-10', 'BIT 1st', 3, '10:25', '11:35', 'WRAV102', 'LECT', 'South 127_0_0018'),
  slot('wed-11', 'BIT 1st', 3, '13:05', '14:15', 'WRAV102', 'PRAC', 'South Campus lab 4'),

  // --- Thursday -----------------------------------------------------------
  slot('thu-1', 'DIP SD 1st', 4, '09:05', '10:15', 'WCI1010', 'TUT', 'N1'),
  slot('thu-2', 'DIP SD 1st', 4, '11:45', '12:55', FOUNDATION, 'TUT', 'Mapungubwe 003'),
  slot('thu-3', 'DIP SD 1st', 4, '13:05', '14:15', 'WIH1040', 'PRAC', 'LAB M119, R128'),
  slot('thu-4', 'DIP CN 1st', 4, '09:05', '10:15', FOUNDATION, 'TUT', 'M154'),
  slot('thu-5', 'DIP CN 1st', 4, '10:25', '11:35', 'WCI1010', 'TUT', 'N1'),
  slot('thu-6', 'DIP CN 1st', 4, '11:45', '12:55', 'WIH1040', 'PRAC', 'LAB M104, M119'),
  slot('thu-7', 'DIP SS 1st', 4, '07:45', '08:55', 'WCI1010', 'TUT', 'N1'),
  slot('thu-8', 'DIP SS 1st', 4, '10:25', '11:35', FOUNDATION, 'TUT', 'Mapungubwe 003'),
  slot('thu-9', 'DIP SS 1st', 4, '11:45', '12:55', 'WIH1040', 'PRAC', 'LAB M104, M119'),
  slot('thu-10', 'BIT 1st', 4, '07:45', '08:55', 'MABN112', 'LECT', 'N2'),
  slot('thu-11', 'BIT 1st', 4, '09:05', '10:15', 'IITP102', 'LECT', 'M222'),
  slot('thu-12', 'BIT 1st', 4, '10:25', '11:35', 'STAV102', 'PRAC', '35 00 40'),

  // --- Friday: not supplied. See the note at the top of this file. ---------
];

// The class groups a student can pick from, read off the data rather than listed separately so the
// two can never disagree.
export const STREAMS: string[] = [...new Set(TIMETABLE_SLOTS.map((s) => s.stream))].sort();

// Weekdays with no teaching loaded at all. The calendar uses this to say "we do not have Friday"
// instead of showing a blank day that reads like a day off.
export const WEEKDAYS_WITHOUT_DATA: number[] = [1, 2, 3, 4, 5].filter(
  (day) => !TIMETABLE_SLOTS.some((s) => s.weekday === day),
);

export const slotsForStream = (stream: string | null): TimetableSlot[] =>
  stream ? TIMETABLE_SLOTS.filter((s) => s.stream === stream) : [];
