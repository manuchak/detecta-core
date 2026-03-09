/**
 * Route matcher for Radar Operativo
 * Matches service origin/destination to highway corridors and dead zones
 */

import { HIGHWAY_CORRIDORS, HighwayCorridor } from '@/lib/security/highwayCorridors';
import { CELLULAR_DEAD_ZONES, CellularDeadZone } from '@/lib/security/cellularCoverage';
import { CIUDADES_PRINCIPALES, extraerCiudad } from '@/utils/geografico';

export interface MatchedRoute {
  corridorId: string;
  corridorName: string;
  riskLevel: string;
  /** Full corridor waypoints [lng, lat] */
  waypoints: [number, number][];
  /** Dead zones crossing this corridor */
  deadZones: CellularDeadZone[];
}

/**
 * Haversine distance in km between two [lng, lat] points
 */
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Get [lng, lat] for a city key from CIUDADES_PRINCIPALES
 */
function getCityCoords(cityKey: string): [number, number] | null {
  const info = CIUDADES_PRINCIPALES[cityKey as keyof typeof CIUDADES_PRINCIPALES];
  if (!info) return null;
  return [info.lng, info.lat];
}

/**
 * Find the closest waypoint index in a corridor to a given point
 */
export function findNearestWaypointIndex(point: [number, number], waypoints: [number, number][]): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const d = haversineKm(point, waypoints[i]);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

/**
 * Match origin/destination strings to the best highway corridor.
 * Returns null if no corridor is close enough (threshold: 80km from endpoints).
 */
export function matchRoute(origen: string, destino: string): MatchedRoute | null {
  const origenKey = extraerCiudad(origen);
  const destinoKey = extraerCiudad(destino);
  if (!origenKey || !destinoKey) return null;

  const origenCoords = getCityCoords(origenKey);
  const destinoCoords = getCityCoords(destinoKey);
  if (!origenCoords || !destinoCoords) return null;

  const THRESHOLD_KM = 80;
  let bestCorridor: HighwayCorridor | null = null;
  let bestScore = Infinity;

  for (const corridor of HIGHWAY_CORRIDORS) {
    if (corridor.waypoints.length < 2) continue;

    const first = corridor.waypoints[0];
    const last = corridor.waypoints[corridor.waypoints.length - 1];

    // Try both directions
    const distA = haversineKm(origenCoords, first) + haversineKm(destinoCoords, last);
    const distB = haversineKm(origenCoords, last) + haversineKm(destinoCoords, first);
    const score = Math.min(distA, distB);

    if (score < bestScore && score < THRESHOLD_KM * 2) {
      bestScore = score;
      bestCorridor = corridor;
    }
  }

  if (!bestCorridor) return null;

  // Determine if we need to reverse waypoints (destination closer to first waypoint)
  const first = bestCorridor.waypoints[0];
  const last = bestCorridor.waypoints[bestCorridor.waypoints.length - 1];
  const needsReverse = haversineKm(origenCoords, last) < haversineKm(origenCoords, first);
  const waypoints = needsReverse ? [...bestCorridor.waypoints].reverse() : bestCorridor.waypoints;

  // Get dead zones for this corridor
  const deadZones = CELLULAR_DEAD_ZONES.filter(z => z.corridorId === bestCorridor!.id);

  return {
    corridorId: bestCorridor.id,
    corridorName: bestCorridor.name,
    riskLevel: bestCorridor.riskLevel,
    waypoints,
    deadZones,
  };
}

/**
 * Given current GPS position, split route waypoints into traveled and remaining segments.
 */
export function splitRouteAtPosition(
  waypoints: [number, number][],
  currentPosition: [number, number]
): { traveled: [number, number][]; remaining: [number, number][] } {
  if (waypoints.length === 0) {
    return { traveled: [], remaining: [] };
  }

  const nearestIdx = findNearestWaypointIndex(currentPosition, waypoints);

  // Traveled: from start up to and including the nearest waypoint, plus the current position
  const traveled = [...waypoints.slice(0, nearestIdx + 1), currentPosition];
  // Remaining: from current position to the end
  const remaining = [currentPosition, ...waypoints.slice(nearestIdx + 1)];

  return { traveled, remaining };
}

/**
 * Geocode a destination string to [lng, lat] using CIUDADES_PRINCIPALES
 */
export function geocodeDestino(destino: string): { lat: number; lng: number } | null {
  if (!destino) return null;
  const key = extraerCiudad(destino);
  if (!key) return null;
  const info = CIUDADES_PRINCIPALES[key as keyof typeof CIUDADES_PRINCIPALES];
  if (!info) return null;
  return { lat: info.lat, lng: info.lng };
}
