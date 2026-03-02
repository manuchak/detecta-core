// Highway Segments with granular risk levels (~30km each)
// Based on CANACAR, AMIS, and SESNSP 2024-2025 incident data
// RECALIBRATED: Distribución realista ~7% extremo, ~18% alto, ~40% medio, ~35% bajo

export type RiskLevel = 'extremo' | 'alto' | 'medio' | 'bajo';

export interface HighwaySegment {
  id: string;
  corridorId: string;
  name: string;
  kmStart: number;
  kmEnd: number;
  riskLevel: RiskLevel;
  avgMonthlyEvents: number;
  criticalHours: string;
  commonIncidentType: string;
  recommendations: string[];
  waypoints: [number, number][]; // [lng, lat]
}

// Safe area subtypes for detailed categorization
export type SafeAreaSubtype = 
  | 'gasolinera_vigilada' 
  | 'base_custodia' 
  | 'area_descanso' 
  | 'punto_encuentro'
  | 'puesto_militar';

export interface POI {
  id: string;
  name: string;
  type: 'blackspot' | 'tollbooth' | 'junction' | 'safe_area' | 'industrial';
  coordinates: [number, number]; // [lng, lat]
  description: string;
  riskLevel?: RiskLevel;
  subtype?: SafeAreaSubtype; // Only for safe_area type
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  extremo: '#dc2626', // red-600
  alto: '#ea580c',    // orange-600
  medio: '#d97706',   // amber-600
  bajo: '#16a34a',    // green-600
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  extremo: 'EXTREMO',
  alto: 'ALTO',
  medio: 'MEDIO',
  bajo: 'BAJO',
};

// ============================================================
// SEGMENTOS POR CORREDOR - Recalibrados con datos AMIS 2024
// Distribución meta: ~7% extremo, ~18% alto, ~40% medio, ~35% bajo
// ============================================================

export const HIGHWAY_SEGMENTS: HighwaySegment[] = [
  // ============================================================
  // CORREDOR: México-Puebla (150D) - 130km total
  // ============================================================
  {
    id: 'mex-pue-1',
    corridorId: 'mexico-puebla',
    name: 'Salida CDMX - Los Reyes',
    kmStart: 0,
    kmEnd: 25,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '18:00-22:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Evitar paradas innecesarias'],
    waypoints: [[-99.0872, 19.4060], [-98.9800, 19.3900]],
  },
  {
    id: 'mex-pue-2',
    corridorId: 'mexico-puebla',
    name: 'Los Reyes - Chalco',
    kmStart: 25,
    kmEnd: 45,
    riskLevel: 'alto', // Recalibrado de extremo
    avgMonthlyEvents: 5,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS cada 10 min'],
    waypoints: [[-98.9800, 19.3900], [-98.8900, 19.3400]],
  },
  {
    id: 'mex-pue-3',
    corridorId: 'mexico-puebla',
    name: 'Chalco - San Martín Texmelucan',
    kmStart: 45,
    kmEnd: 85,
    riskLevel: 'extremo', // MANTENER - Zona #2 nacional AMIS 2024
    avgMonthlyEvents: 12,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Restricción horaria: Evitar 22:00-05:00', 'Check-in cada 15 min', 'Convoy para carga >$5M'],
    waypoints: [[-98.8900, 19.3400], [-98.6200, 19.2800], [-98.4400, 19.2750]],
  },
  {
    id: 'mex-pue-4',
    corridorId: 'mexico-puebla',
    name: 'San Martín - Puebla Centro',
    kmStart: 85,
    kmEnd: 130,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Custodia opcional'],
    waypoints: [[-98.4400, 19.2750], [-98.2000, 19.0414]],
  },

  // ============================================================
  // CORREDOR: San Luis Potosí Hub (57/70/80) - 120km total
  // ============================================================
  {
    id: 'slp-hub-1',
    corridorId: 'san-luis-potosi-hub',
    name: 'SLP Centro - Soledad de G.S.',
    kmStart: 0,
    kmEnd: 15,
    riskLevel: 'extremo', // MANTENER - Zona #1 nacional AMIS 2024
    avgMonthlyEvents: 15,
    criticalHours: '00:00-06:00',
    commonIncidentType: 'Robo con violencia / Asalto múltiple',
    recommendations: ['Restricción horaria: Evitar 00:00-06:00', 'NO pernoctar en zona', 'Convoy mínimo 2 unidades'],
    waypoints: [[-100.9800, 22.1500], [-100.8800, 22.2000]],
  },
  {
    id: 'slp-hub-2',
    corridorId: 'san-luis-potosi-hub',
    name: 'Soledad - Entronque 57/80',
    kmStart: 15,
    kmEnd: 40,
    riskLevel: 'extremo', // MANTENER - Zona crítica documentada
    avgMonthlyEvents: 14,
    criticalHours: '20:00-06:00',
    commonIncidentType: 'Robo organizado / Bloqueo de carretera',
    recommendations: ['Comunicación satelital requerida', 'Protocolo anti-bloqueo activo', 'Check-in cada 10 min'],
    waypoints: [[-100.8800, 22.2000], [-100.7500, 22.2800]],
  },
  {
    id: 'slp-hub-3',
    corridorId: 'san-luis-potosi-hub',
    name: 'Hacia Villa de Reyes',
    kmStart: 40,
    kmEnd: 70,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar paradas no programadas', 'Monitoreo GPS estándar'],
    waypoints: [[-100.9800, 22.1500], [-100.8200, 21.8800]],
  },
  {
    id: 'slp-hub-4',
    corridorId: 'san-luis-potosi-hub',
    name: 'Villa de Reyes - Aguascalientes',
    kmStart: 70,
    kmEnd: 120,
    riskLevel: 'bajo', // Recalibrado de alto
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Ruta relativamente segura'],
    waypoints: [[-100.8200, 21.8800], [-101.1500, 21.8500]],
  },

  // ============================================================
  // CORREDOR: Lázaro Cárdenas - CDMX - 480km total
  // ============================================================
  {
    id: 'lc-cdmx-1',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'Puerto Lázaro Cárdenas',
    kmStart: 0,
    kmEnd: 30,
    riskLevel: 'medio', // Recalibrado de alto - zona portuaria controlada
    avgMonthlyEvents: 2,
    criticalHours: '02:00-06:00',
    commonIncidentType: 'Robo en zona portuaria',
    recommendations: ['Custodia desde puerto', 'Verificación de sellos'],
    waypoints: [[-102.1690, 17.9270], [-102.0500, 18.1000]],
  },
  {
    id: 'lc-cdmx-2',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'TIERRA CALIENTE - Lázaro Cárdenas a Nueva Italia',
    kmStart: 30,
    kmEnd: 90,
    riskLevel: 'extremo', // CRÍTICO - Tierra Caliente Michoacán, zona de mayor riesgo nacional
    avgMonthlyEvents: 12,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia / Bloqueos / Secuestro',
    recommendations: [
      'RESTRICCIÓN HORARIA OBLIGATORIA: Evitar 18:00-06:00',
      'Comunicación satelital OBLIGATORIA',
      'Reportar posición al ENTRAR y SALIR de zona',
      'Convoy mínimo 2 unidades para carga >$3M',
      'Custodia armada requerida por aseguradora',
      'NO pernoctar en zona bajo ninguna circunstancia'
    ],
    // Waypoints densificados para mejor detección (~10km entre puntos)
    waypoints: [
      [-102.0500, 18.1000],  // Salida Puerto LC
      [-101.9800, 18.2000],  // Arteaga aproximación
      [-101.9000, 18.2800],  // Arteaga
      [-101.8200, 18.3600],  // Centro Tierra Caliente norte
      [-101.7400, 18.4400],  // Huetamo aproximación
      [-101.6600, 18.5200],  // Huetamo
      [-101.5800, 18.6200],  // Centro zona crítica
      [-101.5200, 18.7200],  // Nueva Italia aproximación
      [-101.5000, 18.8000],  // Nueva Italia
    ],
  },
  {
    id: 'lc-cdmx-3',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'Nueva Italia - Uruapan',
    kmStart: 90,
    kmEnd: 140,
    riskLevel: 'alto', // Mantener - salida zona caliente
    avgMonthlyEvents: 5,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar paradas', 'Monitoreo GPS cada 10 min'],
    waypoints: [[-101.5000, 18.8000], [-101.1900, 18.9200]],
  },
  {
    id: 'lc-cdmx-4',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'Uruapan - Pátzcuaro',
    kmStart: 140,
    kmEnd: 200,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Zona turística'],
    waypoints: [[-101.1900, 18.9200], [-101.3000, 19.3500]],
  },
  {
    id: 'lc-cdmx-5',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'Pátzcuaro - Morelia',
    kmStart: 200,
    kmEnd: 260,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '02:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Autopista segura'],
    waypoints: [[-101.3000, 19.3500], [-101.1850, 19.7010]],
  },
  {
    id: 'lc-cdmx-6',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'Morelia - Maravatío',
    kmStart: 260,
    kmEnd: 340,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Evitar paradas no programadas'],
    waypoints: [[-101.1850, 19.7010], [-100.4500, 19.7200]],
  },
  {
    id: 'lc-cdmx-7',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'Maravatío - Atlacomulco',
    kmStart: 340,
    kmEnd: 390,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-04:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Corredor relativamente seguro'],
    waypoints: [[-100.4500, 19.7200], [-100.2800, 19.6500]],
  },
  {
    id: 'lc-cdmx-8',
    corridorId: 'lazaro-cardenas-cdmx',
    name: 'Atlacomulco - Toluca - CDMX',
    kmStart: 390,
    kmEnd: 480,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '18:00-22:00',
    commonIncidentType: 'Robo urbano',
    recommendations: ['Evitar horario pico', 'Monitoreo GPS activo'],
    waypoints: [[-100.2800, 19.6500], [-99.5300, 19.5500], [-99.1700, 19.4200]],
  },

  // ============================================================
  // CORREDOR: Manzanillo - Tampico (Transversal) - 850km
  // ============================================================
  {
    id: 'mza-tam-1',
    corridorId: 'manzanillo-tampico',
    name: 'Puerto Manzanillo - Colima',
    kmStart: 0,
    kmEnd: 100,
    riskLevel: 'medio', // Recalibrado de alto - zona portuaria controlada
    avgMonthlyEvents: 2,
    criticalHours: '02:00-06:00',
    commonIncidentType: 'Robo en zona portuaria',
    recommendations: ['Custodia desde puerto', 'Verificación documentos'],
    waypoints: [[-104.3100, 19.1100], [-103.7200, 19.2400]],
  },
  {
    id: 'mza-tam-2',
    corridorId: 'manzanillo-tampico',
    name: 'Colima - Periférico GDL (El Salto)',
    kmStart: 100,
    kmEnd: 200,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Usar periférico obligatoriamente'],
    waypoints: [
      [-103.7200, 19.2400],
      [-103.4000, 19.9500],
      [-103.3000, 20.2800],
      [-103.2600, 20.5200],
    ],
  },
  {
    id: 'mza-tam-2b',
    corridorId: 'manzanillo-tampico',
    name: 'Periférico GDL (Tonalá - Salida Norte)',
    kmStart: 200,
    kmEnd: 240,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '18:00-22:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['No detenerse', 'GPS activo'],
    waypoints: [
      [-103.2600, 20.5200],
      [-103.2300, 20.6500],
      [-103.2100, 20.7200],
      [-103.1800, 20.7600],
    ],
  },
  {
    id: 'mza-tam-3',
    corridorId: 'manzanillo-tampico',
    name: 'Salida GDL - Lagos de Moreno',
    kmStart: 240,
    kmEnd: 350,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS estándar'],
    waypoints: [
      [-103.1800, 20.7600],
      [-102.7500, 20.9500],
      [-102.3400, 21.3500],
    ],
  },
  {
    id: 'mza-tam-4',
    corridorId: 'manzanillo-tampico',
    name: 'Lagos de Moreno - Aguascalientes',
    kmStart: 330,
    kmEnd: 400,
    riskLevel: 'bajo', // Recalibrado de alto
    avgMonthlyEvents: 1,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Autopista de cuota segura'],
    waypoints: [[-102.3400, 21.3500], [-101.8800, 21.8800]],
  },
  {
    id: 'mza-tam-5',
    corridorId: 'manzanillo-tampico',
    name: 'Aguascalientes - SLP',
    kmStart: 400,
    kmEnd: 530,
    riskLevel: 'alto', // Recalibrado de extremo - aproximación a zona caliente
    avgMonthlyEvents: 5,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS cada 10 min'],
    waypoints: [[-101.8800, 21.8800], [-100.9800, 22.1500]],
  },
  {
    id: 'mza-tam-6',
    corridorId: 'manzanillo-tampico',
    name: 'SLP - Ciudad Valles',
    kmStart: 530,
    kmEnd: 700,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar paradas', 'Monitoreo GPS estándar'],
    waypoints: [[-100.9800, 22.1500], [-99.1500, 22.2500]],
  },
  {
    id: 'mza-tam-7',
    corridorId: 'manzanillo-tampico',
    name: 'Ciudad Valles - Tampico',
    kmStart: 700,
    kmEnd: 850,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Corredor relativamente seguro'],
    waypoints: [[-99.1500, 22.2500], [-97.8600, 22.2300]],
  },

  // ============================================================
  // CORREDOR: Arco Norte (Libramiento ZMVM) - 223km
  // ============================================================
  {
    id: 'arco-norte-1',
    corridorId: 'arco-norte',
    name: 'Tizayuca - San Martín Pirámides',
    kmStart: 0,
    kmEnd: 35,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Evitar paradas no programadas'],
    waypoints: [[-98.5600, 19.6100], [-98.7800, 19.5800]],
  },
  {
    id: 'arco-norte-2',
    corridorId: 'arco-norte',
    name: 'San Martín - Ecatepec Norte',
    kmStart: 35,
    kmEnd: 65,
    riskLevel: 'alto', // Recalibrado de extremo
    avgMonthlyEvents: 6,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS cada 10 min'],
    waypoints: [[-98.7800, 19.5800], [-98.9500, 19.5900]],
  },
  {
    id: 'arco-norte-3',
    corridorId: 'arco-norte',
    name: 'Ecatepec Norte - Tultitlán',
    kmStart: 65,
    kmEnd: 100,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar paradas', 'Monitoreo GPS estándar'],
    waypoints: [[-98.9500, 19.5900], [-99.1200, 19.7200]],
  },
  {
    id: 'arco-norte-4',
    corridorId: 'arco-norte',
    name: 'Tultitlán - Cuautitlán',
    kmStart: 100,
    kmEnd: 135,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Evitar paradas'],
    waypoints: [[-99.1200, 19.7200], [-99.2600, 19.7800]],
  },
  {
    id: 'arco-norte-5',
    corridorId: 'arco-norte',
    name: 'Cuautitlán - Teoloyucan',
    kmStart: 135,
    kmEnd: 165,
    riskLevel: 'bajo', // Mantener bajo
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Zona relativamente segura'],
    waypoints: [[-99.2600, 19.7800], [-99.4500, 19.8200]],
  },
  {
    id: 'arco-norte-6',
    corridorId: 'arco-norte',
    name: 'Teoloyucan - Huehuetoca',
    kmStart: 165,
    kmEnd: 195,
    riskLevel: 'bajo', // Mantener bajo
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-99.4500, 19.8200], [-99.5800, 19.8500]],
  },
  {
    id: 'arco-norte-7',
    corridorId: 'arco-norte',
    name: 'Huehuetoca - Tepeji (Conexión 57D)',
    kmStart: 195,
    kmEnd: 223,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Reportar al entrar/salir zona'],
    waypoints: [[-99.5800, 19.8500], [-99.5000, 20.0800]],
  },

  // ============================================================
  // CORREDOR: Circuito Exterior Mexiquense - 110km
  // ============================================================
  {
    id: 'cem-1',
    corridorId: 'circuito-exterior-mexiquense',
    name: 'La Paz - Chalco',
    kmStart: 0,
    kmEnd: 20,
    riskLevel: 'alto', // Recalibrado de extremo
    avgMonthlyEvents: 7,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS cada 10 min'],
    waypoints: [[-98.9500, 19.2800], [-98.9000, 19.3600]],
  },
  {
    id: 'cem-2',
    corridorId: 'circuito-exterior-mexiquense',
    name: 'Chalco - Los Reyes',
    kmStart: 20,
    kmEnd: 40,
    riskLevel: 'alto', // Recalibrado de extremo
    avgMonthlyEvents: 6,
    criticalHours: '20:00-05:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Check-in cada 10 min'],
    waypoints: [[-98.9000, 19.3600], [-98.8800, 19.4500]],
  },
  {
    id: 'cem-3',
    corridorId: 'circuito-exterior-mexiquense',
    name: 'Los Reyes - Chimalhuacán',
    kmStart: 40,
    kmEnd: 60,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 4,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar paradas', 'GPS activo'],
    waypoints: [[-98.8800, 19.4500], [-98.9200, 19.5200]],
  },
  {
    id: 'cem-4',
    corridorId: 'circuito-exterior-mexiquense',
    name: 'Chimalhuacán - Ecatepec',
    kmStart: 60,
    kmEnd: 85,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-98.9200, 19.5200], [-99.0000, 19.5800]],
  },
  {
    id: 'cem-5',
    corridorId: 'circuito-exterior-mexiquense',
    name: 'Ecatepec - Cuautitlán',
    kmStart: 85,
    kmEnd: 110,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-99.0000, 19.5800], [-99.1200, 19.6500]],
  },

  // ============================================================
  // CORREDOR: México-Toluca (15D) - 65km
  // ============================================================
  {
    id: 'mex-tol-1',
    corridorId: 'mexico-toluca',
    name: 'Santa Fe - La Marquesa',
    kmStart: 0,
    kmEnd: 25,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Cuidado neblina nocturna'],
    waypoints: [[-99.2600, 19.3600], [-99.3500, 19.3400]],
  },
  {
    id: 'mex-tol-2',
    corridorId: 'mexico-toluca',
    name: 'La Marquesa - Lerma',
    kmStart: 25,
    kmEnd: 45,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar paradas en zona boscosa', 'Monitoreo GPS estándar'],
    waypoints: [[-99.3500, 19.3400], [-99.5200, 19.3000]],
  },
  {
    id: 'mex-tol-3',
    corridorId: 'mexico-toluca',
    name: 'Lerma - Toluca',
    kmStart: 45,
    kmEnd: 65,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '18:00-22:00',
    commonIncidentType: 'Robo urbano / zona industrial',
    recommendations: ['Verificar destino antes de entrar zona industrial'],
    waypoints: [[-99.5200, 19.3000], [-99.6600, 19.2900]],
  },

  // ============================================================
  // CORREDOR: Toluca-Atlacomulco (55) - 80km
  // ============================================================
  {
    id: 'tol-atl-1',
    corridorId: 'toluca-atlacomulco',
    name: 'Toluca - Zinacantepec',
    kmStart: 0,
    kmEnd: 25,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-99.6600, 19.2900], [-99.7500, 19.4500]],
  },
  {
    id: 'tol-atl-2',
    corridorId: 'toluca-atlacomulco',
    name: 'Zinacantepec - Villa Victoria',
    kmStart: 25,
    kmEnd: 55,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '02:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Evitar paradas no programadas'],
    waypoints: [[-99.7500, 19.4500], [-99.8200, 19.6000]],
  },
  {
    id: 'tol-atl-3',
    corridorId: 'toluca-atlacomulco',
    name: 'Villa Victoria - Atlacomulco',
    kmStart: 55,
    kmEnd: 80,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Conexión a corredor 57D'],
    waypoints: [[-99.8200, 19.6000], [-99.8700, 19.8000]],
  },

  // ============================================================
  // CORREDOR: CDMX - Querétaro (57D) - 220km
  // ============================================================
  {
    id: 'cdmx-qro-1',
    corridorId: 'cdmx-queretaro',
    name: 'CDMX Norte - Tepotzotlán',
    kmStart: 0,
    kmEnd: 45,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '18:00-22:00',
    commonIncidentType: 'Robo urbano',
    recommendations: ['Evitar horario pico', 'Monitoreo GPS estándar'],
    waypoints: [[-99.1332, 19.4326], [-99.2200, 19.6800]],
  },
  {
    id: 'cdmx-qro-2',
    corridorId: 'cdmx-queretaro',
    name: 'Tepotzotlán - Palmillas',
    kmStart: 45,
    kmEnd: 120,
    riskLevel: 'alto', // Recalibrado de extremo
    avgMonthlyEvents: 6,
    criticalHours: '20:00-05:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS cada 10 min'],
    waypoints: [[-99.2200, 19.6800], [-99.5500, 20.0500], [-99.8500, 20.3200]],
  },
  {
    id: 'cdmx-qro-3',
    corridorId: 'cdmx-queretaro',
    name: 'Palmillas - San Juan del Río',
    kmStart: 120,
    kmEnd: 165,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar paradas', 'Monitoreo GPS estándar'],
    waypoints: [[-99.8500, 20.3200], [-99.9900, 20.3900]],
  },
  {
    id: 'cdmx-qro-4',
    corridorId: 'cdmx-queretaro',
    name: 'San Juan del Río - Querétaro',
    kmStart: 165,
    kmEnd: 220,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Zona industrial segura'],
    waypoints: [[-99.9900, 20.3900], [-100.3900, 20.5900]],
  },

  // ============================================================
  // CORREDOR: Bajío Industrial - 350km
  // ============================================================
  {
    id: 'bajio-1',
    corridorId: 'bajio-industrial',
    name: 'Querétaro - Celaya',
    kmStart: 0,
    kmEnd: 60,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 4,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar horario nocturno', 'Monitoreo GPS estándar'],
    waypoints: [[-100.3900, 20.5900], [-100.8000, 20.5200]],
  },
  {
    id: 'bajio-2',
    corridorId: 'bajio-industrial',
    name: 'Celaya - Salamanca',
    kmStart: 60,
    kmEnd: 100,
    riskLevel: 'extremo', // MANTENER - Zona documentada #3 AMIS 2024
    avgMonthlyEvents: 11,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo organizado / Bloqueos',
    recommendations: ['Restricción horaria: Evitar 18:00-06:00', 'Convoy mínimo 2 unidades', 'Comunicación satelital'],
    waypoints: [[-100.8000, 20.5200], [-101.2000, 20.5700]],
  },
  {
    id: 'bajio-3',
    corridorId: 'bajio-industrial',
    name: 'Salamanca - Irapuato',
    kmStart: 100,
    kmEnd: 130,
    riskLevel: 'alto', // Recalibrado de extremo
    avgMonthlyEvents: 6,
    criticalHours: '20:00-05:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Check-in cada 10 min'],
    waypoints: [[-101.2000, 20.5700], [-101.3500, 20.6700]],
  },
  {
    id: 'bajio-4',
    corridorId: 'bajio-industrial',
    name: 'Irapuato - León',
    kmStart: 130,
    kmEnd: 200,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-101.3500, 20.6700], [-101.6800, 21.1200]],
  },
  {
    id: 'bajio-5',
    corridorId: 'bajio-industrial',
    name: 'León - Aguascalientes',
    kmStart: 200,
    kmEnd: 350,
    riskLevel: 'bajo', // Recalibrado de alto
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Autopista de cuota segura'],
    waypoints: [[-101.6800, 21.1200], [-102.2900, 21.8800]],
  },

  // ============================================================
  // CORREDOR: Monterrey - Nuevo Laredo - 250km
  // ============================================================
  {
    id: 'mty-nld-1',
    corridorId: 'monterrey-nuevo-laredo',
    name: 'Monterrey Norte - Salinas Victoria',
    kmStart: 0,
    kmEnd: 40,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '18:00-22:00',
    commonIncidentType: 'Robo urbano',
    recommendations: ['Evitar horario pico', 'Monitoreo GPS estándar'],
    waypoints: [[-100.3100, 25.6700], [-100.3000, 25.9500]],
  },
  {
    id: 'mty-nld-2',
    corridorId: 'monterrey-nuevo-laredo',
    name: 'Salinas Victoria - Sabinas Hidalgo',
    kmStart: 40,
    kmEnd: 110,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar paradas', 'Monitoreo GPS estándar'],
    waypoints: [[-100.3000, 25.9500], [-100.1800, 26.5000]],
  },
  {
    id: 'mty-nld-3',
    corridorId: 'monterrey-nuevo-laredo',
    name: 'Sabinas - Nuevo Laredo',
    kmStart: 110,
    kmEnd: 250,
    riskLevel: 'alto', // Recalibrado de extremo
    avgMonthlyEvents: 5,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Documentación completa'],
    waypoints: [[-100.1800, 26.5000], [-99.7200, 27.0500], [-99.5500, 27.4900]],
  },

  // ============================================================
  // CORREDOR: Veracruz Puerto - CDMX - 420km
  // ============================================================
  {
    id: 'ver-cdmx-1',
    corridorId: 'veracruz-cdmx',
    name: 'Puerto de Veracruz - Cardel',
    kmStart: 0,
    kmEnd: 40,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '02:00-06:00',
    commonIncidentType: 'Robo en zona portuaria',
    recommendations: ['Custodia desde puerto', 'Verificación sellos'],
    waypoints: [[-96.1342, 19.2033], [-96.3700, 19.3700]],
  },
  {
    id: 'ver-cdmx-2',
    corridorId: 'veracruz-cdmx',
    name: 'Cardel - Xalapa',
    kmStart: 40,
    kmEnd: 110,
    riskLevel: 'bajo', // Recalibrado de medio
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-96.3700, 19.3700], [-96.9200, 19.5400]],
  },
  {
    id: 'ver-cdmx-3',
    corridorId: 'veracruz-cdmx',
    name: 'Xalapa - Perote',
    kmStart: 110,
    kmEnd: 170,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS estándar'],
    waypoints: [[-96.9200, 19.5400], [-97.2400, 19.5600]],
  },
  {
    id: 'ver-cdmx-4',
    corridorId: 'veracruz-cdmx',
    name: 'Perote - Puebla',
    kmStart: 170,
    kmEnd: 280,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-97.2400, 19.5600], [-97.8500, 19.2800], [-98.2000, 19.0414]],
  },
  {
    id: 'ver-cdmx-5',
    corridorId: 'veracruz-cdmx',
    name: 'Puebla - CDMX',
    kmStart: 280,
    kmEnd: 420,
    riskLevel: 'alto', // Recalibrado de extremo - conecta con zona caliente
    avgMonthlyEvents: 5,
    criticalHours: '20:00-05:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS cada 10 min'],
    waypoints: [[-98.2000, 19.0414], [-98.8900, 19.3400], [-99.0872, 19.4060]],
  },

  // ============================================================
  // CORREDOR: Altiplano Central (Ags-Zac-SLP) - 280km
  // ============================================================
  {
    id: 'altiplano-1',
    corridorId: 'altiplano-central',
    name: 'Aguascalientes - Zacatecas',
    kmStart: 0,
    kmEnd: 130,
    riskLevel: 'bajo', // Recalibrado de alto
    avgMonthlyEvents: 1,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Autopista de cuota segura'],
    waypoints: [[-102.2900, 21.8800], [-102.5700, 22.7700]],
  },
  {
    id: 'altiplano-2',
    corridorId: 'altiplano-central',
    name: 'Zacatecas - Fresnillo',
    kmStart: 130,
    kmEnd: 190,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 3,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-102.5700, 22.7700], [-102.8700, 23.1700]],
  },
  {
    id: 'altiplano-3',
    corridorId: 'altiplano-central',
    name: 'Fresnillo - SLP',
    kmStart: 190,
    kmEnd: 280,
    riskLevel: 'alto', // Recalibrado de extremo - aproximación a zona caliente
    avgMonthlyEvents: 5,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Comunicación satelital recomendada'],
    waypoints: [[-102.8700, 23.1700], [-101.5200, 22.8500], [-100.9800, 22.1500]],
  },

  // ============================================================
  // CORREDOR: Costera del Pacífico - 650km
  // ============================================================
  {
    id: 'costera-1',
    corridorId: 'costera-pacifico',
    name: 'Acapulco - Zihuatanejo',
    kmStart: 0,
    kmEnd: 240,
    riskLevel: 'medio', // Recalibrado de alto
    avgMonthlyEvents: 2,
    criticalHours: '20:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Evitar tránsito nocturno', 'Monitoreo GPS estándar'],
    waypoints: [[-99.8900, 16.8500], [-100.3800, 17.6500]],
  },
  {
    id: 'costera-2',
    corridorId: 'costera-pacifico',
    name: 'Zihuatanejo - Lázaro Cárdenas',
    kmStart: 240,
    kmEnd: 400,
    riskLevel: 'alto', // Recalibrado de extremo - aproximación Tierra Caliente
    avgMonthlyEvents: 5,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: ['Evitar tránsito nocturno', 'Comunicación satelital recomendada'],
    waypoints: [[-100.3800, 17.6500], [-101.5000, 17.9000], [-102.1690, 17.9270]],
  },
  {
    id: 'costera-3',
    corridorId: 'costera-pacifico',
    name: 'Lázaro Cárdenas - Manzanillo',
    kmStart: 400,
    kmEnd: 650,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Costa relativamente segura'],
    waypoints: [[-102.1690, 17.9270], [-103.2000, 18.5000], [-104.3100, 19.1100]],
  },

  // ============================================================
  // CORREDOR: EdoMex Industrial - 85km (P0 - EXTREMO)
  // AMIS 2025: EdoMex = 23% de incidencia nacional
  // ============================================================
  {
    id: 'edomex-ind-1',
    corridorId: 'edomex-industrial',
    name: 'Tlalnepantla - Naucalpan Industrial',
    kmStart: 0,
    kmEnd: 22,
    riskLevel: 'extremo',
    avgMonthlyEvents: 10,
    criticalHours: '19:00-00:00',
    commonIncidentType: 'Robo con violencia / Uso de jammer (71%)',
    recommendations: [
      'Comunicación satelital OBLIGATORIA (71% uso de jammers en zona)',
      'Restricción horaria: Evitar 19:00-06:00',
      'Check-in cada 10 min por zona industrial',
      'NO pernoctar en zona bajo ninguna circunstancia',
    ],
    waypoints: [[-99.2100, 19.6500], [-99.1700, 19.6458], [-99.1200, 19.5700]],
  },
  {
    id: 'edomex-ind-2',
    corridorId: 'edomex-industrial',
    name: 'Ecatepec - Zona Industrial Oriente',
    kmStart: 22,
    kmEnd: 45,
    riskLevel: 'extremo',
    avgMonthlyEvents: 12,
    criticalHours: '18:00-02:00',
    commonIncidentType: 'Robo organizado / Bloqueo con vehículos',
    recommendations: [
      'Comunicación satelital OBLIGATORIA',
      'Convoy mínimo 2 unidades para carga >$2M',
      'Protocolo anti-bloqueo activo',
      'Reportar posición al ENTRAR y SALIR de zona',
    ],
    waypoints: [[-99.0600, 19.6010], [-99.0800, 19.5500], [-99.1400, 19.6800]],
  },
  {
    id: 'edomex-ind-3',
    corridorId: 'edomex-industrial',
    name: 'Tultitlán - Cuautitlán Izcalli',
    kmStart: 45,
    kmEnd: 65,
    riskLevel: 'alto',
    avgMonthlyEvents: 6,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo con violencia en paradas',
    recommendations: [
      'Evitar paradas en zona',
      'Monitoreo GPS cada 10 min',
      'NO bajar de unidad por ningún motivo',
    ],
    waypoints: [[-99.2000, 19.5400], [-99.2300, 19.4800], [-99.2600, 19.5200]],
  },
  {
    id: 'edomex-ind-4',
    corridorId: 'edomex-industrial',
    name: 'Naucalpan Sur - Zona Satélite',
    kmStart: 65,
    kmEnd: 85,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: [
      'Monitoreo GPS estándar',
      'Evitar paradas no programadas',
    ],
    waypoints: [[-99.2600, 19.5200], [-99.2300, 19.5100], [-99.2100, 19.5000]],
  },

  // ============================================================
  // CORREDOR: México-Texcoco - 45km (P0 - EXTREMO)
  // 7 ev/hex, corredor oriente ZMVM
  // ============================================================
  {
    id: 'mex-tex-1',
    corridorId: 'mexico-texcoco',
    name: 'CDMX Oriente - Los Reyes La Paz',
    kmStart: 0,
    kmEnd: 15,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '18:00-01:00',
    commonIncidentType: 'Robo con violencia en congestionamiento',
    recommendations: [
      'Evitar horario pico y nocturno',
      'Monitoreo GPS cada 10 min',
      'No detenerse en semáforos prolongados',
    ],
    waypoints: [[-99.0700, 19.4300], [-98.9800, 19.4500]],
  },
  {
    id: 'mex-tex-2',
    corridorId: 'mexico-texcoco',
    name: 'Los Reyes - Chicoloapan',
    kmStart: 15,
    kmEnd: 30,
    riskLevel: 'extremo',
    avgMonthlyEvents: 8,
    criticalHours: '19:00-05:00',
    commonIncidentType: 'Robo organizado / Jammer + bloqueo',
    recommendations: [
      'Comunicación satelital OBLIGATORIA',
      'Restricción horaria: Evitar 19:00-05:00',
      'Convoy para carga >$1.5M',
      'Check-in cada 10 min',
    ],
    waypoints: [[-98.9800, 19.4500], [-98.9200, 19.4800]],
  },
  {
    id: 'mex-tex-3',
    corridorId: 'mexico-texcoco',
    name: 'Chicoloapan - Texcoco',
    kmStart: 30,
    kmEnd: 45,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo con violencia',
    recommendations: [
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
      'Reportar al salir de zona',
    ],
    waypoints: [[-98.9200, 19.4800], [-98.8800, 19.5100], [-98.8200, 19.5400]],
  },

  // ============================================================
  // CORREDOR: Córdoba-Orizaba-Puebla (150D Sur) - 190km (P0 - NUEVO)
  // AMESIS 2025: 19% de incidentes nacionales, 2do más peligroso
  // ============================================================
  {
    id: 'cor-pue-1',
    corridorId: 'cordoba-puebla',
    name: 'Córdoba - Orizaba',
    kmStart: 0,
    kmEnd: 25,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: [
      'Monitoreo GPS estándar',
      'Evitar paradas en zona urbana',
    ],
    waypoints: [[-96.9300, 18.8900], [-97.0900, 18.8500]],
  },
  {
    id: 'cor-pue-2',
    corridorId: 'cordoba-puebla',
    name: 'Orizaba - Cumbres de Maltrata',
    kmStart: 25,
    kmEnd: 60,
    riskLevel: 'extremo',
    avgMonthlyEvents: 9,
    criticalHours: '19:00-06:00',
    commonIncidentType: 'Robo organizado / Bloqueo con tráileres',
    recommendations: [
      'ZONA CRÍTICA NACIONAL — 19% incidentes país',
      'Comunicación satelital OBLIGATORIA (alto uso de jammers)',
      'Restricción horaria: Evitar 19:00-06:00',
      'Convoy mínimo 2 unidades',
      'Check-in cada 10 min',
    ],
    waypoints: [[-97.0900, 18.8500], [-97.2500, 18.8200], [-97.4000, 18.8000]],
  },
  {
    id: 'cor-pue-3',
    corridorId: 'cordoba-puebla',
    name: 'Cumbres de Maltrata - Esperanza',
    kmStart: 60,
    kmEnd: 100,
    riskLevel: 'alto',
    avgMonthlyEvents: 6,
    criticalHours: '20:00-05:00',
    commonIncidentType: 'Robo con violencia / Zona serrana',
    recommendations: [
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
      'Cuidado con neblina en zona alta',
    ],
    waypoints: [[-97.4000, 18.8000], [-97.6300, 18.8300]],
  },
  {
    id: 'cor-pue-4',
    corridorId: 'cordoba-puebla',
    name: 'Esperanza - Tehuacán Entronque',
    kmStart: 100,
    kmEnd: 140,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: [
      'Monitoreo GPS estándar',
      'Evitar paradas no programadas',
    ],
    waypoints: [[-97.6300, 18.8300], [-97.8500, 18.9200]],
  },
  {
    id: 'cor-pue-5',
    corridorId: 'cordoba-puebla',
    name: 'Amozoc - Puebla',
    kmStart: 140,
    kmEnd: 190,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '18:00-02:00',
    commonIncidentType: 'Robo con violencia / Zona industrial Amozoc',
    recommendations: [
      'Evitar tránsito nocturno',
      'Puebla = 22% incidencia estatal',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-97.8500, 18.9200], [-98.0500, 19.0000], [-98.2000, 19.0414]],
  },

  // ============================================================
  // CORREDOR: CDMX-Cuernavaca-Acapulco (95D) - 380km (P0 - NUEVO)
  // Guerrero = zona roja, bloqueos frecuentes
  // ============================================================
  {
    id: 'cdmx-aca-1',
    corridorId: 'cdmx-cuernavaca-acapulco',
    name: 'CDMX Sur - Tres Marías',
    kmStart: 0,
    kmEnd: 50,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: [
      'Monitoreo GPS estándar',
      'Cuidado neblina zona alta (3,100 msnm)',
    ],
    waypoints: [[-99.1700, 19.4200], [-99.2200, 19.2500]],
  },
  {
    id: 'cdmx-aca-2',
    corridorId: 'cdmx-cuernavaca-acapulco',
    name: 'Tres Marías - Cuernavaca',
    kmStart: 50,
    kmEnd: 85,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: [
      'Monitoreo GPS estándar',
      'Autopista de cuota relativamente segura',
    ],
    waypoints: [[-99.2200, 19.2500], [-99.2340, 18.9220]],
  },
  {
    id: 'cdmx-aca-3',
    corridorId: 'cdmx-cuernavaca-acapulco',
    name: 'Cuernavaca - Iguala',
    kmStart: 85,
    kmEnd: 190,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo con violencia / Bloqueos carreteros',
    recommendations: [
      'Evitar tránsito nocturno OBLIGATORIO',
      'Verificar alertas de bloqueos antes de partir',
      'Comunicación reforzada con C4',
      'Check-in cada 15 min',
    ],
    waypoints: [[-99.2340, 18.9220], [-99.3500, 18.7500], [-99.5000, 18.4500], [-99.6500, 18.0000]],
  },
  {
    id: 'cdmx-aca-4',
    corridorId: 'cdmx-cuernavaca-acapulco',
    name: 'Iguala - Chilpancingo',
    kmStart: 190,
    kmEnd: 280,
    riskLevel: 'extremo',
    avgMonthlyEvents: 8,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo organizado / Secuestro / Bloqueos',
    recommendations: [
      'ZONA ROJA GUERRERO — Restricción horaria OBLIGATORIA 18:00-06:00',
      'Comunicación satelital OBLIGATORIA',
      'Custodia reforzada requerida',
      'Check-in cada 10 min',
      'Protocolo anti-bloqueo activo',
    ],
    waypoints: [[-99.6500, 18.0000], [-99.7500, 17.5500]],
  },
  {
    id: 'cdmx-aca-5',
    corridorId: 'cdmx-cuernavaca-acapulco',
    name: 'Chilpancingo - Acapulco',
    kmStart: 280,
    kmEnd: 380,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '19:00-05:00',
    commonIncidentType: 'Robo con violencia / Bloqueos esporádicos',
    recommendations: [
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
      'Verificar condiciones viales por fenómenos naturales',
    ],
    waypoints: [[-99.7500, 17.5500], [-99.8900, 16.8500]],
  },

  // ============================================================
  // CORREDOR: CDMX-Pachuca (85D) - 95km (P0 - NUEVO)
  // ============================================================
  {
    id: 'cdmx-pac-1',
    corridorId: 'cdmx-pachuca',
    name: 'CDMX Norte - Ecatepec',
    kmStart: 0,
    kmEnd: 25,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '18:00-22:00',
    commonIncidentType: 'Robo urbano en congestionamiento',
    recommendations: [
      'Evitar horario pico',
      'Monitoreo GPS estándar',
    ],
    waypoints: [[-99.1332, 19.4326], [-99.0800, 19.5300]],
  },
  {
    id: 'cdmx-pac-2',
    corridorId: 'cdmx-pachuca',
    name: 'Ecatepec - Tizayuca',
    kmStart: 25,
    kmEnd: 55,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo con violencia / Zona periurbana',
    recommendations: [
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
      'Conexión con Arco Norte — verificar estado',
    ],
    waypoints: [[-99.0800, 19.5300], [-98.9500, 19.6100]],
  },
  {
    id: 'cdmx-pac-3',
    corridorId: 'cdmx-pachuca',
    name: 'Tizayuca - Pachuca',
    kmStart: 55,
    kmEnd: 95,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: [
      'Monitoreo GPS estándar',
      'Autopista de cuota segura',
    ],
    waypoints: [[-98.9500, 19.6100], [-98.8200, 19.7200], [-98.7300, 20.1010]],
  },

  // ============================================================
  // CORREDOR: Torreón-Monterrey (40D) - 300km (P1 - NUEVO)
  // ============================================================
  {
    id: 'tor-mty-1',
    corridorId: 'torreon-monterrey',
    name: 'Torreón - Gómez Palacio',
    kmStart: 0,
    kmEnd: 30,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Evitar paradas urbanas'],
    waypoints: [[-103.4500, 25.5400], [-103.2000, 25.4200]],
  },
  {
    id: 'tor-mty-2',
    corridorId: 'torreon-monterrey',
    name: 'Gómez Palacio - Parras',
    kmStart: 30,
    kmEnd: 120,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '19:00-06:00',
    commonIncidentType: 'Robo con violencia / Zona desértica',
    recommendations: [
      'Evitar tránsito nocturno OBLIGATORIO',
      'Zona de baja cobertura celular — check-in antes/después',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-103.2000, 25.4200], [-102.5500, 25.3000]],
  },
  {
    id: 'tor-mty-3',
    corridorId: 'torreon-monterrey',
    name: 'Parras - Saltillo Sur',
    kmStart: 120,
    kmEnd: 200,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-102.5500, 25.3000], [-101.4500, 25.3800]],
  },
  {
    id: 'tor-mty-4',
    corridorId: 'torreon-monterrey',
    name: 'Saltillo - Monterrey',
    kmStart: 200,
    kmEnd: 300,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia / Zona urbana',
    recommendations: ['Monitoreo GPS estándar', 'Evitar horario pico'],
    waypoints: [[-101.0000, 25.4200], [-100.3100, 25.6700]],
  },

  // ============================================================
  // CORREDOR: Chihuahua-Cd. Juárez (45 Norte) - 370km (P1 - NUEVO)
  // ============================================================
  {
    id: 'chi-jua-1',
    corridorId: 'chihuahua-ciudad-juarez',
    name: 'Chihuahua - Sacramento',
    kmStart: 0,
    kmEnd: 80,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-106.0889, 28.6353], [-106.3500, 29.1000]],
  },
  {
    id: 'chi-jua-2',
    corridorId: 'chihuahua-ciudad-juarez',
    name: 'Sacramento - Villa Ahumada',
    kmStart: 80,
    kmEnd: 180,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '19:00-06:00',
    commonIncidentType: 'Robo con violencia / Zona desértica aislada',
    recommendations: [
      'Evitar tránsito nocturno',
      'Zona de baja cobertura — check-in antes/después',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-106.3500, 29.1000], [-106.4000, 29.5500]],
  },
  {
    id: 'chi-jua-3',
    corridorId: 'chihuahua-ciudad-juarez',
    name: 'Villa Ahumada - Samalayuca',
    kmStart: 180,
    kmEnd: 280,
    riskLevel: 'alto',
    avgMonthlyEvents: 4,
    criticalHours: '20:00-05:00',
    commonIncidentType: 'Robo con violencia / Narcotráfico',
    recommendations: [
      'Evitar tránsito nocturno',
      'Zona de alto riesgo por presencia de cárteles',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-106.4000, 29.5500], [-106.4200, 30.3500]],
  },
  {
    id: 'chi-jua-4',
    corridorId: 'chihuahua-ciudad-juarez',
    name: 'Samalayuca - Cd. Juárez',
    kmStart: 280,
    kmEnd: 370,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo urbano',
    recommendations: ['Monitoreo GPS estándar', 'Documentación fronteriza lista'],
    waypoints: [[-106.4200, 30.3500], [-106.4300, 31.7400]],
  },

  // ============================================================
  // CORREDOR: Villahermosa-Coatzacoalcos (180) - 250km (P1 - NUEVO)
  // ============================================================
  {
    id: 'vil-coatz-1',
    corridorId: 'villahermosa-coatzacoalcos',
    name: 'Villahermosa - Cárdenas',
    kmStart: 0,
    kmEnd: 55,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar'],
    waypoints: [[-92.9475, 17.9893], [-93.2000, 18.0500]],
  },
  {
    id: 'vil-coatz-2',
    corridorId: 'villahermosa-coatzacoalcos',
    name: 'Cárdenas - Agua Dulce',
    kmStart: 55,
    kmEnd: 140,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia / Zona petrolera',
    recommendations: ['Evitar paradas no programadas', 'Monitoreo GPS estándar'],
    waypoints: [[-93.2000, 18.0500], [-93.6000, 18.1500]],
  },
  {
    id: 'vil-coatz-3',
    corridorId: 'villahermosa-coatzacoalcos',
    name: 'Agua Dulce - Coatzacoalcos',
    kmStart: 140,
    kmEnd: 250,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo en zona industrial',
    recommendations: ['Monitoreo GPS estándar', 'Verificar sellos en terminal petroquímica'],
    waypoints: [[-93.6000, 18.1500], [-94.1000, 18.1000], [-94.4300, 18.1300]],
  },

  // ============================================================
  // CORREDOR: Tepic-Mazatlán (15D Norte) - 290km (P1 - NUEVO)
  // ============================================================
  {
    id: 'tep-maz-1',
    corridorId: 'tepic-mazatlan',
    name: 'Tepic - Acaponeta',
    kmStart: 0,
    kmEnd: 100,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-05:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Evitar paradas en zona serrana'],
    waypoints: [[-104.8950, 21.5040], [-105.2500, 21.8000]],
  },
  {
    id: 'tep-maz-2',
    corridorId: 'tepic-mazatlan',
    name: 'Acaponeta - Escuinapa',
    kmStart: 100,
    kmEnd: 190,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia / Zona serrana',
    recommendations: ['Evitar tránsito nocturno recomendado', 'Monitoreo GPS estándar'],
    waypoints: [[-105.2500, 21.8000], [-105.6000, 22.3000]],
  },
  {
    id: 'tep-maz-3',
    corridorId: 'tepic-mazatlan',
    name: 'Escuinapa - Mazatlán',
    kmStart: 190,
    kmEnd: 290,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Corredor costero relativamente seguro'],
    waypoints: [[-105.6000, 22.3000], [-105.9500, 22.8000], [-106.4200, 23.2300]],
  },

  // ============================================================
  // CORREDOR: SLP - Matehuala - Saltillo (57D) - 450km total
  // Principal arteria comercial CDMX-MTY. Altiplano Potosino.
  // ============================================================
  {
    id: 'slp-mat-1',
    corridorId: 'slp-matehuala-saltillo',
    name: 'SLP Norte - Entronque Charcas',
    kmStart: 0,
    kmEnd: 70,
    riskLevel: 'alto',
    avgMonthlyEvents: 4,
    criticalHours: '20:00-06:00',
    commonIncidentType: 'Robo sin violencia / Halconeo',
    recommendations: [
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 15 min',
      'Último punto con cobertura celular confiable',
    ],
    waypoints: [[-100.9800, 22.1500], [-100.8500, 22.4500], [-100.7800, 22.7300]],
  },
  {
    id: 'slp-mat-2',
    corridorId: 'slp-matehuala-saltillo',
    name: 'Charcas - Venado (Altiplano)',
    kmStart: 70,
    kmEnd: 140,
    riskLevel: 'extremo',
    avgMonthlyEvents: 8,
    criticalHours: '19:00-06:00',
    commonIncidentType: 'Robo organizado / Zona sin cobertura',
    recommendations: [
      'Comunicación satelital OBLIGATORIA (zona muerta confirmada)',
      'Restricción horaria absoluta: NO transitar 19:00-06:00',
      'Check-in obligatorio km 70 ANTES de entrar',
      'Convoy mínimo 2 unidades para carga >$1.5M MXN',
      'Protocolo anti-jammer activo (71% uso nacional)',
    ],
    waypoints: [[-100.7800, 22.7300], [-100.7200, 22.8500], [-100.6800, 23.0000]],
  },
  {
    id: 'slp-mat-3',
    corridorId: 'slp-matehuala-saltillo',
    name: 'Venado - Matehuala Sur',
    kmStart: 140,
    kmEnd: 200,
    riskLevel: 'extremo',
    avgMonthlyEvents: 7,
    criticalHours: '19:00-06:00',
    commonIncidentType: 'Emboscada / Robo con violencia / Halcones',
    recommendations: [
      'ZONA MÁS AISLADA del corredor - Comunicación satelital OBLIGATORIA',
      'NO transitar 19:00-06:00 bajo ninguna circunstancia',
      'Check-in obligatorio al SALIR de zona (km 200)',
      'Contacto previo con base GN Matehuala',
      'Convoy mínimo 2 unidades para cualquier carga de valor',
      'Protocolo anti-jammer activo',
    ],
    waypoints: [[-100.6800, 23.0000], [-100.6500, 23.2000], [-100.6300, 23.4000]],
  },
  {
    id: 'slp-mat-4',
    corridorId: 'slp-matehuala-saltillo',
    name: 'Matehuala',
    kmStart: 200,
    kmEnd: 230,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo en accesos / Robo en estaciones de servicio',
    recommendations: [
      'Evitar paradas en accesos sur y norte',
      'Usar gasolinera vigilada Matehuala centro',
      'Check-in al pasar por Matehuala',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-100.6300, 23.4000], [-100.6500, 23.6400], [-100.6500, 23.6800]],
  },
  {
    id: 'slp-mat-5',
    corridorId: 'slp-matehuala-saltillo',
    name: 'Matehuala - La Ventura',
    kmStart: 230,
    kmEnd: 300,
    riskLevel: 'alto',
    avgMonthlyEvents: 4,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia / Baja vigilancia',
    recommendations: [
      'Tramo desértico norte con baja vigilancia',
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 15 min',
    ],
    waypoints: [[-100.6500, 23.6800], [-100.7000, 23.8500], [-100.7500, 24.0500]],
  },
  {
    id: 'slp-mat-6',
    corridorId: 'slp-matehuala-saltillo',
    name: 'La Ventura - Saltillo Sur',
    kmStart: 300,
    kmEnd: 380,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: [
      'Mejora gradual de infraestructura',
      'Monitoreo GPS estándar',
      'Evitar paradas no programadas',
    ],
    waypoints: [[-100.7500, 24.0500], [-100.8000, 24.3000], [-100.8500, 24.4500], [-101.0000, 25.0000]],
  },
  {
    id: 'slp-mat-7',
    corridorId: 'slp-matehuala-saltillo',
    name: 'Saltillo Sur - Entronque MTY',
    kmStart: 380,
    kmEnd: 450,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: [
      'Zona periurbana Saltillo',
      'Conexión con 40D hacia Monterrey',
      'Monitoreo GPS estándar',
    ],
    waypoints: [[-101.0000, 25.0000], [-101.0000, 25.2000], [-101.0000, 25.4200]],
  },

  // ============================================================
  // CORREDOR: Monterrey - Saltillo (40D) - 85km total
  // ============================================================
  {
    id: 'mty-sal-1',
    corridorId: 'monterrey-saltillo',
    name: 'Saltillo - Ramos Arizpe',
    kmStart: 0,
    kmEnd: 25,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: [
      'Zona industrial vigilada',
      'Monitoreo GPS estándar',
      'Corredor relativamente seguro',
    ],
    waypoints: [[-101.0000, 25.4200], [-100.9500, 25.5400]],
  },
  {
    id: 'mty-sal-2',
    corridorId: 'monterrey-saltillo',
    name: 'Ramos Arizpe - Santa Catarina',
    kmStart: 25,
    kmEnd: 60,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Accidentes viales / Curvas cerradas',
    recommendations: [
      'Tramo montañoso con curvas cerradas',
      'Precaución con vehículos pesados',
      'Monitoreo GPS estándar',
    ],
    waypoints: [[-100.9500, 25.5400], [-100.6200, 25.5200], [-100.4500, 25.5800]],
  },
  {
    id: 'mty-sal-3',
    corridorId: 'monterrey-saltillo',
    name: 'Santa Catarina - Monterrey',
    kmStart: 60,
    kmEnd: 85,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: [
      'Zona metropolitana MTY',
      'Monitoreo GPS estándar',
      'Corredor urbano seguro',
    ],
    waypoints: [[-100.4500, 25.5800], [-100.3100, 25.6700]],
  },

  // ============================================================
  // CORREDOR: Mazatlán-Durango-Torreón - 520km
  // ============================================================
  {
    id: 'maz-dur-1',
    corridorId: 'mazatlan-durango-torreon',
    name: 'Mazatlán - Concordia',
    kmStart: 0,
    kmEnd: 50,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Monitoreo GPS estándar', 'Zona costera, salida urbana'],
    waypoints: [[-106.4200, 23.2300], [-105.9700, 23.4500]],
  },
  {
    id: 'maz-dur-2',
    corridorId: 'mazatlan-durango-torreon',
    name: 'Concordia - Espinazo del Diablo',
    kmStart: 50,
    kmEnd: 120,
    riskLevel: 'extremo',
    avgMonthlyEvents: 8,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Emboscadas / Robo organizado / Narcotráfico',
    recommendations: [
      'Comunicación satelital OBLIGATORIA',
      'Restricción horaria: NO transitar 18:00-06:00',
      'Zona de túneles y puentes críticos',
      'Protocolo anti-jammer activo',
      'Convoy mínimo 2 unidades para carga >$2M',
    ],
    waypoints: [[-105.9700, 23.4500], [-105.9500, 23.5500], [-105.8500, 23.6500], [-105.8000, 23.7500]],
  },
  {
    id: 'maz-dur-3',
    corridorId: 'mazatlan-durango-torreon',
    name: 'Espinazo - El Salto',
    kmStart: 120,
    kmEnd: 180,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-06:00',
    commonIncidentType: 'Robo con violencia / Grupos armados',
    recommendations: [
      'Zona serrana con presencia de grupos armados',
      'Evitar paradas no programadas',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-105.8000, 23.7500], [-105.5000, 23.8500], [-105.3500, 23.9500]],
  },
  {
    id: 'maz-dur-4',
    corridorId: 'mazatlan-durango-torreon',
    name: 'El Salto - Durango',
    kmStart: 180,
    kmEnd: 260,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Bajada al altiplano, mejora infraestructura', 'Monitoreo GPS estándar'],
    waypoints: [[-105.3500, 23.9500], [-105.0200, 24.0200], [-104.6700, 24.0300]],
  },
  {
    id: 'maz-dur-5',
    corridorId: 'mazatlan-durango-torreon',
    name: 'Durango - Nombre de Dios',
    kmStart: 260,
    kmEnd: 370,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Transición al desierto', 'Monitoreo GPS estándar'],
    waypoints: [[-104.6700, 24.0300], [-104.4500, 24.8500], [-104.2000, 25.1000]],
  },
  {
    id: 'maz-dur-6',
    corridorId: 'mazatlan-durango-torreon',
    name: 'Nombre de Dios - Torreón',
    kmStart: 370,
    kmEnd: 520,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo organizado / Conflicto entre cárteles',
    recommendations: [
      'Zona La Laguna, conflicto entre cárteles',
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-104.2000, 25.1000], [-103.7500, 25.3000], [-103.4500, 25.5400]],
  },

  // ============================================================
  // CORREDOR: México-Nogales (15D) - Segmentación granular
  // ============================================================
  {
    id: 'nog-1',
    corridorId: 'mexico-nogales',
    name: 'GDL - Tequila - Magdalena',
    kmStart: 0,
    kmEnd: 120,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Salida GDL hacia costa', 'Monitoreo GPS estándar'],
    waypoints: [[-103.3500, 20.6700], [-103.7500, 20.8500], [-104.1000, 20.9200]],
  },
  {
    id: 'nog-2',
    corridorId: 'mexico-nogales',
    name: 'Magdalena Jalisco - Tepic',
    kmStart: 120,
    kmEnd: 220,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Sierra con curvas', 'Monitoreo GPS estándar'],
    waypoints: [[-104.1000, 20.9200], [-104.5000, 21.2000], [-104.8950, 21.5040]],
  },
  {
    id: 'nog-3',
    corridorId: 'mexico-nogales',
    name: 'Tepic - Acaponeta',
    kmStart: 220,
    kmEnd: 320,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Parcialmente cubierto por tepic-mazatlan', 'Monitoreo GPS estándar'],
    waypoints: [[-104.8950, 21.5040], [-105.2500, 21.8000], [-105.3700, 22.0000]],
  },
  {
    id: 'nog-4',
    corridorId: 'mexico-nogales',
    name: 'Mazatlán - Culiacán',
    kmStart: 320,
    kmEnd: 540,
    riskLevel: 'alto',
    avgMonthlyEvents: 6,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo organizado / Zona cártel',
    recommendations: [
      'Sinaloa norte. Zona de operación de cárteles',
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
      'Custodia armada recomendada',
    ],
    waypoints: [[-106.4200, 23.2300], [-106.8000, 24.0000], [-107.3900, 24.7900]],
  },
  {
    id: 'nog-5',
    corridorId: 'mexico-nogales',
    name: 'Culiacán - Los Mochis',
    kmStart: 540,
    kmEnd: 740,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-06:00',
    commonIncidentType: 'Robo agrícola / Actividad delictiva',
    recommendations: [
      'Corredor agrícola Sinaloa',
      'Robos organizados frecuentes',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-107.3900, 24.7900], [-107.9500, 25.3500], [-108.9900, 25.7700]],
  },
  {
    id: 'nog-6',
    corridorId: 'mexico-nogales',
    name: 'Los Mochis - Guaymas',
    kmStart: 740,
    kmEnd: 960,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Zona agrícola Sonora', 'Monitoreo GPS estándar'],
    waypoints: [[-108.9900, 25.7700], [-109.5500, 26.9000], [-109.9400, 27.4800], [-110.9000, 27.9700]],
  },
  {
    id: 'nog-7',
    corridorId: 'mexico-nogales',
    name: 'Guaymas - Hermosillo',
    kmStart: 960,
    kmEnd: 1090,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Zona industrial, autopista moderna', 'Monitoreo GPS estándar'],
    waypoints: [[-110.9000, 27.9700], [-110.9700, 29.0700]],
  },
  {
    id: 'nog-8',
    corridorId: 'mexico-nogales',
    name: 'Hermosillo - Magdalena Sonora',
    kmStart: 1090,
    kmEnd: 1300,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Incidentes aislados / Baja cobertura',
    recommendations: ['Desierto Sonora, baja cobertura', 'Verificar combustible'],
    waypoints: [[-110.9700, 29.0700], [-110.9500, 29.5500], [-110.9600, 30.3000]],
  },
  {
    id: 'nog-9',
    corridorId: 'mexico-nogales',
    name: 'Magdalena - Santa Ana',
    kmStart: 1300,
    kmEnd: 1400,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Zona relativamente segura', 'Monitoreo GPS estándar'],
    waypoints: [[-110.9600, 30.3000], [-110.9500, 30.6300]],
  },
  {
    id: 'nog-10',
    corridorId: 'mexico-nogales',
    name: 'Santa Ana - Nogales',
    kmStart: 1400,
    kmEnd: 1550,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Tráfico de drogas / Zona fronteriza',
    recommendations: ['Aproximación frontera', 'Monitoreo GPS estándar', 'Documentación en orden'],
    waypoints: [[-110.9500, 30.6300], [-110.9400, 31.3100]],
  },

  // ============================================================
  // CORREDOR: Guadalajara-Lagos de Moreno - 190km
  // ============================================================
  {
    id: 'gdl-lag-1',
    corridorId: 'guadalajara-lagos',
    name: 'GDL - Zapotlanejo',
    kmStart: 0,
    kmEnd: 35,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Salida metropolitana', 'Monitoreo GPS estándar'],
    waypoints: [[-103.3500, 20.6700], [-103.1800, 20.7200]],
  },
  {
    id: 'gdl-lag-2',
    corridorId: 'guadalajara-lagos',
    name: 'Zapotlanejo - Tepatitlán',
    kmStart: 35,
    kmEnd: 80,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-06:00',
    commonIncidentType: 'Robo organizado / Altos de Jalisco',
    recommendations: [
      'Zona de robos en Altos de Jalisco',
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-103.1800, 20.7200], [-102.9500, 20.8100], [-102.7500, 20.8500]],
  },
  {
    id: 'gdl-lag-3',
    corridorId: 'guadalajara-lagos',
    name: 'Tepatitlán - San Juan de los Lagos',
    kmStart: 80,
    kmEnd: 140,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Zona semi-rural', 'Monitoreo GPS estándar'],
    waypoints: [[-102.7500, 20.8500], [-102.5000, 21.0500], [-102.3400, 21.2500]],
  },
  {
    id: 'gdl-lag-4',
    corridorId: 'guadalajara-lagos',
    name: 'San Juan - Lagos de Moreno',
    kmStart: 140,
    kmEnd: 190,
    riskLevel: 'alto',
    avgMonthlyEvents: 4,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo organizado',
    recommendations: [
      'Entrada al Bajío, convergencia con 45D',
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-102.3400, 21.2500], [-102.0800, 21.4200]],
  },

  // ============================================================
  // CORREDOR: Guadalajara-Tepic (15D) - 220km
  // ============================================================
  {
    id: 'gdl-tep-1',
    corridorId: 'guadalajara-tepic',
    name: 'GDL - Tequila',
    kmStart: 0,
    kmEnd: 60,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Autopista moderna, zona turística', 'Monitoreo GPS estándar'],
    waypoints: [[-103.3500, 20.6700], [-103.7500, 20.8500]],
  },
  {
    id: 'gdl-tep-2',
    corridorId: 'guadalajara-tepic',
    name: 'Tequila - Plan de Barrancas',
    kmStart: 60,
    kmEnd: 120,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Inicio Barranca, curvas cerradas', 'Monitoreo GPS estándar', 'Baja cobertura celular'],
    waypoints: [[-103.7500, 20.8500], [-104.0000, 20.9500], [-104.2000, 21.0500]],
  },
  {
    id: 'gdl-tep-3',
    corridorId: 'guadalajara-tepic',
    name: 'Barrancas - Compostela',
    kmStart: 120,
    kmEnd: 170,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Sierra serrana, baja cobertura', 'Monitoreo GPS estándar'],
    waypoints: [[-104.2000, 21.0500], [-104.4500, 21.1500], [-104.6000, 21.2500]],
  },
  {
    id: 'gdl-tep-4',
    corridorId: 'guadalajara-tepic',
    name: 'Compostela - Tepic',
    kmStart: 170,
    kmEnd: 220,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Bajada al valle de Tepic', 'Monitoreo GPS estándar'],
    waypoints: [[-104.6000, 21.2500], [-104.8950, 21.5040]],
  },

  // ============================================================
  // CORREDOR: Culiacán-Guaymas (15D Sinaloa-Sonora) - 600km
  // ============================================================
  {
    id: 'cul-guay-1',
    corridorId: 'culiacan-guaymas',
    name: 'Culiacán - Guamúchil',
    kmStart: 0,
    kmEnd: 80,
    riskLevel: 'alto',
    avgMonthlyEvents: 6,
    criticalHours: '18:00-06:00',
    commonIncidentType: 'Robo organizado / Zona cártel',
    recommendations: [
      'Sinaloa central. Zona de operación de cárteles',
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
      'Custodia armada recomendada',
    ],
    waypoints: [[-107.3900, 24.7900], [-107.5500, 25.0500], [-107.9500, 25.3500]],
  },
  {
    id: 'cul-guay-2',
    corridorId: 'culiacan-guaymas',
    name: 'Guamúchil - Los Mochis',
    kmStart: 80,
    kmEnd: 200,
    riskLevel: 'alto',
    avgMonthlyEvents: 5,
    criticalHours: '20:00-06:00',
    commonIncidentType: 'Robo agrícola / Robos organizados',
    recommendations: [
      'Zona agrícola con robos organizados',
      'Evitar tránsito nocturno',
      'Monitoreo GPS cada 10 min',
    ],
    waypoints: [[-107.9500, 25.3500], [-108.4500, 25.5500], [-108.9900, 25.7700]],
  },
  {
    id: 'cul-guay-3',
    corridorId: 'culiacan-guaymas',
    name: 'Los Mochis - Topolobampo',
    kmStart: 200,
    kmEnd: 230,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Robo sin violencia',
    recommendations: ['Acceso a puerto. Zona controlada', 'Monitoreo GPS estándar'],
    waypoints: [[-108.9900, 25.7700], [-109.0500, 25.6000]],
  },
  {
    id: 'cul-guay-4',
    corridorId: 'culiacan-guaymas',
    name: 'Los Mochis - Navojoa',
    kmStart: 230,
    kmEnd: 380,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Zona agrícola Sonora sur', 'Monitoreo GPS estándar'],
    waypoints: [[-108.9900, 25.7700], [-109.2500, 26.3000], [-109.5500, 26.9000]],
  },
  {
    id: 'cul-guay-5',
    corridorId: 'culiacan-guaymas',
    name: 'Navojoa - Cd. Obregón',
    kmStart: 380,
    kmEnd: 440,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Valle del Yaqui, zona agrícola segura', 'Monitoreo GPS estándar'],
    waypoints: [[-109.5500, 26.9000], [-109.9400, 27.4800]],
  },
  {
    id: 'cul-guay-6',
    corridorId: 'culiacan-guaymas',
    name: 'Cd. Obregón - Guaymas',
    kmStart: 440,
    kmEnd: 600,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Autopista moderna, zona industrial', 'Monitoreo GPS estándar'],
    waypoints: [[-109.9400, 27.4800], [-110.4500, 27.7500], [-110.9000, 27.9700]],
  },

  // ============================================================
  // CORREDOR: Hermosillo-Nogales (15D Norte) - 280km
  // ============================================================
  {
    id: 'her-nog-1',
    corridorId: 'hermosillo-nogales',
    name: 'Hermosillo - Magdalena',
    kmStart: 0,
    kmEnd: 130,
    riskLevel: 'medio',
    avgMonthlyEvents: 2,
    criticalHours: '22:00-04:00',
    commonIncidentType: 'Incidentes aislados / Baja cobertura',
    recommendations: ['Desierto Sonora, baja cobertura', 'Verificar combustible', 'Monitoreo GPS estándar'],
    waypoints: [[-110.9700, 29.0700], [-110.9500, 29.5500], [-110.9600, 30.3000]],
  },
  {
    id: 'her-nog-2',
    corridorId: 'hermosillo-nogales',
    name: 'Magdalena - Santa Ana',
    kmStart: 130,
    kmEnd: 200,
    riskLevel: 'bajo',
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Zona relativamente segura', 'Monitoreo GPS estándar'],
    waypoints: [[-110.9600, 30.3000], [-110.9500, 30.6300]],
  },
  {
    id: 'her-nog-3',
    corridorId: 'hermosillo-nogales',
    name: 'Santa Ana - Nogales',
    kmStart: 200,
    kmEnd: 280,
    riskLevel: 'medio',
    avgMonthlyEvents: 3,
    criticalHours: '20:00-04:00',
    commonIncidentType: 'Tráfico fronterizo',
    recommendations: ['Aproximación fronteriza', 'Documentación en orden', 'Monitoreo GPS estándar'],
    waypoints: [[-110.9500, 30.6300], [-110.9400, 31.3100]],
  },
];

export const HIGHWAY_POIS: POI[] = [
  // === PUNTOS NEGROS (Alta incidencia) ===
  {
    id: 'blackspot-texmelucan',
    name: 'San Martín Texmelucan',
    type: 'blackspot',
    coordinates: [-98.4400, 19.2750],
    description: 'Zona de mayor incidencia en corredor México-Puebla. Robos frecuentes.',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-slp-soledad',
    name: 'Soledad de G.S. - SLP',
    type: 'blackspot',
    coordinates: [-100.8800, 22.2000],
    description: '#1 nacional en robos de carga 2024-2025. Evitar tránsito nocturno.',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-palmillas',
    name: 'Palmillas (Hwy 57)',
    type: 'blackspot',
    coordinates: [-99.8500, 20.3200],
    description: 'Zona de bloqueos frecuentes. Alto riesgo nocturno.',
    riskLevel: 'alto', // Recalibrado de extremo
  },
  {
    id: 'blackspot-celaya',
    name: 'Celaya-Salamanca',
    type: 'blackspot',
    coordinates: [-100.9500, 20.5500],
    description: 'Corredor Bajío con alta actividad delictiva organizada.',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-tierra-caliente',
    name: 'Tierra Caliente (Michoacán)',
    type: 'blackspot',
    coordinates: [-101.5000, 18.5000],
    description: 'Zona de alto riesgo entre Lázaro Cárdenas y Uruapan.',
    riskLevel: 'extremo',
  },

  // === CASETAS DE COBRO (Puntos de emboscada potenciales) ===
  {
    id: 'toll-tepotzotlan',
    name: 'Caseta Tepotzotlán',
    type: 'tollbooth',
    coordinates: [-99.2200, 19.6800],
    description: 'Caseta principal salida norte CDMX. Verificar sellos antes de pasar.',
  },
  {
    id: 'toll-palmillas',
    name: 'Caseta Palmillas',
    type: 'tollbooth',
    coordinates: [-99.8300, 20.2800],
    description: 'Caseta en zona de riesgo. No detenerse más de lo necesario.',
  },
  {
    id: 'toll-san-martin',
    name: 'Caseta San Martín',
    type: 'tollbooth',
    coordinates: [-98.5200, 19.2600],
    description: 'Caseta México-Puebla. Zona monitoreada pero alto riesgo periférico.',
  },
  {
    id: 'toll-cuota-slp',
    name: 'Caseta SLP (57D)',
    type: 'tollbooth',
    coordinates: [-100.7800, 22.1800],
    description: 'Entrada/salida autopista SLP. Verificar documentos.',
  },
  {
    id: 'toll-manzanillo',
    name: 'Caseta Manzanillo',
    type: 'tollbooth',
    coordinates: [-104.2800, 19.1300],
    description: 'Acceso portuario. Control de documentación.',
  },

  // === ENTRONQUES PELIGROSOS ===
  {
    id: 'junction-57-80',
    name: 'Entronque 57/80 (SLP)',
    type: 'junction',
    coordinates: [-100.7500, 22.2800],
    description: 'Convergencia de autopistas. Zona de emboscadas nocturnas.',
    riskLevel: 'extremo',
  },
  {
    id: 'junction-45-54',
    name: 'Entronque 45/54 (Bajío)',
    type: 'junction',
    coordinates: [-101.2000, 20.5700],
    description: 'Cruce Salamanca-Irapuato. Alto tráfico de carga.',
    riskLevel: 'alto',
  },
  {
    id: 'junction-mexico-puebla',
    name: 'Entronque México-Puebla/Texcoco',
    type: 'junction',
    coordinates: [-98.9200, 19.3600],
    description: 'Zona urbana congestionada. Riesgo de robo en tráfico.',
    riskLevel: 'medio', // Recalibrado de alto
  },

  // === ÁREAS SEGURAS - GASOLINERAS VIGILADAS ===
  {
    id: 'safe-queretaro-pemex',
    name: 'Pemex Querétaro Norte',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-100.4100, 20.6200],
    description: 'Gasolinera con vigilancia 24/7. Área de descanso recomendada.',
  },
  {
    id: 'safe-pemex-celaya',
    name: 'Pemex Celaya Libramiento',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-100.8200, 20.5100],
    description: 'Gasolinera vigilada. Punto seguro corredor Bajío.',
  },
  {
    id: 'safe-pemex-leon',
    name: 'Pemex León Norte',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-101.6800, 21.1600],
    description: 'Estación con seguridad privada. Descanso recomendado.',
  },
  {
    id: 'safe-pemex-slp-sur',
    name: 'Pemex SLP Libramiento Sur',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-100.9200, 22.0800],
    description: 'Gasolinera vigilada antes de zona crítica SLP.',
  },
  {
    id: 'safe-pemex-gdl-zapopan',
    name: 'Pemex Zapopan Periférico',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-103.4200, 20.7400],
    description: 'Estación segura en periférico GDL. Punto de espera.',
  },
  {
    id: 'safe-pemex-puebla-norte',
    name: 'Pemex Puebla Autopista',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-98.1800, 19.0800],
    description: 'Gasolinera antes de salida a CDMX. Vigilancia 24h.',
  },
  {
    id: 'safe-pemex-mty-santa-catarina',
    name: 'Pemex Santa Catarina',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-100.4600, 25.6700],
    description: 'Estación vigilada corredor Monterrey-Saltillo.',
  },
  {
    id: 'safe-pemex-aguascalientes',
    name: 'Pemex Aguascalientes Norte',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-102.3000, 21.9200],
    description: 'Punto seguro corredor transversal.',
  },
  {
    id: 'safe-pemex-morelia',
    name: 'Pemex Morelia Libramiento',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-101.2200, 19.7200],
    description: 'Gasolinera vigilada antes de Tierra Caliente.',
  },
  {
    id: 'safe-pemex-colima',
    name: 'Pemex Colima Centro',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-103.7100, 19.2300],
    description: 'Punto de descanso corredor Manzanillo.',
  },

  // === ÁREAS SEGURAS - BASES DE CUSTODIA ===
  {
    id: 'safe-base-detecta-qro',
    name: 'Base Custodia Querétaro',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-100.3800, 20.5900],
    description: 'Base operativa. Relevo de escoltas disponible.',
  },
  {
    id: 'safe-base-detecta-gdl',
    name: 'Base Custodia Guadalajara',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-103.3500, 20.6800],
    description: 'Base operativa GDL. Coordinación de servicios.',
  },
  {
    id: 'safe-base-detecta-mty',
    name: 'Base Custodia Monterrey',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-100.3100, 25.6700],
    description: 'Base operativa MTY. Relevo disponible 24/7.',
  },
  {
    id: 'safe-base-detecta-cdmx',
    name: 'Base Custodia CDMX',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-99.0900, 19.4800],
    description: 'Base central. Coordinación nacional.',
  },
  {
    id: 'safe-base-detecta-manzanillo',
    name: 'Base Custodia Manzanillo',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-104.3100, 19.0600],
    description: 'Base portuaria. Custodia desde puerto.',
  },

  // === ÁREAS SEGURAS - ÁREAS DE DESCANSO ===
  {
    id: 'safe-descanso-slp',
    name: 'Área Descanso SLP Central',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-100.9600, 22.1400],
    description: 'Zona comercial vigilada. Estacionamiento seguro.',
  },
  {
    id: 'safe-descanso-gdl-periferico',
    name: 'Área Descanso GDL Periférico',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-103.3800, 20.7200],
    description: 'Zona industrial con seguridad. Descanso recomendado.',
  },
  {
    id: 'safe-descanso-irapuato',
    name: 'Área Descanso Irapuato',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-101.3600, 20.6800],
    description: 'Estacionamiento vigilado corredor Bajío.',
  },
  {
    id: 'safe-descanso-lagos-moreno',
    name: 'Área Descanso Lagos de Moreno',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-102.3500, 21.3600],
    description: 'Punto seguro corredor transversal.',
  },
  {
    id: 'safe-descanso-san-juan-rio',
    name: 'Área Descanso San Juan del Río',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-99.9800, 20.3900],
    description: 'Plaza comercial con vigilancia. Recomendado.',
  },
  {
    id: 'safe-descanso-cd-valles',
    name: 'Área Descanso Ciudad Valles',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-99.0100, 21.9900],
    description: 'Punto seguro Huasteca. Antes de zona montañosa.',
  },
  {
    id: 'safe-descanso-uruapan',
    name: 'Área Descanso Uruapan',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-102.0600, 19.4200],
    description: 'Punto seguro antes de Tierra Caliente.',
  },
  {
    id: 'safe-descanso-tampico',
    name: 'Área Descanso Tampico',
    type: 'safe_area',
    subtype: 'area_descanso',
    coordinates: [-97.8700, 22.2400],
    description: 'Terminal segura corredor Golfo.',
  },

  // === ÁREAS SEGURAS - PUNTOS DE ENCUENTRO ===
  {
    id: 'safe-encuentro-palmillas',
    name: 'Punto Encuentro Palmillas',
    type: 'safe_area',
    subtype: 'punto_encuentro',
    coordinates: [-99.8400, 20.3100],
    description: 'Caseta Palmillas. Punto de relevo escoltas.',
  },
  {
    id: 'safe-encuentro-tepotzotlan',
    name: 'Punto Encuentro Tepotzotlán',
    type: 'safe_area',
    subtype: 'punto_encuentro',
    coordinates: [-99.2300, 19.7200],
    description: 'Salida CDMX Norte. Inicio custodia.',
  },
  {
    id: 'safe-encuentro-chalco',
    name: 'Punto Encuentro Chalco',
    type: 'safe_area',
    subtype: 'punto_encuentro',
    coordinates: [-98.8800, 19.2700],
    description: 'Antes de zona crítica México-Puebla.',
  },
  {
    id: 'safe-encuentro-soledad',
    name: 'Punto Encuentro Soledad GS',
    type: 'safe_area',
    subtype: 'punto_encuentro',
    coordinates: [-100.8700, 22.1900],
    description: 'Entrada zona crítica SLP. Custodia obligatoria.',
  },
  {
    id: 'safe-encuentro-silao',
    name: 'Punto Encuentro Silao',
    type: 'safe_area',
    subtype: 'punto_encuentro',
    coordinates: [-101.4200, 20.9300],
    description: 'Hub automotriz. Punto de entrega/custodia.',
  },

  // === ÁREAS SEGURAS - PUESTOS MILITARES/GN ===
  {
    id: 'safe-gn-slp-norte',
    name: 'Puesto GN SLP Norte',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-100.7800, 22.3200],
    description: 'Puesto Guardia Nacional permanente. Zona segura.',
  },
  {
    id: 'safe-gn-celaya',
    name: 'Puesto GN Celaya',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-100.8500, 20.5300],
    description: 'Presencia militar permanente corredor Bajío.',
  },
  {
    id: 'safe-sedena-manzanillo',
    name: 'Base Naval Manzanillo',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-104.3400, 19.0400],
    description: 'Zona portuaria militarizada. Alta seguridad.',
  },
  {
    id: 'safe-gn-nuevo-laredo',
    name: 'Puesto GN Nuevo Laredo',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-99.5500, 27.4900],
    description: 'Control fronterizo. Presencia permanente.',
  },

  // === NUEVOS POIs - Corredores P0/P1 ===
  {
    id: 'blackspot-maltrata',
    name: 'Cumbres de Maltrata (150D)',
    type: 'blackspot',
    coordinates: [-97.2500, 18.8200],
    description: 'Zona #2 nacional AMESIS 2025. 19% de incidentes. Bloqueos con tráileres.',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-iguala',
    name: 'Iguala - Autopista del Sol',
    type: 'blackspot',
    coordinates: [-99.6500, 18.0000],
    description: 'Guerrero zona roja. Bloqueos y robos organizados frecuentes.',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-ecatepec',
    name: 'Ecatepec Zona Industrial',
    type: 'blackspot',
    coordinates: [-99.0600, 19.6010],
    description: 'EdoMex = 23% incidencia nacional. Uso intensivo de jammers (71%).',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-villa-ahumada',
    name: 'Villa Ahumada (Chihuahua)',
    type: 'blackspot',
    coordinates: [-106.4000, 29.5500],
    description: 'Zona desértica aislada. Corredor maquiladora con presencia de cárteles.',
    riskLevel: 'alto',
  },
  {
    id: 'toll-cordoba',
    name: 'Caseta Córdoba',
    type: 'tollbooth',
    coordinates: [-96.9300, 18.8900],
    description: 'Entrada corredor Córdoba-Puebla. Verificar estado de ruta.',
  },
  {
    id: 'toll-cuernavaca',
    name: 'Caseta Cuernavaca',
    type: 'tollbooth',
    coordinates: [-99.2340, 18.9220],
    description: 'Caseta Autopista del Sol. Punto de control.',
  },
  {
    id: 'safe-pemex-orizaba',
    name: 'Pemex Orizaba Libramiento',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-97.0900, 18.8500],
    description: 'Gasolinera vigilada antes de Cumbres de Maltrata.',
  },
  {
    id: 'safe-pemex-cuernavaca',
    name: 'Pemex Cuernavaca Norte',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-99.2340, 18.9300],
    description: 'Punto seguro antes de entrar a Guerrero.',
  },
  {
    id: 'safe-gn-iguala',
    name: 'Puesto GN Iguala',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-99.5400, 18.3500],
    description: 'Presencia GN permanente. Punto de verificación.',
  },
  {
    id: 'safe-gn-maltrata',
    name: 'Puesto GN Cumbres Maltrata',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-97.3000, 18.8100],
    description: 'Presencia GN en zona crítica corredor 150D.',
  },
  {
    id: 'safe-base-detecta-puebla',
    name: 'Base Custodia Puebla',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-98.2000, 19.0500],
    description: 'Base operativa Puebla. Conexión corredores 150D y 95D.',
  },
  {
    id: 'safe-encuentro-amozoc',
    name: 'Punto Encuentro Amozoc',
    type: 'safe_area',
    subtype: 'punto_encuentro',
    coordinates: [-98.0500, 19.0000],
    description: 'Entronque Amozoc. Punto de relevo para corredor Córdoba-Puebla.',
  },

  // === PUERTOS Y TERMINALES SEGURAS ===
  {
    id: 'safe-manzanillo-port',
    name: 'API Manzanillo',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-104.3200, 19.0500],
    description: 'Área portuaria con control de acceso. Punto de inicio custodia.',
  },
  {
    id: 'safe-lazaro-port',
    name: 'API Lázaro Cárdenas',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-102.1700, 17.9300],
    description: 'Terminal portuaria. Control de acceso estricto.',
  },
  {
    id: 'safe-veracruz-port',
    name: 'API Veracruz',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-96.1300, 19.1800],
    description: 'Puerto de Veracruz. Zona controlada.',
  },
  {
    id: 'safe-altamira-port',
    name: 'API Altamira',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-97.9000, 22.4200],
    description: 'Terminal industrial. Seguridad portuaria.',
  },

  // === ZONAS INDUSTRIALES ===
  {
    id: 'industrial-cedis-bimbo-qro',
    name: 'CEDIS Bimbo Querétaro',
    type: 'industrial',
    coordinates: [-100.4500, 20.5400],
    description: 'Centro de distribución. Alto valor de carga.',
  },
  {
    id: 'industrial-silao',
    name: 'Parque Industrial Silao',
    type: 'industrial',
    coordinates: [-101.4300, 20.9400],
    description: 'Zona automotriz (GM, VW). Carga de alto valor.',
  },
  {
    id: 'industrial-san-juan',
    name: 'Zona Industrial San Juan del Río',
    type: 'industrial',
    coordinates: [-99.9700, 20.3800],
    description: 'Corredor industrial. Múltiples CEDIS.',
  },
  {
    id: 'industrial-lazaro',
    name: 'Zona Portuaria Lázaro Cárdenas',
    type: 'industrial',
    coordinates: [-102.1500, 17.9400],
    description: 'Puerto de contenedores. Verificación de sellos obligatoria.',
  },
  {
    id: 'industrial-apodaca',
    name: 'Parque Industrial Apodaca',
    type: 'industrial',
    coordinates: [-100.1900, 25.7800],
    description: 'Hub logístico Monterrey. Alta concentración CEDIS.',
  },
  {
    id: 'industrial-toluca',
    name: 'Zona Industrial Toluca',
    type: 'industrial',
    coordinates: [-99.6200, 19.3000],
    description: 'Corredor automotriz. Carga de alto valor.',
  },
  {
    id: 'industrial-aguascalientes',
    name: 'Parque Industrial Aguascalientes',
    type: 'industrial',
    coordinates: [-102.2800, 21.8500],
    description: 'Zona automotriz (Nissan). Carga especializada.',
  },
  {
    id: 'industrial-saltillo-ramos',
    name: 'Parque Industrial Ramos Arizpe',
    type: 'industrial',
    coordinates: [-100.9500, 25.5400],
    description: 'Clúster automotriz (GM, Chrysler). Alto valor.',
  },

  // === POIs CORREDOR SLP-MATEHUALA-SALTILLO (57D) ===
  {
    id: 'blackspot-altiplano-charcas',
    name: 'Altiplano Charcas-Venado (Zona de emboscadas)',
    type: 'blackspot',
    coordinates: [-100.7200, 22.8500],
    description: 'Zona desértica aislada. Emboscadas documentadas. Sin cobertura celular.',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-matehuala-sur',
    name: 'Acceso Sur Matehuala',
    type: 'blackspot',
    coordinates: [-100.6400, 23.5800],
    description: 'Robos en paradas y estaciones de servicio. Halcones activos.',
    riskLevel: 'alto',
  },
  {
    id: 'safe-gasolinera-matehuala',
    name: 'Gasolinera Vigilada Matehuala Centro',
    type: 'safe_area',
    subtype: 'gasolinera_vigilada',
    coordinates: [-100.6500, 23.6500],
    description: 'Gasolinera con vigilancia 24h. Punto de check-in recomendado.',
  },
  {
    id: 'safe-gn-km200',
    name: 'Puesto GN km 200 (57D)',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-100.6300, 23.4500],
    description: 'Base Guardia Nacional. Punto de apoyo antes de entrar a Matehuala.',
  },
  {
    id: 'toll-huizache',
    name: 'Caseta Huizache (57D)',
    type: 'tollbooth',
    coordinates: [-100.5800, 23.1500],
    description: 'Caseta de cobro. Último punto con infraestructura antes de Matehuala.',
  },
  {
    id: 'junction-matehuala-nl',
    name: 'Entronque Matehuala-Nuevo Laredo (57/57D)',
    type: 'junction',
    coordinates: [-100.6500, 23.6800],
    description: 'Bifurcación hacia Nuevo Laredo (57) o Saltillo (57D). Punto de decisión operativa.',
  },

  // === POIs CORREDOR MONTERREY-SALTILLO ===
  {
    id: 'junction-saltillo-40d',
    name: 'Entronque Saltillo-40D (Torreón)',
    type: 'junction',
    coordinates: [-101.0000, 25.4200],
    description: 'Conexión con autopista 40D hacia Torreón/Durango.',
  },

  // === POIs NORPONIENTE ===
  {
    id: 'blackspot-espinazo-diablo',
    name: 'Espinazo del Diablo (Mazatlán-Durango)',
    type: 'blackspot',
    coordinates: [-105.9500, 23.6500],
    description: 'Zona extrema serrana. Túneles, sin cobertura celular. Emboscadas documentadas.',
    riskLevel: 'extremo',
  },
  {
    id: 'blackspot-el-salto',
    name: 'El Salto (Sierra Durango)',
    type: 'blackspot',
    coordinates: [-105.3500, 23.9500],
    description: 'Emboscadas documentadas en zona serrana. Presencia de grupos armados.',
    riskLevel: 'alto',
  },
  {
    id: 'blackspot-culiacan-periurbano',
    name: 'Culiacán Periurbano',
    type: 'blackspot',
    coordinates: [-107.3900, 24.7900],
    description: 'Zona de operación de cárteles. Alto riesgo para transporte de carga.',
    riskLevel: 'alto',
  },
  {
    id: 'blackspot-los-mochis-sur',
    name: 'Los Mochis Acceso Sur',
    type: 'blackspot',
    coordinates: [-108.9900, 25.7700],
    description: 'Robos a transporte agrícola organizados. Zona periurbana.',
    riskLevel: 'alto',
  },
  {
    id: 'safe-puerto-guaymas',
    name: 'Puerto Guaymas',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-110.9000, 27.9700],
    description: 'Zona portuaria controlada. Seguridad portuaria permanente.',
  },
  {
    id: 'safe-api-topolobampo',
    name: 'API Topolobampo',
    type: 'safe_area',
    subtype: 'base_custodia',
    coordinates: [-109.0500, 25.6000],
    description: 'Terminal portuaria con control de acceso. Punto seguro.',
  },
  {
    id: 'safe-gn-mazatlan-norte',
    name: 'Puesto GN Mazatlán Norte',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-106.4200, 23.2800],
    description: 'Presencia GN permanente. Último punto antes de la sierra.',
  },
  {
    id: 'toll-concordia',
    name: 'Caseta Concordia (Mazatlán-Durango)',
    type: 'tollbooth',
    coordinates: [-105.9700, 23.4500],
    description: 'Último punto con infraestructura antes de Espinazo del Diablo.',
  },
  {
    id: 'safe-gn-hermosillo-sur',
    name: 'Puesto GN Hermosillo Sur',
    type: 'safe_area',
    subtype: 'puesto_militar',
    coordinates: [-110.9700, 29.0200],
    description: 'Presencia GN permanente. Control de entrada Sonora.',
  },
];

// Helper functions
export const getSegmentsByCorridorId = (corridorId: string): HighwaySegment[] => {
  return HIGHWAY_SEGMENTS.filter(s => s.corridorId === corridorId);
};

export const getPOIsByType = (type: POI['type']): POI[] => {
  return HIGHWAY_POIS.filter(p => p.type === type);
};

export const getSegmentById = (segmentId: string): HighwaySegment | undefined => {
  return HIGHWAY_SEGMENTS.find(s => s.id === segmentId);
};

export const getTotalSegments = (): number => {
  return HIGHWAY_SEGMENTS.length;
};

export const getSegmentsByRiskLevel = (level: RiskLevel): HighwaySegment[] => {
  return HIGHWAY_SEGMENTS.filter(s => s.riskLevel === level);
};

// Statistics helper for risk distribution
export const getRiskDistribution = (): Record<RiskLevel, { count: number; percentage: number }> => {
  const total = HIGHWAY_SEGMENTS.length;
  const distribution: Record<RiskLevel, { count: number; percentage: number }> = {
    extremo: { count: 0, percentage: 0 },
    alto: { count: 0, percentage: 0 },
    medio: { count: 0, percentage: 0 },
    bajo: { count: 0, percentage: 0 },
  };
  
  HIGHWAY_SEGMENTS.forEach(s => {
    distribution[s.riskLevel].count++;
  });
  
  Object.keys(distribution).forEach(level => {
    distribution[level as RiskLevel].percentage = Math.round((distribution[level as RiskLevel].count / total) * 100);
  });
  
  return distribution;
};
