// Safe Points Route Analysis Helper
// Finds certified safe points near a route for security consultation reports

export interface SafePointForRoute {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  certification_level: 'oro' | 'plata' | 'bronce' | 'precaucion';
  total_score: number;
  distanceFromRouteKm: number;
  kmFromOrigin: number;
  // Security features
  has_24h_security: boolean;
  has_cctv: boolean;
  has_lighting: boolean;
  has_fuel: boolean;
  has_restrooms: boolean;
  has_food: boolean;
}

export interface SafePointInput {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  certification_level: string | null;
  total_score: number | null;
  has_24h_security: boolean | null;
  has_cctv: boolean | null;
  has_lighting: boolean | null;
  has_fuel: boolean | null;
  has_restrooms: boolean | null;
  has_food: boolean | null;
}

// Haversine distance calculation
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

// Find closest point on route to a safe point
function findClosestPointOnRoute(
  safePointLat: number,
  safePointLng: number,
  routeCoordinates: [number, number][]
): { distanceKm: number; closestIndex: number } {
  let minDistance = Infinity;
  let closestIndex = 0;

  routeCoordinates.forEach((coord, idx) => {
    const distance = haversineDistance(safePointLat, safePointLng, coord[1], coord[0]);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = idx;
    }
  });

  return { distanceKm: minDistance, closestIndex };
}

// Calculate approximate km from origin based on route index
function calculateKmFromOrigin(
  closestIndex: number,
  totalCoordinates: number,
  totalDistanceKm: number
): number {
  return (closestIndex / totalCoordinates) * totalDistanceKm;
}

/**
 * Find safe points along a route within a specified distance
 * @param safePoints - Array of safe points from database
 * @param routeCoordinates - Route coordinates [lng, lat][]
 * @param totalDistanceKm - Total route distance
 * @param maxDistanceKm - Maximum distance from route to consider (default 30km)
 * @param maxPoints - Maximum number of points to return (default 10)
 */
export function findSafePointsAlongRoute(
  safePoints: SafePointInput[],
  routeCoordinates: [number, number][],
  totalDistanceKm: number,
  maxDistanceKm: number = 30,
  maxPoints: number = 10
): SafePointForRoute[] {
  if (!routeCoordinates.length || !safePoints.length) {
    return [];
  }

  const pointsWithDistance: SafePointForRoute[] = [];

  for (const sp of safePoints) {
    const { distanceKm, closestIndex } = findClosestPointOnRoute(
      sp.lat,
      sp.lng,
      routeCoordinates
    );

    if (distanceKm <= maxDistanceKm) {
      const kmFromOrigin = calculateKmFromOrigin(
        closestIndex,
        routeCoordinates.length,
        totalDistanceKm
      );

      pointsWithDistance.push({
        id: sp.id,
        name: sp.name,
        lat: sp.lat,
        lng: sp.lng,
        type: sp.type,
        certification_level: (sp.certification_level as 'oro' | 'plata' | 'bronce' | 'precaucion') || 'precaucion',
        total_score: sp.total_score || 0,
        distanceFromRouteKm: Math.round(distanceKm * 10) / 10,
        kmFromOrigin: Math.round(kmFromOrigin),
        has_24h_security: sp.has_24h_security || false,
        has_cctv: sp.has_cctv || false,
        has_lighting: sp.has_lighting || false,
        has_fuel: sp.has_fuel || false,
        has_restrooms: sp.has_restrooms || false,
        has_food: sp.has_food || false,
      });
    }
  }

  // Sort by km from origin
  const sortedPoints = pointsWithDistance.sort((a, b) => a.kmFromOrigin - b.kmFromOrigin);
  
  if (sortedPoints.length <= maxPoints) {
    return sortedPoints;
  }
  
  // Distribute points uniformly along the route to ensure coverage for long routes
  // This prevents all points from clustering at the start of the route
  const interval = totalDistanceKm / maxPoints;
  const selectedPoints: SafePointForRoute[] = [];
  let lastSelectedKm = -interval; // Start before km 0 to include first point
  
  for (const point of sortedPoints) {
    // Select point if it's at least 70% of the interval away from last selected
    if (point.kmFromOrigin >= lastSelectedKm + interval * 0.7) {
      selectedPoints.push(point);
      lastSelectedKm = point.kmFromOrigin;
      if (selectedPoints.length >= maxPoints) break;
    }
  }
  
  // If we still have capacity, fill with highest-scoring remaining points
  if (selectedPoints.length < maxPoints) {
    const remaining = sortedPoints.filter(p => !selectedPoints.includes(p));
    const byScore = remaining.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    selectedPoints.push(...byScore.slice(0, maxPoints - selectedPoints.length));
  }
  
  // Return sorted by km from origin
  return selectedPoints.sort((a, b) => a.kmFromOrigin - b.kmFromOrigin);
}

/**
 * Get services array from safe point features
 */
export function getSafePointServices(point: SafePointForRoute): string[] {
  const services: string[] = [];
  if (point.has_24h_security) services.push('Seguridad 24h');
  if (point.has_cctv) services.push('CCTV');
  if (point.has_lighting) services.push('Iluminación');
  if (point.has_fuel) services.push('Combustible');
  if (point.has_restrooms) services.push('Sanitarios');
  if (point.has_food) services.push('Alimentos');
  return services;
}

/**
 * Map safe point type to display name
 */
export function mapSafePointType(type: string): 'pernocta' | 'parada' | 'emergencia' | 'combustible' {
  switch (type) {
    case 'gasolinera_vigilada':
      return 'combustible';
    case 'base_custodia':
    case 'punto_encuentro':
      return 'emergencia';
    case 'area_descanso':
      return 'pernocta';
    default:
      return 'parada';
  }
}

/**
 * Get certification badge color
 */
export function getCertificationColor(level: string): string {
  switch (level) {
    case 'oro': return 'bg-yellow-500 text-white';
    case 'plata': return 'bg-gray-400 text-white';
    case 'bronce': return 'bg-amber-700 text-white';
    default: return 'bg-red-500 text-white';
  }
}
