/**
 * Utility functions for normalizing and validating location text
 * to prevent database pollution with inconsistent formats.
 */

// Common abbreviations and their standardized state names
export const LOCATION_SHORTCUTS: Record<string, string> = {
  'AICM': 'CDMX',
  'AIFA': 'EDOMEX',
  'ARCO NORTE': 'EDOMEX',
  'BENITO JUAREZ': 'CDMX',
  'SANTA FE': 'CDMX',
  'POLANCO': 'CDMX',
  'REFORMA': 'CDMX',
  'TLALNEPANTLA': 'EDOMEX',
  'NAUCALPAN': 'EDOMEX',
  'ECATEPEC': 'EDOMEX',
  'TOLUCA': 'EDOMEX',
  'TEXCOCO': 'EDOMEX',
};

// State code mappings
export const STATE_CODES: Record<string, string> = {
  'AGUASCALIENTES': 'AGS',
  'BAJA CALIFORNIA': 'BC',
  'BAJA CALIFORNIA SUR': 'BCS',
  'CAMPECHE': 'CAMP',
  'CHIAPAS': 'CHIS',
  'CHIHUAHUA': 'CHIH',
  'CIUDAD DE MEXICO': 'CDMX',
  'CDMX': 'CDMX',
  'COAHUILA': 'COAH',
  'COLIMA': 'COL',
  'DURANGO': 'DGO',
  'ESTADO DE MEXICO': 'EDOMEX',
  'EDOMEX': 'EDOMEX',
  'GUANAJUATO': 'GTO',
  'GUERRERO': 'GRO',
  'HIDALGO': 'HGO',
  'JALISCO': 'JAL',
  'MEXICO': 'EDOMEX',
  'MICHOACAN': 'MICH',
  'MORELOS': 'MOR',
  'NAYARIT': 'NAY',
  'NUEVO LEON': 'NL',
  'OAXACA': 'OAX',
  'PUEBLA': 'PUE',
  'QUERETARO': 'QRO',
  'QUINTANA ROO': 'QROO',
  'SAN LUIS POTOSI': 'SLP',
  'SINALOA': 'SIN',
  'SONORA': 'SON',
  'TABASCO': 'TAB',
  'TAMAULIPAS': 'TAMPS',
  'TLAXCALA': 'TLAX',
  'VERACRUZ': 'VER',
  'YUCATAN': 'YUC',
  'ZACATECAS': 'ZAC',
};

/**
 * Normalize text for location: uppercase, no accents, trimmed
 */
export function normalizeLocationText(text: string): string {
  if (!text) return '';
  
  return text
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, ' '); // Normalize multiple spaces
}

/**
 * Format location as standardized "CIUDAD, ESTADO"
 */
export function formatLocation(ciudad: string, estado: string): string {
  const normalizedCiudad = normalizeLocationText(ciudad);
  const normalizedEstado = normalizeLocationText(estado);
  return `${normalizedCiudad}, ${normalizedEstado}`;
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 * Returns a value between 0 and 1 (1 = identical)
 */
export function calculateSimilarity(a: string, b: string): number {
  const strA = normalizeLocationText(a);
  const strB = normalizeLocationText(b);
  
  if (strA === strB) return 1;
  if (!strA || !strB) return 0;
  
  const longer = strA.length > strB.length ? strA : strB;
  const shorter = strA.length > strB.length ? strB : strA;
  
  const longerLength = longer.length;
  if (longerLength === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Find similar locations from existing list
 */
export function findSimilarLocations(
  input: string,
  existingLocations: string[],
  threshold: number = 0.8
): Array<{ location: string; similarity: number }> {
  const normalizedInput = normalizeLocationText(input);
  
  const matches = existingLocations
    .map(loc => ({
      location: loc,
      similarity: calculateSimilarity(normalizedInput, loc)
    }))
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
  
  return matches;
}

/**
 * Try to auto-detect state from city name using shortcuts
 */
export function autoDetectState(ciudad: string): string | null {
  const normalized = normalizeLocationText(ciudad);
  
  // Check direct shortcut matches
  for (const [key, state] of Object.entries(LOCATION_SHORTCUTS)) {
    if (normalized.includes(key)) {
      return state;
    }
  }
  
  return null;
}

/**
 * Validate that a location follows the expected format
 */
export function isValidLocationFormat(location: string): boolean {
  const normalized = normalizeLocationText(location);
  // Should have format "CIUDAD, ESTADO" with comma
  return /^[A-Z0-9\s]+,\s*[A-Z]+$/.test(normalized);
}

/**
 * Parse a location string into city and state parts
 */
export function parseLocation(location: string): { ciudad: string; estado: string } | null {
  const normalized = normalizeLocationText(location);
  const parts = normalized.split(',').map(p => p.trim());
  
  if (parts.length !== 2) return null;
  
  return {
    ciudad: parts[0],
    estado: parts[1]
  };
}
