import { useCallback, useEffect, useState } from 'react';
import { mapEvent, venueLookup } from '../components/EventsList';
import { useAuth } from '../context/AuthContext';
import { fetchWithOfflineFallback } from './offlineData';
import { readPersonalEntries, type PersonalEntry } from './personalEntries';
import {
  STREAMS,
  WEEKDAYS_WITHOUT_DATA,
  slotsForStream,
  type TimetableSlot,
} from '../data/timetable-data';
import i18n from '../i18n';

// Everything a student has on, in one place: orientation sessions, lectures, campus events and
// whatever they added themselves.
//
// The distinction that drives the colours is compulsory vs optional. Orientation and lectures are
// expected of a first-year; campus events are an invitation, not an obligation, which is why they
// are yellow and why nothing here ever schedules a notification. The calendar tells a student when
// things are — it does not nag them.

export type EntryKind = 'orientation' | 'timetable' | 'event' | 'personal';

export interface CalendarEntry {
  id: string;
  kind: EntryKind;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM, '' when no time is set
  end: string;
  venue: string;
  detail: string;
  // For a campus event: the event's own id, which is what a pin is stored against.
  sourceId?: string;
}

// The wording here is doing real work. A first-year opening a full calendar is often already
// anxious, so the labels say what something is worth rather than issuing instructions —
// "Worth being there" instead of "COMPULSORY", "Come if you can" instead of "Optional". The
// colours carry the same distinction without anyone having to be told off by their own phone.
export const ENTRY_KINDS: Record<
  EntryKind,
  // label and note are locale keys; the screen translates them when it draws.
  { label: string; note: string; compulsory: boolean; color: string; icon: string }
> = {
  orientation: {
    label: 'schedule.tabOrientation',
    note: 'cal.kind.orientation.note',
    compulsory: true,
    color: '#0B4F9E',
    icon: 'school-outline',
  },
  timetable: {
    label: 'cal.kind.timetable.label',
    note: 'cal.kind.orientation.note',
    compulsory: true,
    color: '#1F7A5A',
    icon: 'book-outline',
  },
  // Yellow reads as "you are welcome", not "you are required".
  event: {
    label: 'common.eventsTitle',
    note: 'cal.kind.event.note',
    compulsory: false,
    color: '#F8A705',
    icon: 'megaphone-outline',
  },
  personal: {
    label: 'cal.kind.personal.label',
    note: 'cal.kind.personal.note',
    compulsory: false,
    color: '#7A4FBF',
    icon: 'person-outline',
  },
};

// Sits under the legend. The point of the whole colour scheme, said kindly and once.
// (This is a locale key, not the words: the screen translates it when it draws.)
export const LEGEND_BLURB = 'cal.blurb';

// -----------------------------------------------------------------------------
// Dates
// -----------------------------------------------------------------------------

export const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const todayIso = () => toIso(new Date());

// JS Date gives Sunday = 0; the timetable's weekdays are Monday = 1 ... Sunday = 7.
const isoWeekday = (date: Date) => date.getDay() || 7;

// Every date in a month, plus the leading/trailing blanks that make the grid start on a Monday.
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = isoWeekday(first) - 1;

  const cells: (string | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(toIso(new Date(year, month, day)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// -----------------------------------------------------------------------------
// Building entries
// -----------------------------------------------------------------------------

const str = (value: unknown) => String(value ?? '').trim();

// A weekly timetable slot becomes one entry per matching weekday in the month being shown. Term
// dates are not modelled anywhere yet, so a lecture appears on every matching weekday — including
// during a recess. Worth fixing once term dates exist.
function expandTimetable(slots: TimetableSlot[], year: number, month: number): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const weekday = isoWeekday(date);
    const iso = toIso(date);

    for (const slot of slots) {
      if (slot.weekday !== weekday) continue;
      entries.push({
        id: `${slot.id}-${iso}`,
        kind: 'timetable',
        title: slot.moduleCode,
        date: iso,
        start: slot.start,
        end: slot.end,
        venue: slot.venue,
        detail: [slot.activity, slot.stream].filter(Boolean).join(' · '),
      });
    }
  }
  return entries;
}

const personalToEntry = (entry: PersonalEntry): CalendarEntry => ({
  id: entry.id,
  kind: 'personal',
  title: entry.title,
  date: entry.date,
  start: entry.start,
  end: entry.end,
  venue: entry.venue,
  detail: i18n.t('cal.addedByYou'),
});

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export interface CalendarData {
  loading: boolean;
  byDate: Map<string, CalendarEntry[]>;
  streams: string[];
  // Weekdays (1-7) the timetable has no rows for at all, so the screen can say the data is missing
  // rather than implying the student is free.
  uncoveredWeekdays: number[];
  // Campus events the student has not pinned, by day. They are offered under the day, not on the grid.
  otherByDate: Map<string, CalendarEntry[]>;
  // The next few things coming up, from now on.
  upNext: CalendarEntry[];
  refreshPersonal: () => Promise<void>;
}

export function useCalendar(year: number, month: number, stream: string | null, pinned: ReadonlySet<string>): CalendarData {
  const { user } = useAuth();
  const userId = user?.id;

  const [fixed, setFixed] = useState<CalendarEntry[]>([]);
  const [personal, setPersonal] = useState<PersonalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Orientation, events and the timetable are fetched once; only the month-expansion below depends
  // on which month is showing.
  useEffect(() => {
    let active = true;
    void (async () => {
      const [scheduleResult, venueResult, eventResult] = await Promise.all([
        fetchWithOfflineFallback('schedule_items'),
        fetchWithOfflineFallback('Venue'),
        fetchWithOfflineFallback('event'),
      ]);

      const venues = new Map(
        (Array.isArray(venueResult.data) ? venueResult.data : []).map((row: Record<string, unknown>) => [
          str(row.venue_id),
          row,
        ]),
      );

      const orientation: CalendarEntry[] = (
        Array.isArray(scheduleResult.data) ? (scheduleResult.data as Record<string, unknown>[]) : []
      )
        .map((item, index) => {
          const venue = venues.get(str(item.venue_id)) as Record<string, unknown> | undefined;
          return {
            id: `orientation-${str(item.id) || str(item.schedule_id) || index}`,
            kind: 'orientation' as const,
            title: str(item.title),
            date: str(item.date),
            start: str(item.start_time).slice(0, 5),
            end: str(item.end_time).slice(0, 5),
            venue: [venue?.venue_name, venue?.room_number].filter(Boolean).join(' · ') || str(item.venue),
            detail: str(item.description),
          };
        })
        .filter((entry) => entry.title && entry.date);

      const lookup = venueLookup(venueResult.data);
      const events: CalendarEntry[] = (
        Array.isArray(eventResult.data) ? (eventResult.data as Record<string, unknown>[]) : []
      )
        .map((row) => mapEvent(row, lookup))
        .filter((event): event is NonNullable<typeof event> => event !== null)
        .filter((event) => event.date)
        .map((event) => ({
          id: `event-${event.id}`,
          sourceId: event.id,
          kind: 'event' as const,
          title: event.title,
          date: event.date,
          start: event.start,
          end: event.end,
          venue: [event.venue, event.room].filter(Boolean).join(' · '),
          detail: event.organizer || event.category,
        }));

      if (!active) return;
      setFixed([...orientation, ...events]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshPersonal = useCallback(async () => {
    setPersonal(userId ? await readPersonalEntries(userId) : []);
  }, [userId]);

  useEffect(() => {
    void refreshPersonal();
  }, [refreshPersonal]);

  const streamSlots = slotsForStream(stream);

  // Orientation, lectures and the student's own plans are always on the calendar. A campus event is an
  // invitation, so it only goes on once they pin it.
  const isShown = (entry: CalendarEntry) => entry.kind !== 'event' || pinned.has(entry.sourceId ?? '');
  const shownFixed = fixed.filter(isShown);
  const personalEntries = personal.map(personalToEntry);

  const all = [...shownFixed, ...expandTimetable(streamSlots, year, month), ...personalEntries];

  const group = (entries: CalendarEntry[]) => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date);
      if (list) list.push(entry);
      else map.set(entry.date, [entry]);
    }
    // Untimed entries sort last, so a day reads in the order it will actually happen.
    for (const list of map.values()) list.sort((x, y) => (x.start || '99:99').localeCompare(y.start || '99:99'));
    return map;
  };

  const byDate = group(all);
  const otherByDate = group(fixed.filter((entry) => !isShown(entry)));

  const now = new Date();
  const today = toIso(now);
  const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const upNext = [
    ...shownFixed,
    ...personalEntries,
    ...expandTimetable(streamSlots, now.getFullYear(), now.getMonth()),
    ...expandTimetable(streamSlots, nextMonth.getFullYear(), nextMonth.getMonth()),
  ]
    .filter((entry) => entry.date > today || (entry.date === today && (entry.end || entry.start || '99:99') >= nowHm))
    .sort((x, y) => `${x.date} ${x.start || '99:99'}`.localeCompare(`${y.date} ${y.start || '99:99'}`))
    .slice(0, 3);

  return {
    loading,
    byDate,
    streams: STREAMS,
    uncoveredWeekdays: WEEKDAYS_WITHOUT_DATA,
    otherByDate,
    upNext,
    refreshPersonal,
  };
}
