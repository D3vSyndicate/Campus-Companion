import i18n from '../i18n';

// Weekday and month names in the student's language. Dates are written by hand on purpose, so they
// look the same on every phone; only the words change with the language.
const EN = {
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
} as const;

type Group = keyof typeof EN;

const word = (group: Group, index: number) => i18n.t(`date.${group}.${index}`, { defaultValue: EN[group][index] ?? '' });

export const weekdayShort = (index: number) => word('weekdaysShort', index);
export const weekdayLong = (index: number) => word('weekdaysLong', index);
export const monthShort = (index: number) => word('monthsShort', index);
export const monthLong = (index: number) => word('monthsLong', index);

// Thu 4 Feb
export const shortDate = (date: Date) => `${weekdayShort(date.getDay())} ${date.getDate()} ${monthShort(date.getMonth())}`;
