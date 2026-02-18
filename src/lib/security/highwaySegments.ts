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
    riskLevel: 'bajo', // Recalibrado de alto
    avgMonthlyEvents: 1,
    criticalHours: '00:00-05:00',
    commonIncidentType: 'Incidentes aislados',
    recommendations: ['Monitoreo GPS estándar', 'Costa relativamente segura'],
    waypoints: [[-102.1690, 17.9270], [-103.2000, 18.5000], [-104.3100, 19.1100]],
  },
];

// ============================================================
// PUNTOS DE INTERÉS (POIs) - Casetas, Puntos Negros, Áreas Seguras
// ============================================================

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
