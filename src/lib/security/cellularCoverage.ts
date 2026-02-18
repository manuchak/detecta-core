// Cellular Coverage Database - Enriched with nPerf/IFT/OpenCellID data
// Critical for GPS/monitoring reliability assessment

export type SignalStrength = 'excellent' | 'good' | 'weak' | 'none';
export type CellularSeverity = 'total' | 'parcial';
export type Carrier = 'Telcel' | 'ATT' | 'Movistar';
export type DataSource = 'nperf' | 'ift' | 'opencellid' | 'manual' | 'field_report';

export interface CarrierCoverage {
  signal: SignalStrength;
  towerDensity?: 'high' | 'medium' | 'low' | 'none';
}

export interface CellularDeadZone {
  id: string;
  name: string;
  corridorId: string;
  kmStart: number;
  kmEnd: number;
  center: [number, number]; // [lng, lat]
  polygon: [number, number][];
  estimatedLengthKm: number;
  // Legacy field for backward compatibility
  carriers: Carrier[];
  severity: CellularSeverity;
  // Enriched coverage data
  coverage: {
    telcel: CarrierCoverage;
    att: CarrierCoverage;
    movistar: CarrierCoverage;
  };
  sources: DataSource[];
  lastVerified: string;
  confidenceScore: number; // 0-100
  bestCarrier: Carrier | null;
  recommendation: string;
  altitudeRange?: string;
  iftGuaranteed?: boolean; // IFT cobertura garantizada
}

// Touchpoint gap zone for operational impact
export interface TouchpointGapZone {
  zoneName: string;
  kmLength: number;
  transitMinutes: number;
  touchpointsLost: number;
  requiresCheckIn: boolean;
  requiresEnhancedMonitoring: boolean; // Changed from requiresSatellite - enhanced terrestrial monitoring
}

// Operational impact with touchpoint analysis
export interface OperationalImpact {
  estimatedTransitTimeMinutes: number;
  expectedTouchpoints: number;
  lostTouchpoints: number;
  maxConsecutiveMinutesNoContact: number;
  zonesWithLostTouchpoints: TouchpointGapZone[];
}

export interface RouteConnectivityReport {
  overallConnectivity: 'full' | 'partial' | 'critical';
  deadZonesCrossed: CellularDeadZone[];
  totalKmWithoutSignal: number;
  totalKmWeakSignal: number;
  bestCarrier: Carrier;
  carrierCoveragePercentage: {
    telcel: number;
    att: number;
    movistar: number;
  };
  recommendations: string[];
  requiresEnhancedMonitoring: boolean; // Changed from requiresSatellite
  // NEW: Operational impact with touchpoint analysis
  operationalImpact: OperationalImpact;
}

// Signal strength colors for visualization
export const SIGNAL_COLORS: Record<SignalStrength, string> = {
  none: '#dc2626',      // red-600
  weak: '#f97316',      // orange-500
  good: '#84cc16',      // lime-500
  excellent: '#22c55e', // green-500
};

export const CELLULAR_SEVERITY_COLORS: Record<CellularSeverity, string> = {
  total: '#dc2626',    // red-600 - complete loss
  parcial: '#f97316',  // orange-500 - intermittent
};

// ============================================================
// ENRICHED CELLULAR DEAD ZONES DATABASE
// Sources: nPerf, IFT México, OpenCellID (Dec 2024)
// ============================================================

export const CELLULAR_DEAD_ZONES: CellularDeadZone[] = [
  // ============================================================
  // SIERRA MADRE OCCIDENTAL
  // ============================================================
  {
    id: 'deadzone-sierra-durango',
    name: 'Sierra de Durango (Mazatlán-Durango)',
    corridorId: 'mazatlan-durango-torreon',
    kmStart: 80,
    kmEnd: 160,
    center: [-105.8000, 23.7000],
    polygon: [
      [-106.1000, 23.5000],
      [-105.5000, 23.5000],
      [-105.5000, 24.0000],
      [-106.1000, 24.0000],
      [-106.1000, 23.5000],
    ],
    estimatedLengthKm: 80,
    carriers: ['Telcel', 'ATT', 'Movistar'],
    severity: 'total',
    coverage: {
      telcel: { signal: 'none', towerDensity: 'none' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 95,
    bestCarrier: null,
    recommendation: 'Reportar posición km 75 y km 165. Comunicación satelital obligatoria.',
    altitudeRange: '2,000 - 2,800 msnm',
    iftGuaranteed: false,
  },
  {
    id: 'deadzone-espinazo-diablo',
    name: 'Espinazo del Diablo',
    corridorId: 'mazatlan-durango-torreon',
    kmStart: 100,
    kmEnd: 140,
    center: [-105.9500, 23.6500],
    polygon: [
      [-106.1500, 23.5500],
      [-105.7500, 23.5500],
      [-105.7500, 23.8000],
      [-106.1500, 23.8000],
      [-106.1500, 23.5500],
    ],
    estimatedLengthKm: 40,
    carriers: ['Telcel', 'ATT', 'Movistar'],
    severity: 'total',
    coverage: {
      telcel: { signal: 'none', towerDensity: 'none' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 98,
    bestCarrier: null,
    recommendation: 'ZONA CRÍTICA. Comunicación satelital obligatoria. Reportar antes y después.',
    altitudeRange: '2,200 - 2,800 msnm',
    iftGuaranteed: false,
  },

  // ============================================================
  // TIERRA CALIENTE - MICHOACÁN
  // ============================================================
  {
    id: 'deadzone-tierra-caliente',
    name: 'Tierra Caliente (Michoacán)',
    corridorId: 'lazaro-cardenas-cdmx',
    kmStart: 50,
    kmEnd: 130,
    center: [-101.6000, 18.6000],
    polygon: [
      [-102.0000, 18.3000],
      [-101.2000, 18.3000],
      [-101.2000, 18.9000],
      [-102.0000, 18.9000],
      [-102.0000, 18.3000],
    ],
    estimatedLengthKm: 80,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel con señal débil. GPS puede perder conexión. Reportar cada 30 min.',
    iftGuaranteed: false,
  },
  {
    id: 'deadzone-nueva-italia',
    name: 'Nueva Italia - Apatzingán',
    corridorId: 'lazaro-cardenas-cdmx',
    kmStart: 80,
    kmEnd: 110,
    center: [-101.5500, 18.7500],
    polygon: [
      [-101.8000, 18.6000],
      [-101.3000, 18.6000],
      [-101.3000, 18.9000],
      [-101.8000, 18.9000],
      [-101.8000, 18.6000],
    ],
    estimatedLengthKm: 30,
    carriers: ['Telcel', 'ATT', 'Movistar'],
    severity: 'total',
    coverage: {
      telcel: { signal: 'none', towerDensity: 'none' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'field_report'],
    lastVerified: '2024-12',
    confidenceScore: 92,
    bestCarrier: null,
    recommendation: 'Sin cobertura confirmada. Comunicación satelital requerida.',
    iftGuaranteed: false,
  },

  // ============================================================
  // SIERRA NORTE DE PUEBLA
  // ============================================================
  {
    id: 'deadzone-sierra-norte-puebla',
    name: 'Sierra Norte de Puebla',
    corridorId: 'veracruz-cdmx',
    kmStart: 140,
    kmEnd: 200,
    center: [-97.5500, 19.9000],
    polygon: [
      [-97.8000, 19.7000],
      [-97.3000, 19.7000],
      [-97.3000, 20.1000],
      [-97.8000, 20.1000],
      [-97.8000, 19.7000],
    ],
    estimatedLengthKm: 60,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 88,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel con cobertura parcial. ATT/Movistar sin señal. Usar SIM Telcel.',
    altitudeRange: '1,800 - 2,400 msnm',
    iftGuaranteed: false,
  },

  // ============================================================
  // HUASTECA POTOSINA
  // ============================================================
  {
    id: 'deadzone-huasteca',
    name: 'Huasteca Potosina',
    corridorId: 'manzanillo-tampico',
    kmStart: 580,
    kmEnd: 650,
    center: [-99.0500, 21.8500],
    polygon: [
      [-99.4000, 21.6000],
      [-98.7000, 21.6000],
      [-98.7000, 22.1000],
      [-99.4000, 22.1000],
      [-99.4000, 21.6000],
    ],
    estimatedLengthKm: 70,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 82,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT intermitente, Movistar sin cobertura. Reportar en Cd. Valles.',
    iftGuaranteed: true,
  },

  // ============================================================
  // SIERRA DE CHIHUAHUA
  // ============================================================
  {
    id: 'deadzone-sierra-chihuahua',
    name: 'Sierra de Chihuahua (Barrancas)',
    corridorId: 'chihuahua-hermosillo',
    kmStart: 200,
    kmEnd: 280,
    center: [-107.5000, 27.5000],
    polygon: [
      [-108.0000, 27.2000],
      [-107.0000, 27.2000],
      [-107.0000, 27.8000],
      [-108.0000, 27.8000],
      [-108.0000, 27.2000],
    ],
    estimatedLengthKm: 80,
    carriers: ['Telcel', 'ATT', 'Movistar'],
    severity: 'total',
    coverage: {
      telcel: { signal: 'none', towerDensity: 'none' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 95,
    bestCarrier: null,
    recommendation: 'ZONA SIN COBERTURA. Comunicación satelital obligatoria. Convoy recomendado.',
    altitudeRange: '2,000 - 2,600 msnm',
    iftGuaranteed: false,
  },

  // ============================================================
  // SIERRA MADRE DEL SUR - OAXACA
  // ============================================================
  {
    id: 'deadzone-sierra-oaxaca',
    name: 'Sierra de Oaxaca (Cuenca del Papaloapan)',
    corridorId: 'puebla-oaxaca',
    kmStart: 180,
    kmEnd: 240,
    center: [-96.8000, 17.8000],
    polygon: [
      [-97.1000, 17.6000],
      [-96.5000, 17.6000],
      [-96.5000, 18.0000],
      [-97.1000, 18.0000],
      [-97.1000, 17.6000],
    ],
    estimatedLengthKm: 60,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel con cobertura. Otros carriers intermitentes. Reportar en Nochixtlán.',
    altitudeRange: '1,600 - 2,200 msnm',
    iftGuaranteed: true,
  },

  // ============================================================
  // TAMAULIPAS FRONTERIZO
  // ============================================================
  {
    id: 'deadzone-tamaulipas-norte',
    name: 'Tamaulipas Fronterizo (Zona Rural)',
    corridorId: 'monterrey-reynosa',
    kmStart: 120,
    kmEnd: 180,
    center: [-98.8000, 26.2000],
    polygon: [
      [-99.2000, 26.0000],
      [-98.4000, 26.0000],
      [-98.4000, 26.4000],
      [-99.2000, 26.4000],
      [-99.2000, 26.0000],
    ],
    estimatedLengthKm: 60,
    carriers: ['ATT'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 80,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y Movistar funcionan. ATT sin cobertura. Zona de alto riesgo.',
    iftGuaranteed: false,
  },

  // ============================================================
  // CAÑÓN DEL SUMIDERO - CHIAPAS
  // ============================================================
  {
    id: 'deadzone-sumidero',
    name: 'Cañón del Sumidero (Chiapas)',
    corridorId: 'tuxtla-san-cristobal',
    kmStart: 20,
    kmEnd: 50,
    center: [-93.0800, 16.8500],
    polygon: [
      [-93.2500, 16.7500],
      [-92.9000, 16.7500],
      [-92.9000, 16.9500],
      [-93.2500, 16.9500],
      [-93.2500, 16.7500],
    ],
    estimatedLengthKm: 30,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional en cresta. Sin señal en cañón. Reportar al salir.',
    altitudeRange: '400 - 1,200 msnm',
    iftGuaranteed: false,
  },

  // ============================================================
  // BAJA CALIFORNIA - DESIERTO
  // ============================================================
  {
    id: 'deadzone-baja-desierto',
    name: 'Desierto Central Baja California',
    corridorId: 'tijuana-cabo',
    kmStart: 400,
    kmEnd: 550,
    center: [-113.5000, 28.5000],
    polygon: [
      [-114.2000, 28.0000],
      [-112.8000, 28.0000],
      [-112.8000, 29.0000],
      [-114.2000, 29.0000],
      [-114.2000, 28.0000],
    ],
    estimatedLengthKm: 150,
    carriers: ['Telcel', 'ATT', 'Movistar'],
    severity: 'total',
    coverage: {
      telcel: { signal: 'none', towerDensity: 'none' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 95,
    bestCarrier: null,
    recommendation: 'ZONA SIN COBERTURA EXTENDIDA. Satelital obligatorio. Tanque lleno antes de entrar.',
    iftGuaranteed: false,
  },

  // ============================================================
  // NEW ZONES FROM nPerf/IFT/OpenCellID ANALYSIS (Dec 2024)
  // ============================================================

  // MÉXICO - GUADALAJARA CORRIDOR
  {
    id: 'deadzone-la-marquesa',
    name: 'La Marquesa - Toluca',
    corridorId: 'mexico-guadalajara',
    kmStart: 25,
    kmEnd: 50,
    center: [-99.4200, 19.2800],
    polygon: [
      [-99.5500, 19.2000],
      [-99.2800, 19.2000],
      [-99.2800, 19.3600],
      [-99.5500, 19.3600],
      [-99.5500, 19.2000],
    ],
    estimatedLengthKm: 25,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 88,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel estable. ATT intermitente en ascenso. Movistar sin cobertura.',
    altitudeRange: '2,800 - 3,200 msnm',
    iftGuaranteed: true,
  },
  {
    id: 'deadzone-mil-cumbres',
    name: 'Sierra de Mil Cumbres',
    corridorId: 'mexico-guadalajara',
    kmStart: 180,
    kmEnd: 220,
    center: [-100.4500, 19.5800],
    polygon: [
      [-100.6500, 19.4500],
      [-100.2500, 19.4500],
      [-100.2500, 19.7000],
      [-100.6500, 19.7000],
      [-100.6500, 19.4500],
    ],
    estimatedLengthKm: 40,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Cobertura intermitente todos los carriers. Reportar en Morelia y Cd. Hidalgo.',
    altitudeRange: '2,400 - 3,000 msnm',
    iftGuaranteed: false,
  },

  // QUERÉTARO - SAN LUIS POTOSÍ
  {
    id: 'deadzone-qro-slp-desierto',
    name: 'Desierto Villa de Reyes',
    corridorId: 'mexico-qro-slp',
    kmStart: 280,
    kmEnd: 340,
    center: [-100.9500, 21.9500],
    polygon: [
      [-101.1500, 21.7500],
      [-100.7500, 21.7500],
      [-100.7500, 22.1500],
      [-101.1500, 22.1500],
      [-101.1500, 21.7500],
    ],
    estimatedLengthKm: 60,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 82,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel estable. ATT intermitente. Movistar sin cobertura en todo el tramo.',
    iftGuaranteed: true,
  },

  // GUADALAJARA - MANZANILLO
  {
    id: 'deadzone-sierra-manantlan',
    name: 'Sierra de Manantlán',
    corridorId: 'guadalajara-manzanillo',
    kmStart: 120,
    kmEnd: 160,
    center: [-104.2500, 19.5800],
    polygon: [
      [-104.4500, 19.4500],
      [-104.0500, 19.4500],
      [-104.0500, 19.7000],
      [-104.4500, 19.7000],
      [-104.4500, 19.4500],
    ],
    estimatedLengthKm: 40,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 87,
    bestCarrier: 'Telcel',
    recommendation: 'Solo Telcel con señal débil. Reportar en Autlán y antes de subir sierra.',
    altitudeRange: '1,200 - 2,000 msnm',
    iftGuaranteed: false,
  },
  {
    id: 'deadzone-bajada-atenquique',
    name: 'Bajada de Atenquique',
    corridorId: 'guadalajara-manzanillo',
    kmStart: 180,
    kmEnd: 210,
    center: [-103.8500, 19.4500],
    polygon: [
      [-104.0000, 19.3500],
      [-103.7000, 19.3500],
      [-103.7000, 19.5500],
      [-104.0000, 19.5500],
      [-104.0000, 19.3500],
    ],
    estimatedLengthKm: 30,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 80,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT/Movistar intermitente. Curvas peligrosas.',
    altitudeRange: '800 - 1,600 msnm',
    iftGuaranteed: true,
  },

  // MONTERREY - LAREDO
  {
    id: 'deadzone-tamaulipas-rural',
    name: 'Tamaulipas Rural (Nuevo Laredo)',
    corridorId: 'monterrey-laredo',
    kmStart: 150,
    kmEnd: 210,
    center: [-99.5500, 27.1500],
    polygon: [
      [-99.8000, 26.9500],
      [-99.3000, 26.9500],
      [-99.3000, 27.3500],
      [-99.8000, 27.3500],
      [-99.8000, 26.9500],
    ],
    estimatedLengthKm: 60,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'good', towerDensity: 'medium' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT funcionan. Movistar sin cobertura. Zona de alto riesgo.',
    iftGuaranteed: true,
  },

  // CDMX - PACHUCA
  {
    id: 'deadzone-sierra-pachuca',
    name: 'Sierra de Pachuca',
    corridorId: 'cdmx-pachuca',
    kmStart: 40,
    kmEnd: 60,
    center: [-98.8500, 19.9500],
    polygon: [
      [-99.0000, 19.8500],
      [-98.7000, 19.8500],
      [-98.7000, 20.0500],
      [-99.0000, 20.0500],
      [-99.0000, 19.8500],
    ],
    estimatedLengthKm: 20,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'high' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 90,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel estable. ATT/Movistar intermitente en subida. Ruta concurrida.',
    altitudeRange: '2,400 - 2,800 msnm',
    iftGuaranteed: true,
  },

  // PACHUCA - TUXPAN
  {
    id: 'deadzone-sierra-hidalgo',
    name: 'Sierra de Hidalgo',
    corridorId: 'pachuca-tuxpan',
    kmStart: 80,
    kmEnd: 140,
    center: [-98.2500, 20.5500],
    polygon: [
      [-98.5000, 20.3500],
      [-98.0000, 20.3500],
      [-98.0000, 20.7500],
      [-98.5000, 20.7500],
      [-98.5000, 20.3500],
    ],
    estimatedLengthKm: 60,
    carriers: ['Telcel', 'ATT', 'Movistar'],
    severity: 'total',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 88,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel débil. ATT/Movistar sin señal. Comunicación satelital recomendada.',
    altitudeRange: '1,800 - 2,400 msnm',
    iftGuaranteed: false,
  },

  // VERACRUZ - XALAPA
  {
    id: 'deadzone-cofre-perote',
    name: 'Cofre de Perote',
    corridorId: 'veracruz-xalapa',
    kmStart: 60,
    kmEnd: 90,
    center: [-97.1500, 19.5000],
    polygon: [
      [-97.3000, 19.4000],
      [-97.0000, 19.4000],
      [-97.0000, 19.6000],
      [-97.3000, 19.6000],
      [-97.3000, 19.4000],
    ],
    estimatedLengthKm: 30,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT intermitente. Movistar sin cobertura.',
    altitudeRange: '2,400 - 4,200 msnm',
    iftGuaranteed: true,
  },

  // AGUASCALIENTES - ZACATECAS
  {
    id: 'deadzone-sierra-nochistlan',
    name: 'Sierra de Nochistlán',
    corridorId: 'aguascalientes-zacatecas',
    kmStart: 40,
    kmEnd: 90,
    center: [-102.8500, 21.4500],
    polygon: [
      [-103.0500, 21.3000],
      [-102.6500, 21.3000],
      [-102.6500, 21.6000],
      [-103.0500, 21.6000],
      [-103.0500, 21.3000],
    ],
    estimatedLengthKm: 50,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 82,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel estable. ATT/Movistar intermitente. Reportar en Nochistlán.',
    altitudeRange: '2,000 - 2,400 msnm',
    iftGuaranteed: true,
  },

  // PUEBLA - TEHUACÁN
  {
    id: 'deadzone-sierra-negra',
    name: 'Sierra Negra',
    corridorId: 'puebla-tehuacan',
    kmStart: 80,
    kmEnd: 120,
    center: [-97.4500, 18.7500],
    polygon: [
      [-97.6500, 18.6000],
      [-97.2500, 18.6000],
      [-97.2500, 18.9000],
      [-97.6500, 18.9000],
      [-97.6500, 18.6000],
    ],
    estimatedLengthKm: 40,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Solo Telcel con señal débil. Observatorio astronómico cercano.',
    altitudeRange: '2,200 - 4,600 msnm',
    iftGuaranteed: false,
  },

  // COLIMA - GUADALAJARA
  {
    id: 'deadzone-bajada-colima',
    name: 'Bajada de Colima',
    corridorId: 'colima-guadalajara',
    kmStart: 30,
    kmEnd: 65,
    center: [-103.7500, 19.3500],
    polygon: [
      [-103.9500, 19.2500],
      [-103.5500, 19.2500],
      [-103.5500, 19.4500],
      [-103.9500, 19.4500],
      [-103.9500, 19.2500],
    ],
    estimatedLengthKm: 35,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 83,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT débil. Movistar sin cobertura. Curvas cerradas.',
    altitudeRange: '600 - 1,400 msnm',
    iftGuaranteed: true,
  },

  // SALTILLO - MONTERREY
  {
    id: 'deadzone-sierra-arteaga',
    name: 'Sierra de Arteaga',
    corridorId: 'saltillo-monterrey',
    kmStart: 15,
    kmEnd: 40,
    center: [-100.5500, 25.4500],
    polygon: [
      [-100.7500, 25.3500],
      [-100.3500, 25.3500],
      [-100.3500, 25.5500],
      [-100.7500, 25.5500],
      [-100.7500, 25.3500],
    ],
    estimatedLengthKm: 25,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'high' },
      att: { signal: 'good', towerDensity: 'medium' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 90,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT funcionan bien. Movistar intermitente en cumbres.',
    altitudeRange: '1,800 - 2,600 msnm',
    iftGuaranteed: true,
  },

  // MORELIA - GUADALAJARA
  {
    id: 'deadzone-mil-cumbres-mich',
    name: 'Mil Cumbres (Michoacán)',
    corridorId: 'morelia-guadalajara',
    kmStart: 30,
    kmEnd: 75,
    center: [-100.6500, 19.6500],
    polygon: [
      [-100.8500, 19.5500],
      [-100.4500, 19.5500],
      [-100.4500, 19.7500],
      [-100.8500, 19.7500],
      [-100.8500, 19.5500],
    ],
    estimatedLengthKm: 45,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 86,
    bestCarrier: 'Telcel',
    recommendation: 'Todos los carriers con señal débil o nula. GPS intermitente.',
    altitudeRange: '2,400 - 3,000 msnm',
    iftGuaranteed: false,
  },

  // CDMX - CUERNAVACA
  {
    id: 'deadzone-paso-cortes',
    name: 'Paso de Cortés',
    corridorId: 'cdmx-cuernavaca',
    kmStart: 35,
    kmEnd: 55,
    center: [-98.9000, 19.0800],
    polygon: [
      [-99.0500, 18.9800],
      [-98.7500, 18.9800],
      [-98.7500, 19.1800],
      [-99.0500, 19.1800],
      [-99.0500, 18.9800],
    ],
    estimatedLengthKm: 20,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'high' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 88,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel estable. ATT/Movistar intermitente en zona alta. Ruta concurrida.',
    altitudeRange: '2,200 - 3,800 msnm',
    iftGuaranteed: true,
  },

  // DURANGO - TORREÓN
  {
    id: 'deadzone-desierto-durango',
    name: 'Desierto Durango-Torreón',
    corridorId: 'mazatlan-durango-torreon',
    kmStart: 200,
    kmEnd: 280,
    center: [-104.2500, 24.5500],
    polygon: [
      [-104.6500, 24.3500],
      [-103.8500, 24.3500],
      [-103.8500, 24.7500],
      [-104.6500, 24.7500],
      [-104.6500, 24.3500],
    ],
    estimatedLengthKm: 80,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 84,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT intermitente. Movistar sin cobertura. Zona muy caliente.',
    iftGuaranteed: true,
  },

  // MÉXICO - NOGALES
  {
    id: 'deadzone-sonora-desierto',
    name: 'Desierto de Sonora',
    corridorId: 'mexico-nogales',
    kmStart: 1800,
    kmEnd: 1920,
    center: [-111.5500, 30.5500],
    polygon: [
      [-112.0500, 30.2500],
      [-111.0500, 30.2500],
      [-111.0500, 30.8500],
      [-112.0500, 30.8500],
      [-112.0500, 30.2500],
    ],
    estimatedLengthKm: 120,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 80,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel estable. ATT/Movistar intermitente. Zona calurosa extrema.',
    iftGuaranteed: true,
  },

  // SAN LUIS POTOSÍ - MATEHUALA
  {
    id: 'deadzone-altiplano-slp',
    name: 'Altiplano Potosino',
    corridorId: 'slp-matehuala',
    kmStart: 80,
    kmEnd: 150,
    center: [-100.5500, 23.2500],
    polygon: [
      [-100.8500, 23.0500],
      [-100.2500, 23.0500],
      [-100.2500, 23.4500],
      [-100.8500, 23.4500],
      [-100.8500, 23.0500],
    ],
    estimatedLengthKm: 70,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'good', towerDensity: 'medium' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT funcionan. Movistar intermitente. Reportar en Matehuala.',
    altitudeRange: '1,800 - 2,200 msnm',
    iftGuaranteed: true,
  },

  // VERACRUZ - CÓRDOBA
  {
    id: 'deadzone-cumbres-maltrata',
    name: 'Cumbres de Maltrata',
    corridorId: 'veracruz-cordoba',
    kmStart: 70,
    kmEnd: 100,
    center: [-97.2500, 18.8500],
    polygon: [
      [-97.4000, 18.7500],
      [-97.1000, 18.7500],
      [-97.1000, 18.9500],
      [-97.4000, 18.9500],
      [-97.4000, 18.7500],
    ],
    estimatedLengthKm: 30,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 87,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT débil. Movistar sin señal. Curvas peligrosas.',
    altitudeRange: '1,200 - 2,400 msnm',
    iftGuaranteed: true,
  },

  // ACAPULCO - CDMX
  {
    id: 'deadzone-sierra-guerrero',
    name: 'Sierra de Guerrero',
    corridorId: 'acapulco-cdmx',
    kmStart: 120,
    kmEnd: 180,
    center: [-99.6500, 17.8500],
    polygon: [
      [-99.9000, 17.6500],
      [-99.4000, 17.6500],
      [-99.4000, 18.0500],
      [-99.9000, 18.0500],
      [-99.9000, 17.6500],
    ],
    estimatedLengthKm: 60,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'field_report'],
    lastVerified: '2024-12',
    confidenceScore: 82,
    bestCarrier: 'Telcel',
    recommendation: 'Solo Telcel débil. Zona de alto riesgo. Satelital recomendado.',
    altitudeRange: '1,400 - 2,200 msnm',
    iftGuaranteed: false,
  },

  // TUXTLA - TAPACHULA
  {
    id: 'deadzone-sierra-madre-chiapas',
    name: 'Sierra Madre de Chiapas',
    corridorId: 'tuxtla-tapachula',
    kmStart: 150,
    kmEnd: 220,
    center: [-92.4500, 15.5500],
    polygon: [
      [-92.7500, 15.3500],
      [-92.1500, 15.3500],
      [-92.1500, 15.7500],
      [-92.7500, 15.7500],
      [-92.7500, 15.3500],
    ],
    estimatedLengthKm: 70,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 80,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT con señal débil. Movistar sin cobertura. Zona cafetalera.',
    altitudeRange: '800 - 2,400 msnm',
    iftGuaranteed: false,
  },

  // VILLAHERMOSA - CHETUMAL
  {
    id: 'deadzone-selva-quintana-roo',
    name: 'Selva de Quintana Roo',
    corridorId: 'villahermosa-chetumal',
    kmStart: 350,
    kmEnd: 420,
    center: [-88.8500, 18.5500],
    polygon: [
      [-89.1500, 18.3500],
      [-88.5500, 18.3500],
      [-88.5500, 18.7500],
      [-89.1500, 18.7500],
      [-89.1500, 18.3500],
    ],
    estimatedLengthKm: 70,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'low' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 78,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional pero lento. ATT/Movistar intermitente. Zona selvática.',
    iftGuaranteed: true,
  },

  // MÉRIDA - CAMPECHE
  {
    id: 'deadzone-reserva-calakmul',
    name: 'Reserva de Calakmul',
    corridorId: 'merida-campeche',
    kmStart: 200,
    kmEnd: 280,
    center: [-89.8500, 18.1500],
    polygon: [
      [-90.2500, 17.9500],
      [-89.4500, 17.9500],
      [-89.4500, 18.3500],
      [-90.2500, 18.3500],
      [-90.2500, 17.9500],
    ],
    estimatedLengthKm: 80,
    carriers: ['Telcel', 'ATT', 'Movistar'],
    severity: 'total',
    coverage: {
      telcel: { signal: 'none', towerDensity: 'none' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 92,
    bestCarrier: null,
    recommendation: 'ZONA SIN COBERTURA. Reserva natural protegida. Satelital obligatorio.',
    iftGuaranteed: false,
  },

  // OAXACA - PUERTO ESCONDIDO
  {
    id: 'deadzone-sierra-sur-oaxaca',
    name: 'Sierra Sur de Oaxaca',
    corridorId: 'oaxaca-puerto-escondido',
    kmStart: 50,
    kmEnd: 140,
    center: [-96.8500, 16.2500],
    polygon: [
      [-97.1500, 16.0500],
      [-96.5500, 16.0500],
      [-96.5500, 16.4500],
      [-97.1500, 16.4500],
      [-97.1500, 16.0500],
    ],
    estimatedLengthKm: 90,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'none', towerDensity: 'none' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'field_report'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Solo Telcel débil. Curvas muy cerradas. Satelital recomendado.',
    altitudeRange: '400 - 2,400 msnm',
    iftGuaranteed: false,
  },

  // ZACATECAS - DURANGO
  {
    id: 'deadzone-altiplano-zacatecas',
    name: 'Altiplano de Zacatecas',
    corridorId: 'zacatecas-durango',
    kmStart: 100,
    kmEnd: 180,
    center: [-104.1500, 24.0500],
    polygon: [
      [-104.4500, 23.8500],
      [-103.8500, 23.8500],
      [-103.8500, 24.2500],
      [-104.4500, 24.2500],
      [-104.4500, 23.8500],
    ],
    estimatedLengthKm: 80,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 83,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT intermitente. Movistar sin cobertura.',
    altitudeRange: '2,000 - 2,400 msnm',
    iftGuaranteed: true,
  },

  // GUANAJUATO - DOLORES HIDALGO
  {
    id: 'deadzone-sierra-guanajuato',
    name: 'Sierra de Guanajuato',
    corridorId: 'guanajuato-dolores',
    kmStart: 20,
    kmEnd: 45,
    center: [-100.9500, 21.1500],
    polygon: [
      [-101.1000, 21.0500],
      [-100.8000, 21.0500],
      [-100.8000, 21.2500],
      [-101.1000, 21.2500],
      [-101.1000, 21.0500],
    ],
    estimatedLengthKm: 25,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel funcional. ATT/Movistar intermitente. Zona minera histórica.',
    altitudeRange: '2,000 - 2,600 msnm',
    iftGuaranteed: true,
  },

  // CELAYA - SAN MIGUEL DE ALLENDE
  {
    id: 'deadzone-bajio-rural',
    name: 'Bajío Rural (Celaya-SMA)',
    corridorId: 'celaya-san-miguel',
    kmStart: 25,
    kmEnd: 50,
    center: [-100.7500, 20.8500],
    polygon: [
      [-100.9000, 20.7500],
      [-100.6000, 20.7500],
      [-100.6000, 20.9500],
      [-100.9000, 20.9500],
      [-100.9000, 20.7500],
    ],
    estimatedLengthKm: 25,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'high' },
      att: { signal: 'good', towerDensity: 'medium' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 88,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT funcionan bien. Movistar débil. Zona turística.',
    iftGuaranteed: true,
  },

  // CHIHUAHUA - DELICIAS
  {
    id: 'deadzone-desierto-chihuahua-sur',
    name: 'Desierto de Chihuahua Sur',
    corridorId: 'chihuahua-delicias',
    kmStart: 40,
    kmEnd: 80,
    center: [-105.5500, 28.3500],
    polygon: [
      [-105.8000, 28.1500],
      [-105.3000, 28.1500],
      [-105.3000, 28.5500],
      [-105.8000, 28.5500],
      [-105.8000, 28.1500],
    ],
    estimatedLengthKm: 40,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'good', towerDensity: 'medium' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 84,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT funcionan. Movistar intermitente. Zona agrícola.',
    iftGuaranteed: true,
  },

  // HERMOSILLO - GUAYMAS
  {
    id: 'deadzone-desierto-sonora-sur',
    name: 'Desierto de Sonora (Empalme)',
    corridorId: 'hermosillo-guaymas',
    kmStart: 80,
    kmEnd: 110,
    center: [-110.8500, 27.9500],
    polygon: [
      [-111.0500, 27.8000],
      [-110.6500, 27.8000],
      [-110.6500, 28.1000],
      [-111.0500, 28.1000],
      [-111.0500, 27.8000],
    ],
    estimatedLengthKm: 30,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'good', towerDensity: 'medium' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 82,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT funcionan. Movistar débil. Zona industrial pesquera.',
    iftGuaranteed: true,
  },

  // TORREÓN - CHIHUAHUA
  {
    id: 'deadzone-desierto-bolson-mapimi',
    name: 'Bolsón de Mapimí',
    corridorId: 'torreon-chihuahua',
    kmStart: 100,
    kmEnd: 220,
    center: [-104.0500, 26.5500],
    polygon: [
      [-104.5500, 26.2500],
      [-103.5500, 26.2500],
      [-103.5500, 26.8500],
      [-104.5500, 26.8500],
      [-104.5500, 26.2500],
    ],
    estimatedLengthKm: 120,
    carriers: ['ATT', 'Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'weak', towerDensity: 'low' },
      att: { signal: 'weak', towerDensity: 'low' },
      movistar: { signal: 'none', towerDensity: 'none' },
    },
    sources: ['nperf', 'ift', 'opencellid'],
    lastVerified: '2024-12',
    confidenceScore: 85,
    bestCarrier: 'Telcel',
    recommendation: 'Todos los carriers débiles. Zona de silencio conocida. Satelital recomendado.',
    iftGuaranteed: false,
  },

  // NUEVO LAREDO - MONTERREY (otro tramo)
  {
    id: 'deadzone-rancho-rural-nl',
    name: 'Zona Rural Nuevo León',
    corridorId: 'nuevo-laredo-monterrey',
    kmStart: 80,
    kmEnd: 130,
    center: [-99.8500, 26.6500],
    polygon: [
      [-100.1500, 26.4500],
      [-99.5500, 26.4500],
      [-99.5500, 26.8500],
      [-100.1500, 26.8500],
      [-100.1500, 26.4500],
    ],
    estimatedLengthKm: 50,
    carriers: ['Movistar'],
    severity: 'parcial',
    coverage: {
      telcel: { signal: 'good', towerDensity: 'medium' },
      att: { signal: 'good', towerDensity: 'medium' },
      movistar: { signal: 'weak', towerDensity: 'low' },
    },
    sources: ['nperf', 'ift'],
    lastVerified: '2024-12',
    confidenceScore: 86,
    bestCarrier: 'Telcel',
    recommendation: 'Telcel y ATT funcionan. Movistar intermitente. Zona de alto riesgo.',
    iftGuaranteed: true,
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const getDeadZonesByCorridorId = (corridorId: string): CellularDeadZone[] => {
  return CELLULAR_DEAD_ZONES.filter(z => z.corridorId === corridorId);
};

export const getDeadZonesBySeverity = (severity: CellularSeverity): CellularDeadZone[] => {
  return CELLULAR_DEAD_ZONES.filter(z => z.severity === severity);
};

export const getTotalDeadZoneKm = (): number => {
  return CELLULAR_DEAD_ZONES.reduce((acc, z) => acc + z.estimatedLengthKm, 0);
};

export const getZonesWithoutCarrier = (carrier: Carrier): CellularDeadZone[] => {
  return CELLULAR_DEAD_ZONES.filter(z => {
    const key = carrier.toLowerCase().replace('att', 'att') as 'telcel' | 'att' | 'movistar';
    return z.coverage[key].signal === 'none';
  });
};

export const getBestCarrierForZone = (zone: CellularDeadZone): Carrier | null => {
  const signalPriority: Record<SignalStrength, number> = {
    excellent: 4,
    good: 3,
    weak: 2,
    none: 0,
  };

  let bestCarrier: Carrier | null = null;
  let bestScore = 0;

  const carriers: { carrier: Carrier; key: 'telcel' | 'att' | 'movistar' }[] = [
    { carrier: 'Telcel', key: 'telcel' },
    { carrier: 'ATT', key: 'att' },
    { carrier: 'Movistar', key: 'movistar' },
  ];

  for (const { carrier, key } of carriers) {
    const score = signalPriority[zone.coverage[key].signal];
    if (score > bestScore) {
      bestScore = score;
      bestCarrier = carrier;
    }
  }

  return bestScore > 0 ? bestCarrier : null;
};

// Legacy function maintained for backward compatibility
export const checkRouteDeadZones = (routeCoordinates: [number, number][]): CellularDeadZone[] => {
  const crossedZones: CellularDeadZone[] = [];
  
  for (const zone of CELLULAR_DEAD_ZONES) {
    for (const coord of routeCoordinates) {
      const distance = haversineDistance(coord, zone.center);
      if (distance < 50) {
        if (!crossedZones.includes(zone)) {
          crossedZones.push(zone);
        }
        break;
      }
    }
  }
  
  return crossedZones;
};

// Operational constants for touchpoint calculation
const TOUCHPOINT_CONSTANTS = {
  touchpointIntervalMinutes: 25,   // Mandatory contact interval
  avgTruckSpeedKmh: 70,            // Average highway speed
  kmPerTouchpoint: 29,             // 70 km/h × 25/60 h = ~29 km
};

// Calculate touchpoint analysis for a zone
function calculateZoneTouchpointImpact(kmLength: number): {
  transitMinutes: number;
  touchpointsLost: number;
  requiresCheckIn: boolean;
  requiresSatellite: boolean;
} {
  const transitMinutes = Math.round((kmLength / TOUCHPOINT_CONSTANTS.avgTruckSpeedKmh) * 60);
  const touchpointsLost = Math.floor(transitMinutes / TOUCHPOINT_CONSTANTS.touchpointIntervalMinutes);
  
  return {
    transitMinutes,
    touchpointsLost,
    requiresCheckIn: touchpointsLost >= 1,
    requiresSatellite: touchpointsLost >= 3,
  };
}

// Enhanced route analysis function with touchpoint calculation
export const analyzeRouteCoverage = (
  routeCoordinates: [number, number][],
  totalRouteKm: number
): RouteConnectivityReport => {
  const crossedZones = checkRouteDeadZones(routeCoordinates);
  
  // Calculate km without/weak signal
  const totalKmWithoutSignal = crossedZones
    .filter(z => z.severity === 'total')
    .reduce((acc, z) => acc + z.estimatedLengthKm, 0);
  
  const totalKmWeakSignal = crossedZones
    .filter(z => z.severity === 'parcial')
    .reduce((acc, z) => acc + z.estimatedLengthKm, 0);

  // Calculate carrier coverage percentages
  const carrierCoveragePercentage = {
    telcel: calculateCarrierCoverage(crossedZones, 'telcel', totalRouteKm),
    att: calculateCarrierCoverage(crossedZones, 'att', totalRouteKm),
    movistar: calculateCarrierCoverage(crossedZones, 'movistar', totalRouteKm),
  };

  // Determine best carrier
  const bestCarrier: Carrier = carrierCoveragePercentage.telcel >= carrierCoveragePercentage.att
    ? (carrierCoveragePercentage.telcel >= carrierCoveragePercentage.movistar ? 'Telcel' : 'Movistar')
    : (carrierCoveragePercentage.att >= carrierCoveragePercentage.movistar ? 'ATT' : 'Movistar');

  // Calculate operational impact with touchpoints
  const zonesWithLostTouchpoints: TouchpointGapZone[] = [];
  let totalLostTouchpoints = 0;
  let maxConsecutiveMinutesNoContact = 0;
  
  for (const zone of crossedZones) {
    const impact = calculateZoneTouchpointImpact(zone.estimatedLengthKm);
    
    if (impact.touchpointsLost > 0 || impact.transitMinutes >= 35) {
      zonesWithLostTouchpoints.push({
        zoneName: zone.name,
        kmLength: zone.estimatedLengthKm,
        transitMinutes: impact.transitMinutes,
        touchpointsLost: impact.touchpointsLost,
        requiresCheckIn: impact.requiresCheckIn,
        requiresEnhancedMonitoring: impact.requiresSatellite, // Map to enhanced monitoring
      });
      
      totalLostTouchpoints += impact.touchpointsLost;
      maxConsecutiveMinutesNoContact = Math.max(maxConsecutiveMinutesNoContact, impact.transitMinutes);
    }
  }
  
  const operationalImpact: OperationalImpact = {
    estimatedTransitTimeMinutes: Math.round((totalRouteKm / TOUCHPOINT_CONSTANTS.avgTruckSpeedKmh) * 60),
    expectedTouchpoints: Math.floor((totalRouteKm / TOUCHPOINT_CONSTANTS.avgTruckSpeedKmh) * 60 / TOUCHPOINT_CONSTANTS.touchpointIntervalMinutes),
    lostTouchpoints: totalLostTouchpoints,
    maxConsecutiveMinutesNoContact,
    zonesWithLostTouchpoints,
  };

  // Determine overall connectivity
  const criticalPercentage = (totalKmWithoutSignal / totalRouteKm) * 100;
  const partialPercentage = (totalKmWeakSignal / totalRouteKm) * 100;
  
  let overallConnectivity: 'full' | 'partial' | 'critical';
  if (criticalPercentage > 10 || totalKmWithoutSignal > 50 || totalLostTouchpoints >= 3) {
    overallConnectivity = 'critical';
  } else if (criticalPercentage > 0 || partialPercentage > 20 || totalLostTouchpoints >= 1) {
    overallConnectivity = 'partial';
  } else {
    overallConnectivity = 'full';
  }

  // Generate recommendations based on touchpoints - PREVENTIVE MODEL (no satellite)
  const recommendations: string[] = [];
  
  if (totalLostTouchpoints >= 3) {
    recommendations.push(`⚠️ MONITOREO REFORZADO: ${totalLostTouchpoints} touchpoints perdidos (~${maxConsecutiveMinutesNoContact} min sin contacto). Check-in obligatorio antes y después de cada zona.`);
  } else if (totalLostTouchpoints >= 1) {
    recommendations.push(`Check-in obligatorio antes/después de zonas sin cobertura (${totalLostTouchpoints} touchpoint${totalLostTouchpoints > 1 ? 's' : ''} perdido${totalLostTouchpoints > 1 ? 's' : ''})`);
  }
  
  if (overallConnectivity === 'critical') {
    recommendations.push('Reportar posición antes y después de cada zona sin cobertura');
    recommendations.push('Coordinar con C4 tiempos estimados de silencio de comunicación');
  }
  
  if (crossedZones.length > 0) {
    recommendations.push(`Usar SIM ${bestCarrier} para mejor cobertura (${carrierCoveragePercentage[bestCarrier.toLowerCase() as 'telcel' | 'att' | 'movistar']}%)`);
    
    const criticalZones = crossedZones.filter(z => z.severity === 'total');
    if (criticalZones.length > 0) {
      recommendations.push(`Zonas críticas sin señal: ${criticalZones.map(z => z.name).join(', ')}`);
    }
  }

  // Enhanced monitoring when coverage is critical (replaces satellite requirement)
  const requiresEnhancedMonitoring = overallConnectivity === 'critical' || totalKmWithoutSignal > 30 || totalLostTouchpoints >= 3;

  return {
    overallConnectivity,
    deadZonesCrossed: crossedZones,
    totalKmWithoutSignal,
    totalKmWeakSignal,
    bestCarrier,
    carrierCoveragePercentage,
    recommendations,
    requiresEnhancedMonitoring,
    operationalImpact,
  };
};

function calculateCarrierCoverage(
  zones: CellularDeadZone[],
  carrier: 'telcel' | 'att' | 'movistar',
  totalKm: number
): number {
  const signalWeights: Record<SignalStrength, number> = {
    excellent: 1.0,
    good: 0.9,
    weak: 0.5,
    none: 0,
  };

  let weightedCoverageKm = totalKm;
  
  for (const zone of zones) {
    const signal = zone.coverage[carrier].signal;
    const lostKm = zone.estimatedLengthKm * (1 - signalWeights[signal]);
    weightedCoverageKm -= lostKm;
  }

  return Math.max(0, Math.round((weightedCoverageKm / totalKm) * 100));
}

// Haversine distance calculation in km
function haversineDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371;
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);
  const lat1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[1]);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

// Statistics
export const getCoverageStats = () => {
  const total = CELLULAR_DEAD_ZONES.length;
  const totalKm = getTotalDeadZoneKm();
  const criticalZones = getDeadZonesBySeverity('total');
  const partialZones = getDeadZonesBySeverity('parcial');
  
  const telcelNoSignal = getZonesWithoutCarrier('Telcel').length;
  const attNoSignal = getZonesWithoutCarrier('ATT').length;
  const movistarNoSignal = getZonesWithoutCarrier('Movistar').length;

  return {
    totalZones: total,
    totalKm,
    criticalZones: criticalZones.length,
    criticalKm: criticalZones.reduce((acc, z) => acc + z.estimatedLengthKm, 0),
    partialZones: partialZones.length,
    partialKm: partialZones.reduce((acc, z) => acc + z.estimatedLengthKm, 0),
    carrierCoverage: {
      telcel: Math.round(((total - telcelNoSignal) / total) * 100),
      att: Math.round(((total - attNoSignal) / total) * 100),
      movistar: Math.round(((total - movistarNoSignal) / total) * 100),
    },
    sources: ['nperf', 'ift', 'opencellid', 'field_report'] as DataSource[],
    lastUpdated: '2024-12',
  };
};
