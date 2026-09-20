import { distanceMeters } from '../data/campus';
import i18n from '../i18n';

export type LatLng = [number, number];

export type RouteResult = {
  coords: LatLng[];
  distanceM: number;
  steps: string[];
  // True when the routing service could not be reached and this is a straight-line estimate.
  approximate: boolean;
};

// Free walking-route service built on OpenStreetMap footpaths. No key, no account.
const ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

type OsrmStep = { distance: number; name?: string; maneuver: { type: string; modifier?: string } };

function describeStep(step: OsrmStep): string | null {
  const { type, modifier } = step.maneuver;
  const distance = step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`;
  const name = step.name ?? '';

  switch (type) {
    case 'depart':
      return name ? i18n.t('route.startAlong', { name, distance }) : i18n.t('route.start', { distance });
    case 'arrive':
      return i18n.t('route.arrived');
    case 'turn':
    case 'end of road':
    case 'fork':
    case 'on ramp':
    case 'off ramp': {
      const direction = i18n.t(`route.direction.${(modifier ?? 'ahead').replace(' ', '_')}`, { defaultValue: modifier ?? 'ahead' });
      return name ? i18n.t('route.turnOnto', { direction, name, distance }) : i18n.t('route.turn', { direction, distance });
    }
    case 'new name':
    case 'continue':
      return name ? i18n.t('route.keepOn', { name, distance }) : i18n.t('route.keep', { distance });
    default:
      return step.distance > 20 ? i18n.t('route.continue', { distance }) : null;
  }
}

function straightLine(from: LatLng, to: LatLng): RouteResult {
  // Real paths wind a bit, so pad the straight-line distance.
  const distanceM = distanceMeters(from, to) * 1.25;
  return {
    coords: [from, to],
    distanceM,
    steps: [],
    approximate: true,
  };
}

export async function walkingRoute(from: LatLng, to: LatLng): Promise<RouteResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const url = `${ROUTER}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return straightLine(from, to);

    const data = (await response.json()) as {
      code?: string;
      routes?: {
        distance: number;
        geometry: { coordinates: [number, number][] };
        legs: { steps: OsrmStep[] }[];
      }[];
    };
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) return straightLine(from, to);

    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng),
      distanceM: route.distance,
      steps: route.legs
        .flatMap((leg) => leg.steps)
        .map(describeStep)
        .filter((line): line is string => Boolean(line)),
      approximate: false,
    };
  } catch {
    // Offline, blocked, or too slow: still give the student a sense of the distance.
    return straightLine(from, to);
  } finally {
    clearTimeout(timeout);
  }
}

export function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters / 10) * 10} m`;
}
