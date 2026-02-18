// ============================================================
// Configuración de Periféricos para Camiones de Carga en México
// Los camiones T3+ deben usar vías periféricas, no centros urbanos
// ============================================================

export interface MetropolitanBypass {
  cityName: string;
  center: [number, number]; // [lng, lat] - Centro de la ciudad
  detectionRadius: number;  // Radio en km para detectar si la ruta cruza la zona
  bypassWaypoints: [number, number][]; // Puntos del periférico en orden
  description: string;
  extraDistanceKm: number; // Distancia adicional aproximada vs ruta directa
}

// Ciudades mexicanas que requieren uso de periférico para carga pesada
export const MEXICAN_BYPASSES: MetropolitanBypass[] = [
  {
    cityName: 'Guadalajara',
    center: [-103.3500, 20.6700],
    detectionRadius: 25,
    bypassWaypoints: [
      [-103.2600, 20.5200], // Sur - El Salto (entrada periférico desde Colima)
      [-103.2300, 20.6500], // Este - Tlaquepaque
      [-103.2100, 20.7200], // Noreste - Tonalá
      [-103.1800, 20.7600], // Salida hacia Lagos de Moreno
    ],
    description: 'Arco Periférico de Guadalajara',
    extraDistanceKm: 15,
  },
  {
    cityName: 'CDMX',
    center: [-99.1332, 19.4326],
    detectionRadius: 35,
    bypassWaypoints: [
      [-99.0200, 19.2800], // Sureste - Chalco bypass
      [-98.9500, 19.5200], // Este - Circuito Exterior Mexiquense
      [-99.1000, 19.6500], // Norte - Ecatepec
      [-99.2500, 19.6800], // Noroeste - Cuautitlán
    ],
    description: 'Circuito Exterior Mexiquense',
    extraDistanceKm: 25,
  },
  {
    cityName: 'Monterrey',
    center: [-100.3099, 25.6866],
    detectionRadius: 22,
    bypassWaypoints: [
      [-100.1200, 25.5800], // Sureste - Cadereyta
      [-100.0800, 25.7500], // Este - Periférico noreste
      [-100.2000, 25.8200], // Norte - Escobedo
      [-100.4500, 25.7000], // Oeste - García
    ],
    description: 'Periférico de Monterrey',
    extraDistanceKm: 18,
  },
  {
    cityName: 'Puebla',
    center: [-98.2063, 19.0414],
    detectionRadius: 15,
    bypassWaypoints: [
      [-98.1200, 18.9500], // Sur - Valsequillo
      [-98.0800, 19.0800], // Este - Periférico ecológico
      [-98.2500, 19.1200], // Norte - San Pablo Xochimehuacan
    ],
    description: 'Periférico Ecológico de Puebla',
    extraDistanceKm: 10,
  },
  {
    cityName: 'León',
    center: [-101.6800, 21.1200],
    detectionRadius: 12,
    bypassWaypoints: [
      [-101.5800, 21.0500], // Sureste
      [-101.5500, 21.1500], // Este - Libramiento
      [-101.6500, 21.2000], // Norte
      [-101.7500, 21.1500], // Oeste
    ],
    description: 'Libramiento de León',
    extraDistanceKm: 12,
  },
  {
    cityName: 'Aguascalientes',
    center: [-102.2900, 21.8800],
    detectionRadius: 10,
    bypassWaypoints: [
      [-102.2200, 21.8200], // Sureste
      [-102.2000, 21.9200], // Este
      [-102.3200, 21.9500], // Norte - Libramiento norte
    ],
    description: 'Libramiento de Aguascalientes',
    extraDistanceKm: 8,
  },
  {
    cityName: 'Querétaro',
    center: [-100.3900, 20.5900],
    detectionRadius: 12,
    bypassWaypoints: [
      [-100.3200, 20.5200], // Sur
      [-100.2800, 20.6200], // Este
      [-100.3500, 20.6800], // Norte - Anillo vial
    ],
    description: 'Anillo Vial de Querétaro',
    extraDistanceKm: 10,
  },
  {
    cityName: 'Morelia',
    center: [-101.1850, 19.7010],
    detectionRadius: 10,
    bypassWaypoints: [
      [-101.0800, 19.6500], // Sureste
      [-101.1000, 19.7500], // Este
      [-101.2500, 19.7300], // Oeste - Libramiento sur
    ],
    description: 'Libramiento de Morelia',
    extraDistanceKm: 8,
  },
];

/**
 * Calcula la distancia en km entre dos puntos usando la fórmula Haversine
 */
export function haversineDistance(
  point1: [number, number], // [lng, lat]
  point2: [number, number]  // [lng, lat]
): number {
  const R = 6371; // Radio de la Tierra en km
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determina si un punto está dentro del radio de detección de una ciudad
 */
export function isPointNearCity(
  point: [number, number],
  bypass: MetropolitanBypass
): boolean {
  const distance = haversineDistance(point, bypass.center);
  return distance <= bypass.detectionRadius;
}

/**
 * Encuentra qué ciudades están entre el origen y destino de una ruta
 */
export function findCitiesOnRoute(
  origin: [number, number],
  destination: [number, number]
): MetropolitanBypass[] {
  const citiesOnRoute: MetropolitanBypass[] = [];
  
  for (const bypass of MEXICAN_BYPASSES) {
    // Verificar si la línea origen-destino pasa cerca del centro de la ciudad
    const distToOrigin = haversineDistance(origin, bypass.center);
    const distToDestination = haversineDistance(destination, bypass.center);
    const routeLength = haversineDistance(origin, destination);
    
    // Si la ciudad está entre origen y destino (no más lejos que la ruta total)
    // y la distancia al centro es menor que el radio de detección
    const minDistToRoute = Math.min(distToOrigin, distToDestination);
    
    if (minDistToRoute <= bypass.detectionRadius * 1.5 && 
        distToOrigin + distToDestination < routeLength * 1.5) {
      citiesOnRoute.push(bypass);
    }
  }
  
  // Ordenar por distancia al origen
  return citiesOnRoute.sort((a, b) => {
    const distA = haversineDistance(origin, a.center);
    const distB = haversineDistance(origin, b.center);
    return distA - distB;
  });
}

/**
 * Genera waypoints de bypass para ciudades en la ruta
 */
export function generateBypassWaypoints(
  origin: [number, number],
  destination: [number, number],
  cities: MetropolitanBypass[]
): [number, number][] {
  if (cities.length === 0) return [];
  
  const allWaypoints: [number, number][] = [];
  
  for (const city of cities) {
    // Determinar qué waypoints del periférico usar basado en dirección de la ruta
    const entryPoint = findClosestWaypoint(origin, city.bypassWaypoints);
    const exitPoint = findClosestWaypoint(destination, city.bypassWaypoints);
    
    // Si entrada y salida son diferentes, agregar ambos
    if (entryPoint !== exitPoint) {
      allWaypoints.push(city.bypassWaypoints[entryPoint]);
      
      // Agregar waypoints intermedios en orden
      const startIdx = entryPoint;
      const endIdx = exitPoint;
      const step = endIdx > startIdx ? 1 : -1;
      
      for (let i = startIdx + step; i !== endIdx; i += step) {
        if (i >= 0 && i < city.bypassWaypoints.length) {
          allWaypoints.push(city.bypassWaypoints[i]);
        }
      }
      
      allWaypoints.push(city.bypassWaypoints[exitPoint]);
    } else {
      // Si son el mismo punto, solo agregar el más cercano al centro de ruta
      allWaypoints.push(city.bypassWaypoints[entryPoint]);
    }
  }
  
  return allWaypoints;
}

/**
 * Encuentra el índice del waypoint más cercano a un punto
 */
function findClosestWaypoint(
  point: [number, number],
  waypoints: [number, number][]
): number {
  let minDist = Infinity;
  let closestIdx = 0;
  
  waypoints.forEach((wp, idx) => {
    const dist = haversineDistance(point, wp);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = idx;
    }
  });
  
  return closestIdx;
}

/**
 * Obtiene el nombre de los periféricos usados en una ruta
 */
export function getBypassNames(cities: MetropolitanBypass[]): string[] {
  return cities.map(c => c.description);
}

/**
 * Calcula la distancia extra total por uso de periféricos
 */
export function getTotalExtraDistance(cities: MetropolitanBypass[]): number {
  return cities.reduce((sum, c) => sum + c.extraDistanceKm, 0);
}
