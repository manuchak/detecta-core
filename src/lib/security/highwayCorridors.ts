// Highway corridors for Mexico with waypoints following actual road paths
// Used for both visualization (lines) and seed data generation

export interface HighwayCorridor {
  id: string;
  name: string;
  riskLevel: 'extremo' | 'alto' | 'medio' | 'bajo';
  description: string;
  waypoints: [number, number][]; // [lng, lat] format for Mapbox
  avgEventsPerHex: number;
  kilometers: number;
}

export const RISK_LEVEL_COLORS: Record<string, string> = {
  extremo: '#ef4444',
  alto: '#f97316',
  medio: '#f59e0b',
  bajo: '#22c55e',
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  extremo: 'Extremo',
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

export const HIGHWAY_CORRIDORS: HighwayCorridor[] = [
  // === CORREDORES DE RIESGO EXTREMO ===
  {
    id: 'mexico-puebla',
    name: 'México-Puebla (150D)',
    riskLevel: 'extremo',
    description: 'Autopista más peligrosa de México para transporte de carga',
    kilometers: 130,
    avgEventsPerHex: 8,
    waypoints: [
      [-99.0872, 19.4060],
      [-98.9600, 19.3800],
      [-98.8900, 19.3400],
      [-98.7800, 19.3100],
      [-98.6200, 19.2800],
      [-98.5100, 19.2600],
      [-98.4400, 19.2750],
      [-98.3800, 19.2300],
      [-98.2800, 19.1600],
      [-98.2000, 19.0400],
    ],
  },
  {
    id: 'edomex-industrial',
    name: 'Zona Industrial EdoMex',
    riskLevel: 'extremo',
    description: 'Corredor industrial con alta concentración de robos',
    kilometers: 85,
    avgEventsPerHex: 10,
    waypoints: [
      [-99.0600, 19.6010],
      [-99.1200, 19.5700],
      [-99.1700, 19.6458],
      [-99.2100, 19.6500],
      [-99.2000, 19.5400],
      [-99.2300, 19.4800],
      [-99.2600, 19.5200],
      [-99.1400, 19.6800],
    ],
  },
  {
    id: 'mexico-texcoco',
    name: 'México-Texcoco',
    riskLevel: 'extremo',
    description: 'Corredor oriente con alto índice de asaltos',
    kilometers: 45,
    avgEventsPerHex: 7,
    waypoints: [
      [-99.0700, 19.4300],
      [-98.9800, 19.4500],
      [-98.9200, 19.4800],
      [-98.8800, 19.5100],
      [-98.8200, 19.5400],
    ],
  },
  {
    id: 'san-luis-potosi-hub',
    name: 'Hub SLP (57/70/80)',
    riskLevel: 'extremo',
    description: '#1 en robos de carga México 2025 - convergencia de 3 autopistas',
    kilometers: 150,
    avgEventsPerHex: 12,
    waypoints: [
      [-100.9800, 22.1500],
      [-100.7500, 22.2800],
      [-100.5200, 22.4100],
      [-100.8200, 21.8800],
      [-101.1500, 21.8500],
      [-100.4500, 22.0500],
    ],
  },

  // === NUEVOS CORREDORES ZMVM ===
  {
    id: 'arco-norte',
    name: 'Arco Norte (Libramiento ZMVM)',
    riskLevel: 'alto',
    description: 'Libramiento norte obligatorio para tractocamiones - 223km',
    kilometers: 223,
    avgEventsPerHex: 6,
    waypoints: [
      [-98.5600, 19.6100],  // Tizayuca (conexión 85D Pachuca)
      [-98.7800, 19.5800],  // San Martín de las Pirámides
      [-98.9500, 19.5900],  // Ecatepec Norte
      [-99.1200, 19.7200],  // Tultitlán
      [-99.2600, 19.7800],  // Cuautitlán
      [-99.4500, 19.8200],  // Teoloyucan
      [-99.5800, 19.8500],  // Huehuetoca
      [-99.5000, 20.0800],  // Tepeji del Río (conexión 57D)
    ],
  },
  {
    id: 'circuito-exterior-mexiquense',
    name: 'Circuito Exterior Mexiquense',
    riskLevel: 'extremo',
    description: 'Libramiento oriente ZMVM - Zona de alto riesgo',
    kilometers: 110,
    avgEventsPerHex: 9,
    waypoints: [
      [-98.9500, 19.2800],  // La Paz
      [-98.9000, 19.3600],  // Chalco
      [-98.8800, 19.4500],  // Los Reyes
      [-98.9200, 19.5200],  // Chimalhuacán
      [-99.0000, 19.5800],  // Ecatepec
      [-99.1200, 19.6500],  // Cuautitlán (conexión Arco Norte)
    ],
  },
  {
    id: 'mexico-toluca',
    name: 'México-Toluca (15D)',
    riskLevel: 'alto',
    description: 'Corredor industrial poniente CDMX-Toluca',
    kilometers: 65,
    avgEventsPerHex: 5,
    waypoints: [
      [-99.2600, 19.3600],  // Santa Fe CDMX
      [-99.3500, 19.3400],  // La Marquesa
      [-99.5200, 19.3000],  // Lerma
      [-99.6600, 19.2900],  // Toluca
    ],
  },
  {
    id: 'toluca-atlacomulco',
    name: 'Toluca-Atlacomulco (55)',
    riskLevel: 'medio',
    description: 'Conexión Toluca hacia corredor Bajío',
    kilometers: 80,
    avgEventsPerHex: 4,
    waypoints: [
      [-99.6600, 19.2900],  // Toluca
      [-99.7500, 19.4500],  // Zinacantepec
      [-99.8200, 19.6000],  // Villa Victoria
      [-99.8700, 19.8000],  // Atlacomulco
    ],
  },

  // === CORREDORES DE RIESGO ALTO ===
  {
    id: 'mexico-queretaro',
    name: 'México-Querétaro (57D)',
    riskLevel: 'alto',
    description: 'Principal corredor industrial del Bajío',
    kilometers: 220,
    avgEventsPerHex: 5,
    waypoints: [
      [-99.2200, 19.7150],
      [-99.3500, 19.8200],
      [-99.4500, 19.9000],
      [-99.5300, 19.9500],
      [-99.7000, 20.1500],
      [-99.8500, 20.2800],
      [-99.9900, 20.3900],
      [-100.1500, 20.4800],
      [-100.3900, 20.5900],
    ],
  },
  {
    id: 'corredor-bajio',
    name: 'Corredor Bajío (45D)',
    riskLevel: 'alto',
    description: 'Eje automotriz Querétaro-León',
    kilometers: 180,
    avgEventsPerHex: 6,
    waypoints: [
      [-100.3900, 20.5900],
      [-100.5500, 20.5500],
      [-100.8100, 20.5200],
      [-101.0200, 20.5700],
      [-101.3500, 20.6700],
      [-101.4300, 20.9500],
      [-101.5200, 21.0500],
      [-101.6800, 21.1200],
    ],
  },
  {
    id: 'guadalajara-lagos',
    name: 'Guadalajara-Lagos de Moreno',
    riskLevel: 'alto',
    description: 'Conexión Jalisco-Bajío',
    kilometers: 190,
    avgEventsPerHex: 5,
    waypoints: [
      [-103.3500, 20.6700],
      [-103.1800, 20.7200],
      [-102.9500, 20.8100],
      [-102.7200, 20.9300],
      [-102.3400, 21.3500],
      [-102.0800, 21.4200],
    ],
  },
  {
    id: 'tamaulipas-frontera',
    name: 'Corredor Tamaulipas (85)',
    riskLevel: 'alto',
    description: 'Corredor fronterizo de alto riesgo',
    kilometers: 320,
    avgEventsPerHex: 5,
    waypoints: [
      [-99.5200, 23.7250],
      [-99.1700, 24.0300],
      [-98.9500, 24.3500],
      [-98.7300, 24.7900],
      [-98.5600, 25.4200],
      [-98.2900, 25.8700],
      [-97.5000, 25.8700],
    ],
  },
  {
    id: 'manzanillo-tampico',
    name: 'Manzanillo-Tampico (Transversal)',
    riskLevel: 'alto',
    description: 'Corredor costa a costa cruzando SLP',
    kilometers: 850,
    avgEventsPerHex: 6,
    waypoints: [
      [-104.3100, 19.1100],
      [-103.3500, 20.6700],
      [-102.3400, 21.3500],
      [-101.8800, 21.8800],
      [-100.9800, 22.1500],
      [-99.1500, 22.2500],
      [-97.8600, 22.2300],
    ],
  },
  {
    id: 'lazaro-cardenas-cdmx',
    name: 'Lázaro Cárdenas-CDMX',
    riskLevel: 'alto',
    description: 'Puerto Pacífico al centro del país',
    kilometers: 480,
    avgEventsPerHex: 5,
    waypoints: [
      [-102.1690, 17.9270],
      [-101.1900, 18.9200],
      [-101.1850, 19.7010],
      [-100.4500, 19.7200],
      [-100.2800, 19.6500],
      [-99.5300, 19.5500],
      [-99.1700, 19.4200],
    ],
  },
  {
    id: 'altiplano-central',
    name: 'Altiplano Central (45/49)',
    riskLevel: 'alto',
    description: 'Aguascalientes-Zacatecas-SLP',
    kilometers: 280,
    avgEventsPerHex: 6,
    waypoints: [
      [-102.2900, 21.8800],
      [-102.5700, 22.7700],
      [-102.2800, 23.1900],
      [-101.5200, 22.8500],
      [-100.9800, 22.1500],
    ],
  },
  {
    id: 'mazatlan-durango-torreon',
    name: 'Mazatlán-Durango-Torreón',
    riskLevel: 'alto',
    description: 'Corredor serrano peligroso',
    kilometers: 520,
    avgEventsPerHex: 5,
    waypoints: [
      [-106.4200, 23.2300],
      [-105.8500, 23.6800],
      [-105.0200, 24.0200],
      [-104.4500, 24.8500],
      [-103.4500, 25.5400],
    ],
  },
  {
    id: 'queretaro-ciudad-juarez',
    name: 'Querétaro-Cd. Juárez (45/49)',
    riskLevel: 'alto',
    description: 'Eje norte por SLP y Chihuahua',
    kilometers: 1200,
    avgEventsPerHex: 4,
    waypoints: [
      [-100.3900, 20.5900],
      [-100.9800, 22.1500],
      [-102.5700, 22.7700],
      [-103.4500, 25.5400],
      [-105.4800, 28.6400],
      [-106.4300, 31.7400],
    ],
  },

  // === CORREDORES DE RIESGO MEDIO ===
  {
    id: 'mexico-veracruz',
    name: 'México-Veracruz (150D/180D)',
    riskLevel: 'medio',
    description: 'Corredor al Golfo',
    kilometers: 400,
    avgEventsPerHex: 4,
    waypoints: [
      [-98.2000, 19.0400],
      [-97.9200, 18.9300],
      [-97.6300, 18.8700],
      [-97.4000, 18.8500],
      [-97.1000, 18.8800],
      [-96.9300, 18.8500],
      [-96.6800, 18.9200],
      [-96.4500, 19.0500],
      [-96.1342, 19.2033],
    ],
  },
  {
    id: 'guadalajara-colima',
    name: 'Guadalajara-Manzanillo',
    riskLevel: 'medio',
    description: 'Conexión al Puerto de Manzanillo',
    kilometers: 300,
    avgEventsPerHex: 4,
    waypoints: [
      [-103.3500, 20.6700],
      [-103.4800, 20.5200],
      [-103.7600, 20.2100],
      [-103.9800, 19.9200],
      [-104.2200, 19.5800],
      [-104.3100, 19.1100],
    ],
  },
  {
    id: 'monterrey-saltillo',
    name: 'Monterrey-Saltillo (40D)',
    riskLevel: 'medio',
    description: 'Conexión industrial noreste',
    kilometers: 85,
    avgEventsPerHex: 3,
    waypoints: [
      [-100.3100, 25.6700],
      [-100.4500, 25.5800],
      [-100.6200, 25.5200],
      [-100.8500, 25.4300],
      [-101.0000, 25.4200],
    ],
  },
  {
    id: 'laredo-monterrey',
    name: 'Nuevo Laredo-Monterrey (85D)',
    riskLevel: 'medio',
    description: 'Principal cruce fronterizo comercial',
    kilometers: 230,
    avgEventsPerHex: 4,
    waypoints: [
      [-99.5200, 27.4800],
      [-99.6500, 27.1200],
      [-99.8200, 26.6800],
      [-100.0500, 26.2300],
      [-100.3100, 25.6700],
    ],
  },
  {
    id: 'veracruz-monterrey',
    name: 'Veracruz-Monterrey (180/85)',
    riskLevel: 'medio',
    description: 'Conecta puertos del Golfo cruzando SLP',
    kilometers: 780,
    avgEventsPerHex: 4,
    waypoints: [
      [-96.1342, 19.2033],
      [-97.0500, 20.5300],
      [-98.2000, 21.1500],
      [-99.1500, 22.2500],
      [-100.9800, 22.1500],
      [-100.3100, 25.6700],
    ],
  },
  {
    id: 'costera-pacifico',
    name: 'Costera del Pacífico',
    riskLevel: 'medio',
    description: 'Acapulco-Lázaro Cárdenas-Manzanillo',
    kilometers: 650,
    avgEventsPerHex: 3,
    waypoints: [
      [-99.8900, 16.8500],
      [-100.3800, 17.6500],
      [-102.1690, 17.9270],
      [-104.3100, 19.1100],
    ],
  },
  {
    id: 'puebla-oaxaca',
    name: 'Puebla-Oaxaca (135D)',
    riskLevel: 'medio',
    description: 'Corredor sur hacia Oaxaca',
    kilometers: 340,
    avgEventsPerHex: 3,
    waypoints: [
      [-98.2000, 19.0400],
      [-97.4000, 18.8500],
      [-97.0600, 18.1300],
      [-96.7200, 17.0600],
    ],
  },
  {
    id: 'mexico-nogales',
    name: 'México-Nogales (15D)',
    riskLevel: 'medio',
    description: 'Corredor oeste a frontera Arizona',
    kilometers: 1800,
    avgEventsPerHex: 3,
    waypoints: [
      [-99.1700, 19.4200],
      [-103.3500, 20.6700],
      [-105.2500, 21.5000],
      [-106.4200, 23.2300],
      [-107.4000, 24.8000],
      [-108.9800, 25.8000],
      [-109.9300, 27.4800],
      [-110.9700, 29.0700],
      [-110.9400, 31.3100],
    ],
  },

  // === CORREDORES DE RIESGO BAJO ===
  {
    id: 'merida-cancun',
    name: 'Mérida-Cancún (180D)',
    riskLevel: 'bajo',
    description: 'Corredor turístico península',
    kilometers: 310,
    avgEventsPerHex: 1,
    waypoints: [
      [-89.6200, 20.9700],
      [-89.1500, 20.9300],
      [-88.2000, 20.8500],
      [-87.5300, 20.5100],
      [-86.8500, 21.1600],
    ],
  },
  {
    id: 'tijuana-ensenada',
    name: 'Tijuana-Ensenada (1D)',
    riskLevel: 'bajo',
    description: 'Corredor Baja California',
    kilometers: 100,
    avgEventsPerHex: 1,
    waypoints: [
      [-117.0200, 32.5300],
      [-116.9700, 32.4100],
      [-116.8700, 32.1500],
      [-116.6200, 31.8700],
    ],
  },

  // === NUEVOS CORREDORES P0 - Fase 1 ===
  {
    id: 'cordoba-puebla',
    name: 'Córdoba-Orizaba-Puebla (150D Sur)',
    riskLevel: 'alto',
    description: '19% de incidentes nacionales (AMESIS 2025). 2do corredor más peligroso de México',
    kilometers: 190,
    avgEventsPerHex: 7,
    waypoints: [
      [-96.9300, 18.8900],  // Córdoba
      [-97.0900, 18.8500],  // Orizaba
      [-97.2500, 18.8200],  // Cd. Mendoza / Maltrata
      [-97.4000, 18.8000],  // Cumbres de Maltrata
      [-97.6300, 18.8300],  // Esperanza
      [-97.8500, 18.9200],  // Tehuacán entronque
      [-98.0500, 19.0000],  // Amozoc
      [-98.2000, 19.0414],  // Puebla
    ],
  },
  {
    id: 'cdmx-cuernavaca-acapulco',
    name: 'CDMX-Cuernavaca-Acapulco (95D)',
    riskLevel: 'alto',
    description: 'Autopista del Sol. Guerrero = zona roja. Bloqueos frecuentes',
    kilometers: 380,
    avgEventsPerHex: 5,
    waypoints: [
      [-99.1700, 19.4200],  // CDMX Sur
      [-99.2200, 19.2500],  // Tres Marías
      [-99.2340, 18.9220],  // Cuernavaca
      [-99.3500, 18.7500],  // Alpuyeca
      [-99.5000, 18.4500],  // Taxco entronque
      [-99.6500, 18.0000],  // Iguala
      [-99.7500, 17.5500],  // Chilpancingo
      [-99.8900, 16.8500],  // Acapulco
    ],
  },
  {
    id: 'cdmx-pachuca',
    name: 'CDMX-Pachuca (85D)',
    riskLevel: 'medio',
    description: 'Alto tráfico, conexión con Arco Norte. Rutas a Tizayuca/Pachuca',
    kilometers: 95,
    avgEventsPerHex: 3,
    waypoints: [
      [-99.1332, 19.4326],  // CDMX Norte
      [-99.0800, 19.5300],  // Ecatepec
      [-98.9500, 19.6100],  // Tizayuca
      [-98.8200, 19.7200],  // Pachuca aproximación
      [-98.7300, 20.1010],  // Pachuca
    ],
  },
  {
    id: 'torreon-monterrey',
    name: 'Torreón-Monterrey (40D)',
    riskLevel: 'alto',
    description: 'Corredor industrial La Laguna-MTY. Zona de conflicto entre cárteles',
    kilometers: 300,
    avgEventsPerHex: 5,
    waypoints: [
      [-103.4500, 25.5400],  // Torreón
      [-103.2000, 25.4200],  // Gómez Palacio
      [-102.5500, 25.3000],  // Parras
      [-101.4500, 25.3800],  // Saltillo Sur
      [-101.0000, 25.4200],  // Saltillo
      [-100.3100, 25.6700],  // Monterrey
    ],
  },
  {
    id: 'chihuahua-ciudad-juarez',
    name: 'Chihuahua-Cd. Juárez (45 Norte)',
    riskLevel: 'alto',
    description: 'Corredor maquiladora IMMEX. Rutas activas en matriz de precios',
    kilometers: 370,
    avgEventsPerHex: 4,
    waypoints: [
      [-106.0889, 28.6353],  // Chihuahua
      [-106.3500, 29.1000],  // Sacramento
      [-106.4000, 29.5500],  // Villa Ahumada
      [-106.4200, 30.3500],  // Samalayuca
      [-106.4300, 31.7400],  // Cd. Juárez
    ],
  },
  {
    id: 'villahermosa-coatzacoalcos',
    name: 'Villahermosa-Coatzacoalcos (180)',
    riskLevel: 'medio',
    description: 'Corredor petroquímico. Rutas a Villahermosa en matriz',
    kilometers: 250,
    avgEventsPerHex: 3,
    waypoints: [
      [-92.9475, 17.9893],  // Villahermosa
      [-93.2000, 18.0500],  // Cárdenas
      [-93.6000, 18.1500],  // Agua Dulce
      [-94.1000, 18.1000],  // Las Choapas
      [-94.4300, 18.1300],  // Coatzacoalcos
    ],
  },
  {
    id: 'tepic-mazatlan',
    name: 'Tepic-Mazatlán (15D Norte)',
    riskLevel: 'medio',
    description: 'Costa Pacífico norte, conecta con corredor Nogales',
    kilometers: 290,
    avgEventsPerHex: 3,
    waypoints: [
      [-104.8950, 21.5040],  // Tepic
      [-105.2500, 21.8000],  // Acaponeta
      [-105.6000, 22.3000],  // Escuinapa
      [-105.9500, 22.8000],  // Mazatlán Norte
      [-106.4200, 23.2300],  // Mazatlán
    ],
  },

  // === CORREDOR P0: SLP - Matehuala - Saltillo (57D) ===
  {
    id: 'slp-matehuala-saltillo',
    name: 'SLP - Matehuala - Saltillo (57D)',
    riskLevel: 'alto',
    description: 'Eje norte por Altiplano Potosino. Zonas muertas de comunicación, robos organizados en Matehuala. Principal arteria CDMX-MTY',
    kilometers: 450,
    avgEventsPerHex: 5,
    waypoints: [
      [-100.9800, 22.1500],  // SLP Norte
      [-100.8500, 22.4500],  // Entronque Charcas
      [-100.7800, 22.7300],  // Charcas
      [-100.6800, 23.0000],  // Venado
      [-100.6300, 23.4000],  // Cedral
      [-100.6500, 23.6400],  // Matehuala
      [-100.7500, 24.0500],  // La Ventura
      [-100.8500, 24.4500],  // Entronque Saltillo
      [-101.0000, 25.0000],  // Saltillo Sur
      [-101.0000, 25.4200],  // Saltillo
    ],
  },

  // === CORREDORES NORPONIENTE ===
  {
    id: 'guadalajara-tepic',
    name: 'Guadalajara-Tepic (15D)',
    riskLevel: 'medio',
    description: 'Conexión GDL-Costa Pacífico. Sierra de Nayarit con cobertura limitada',
    kilometers: 220,
    avgEventsPerHex: 3,
    waypoints: [
      [-103.3500, 20.6700],  // GDL
      [-103.7500, 20.8500],  // Tequila
      [-104.2000, 21.0500],  // Plan de Barrancas
      [-104.6000, 21.2500],  // Compostela
      [-104.8950, 21.5040],  // Tepic
    ],
  },
  {
    id: 'culiacan-guaymas',
    name: 'Culiacán-Los Mochis-Guaymas (15D)',
    riskLevel: 'alto',
    description: 'Corredor Sinaloa-Sonora. Zona de operación de cárteles. Robos a transporte agrícola',
    kilometers: 600,
    avgEventsPerHex: 5,
    waypoints: [
      [-107.3900, 24.7900],  // Culiacán
      [-107.9500, 25.3500],  // Guamúchil
      [-108.9900, 25.7700],  // Los Mochis
      [-109.0500, 25.6000],  // Topolobampo
      [-109.5500, 26.9000],  // Navojoa
      [-109.9400, 27.4800],  // Cd. Obregón
      [-110.9000, 27.9700],  // Guaymas
    ],
  },
  {
    id: 'hermosillo-nogales',
    name: 'Hermosillo-Nogales (15D Norte)',
    riskLevel: 'medio',
    description: 'Cruce fronterizo Arizona. Maquiladoras IMMEX. Desierto de Sonora',
    kilometers: 280,
    avgEventsPerHex: 3,
    waypoints: [
      [-110.9700, 29.0700],  // Hermosillo
      [-110.9500, 29.5500],  // Zona desierto
      [-110.9600, 30.3000],  // Magdalena
      [-110.9500, 30.6300],  // Santa Ana
      [-110.9400, 31.3100],  // Nogales
    ],
  },
];

// Helper to get corridors by risk level
export const getCorridorsByRiskLevel = (level: string): HighwayCorridor[] => {
  return HIGHWAY_CORRIDORS.filter(c => c.riskLevel === level);
};

// Get total kilometers by risk level
export const getTotalKilometersByRisk = (): Record<string, number> => {
  return HIGHWAY_CORRIDORS.reduce((acc, corridor) => {
    acc[corridor.riskLevel] = (acc[corridor.riskLevel] || 0) + corridor.kilometers;
    return acc;
  }, {} as Record<string, number>);
};
