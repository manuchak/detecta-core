

# Modulo de Seguridad Integral: Integracion Hermes + Detecta

## Resumen Ejecutivo

Integrar el motor de inteligencia de riesgo de Hermes (datos estaticos de ~1,500 segmentos carreteros, 1,700+ zonas de cobertura celular, 489 puntos de corredores GPS, scoring H3, puntos seguros certificados, y recomendaciones ISO 28000) con la infraestructura operativa de Detecta (incidentes operativos, incidentes RRSS, servicios planificados, checklists, StarMap KPIs) para crear un modulo de seguridad que transforme datos en accionables de prevencion, cumplimiento y respuesta.

---

## Inventario de Activos de Hermes a Integrar

### Datos Estaticos (copia directa, sin adaptacion)

| Archivo | Lineas | Contenido | Valor |
|---|---|---|---|
| `highwaySegments.ts` | 1,502 | ~200 segmentos carreteros de 30km c/u con nivel de riesgo, horas criticas, tipo de incidente comun, waypoints GPS y recomendaciones. Datos CANACAR/AMIS 2024-2025 recalibrados (~7% extremo, 18% alto, 40% medio, 35% bajo) | Base del mapa de calor de riesgo |
| `highwayCorridors.ts` | 489 | 23 corredores con waypoints Mapbox, nivel de riesgo y promedio de eventos por hexagono H3 | Lineas de riesgo en mapa |
| `cellularCoverage.ts` | 1,713 | Base de datos de zonas muertas celulares con cobertura por carrier (Telcel/ATT/Movistar), severidad, confianza, y analisis operacional de touchpoints perdidos. Fuentes: nPerf, IFT, OpenCellID | Mapa de conectividad para monitoreo |
| `safePointScoring.ts` | 264 | Sistema de puntuacion de puntos seguros (100 pts, 3 categorias: vigilancia 40pts, visibilidad 35pts, operacional 25pts) con 4 niveles de certificacion (oro/plata/bronce/precaucion) | Certificacion de puntos de parada |
| `securityRecommendations.ts` | 472 | Generador de recomendaciones ISO 28000 con 4 ejes (prevencion, deteccion, respuesta, cumplimiento), constantes operacionales (touchpoint cada 25 min, 70km/h, umbrales de alerta), y determinacion de tipo de custodia por valor de carga | Motor de recomendaciones automaticas |
| `riskCalculations.ts` | 236 | Motor de calculo ISO 31000 con matrices de probabilidad x impacto, 4 dimensiones de consecuencia (personas, operacion, financiero, reputacion), y niveles de aceptabilidad | Scoring formal de riesgos |
| `riskContextMatching.ts` | 181 | Motor semantico que cruza amenazas con vulnerabilidades/controles por contexto (transporte, RRHH, tecnologia, infraestructura, seguridad, cumplimiento) | Sugerencias inteligentes |
| `riskIdentificationEngine.ts` | 412 | Motor ISO 31010 para generacion automatica de riesgos, analisis de gaps de cobertura por categoria, validacion de cumplimiento, y metricas de calidad | Identificacion proactiva |
| `riskTrends.ts` | 173 | Funciones para obtener evaluaciones historicas y calcular tendencias de riesgos criticos entre periodos | Tendencias temporales |
| `safePointsRouteAnalysis.ts` | 214 | Algoritmo para encontrar puntos seguros a lo largo de una ruta, distribucion uniforme, y analisis de servicios disponibles | Planificacion de paradas seguras |
| `truckBypasses.ts` | 261 | Configuracion de perifericos para carga pesada en Guadalajara, CDMX, Monterrey, Puebla, Leon, Aguascalientes, Queretaro con waypoints GPS | Rutas de desvio obligatorias |

### Hooks (adaptar a contexto Detecta)

| Hook | Funcion | Adaptacion necesaria |
|---|---|---|
| `useCorredorRiskAnalysis` | Dado un par de coordenadas (origen, destino), encuentra segmentos carreteros que cruza la ruta usando Haversine + interpolacion, determina nivel maximo de riesgo (ISO 28000: peor segmento define la ruta) y agrega recomendaciones | Conectar con coordenadas de `servicios_planificados` |
| `useRouteCoverage` | Analiza cobertura celular a lo largo de una ruta, genera reporte de conectividad (full/partial/critical), identifica zonas muertas cruzadas | Integrar con mapa de monitoreo |
| `useRouteRiskSummary` | Combina riesgo de corredor + cobertura celular + valor de carga en un resumen ejecutivo con recomendaciones ISO 28000, nivel de alerta, y tipo de custodia necesario | Resumen por servicio planificado |
| `useRiskZones` | CRUD contra tabla `risk_zone_scores` con hexagonos H3, scores, recalculo | Recrear tabla en Detecta |
| `useH3Geocoding` | Geocodifica direcciones a indices H3 via edge function (`geocode-to-h3` usa h3-js + Mapbox) | Copiar edge function |
| `useSafePoints` | CRUD completo de puntos seguros con filtros, verificacion, y estadisticas | Recrear tabla en Detecta |

### Edge Functions (copiar y adaptar)

| Funcion | Proposito | Dependencias |
|---|---|---|
| `geocode-to-h3` | Convierte direccion o coordenadas a indice H3 usando h3-js + Mapbox | Secret: `MAPBOX_SECRET_TOKEN` (ya existe como `MAPBOX_ACCESS_TOKEN`) |
| `recalculate-zone-scores` | Recalcula scores de zonas H3 llamando RPC `recalculate_zone_score` | RPC en BD |
| `seed-risk-zones` | Genera datos iniciales: hexagonos H3 a lo largo de 23 corredores con eventos de seguridad | Tablas `risk_zone_scores`, `security_events` |

### Tipos TypeScript

| Archivo | Contenido |
|---|---|
| `types/riskZones.ts` | `RiskLevel`, `SeverityLevel`, `EventType`, `SecurityEvent`, `RiskZoneScore`, `RiskZoneAdjustment`, `RiskZoneHistory`, `RiskScoreBreakdown`, `RiskCalculationParams` |
| `types/risk.ts` | Tipos ISO 31000/28000 completos: `Organization`, `Process`, `MatrixConfig`, `RiskAssessment`, `IdentifiedRisk`, `TreatmentPlan`, enums y labels |

---

## Arquitectura del Modulo de Seguridad en Detecta

### Estructura de archivos nueva

```text
src/
  pages/
    Security/
      SecurityPage.tsx              -- Layout principal con tabs
  components/
    security/
      dashboard/
        SecurityDashboard.tsx       -- Tab 1: Risk Posture
        RiskScoreCard.tsx           -- Score 0-100 con semaforo
        SecurityAlertsTicker.tsx    -- Alertas activas
        RiskHeatMap.tsx             -- Mapa Mapbox con overlay H3
      routes/
        RouteRiskIntelligence.tsx   -- Tab 2: Rutas y Zonas
        CorridorRiskTable.tsx       -- Tabla de corredores con score
        SafePointsManager.tsx       -- CRUD de puntos seguros
        CellularCoverageMap.tsx     -- Overlay de cobertura
      analytics/
        IncidentAnalytics.tsx       -- Tab 3: Analisis
        RootCauseTree.tsx           -- Arbol de causas
        NearMissCorrelation.tsx     -- Cruce RRSS vs operaciones
        IncidentTrendChart.tsx      -- Tendencias temporales
      compliance/
        ComplianceTracker.tsx       -- Tab 4: Cumplimiento
        CustodianComplianceMatrix.tsx  -- Matriz por custodio
        ProtocolChecklist.tsx       -- Protocolos por tipo servicio
        DocumentExpiryCalendar.tsx  -- Vencimientos
      intelligence/
        ThreatIntelFeed.tsx         -- Tab 5: Inteligencia
        RRSSFeedTimeline.tsx        -- Timeline de incidentes RRSS
        ThreatRelevanceScorer.tsx   -- Scoring de relevancia
  lib/
    security/
      highwaySegments.ts           -- Copiado de Hermes
      highwayCorridors.ts          -- Copiado de Hermes
      cellularCoverage.ts          -- Copiado de Hermes
      safePointScoring.ts          -- Copiado de Hermes
      securityRecommendations.ts   -- Copiado de Hermes
      riskCalculations.ts          -- Copiado de Hermes
      riskContextMatching.ts       -- Copiado de Hermes
      riskIdentificationEngine.ts  -- Copiado de Hermes
      riskTrends.ts                -- Copiado de Hermes
      safePointsRouteAnalysis.ts   -- Copiado de Hermes
      truckBypasses.ts             -- Copiado de Hermes
  hooks/
    security/
      useCorredorRiskAnalysis.ts   -- Adaptado de Hermes
      useRouteCoverage.ts          -- Adaptado de Hermes
      useRouteRiskSummary.ts       -- Adaptado de Hermes
      useRiskZones.ts              -- Adaptado de Hermes
      useH3Geocoding.ts            -- Adaptado de Hermes
      useSafePoints.ts             -- Adaptado de Hermes
      useSecurityDashboard.ts      -- Nuevo: agrega datos Detecta
      useComplianceMatrix.ts       -- Nuevo: cumplimiento custodios
      useNearMisses.ts             -- Nuevo: correlacion RRSS/ops
  types/
    security/
      riskZones.ts                 -- Copiado de Hermes
      risk.ts                      -- Adaptado de Hermes
```

### Tablas nuevas en base de datos

**1. `risk_zone_scores`** (del modelo de Hermes)
```sql
CREATE TABLE risk_zone_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_index TEXT UNIQUE NOT NULL,
  h3_resolution INTEGER DEFAULT 6,
  base_score NUMERIC DEFAULT 0,
  manual_adjustment NUMERIC DEFAULT 0,
  final_score NUMERIC GENERATED ALWAYS AS (base_score + manual_adjustment) STORED,
  risk_level TEXT DEFAULT 'bajo',
  price_multiplier NUMERIC DEFAULT 1.0,
  event_count INTEGER DEFAULT 0,
  last_event_date DATE,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_risk_zones_h3 ON risk_zone_scores(h3_index);
CREATE INDEX idx_risk_zones_level ON risk_zone_scores(risk_level);
```

**2. `security_events`** (del modelo de Hermes)
```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_index TEXT NOT NULL,
  h3_resolution INTEGER DEFAULT 6,
  event_type TEXT NOT NULL, -- robo, asalto, secuestro, vandalismo, etc.
  severity TEXT NOT NULL,   -- bajo, medio, alto, critico
  event_date DATE NOT NULL,
  description TEXT,
  source TEXT,              -- CANACAR, RRSS, operativo, etc.
  reported_by UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT false,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_security_events_h3 ON security_events(h3_index);
CREATE INDEX idx_security_events_date ON security_events(event_date);
```

**3. `risk_zone_history`** (auditoria de cambios)
```sql
CREATE TABLE risk_zone_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_index TEXT NOT NULL,
  previous_score NUMERIC,
  new_score NUMERIC,
  previous_risk_level TEXT,
  new_risk_level TEXT,
  change_type TEXT NOT NULL, -- event_added, recalculation, manual_adjustment
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. `safe_points`** (del modelo de Hermes)
```sql
CREATE TABLE safe_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- gasolinera, base_custodia, area_descanso, etc.
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  address TEXT,
  corridor_id TEXT,
  km_marker NUMERIC,
  -- Criterios de evaluacion (100 pts total)
  has_security_guard BOOLEAN DEFAULT false,
  has_employees_24h BOOLEAN DEFAULT false,
  has_visible_cctv BOOLEAN DEFAULT false,
  has_military_nearby BOOLEAN DEFAULT false,
  is_well_lit BOOLEAN DEFAULT false,
  is_recognized_chain BOOLEAN DEFAULT false,
  has_perimeter_barrier BOOLEAN DEFAULT false,
  has_commercial_activity BOOLEAN DEFAULT false,
  truck_fits_inside BOOLEAN DEFAULT false,
  has_alternate_exit BOOLEAN DEFAULT false,
  has_restrooms BOOLEAN DEFAULT false,
  has_cell_signal BOOLEAN DEFAULT false,
  -- Calculados
  total_score INTEGER DEFAULT 0,
  certification_level TEXT DEFAULT 'precaucion',
  -- Metadata
  photo_url TEXT,
  notes TEXT,
  verification_status TEXT DEFAULT 'pending',
  reported_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_safe_points_coords ON safe_points(lat, lng);
CREATE INDEX idx_safe_points_corridor ON safe_points(corridor_id);
```

**5. `protocolos_seguridad`** (nuevo para Detecta)
```sql
CREATE TABLE protocolos_seguridad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_servicio TEXT NOT NULL, -- local, foraneo, alta_seguridad
  descripcion TEXT,
  checklist_items JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**6. `capacitaciones_seguridad`** (nuevo para Detecta)
```sql
CREATE TABLE capacitaciones_seguridad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_id UUID NOT NULL,
  nombre_capacitacion TEXT NOT NULL,
  fecha_completado DATE,
  fecha_vencimiento DATE,
  certificado_url TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RPCs de base de datos

**`recalculate_zone_score(p_h3_index TEXT)`**: Recalcula el score de una zona H3 sumando eventos ponderados por severidad y decay temporal.

### Edge Functions nuevas

**`geocode-to-h3`**: Copia directa de Hermes. Convierte coordenadas a indice H3 usando h3-js. Modo dual: coordenadas directas (solo H3) o direccion (Mapbox + H3).

**`seed-risk-zones`**: Copia adaptada de Hermes. Genera datos iniciales para los 23 corredores mexicanos con hexagonos H3, scores de riesgo y eventos de seguridad historicos simulados basados en CANACAR/SESNSP 2025.

**`recalculate-zone-scores`**: Copia de Hermes. Recalcula scores de zonas especificas via RPC.

---

## Plan de Fases

### FASE 1: Fundamentos de Datos y Mapa de Riesgo (Sprint 1)

**Objetivo**: Tener el mapa de calor de riesgo funcionando con datos estaticos + dinamicos.

**Paso 1.1 - Copiar datos estaticos de Hermes**
- Copiar 11 archivos `src/lib/` a `src/lib/security/`
- Copiar 2 archivos `src/types/` a `src/types/security/`
- Adaptar imports internos (cambiar `@/types/risk` por `@/types/security/risk`, etc.)

**Paso 1.2 - Crear tablas en base de datos**
- Migracion con las 6 tablas descritas arriba
- RPC `recalculate_zone_score`
- Politicas RLS apropiadas

**Paso 1.3 - Copiar y deployer edge functions**
- `geocode-to-h3`: copiar de Hermes, adaptar config.toml
- `seed-risk-zones`: copiar de Hermes, adaptar a proyecto Detecta
- `recalculate-zone-scores`: copiar de Hermes

**Paso 1.4 - Copiar y adaptar hooks**
- 6 hooks de `src/hooks/security/` adaptados al cliente Supabase de Detecta

**Paso 1.5 - Crear SecurityPage con Tab 1 (Risk Posture Dashboard)**
- Pagina `/seguridad` con layout de tabs
- Mapa de calor usando Mapbox (ya integrado) con overlay de corredores de riesgo
- Cards de KPIs: tasa de incidentes, controles efectivos, servicios en zonas rojas, dias sin incidente critico
- Ticker de alertas activas
- Datos del mapa: corredores estaticos coloreados por riesgo + hexagonos H3 de la BD

**Paso 1.6 - Crear Tab 2 (Route Risk Intelligence)**
- Tabla de corredores con score de riesgo, horas criticas, tipo de incidente
- Mapa interactivo de zonas con overlay de cobertura celular
- Analisis de ruta: dado origen/destino de un servicio, mostrar segmentos cruzados, nivel de riesgo, y recomendaciones ISO 28000

**Paso 1.7 - Ejecutar seed de datos**
- Correr `seed-risk-zones` para poblar hexagonos H3 en los 23 corredores
- Verificar visualizacion en mapa

---

### FASE 2: Puntos Seguros y Cumplimiento (Sprint 2)

**Paso 2.1 - CRUD de Puntos Seguros**
- Manager de puntos seguros con mapa, formulario de evaluacion (12 criterios), y certificacion automatica
- Verificacion por usuarios con rol `jefe_seguridad`
- Overlay de puntos seguros en mapa de riesgo (color por certificacion)

**Paso 2.2 - Analisis de ruta con puntos seguros**
- Dado un servicio planificado, encontrar puntos seguros a lo largo de la ruta
- Mostrar distancia desde la ruta, servicios disponibles, y certificacion

**Paso 2.3 - Tab 4 (Compliance Tracker)**
- Matriz de cumplimiento por custodio: documentos vigentes, checklists completados vs servicios, capacitaciones, incidentes atribuibles
- Score compuesto de confiabilidad (0-100)
- Calendario de vencimientos (documentos por vencer en 30 dias)
- Protocolos por tipo de servicio con rastreo de cumplimiento

---

### FASE 3: Analitica de Incidentes (Sprint 3)

**Paso 3.1 - Tab 3 (Incident Analytics)**
- Dashboard analitico sobre `incidentes_operativos`: distribucion por tipo, severidad, zona, custodio, cliente, dia, hora
- Tendencias temporales (mensual/trimestral)
- Tasa de atribuibilidad operativa vs externa

**Paso 3.2 - Correlacion Near-Miss (RRSS vs Operaciones)**
- Cruzar `incidentes_rrss` con `servicios_planificados` que transitaron la misma zona en +/- 48h
- Mostrar "casi-incidentes" que evidencian riesgo latente
- Usar Haversine para proximidad geografica entre incidente RRSS y ruta del servicio

**Paso 3.3 - Arbol de causas raiz**
- Para cada incidente cerrado, clasificacion de factores contribuyentes
- Analisis de controles activos vs efectivos (datos de StarMap R3/R4)

**Paso 3.4 - Generador de reportes PDF**
- Reporte ejecutivo de seguridad mensual/trimestral usando jspdf (ya disponible)
- Incluye: score de riesgo, tendencias, cumplimiento, near-misses, recomendaciones

---

### FASE 4: Inteligencia de Amenazas (Sprint 4)

**Paso 4.1 - Tab 5 (Threat Intelligence Feed)**
- Timeline de `incidentes_rrss` filtrados por relevancia para zonas operativas
- Scoring de relevancia usando `riskContextMatching.ts`: proximidad a rutas activas, tipo de incidente, temporalidad, confianza de clasificacion AI

**Paso 4.2 - Alertas automaticas**
- Cuando un incidente RRSS se detecta en zona donde hay servicio programado en proximas 24-48h, generar alerta
- Notificacion en SecurityAlertsTicker del dashboard

**Paso 4.3 - Activar pipeline RRSS**
- Configurar cron para `apify-data-fetcher` (edge function ya existe) que alimente `incidentes_rrss` periodicamente
- `procesar-incidente-rrss` (ya existe) para clasificacion AI

**Paso 4.4 - Resumen semanal**
- Digest automatico de amenazas por zona con tendencias
- Puede ser componente visual o PDF exportable

---

### FASE 5: Integracion Operativa (Sprint 5)

**Paso 5.1 - Enriquecer planificacion de servicios**
- Al crear/editar un servicio planificado, mostrar automaticamente:
  - Nivel de riesgo de la ruta (de `useCorredorRiskAnalysis`)
  - Zonas de cobertura celular critica (de `useRouteCoverage`)
  - Puntos seguros disponibles en la ruta
  - Recomendaciones ISO 28000 (de `securityRecommendations.ts`)
  - Tipo de custodia sugerido por valor de carga

**Paso 5.2 - Retroalimentacion de incidentes al scoring**
- Cuando se registra un incidente operativo con coordenadas, automaticamente:
  - Calcular H3 del punto
  - Insertar en `security_events`
  - Recalcular `risk_zone_scores` de esa zona
  - Registrar cambio en `risk_zone_history`

**Paso 5.3 - Vista TV de seguridad**
- Panel para monitores tipo TV con mapa en vivo de riesgo + servicios activos + alertas

---

## Navegacion y Acceso

- Ruta: `/seguridad`
- Agregar entrada en `MainNavigation.tsx` con icono `Shield`
- Roles con acceso: `admin`, `owner`, `jefe_seguridad`, `analista_seguridad`, `coordinador_operaciones`
- Tabs internos: Risk Posture, Rutas y Zonas, Analisis, Cumplimiento, Inteligencia

---

## Dependencias y Riesgos del Plan

| Item | Estado | Accion |
|---|---|---|
| Mapbox token | Ya configurado en Detecta | Reutilizar `mapbox-token` edge function |
| h3-js (libreria) | Solo se usa en edge function (Deno import via esm.sh) | No requiere instalacion en frontend |
| Datos RRSS | Pipeline existe (`apify-data-fetcher`, `procesar-incidente-rrss`) pero sin datos activos | Activar en Fase 4 |
| Incidentes operativos | Solo 2 registros existentes | El modulo mejora con mas datos; funcional desde el inicio con datos estaticos de Hermes |
| Coordenadas en servicios | Algunos servicios planificados tienen lat/lng | Para integracion operativa (Fase 5) se necesitan coordenadas geocodificadas |

