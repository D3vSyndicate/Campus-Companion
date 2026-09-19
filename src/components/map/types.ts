import type { StyleProp, ViewStyle } from 'react-native';
import type { CampusId, CampusPlace } from '../../data/campus';

export type MapTheme = 'light' | 'dark';

// Everything the screen can ask the map to do.
export type CampusMapHandle = {
  focusPlace: (id: string) => void;
  showCampus: (id: CampusId) => void;
  showRoute: (coords: [number, number][]) => void;
  clearRoute: () => void;
  // Only show these pins (null shows all).
  setVisible: (ids: string[] | null) => void;
  // Space covered by overlays, so pins and routes stay clear of them.
  setInsets: (top: number, bottom: number) => void;
  zoom: (delta: number) => void;
  clearSelection: () => void;
  // Zoom out so every place on both campuses is in view.
  fitAll: () => void;
};

export type CampusMapProps = {
  places: CampusPlace[];
  theme: MapTheme;
  initialCampus: CampusId;
  onSelect: (id: string) => void;
  onBlank: () => void;
  // 'offline' means the map library or tiles could not load; the list still works.
  onStatus?: (status: 'ready' | 'offline') => void;
  style?: StyleProp<ViewStyle>;
};

// Messages that the page inside the map sends back.
export type MapEvent =
  | { type: 'ready' }
  | { type: 'status'; value: 'offline' }
  | { type: 'select'; id: string }
  | { type: 'blank' };

// Commands sent to the page.
export type MapCommand =
  | { cmd: 'theme'; value: MapTheme }
  | { cmd: 'campus'; id: CampusId }
  | { cmd: 'focus'; id: string }
  | { cmd: 'clear' }
  | { cmd: 'places'; places: CampusPlace[] }
  | { cmd: 'visible'; ids: string[] | null }
  | { cmd: 'route'; coords: [number, number][] }
  | { cmd: 'clearRoute' }
  | { cmd: 'insets'; top: number; bottom: number }
  | { cmd: 'zoom'; delta: number }
  | { cmd: 'fitAll' };
