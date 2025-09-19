/**
 * Utilidades para manejo geográfico y extracción de ubicaciones
 */

// Diccionario de ciudades principales con coordenadas aproximadas
export const CIUDADES_PRINCIPALES = {
  // Ciudad de México y zona metropolitana
  'cdmx': { lat: 19.4326, lng: -99.1332, estado: 'Ciudad de México', aliases: ['ciudad de mexico', 'df', 'mexico df', 'metro cdmx'] },
  'mexico': { lat: 19.4326, lng: -99.1332, estado: 'Ciudad de México', aliases: ['ciudad de mexico', 'df'] },
  'nezahualcoyotl': { lat: 19.4003, lng: -99.0146, estado: 'Estado de México', aliases: ['neza', 'ciudad neza'] },
  'ecatepec': { lat: 19.6014, lng: -99.0602, estado: 'Estado de México', aliases: ['ecatepec de morelos'] },
  'tlalnepantla': { lat: 19.5409, lng: -99.1956, estado: 'Estado de México', aliases: [] },
  'naucalpan': { lat: 19.4781, lng: -99.2386, estado: 'Estado de México', aliases: ['naucalpan de juarez'] },
  
  // Guadalajara y zona metropolitana
  'guadalajara': { lat: 20.6597, lng: -103.3496, estado: 'Jalisco', aliases: ['gdl', 'metro guadalajara'] },
  'zapopan': { lat: 20.7227, lng: -103.3933, estado: 'Jalisco', aliases: [] },
  'tlaquepaque': { lat: 20.6403, lng: -103.2927, estado: 'Jalisco', aliases: ['san pedro tlaquepaque'] },
  
  // Monterrey y zona metropolitana
  'monterrey': { lat: 25.6866, lng: -100.3161, estado: 'Nuevo León', aliases: ['mty', 'metro monterrey'] },
  'guadalupe': { lat: 25.6767, lng: -100.2569, estado: 'Nuevo León', aliases: ['guadalupe nl'] },
  'san_nicolas': { lat: 25.7481, lng: -100.2975, estado: 'Nuevo León', aliases: ['san nicolas de los garza'] },
  'apodaca': { lat: 25.7806, lng: -100.1867, estado: 'Nuevo León', aliases: [] },
  
  // Puebla
  'puebla': { lat: 19.0414, lng: -98.2063, estado: 'Puebla', aliases: ['puebla de zaragoza', 'heroica puebla'] },
  'tehuacan': { lat: 18.4628, lng: -97.3925, estado: 'Puebla', aliases: [] },
  'cholula': { lat: 19.0631, lng: -98.3028, estado: 'Puebla', aliases: ['san pedro cholula'] },
  
  // Querétaro
  'queretaro': { lat: 20.5888, lng: -100.3899, estado: 'Querétaro', aliases: ['qro', 'santiago de queretaro'] },
  
  // Bajío
  'leon': { lat: 21.1219, lng: -101.6827, estado: 'Guanajuato', aliases: ['leon de los aldama'] },
  'celaya': { lat: 20.5289, lng: -100.8157, estado: 'Guanajuato', aliases: [] },
  'irapuato': { lat: 20.6767, lng: -101.3542, estado: 'Guanajuato', aliases: [] },
  'salamanca': { lat: 20.5739, lng: -101.1956, estado: 'Guanajuato', aliases: [] },
  'aguascalientes': { lat: 21.8853, lng: -102.2916, estado: 'Aguascalientes', aliases: ['ags'] },
  
  // Otras ciudades importantes
  'tijuana': { lat: 32.5149, lng: -117.0382, estado: 'Baja California', aliases: ['tj'] },
  'cancun': { lat: 21.1619, lng: -86.8515, estado: 'Quintana Roo', aliases: ['cancún'] },
  'merida': { lat: 20.9674, lng: -89.5926, estado: 'Yucatán', aliases: ['mérida'] },
  'veracruz': { lat: 19.1738, lng: -96.1342, estado: 'Veracruz', aliases: ['puerto de veracruz'] },
  'tampico': { lat: 22.2336, lng: -97.8614, estado: 'Tamaulipas', aliases: [] },
  'morelia': { lat: 19.7007, lng: -101.1884, estado: 'Michoacán', aliases: [] },
  'toluca': { lat: 19.2926, lng: -99.6544, estado: 'Estado de México', aliases: ['toluca de lerdo'] },
} as const;

// Mapeo de zonas de trabajo a ciudades principales
export const ZONAS_A_CIUDADES = {
  'zona_centro': ['cdmx', 'mexico', 'toluca', 'puebla', 'queretaro'],
  'zona_bajio': ['leon', 'celaya', 'irapuato', 'salamanca', 'aguascalientes', 'queretaro'],
  'zona_occidente': ['guadalajara', 'zapopan', 'tlaquepaque'],
  'zona_norte': ['monterrey', 'guadalupe', 'san_nicolas', 'apodaca'],
  'zona_golfo': ['veracruz', 'tampico'],
  'zona_pacifico': ['tijuana'],
  'zona_sureste': ['cancun', 'merida'],
} as const;

/**
 * Extrae la ciudad principal de un string de origen o destino
 * Ejemplos: "TYASA → TEHUACAN, PUEBLA" -> "tehuacan"
 *           "CDMX Centro" -> "cdmx"
 */
export function extraerCiudad(texto: string): string | null {
  if (!texto) return null;
  
  const textoLimpio = texto.toLowerCase()
    .replace(/[→→]/g, ' ')
    .replace(/[,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Buscar coincidencias exactas primero
  for (const [ciudad, data] of Object.entries(CIUDADES_PRINCIPALES)) {
    if (textoLimpio.includes(ciudad)) {
      return ciudad;
    }
    
    // Buscar por aliases
    for (const alias of data.aliases) {
      if (textoLimpio.includes(alias)) {
        return ciudad;
      }
    }
  }
  
  // Buscar por palabras clave parciales
  const palabras = textoLimpio.split(' ');
  for (const palabra of palabras) {
    if (palabra.length < 3) continue;
    
    for (const [ciudad, data] of Object.entries(CIUDADES_PRINCIPALES)) {
      if (ciudad.includes(palabra) || palabra.includes(ciudad)) {
        return ciudad;
      }
      
      for (const alias of data.aliases) {
        if (alias.includes(palabra) || palabra.includes(alias)) {
          return ciudad;
        }
      }
    }
  }
  
  return null;
}

/**
 * Obtiene información geográfica de una ciudad
 */
export function obtenerInfoCiudad(ciudadKey: string) {
  return CIUDADES_PRINCIPALES[ciudadKey as keyof typeof CIUDADES_PRINCIPALES] || null;
}

/**
 * Calcula la distancia entre dos ciudades en km
 */
export function calcularDistanciaCiudades(ciudad1: string, ciudad2: string): number | null {
  const info1 = obtenerInfoCiudad(ciudad1);
  const info2 = obtenerInfoCiudad(ciudad2);
  
  if (!info1 || !info2) return null;
  
  // Fórmula de Haversine simplificada
  const R = 6371; // Radio de la Tierra en km
  const dLat = (info2.lat - info1.lat) * Math.PI / 180;
  const dLng = (info2.lng - info1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(info1.lat * Math.PI / 180) * Math.cos(info2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Determina si dos ciudades están en la misma región geográfica
 */
export function estanEnMismaRegion(ciudad1: string, ciudad2: string): boolean {
  for (const zona of Object.values(ZONAS_A_CIUDADES)) {
    const ciudadesZona = zona as readonly string[];
    if (ciudadesZona.includes(ciudad1) && ciudadesZona.includes(ciudad2)) {
      return true;
    }
  }
  return false;
}

/**
 * Obtiene las ciudades principales de una zona
 */
export function obtenerCiudadesDeZona(zona: string): string[] {
  const ciudadesZona = ZONAS_A_CIUDADES[zona as keyof typeof ZONAS_A_CIUDADES];
  return ciudadesZona ? [...ciudadesZona] : [];
}

/**
 * Mapea una zona_preferida_id a ciudades principales
 * Esta función necesitará ser actualizada cuando tengamos acceso real a la tabla zonas_trabajo
 */
export function mapearZonaPreferidaACiudades(zonaId: string | null): string[] {
  if (!zonaId) return [];
  
  // Mapeo temporal basado en nombres comunes de zonas
  const mapeosTemporales: Record<string, string[]> = {
    'zona_centro': ['cdmx', 'mexico', 'toluca', 'puebla'],
    'zona_bajio': ['leon', 'celaya', 'queretaro'],
    'zona_occidente': ['guadalajara'],
    'zona_norte': ['monterrey'],
    'cdmx': ['cdmx', 'mexico'],
    'guadalajara': ['guadalajara'],
    'monterrey': ['monterrey'],
    'puebla': ['puebla', 'tehuacan'],
    'leon': ['leon', 'celaya'],
    'queretaro': ['queretaro'],
  };
  
  return mapeosTemporales[zonaId.toLowerCase()] || [];
}