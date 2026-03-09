/**
 * Route matcher for Radar Operativo
 * Matches service origin/destination to highway corridors and dead zones
 * Supports multi-corridor chaining via BFS for long-distance routes
 */

import { HIGHWAY_CORRIDORS, HighwayCorridor } from '@/lib/security/highwayCorridors';
import { CELLULAR_DEAD_ZONES, CellularDeadZone } from '@/lib/security/cellularCoverage';
import { CIUDADES_PRINCIPALES, extraerCiudad } from '@/utils/geografico';

export interface MatchedRoute {
  corridorIds: string[];
  corridorName: string;
  riskLevel: string;
  /** Merged waypoints [lng, lat] across all chained corridors */
  waypoints: [number, number][];
  /** Dead zones crossing all chained corridors */
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

/* ───────── Corridor Adjacency Graph ───────── */

const ADJACENCY_THRESHOLD_KM = 50;

interface CorridorEndpoints {
  corridor: HighwayCorridor;
  first: [number, number];
  last: [number, number];
}

function getEndpoints(c: HighwayCorridor): CorridorEndpoints {
  return {
    corridor: c,
    first: c.waypoints[0],
    last: c.waypoints[c.waypoints.length - 1],
  };
}

/**
 * Build adjacency list: corridors are neighbors if an endpoint of one
 * is within ADJACENCY_THRESHOLD_KM of an endpoint of the other.
 */
function buildAdjacency(): Map<string, string[]> {
  const endpoints = HIGHWAY_CORRIDORS.filter(c => c.waypoints.length >= 2).map(getEndpoints);
  const adj = new Map<string, string[]>();

  for (const ep of endpoints) {
    adj.set(ep.corridor.id, []);
  }

  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      const a = endpoints[i];
      const b = endpoints[j];
      // Check all 4 endpoint combinations
      const dists = [
        haversineKm(a.first, b.first),
        haversineKm(a.first, b.last),
        haversineKm(a.last, b.first),
        haversineKm(a.last, b.last),
      ];
      if (Math.min(...dists) <= ADJACENCY_THRESHOLD_KM) {
        adj.get(a.corridor.id)!.push(b.corridor.id);
        adj.get(b.corridor.id)!.push(a.corridor.id);
      }
    }
  }
  return adj;
}

// Lazy singleton
let _adjacency: Map<string, string[]> | null = null;
function getAdjacency() {
  if (!_adjacency) _adjacency = buildAdjacency();
  return _adjacency;
}

/**
 * BFS to find shortest corridor chain from startId to endId.
 * Returns array of corridor IDs or null.
 */
function bfsCorridorChain(startId: string, endId: string): string[] | null {
  if (startId === endId) return [startId];
  const adj = getAdjacency();
  const visited = new Set<string>([startId]);
  const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    for (const neighbor of adj.get(id) || []) {
      if (visited.has(neighbor)) continue;
      const newPath = [...path, neighbor];
      if (neighbor === endId) return newPath;
      visited.add(neighbor);
      queue.push({ id: neighbor, path: newPath });
    }
  }
  return null;
}

/**
 * Orient a corridor's waypoints so the first waypoint is closest to `nearPoint`.
 */
function orientWaypoints(wp: [number, number][], nearPoint: [number, number]): [number, number][] {
  if (wp.length < 2) return wp;
  const dFirst = haversineKm(nearPoint, wp[0]);
  const dLast = haversineKm(nearPoint, wp[wp.length - 1]);
  return dLast < dFirst ? [...wp].reverse() : [...wp];
}

/**
 * Merge waypoints from a chain of corridors, removing near-duplicate junction points.
 */
function mergeChainWaypoints(
  corridorIds: string[],
  origenCoords: [number, number],
): [number, number][] {
  const corridorMap = new Map(HIGHWAY_CORRIDORS.map(c => [c.id, c]));
  if (corridorIds.length === 0) return [];

  // Orient the first corridor towards the origin
  const first = corridorMap.get(corridorIds[0])!;
  let merged = orientWaypoints([...first.waypoints], origenCoords);

  for (let i = 1; i < corridorIds.length; i++) {
    const c = corridorMap.get(corridorIds[i])!;
    // Orient this corridor so its start is near the end of the current merged path
    const lastPoint = merged[merged.length - 1];
    const oriented = orientWaypoints([...c.waypoints], lastPoint);

    // Skip the first point if it's very close to the last merged point (junction)
    const startIdx = haversineKm(lastPoint, oriented[0]) < ADJACENCY_THRESHOLD_KM ? 1 : 0;
    merged = [...merged, ...oriented.slice(startIdx)];
  }

  return merged;
}

/* ───────── Public API ───────── */

const ENDPOINT_THRESHOLD_KM = 80;

/**
 * Find the best corridor whose endpoint is closest to a given point.
 * Returns corridor ID and distance, or null.
 */
function findClosestCorridor(point: [number, number]): { id: string; dist: number } | null {
  let best: { id: string; dist: number } | null = null;
  for (const c of HIGHWAY_CORRIDORS) {
    if (c.waypoints.length < 2) continue;
    const dFirst = haversineKm(point, c.waypoints[0]);
    const dLast = haversineKm(point, c.waypoints[c.waypoints.length - 1]);
    const d = Math.min(dFirst, dLast);
    if (d < ENDPOINT_THRESHOLD_KM && (!best || d < best.dist)) {
      best = { id: c.id, dist: d };
    }
  }
  return best;
}

const RISK_PRIORITY: Record<string, number> = { extremo: 3, alto: 2, medio: 1, bajo: 0 };

/**
 * Match origin/destination to a chain of highway corridors.
 * Returns merged waypoints across all corridors in the chain.
 */
export function matchRoute(origen: string, destino: string): MatchedRoute | null {
  const origenKey = extraerCiudad(origen);
  const destinoKey = extraerCiudad(destino);
  if (!origenKey || !destinoKey) return null;

  const origenCoords = getCityCoords(origenKey);
  const destinoCoords = getCityCoords(destinoKey);
  if (!origenCoords || !destinoCoords) return null;

  const startCorridor = findClosestCorridor(origenCoords);
  const endCorridor = findClosestCorridor(destinoCoords);
  if (!startCorridor || !endCorridor) return null;

  // Try BFS chain
  const chain = bfsCorridorChain(startCorridor.id, endCorridor.id);
  if (!chain || chain.length === 0) return null;

  const corridorMap = new Map(HIGHWAY_CORRIDORS.map(c => [c.id, c]));

  // Merge waypoints
  const waypoints = mergeChainWaypoints(chain, origenCoords);

  // Highest risk level in chain
  const highestRisk = chain.reduce((max, id) => {
    const c = corridorMap.get(id)!;
    return (RISK_PRIORITY[c.riskLevel] || 0) > (RISK_PRIORITY[max] || 0) ? c.riskLevel : max;
  }, 'bajo');

  // Corridor name
  const corridorName = chain.length === 1
    ? corridorMap.get(chain[0])!.name
    : `${corridorMap.get(chain[0])!.name} → ... → ${corridorMap.get(chain[chain.length - 1])!.name}`;

  // Dead zones for all corridors in the chain
  const chainSet = new Set(chain);
  const deadZones = CELLULAR_DEAD_ZONES.filter(z => chainSet.has(z.corridorId));

  return {
    corridorIds: chain,
    corridorName,
    riskLevel: highestRisk,
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
  const traveled = [...waypoints.slice(0, nearestIdx + 1), currentPosition];
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
