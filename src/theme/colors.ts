// Keep the accent (#F8A705) used sparingly — buttons, active states, small
// highlights — not as a background fill. Backgrounds and text carry the
// #071B2C / white contrast instead.

export type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  danger: string;
  headerBackground: string;
  headerText: string;
};

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#F6F7F8',
  surfaceMuted: '#EEF3F9',
  text: '#071B2C',
  textSecondary: '#5B6B76',
  border: '#E4E7EA',
  accent: '#F8A705',
  danger: '#D64545',
  headerBackground: '#FFFFFF',
  headerText: '#071B2C',
};

export const darkColors: ThemeColors = {
  background: '#071B2C',
  surface: '#0E2A40',
  card: '#0E2A40',
  surfaceMuted: '#16374D',
  text: '#FFFFFF',
  textSecondary: '#9FB3C1',
  border: '#16374D',
  accent: '#F8A705',
  danger: '#FF6B6B',
  headerBackground: '#071B2C',
  headerText: '#FFFFFF',
};
