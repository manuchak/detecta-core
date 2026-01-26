

# Plan: Módulo Master de Clientes CRM con Integración Pipedrive

## Resumen Ejecutivo

Crear un nuevo módulo centralizado "CRM Hub" que unifique la visibilidad del ciclo de vida comercial completo: desde prospectos en Pipedrive hasta servicios ejecutados en Detecta, proporcionando dashboards de pipeline de ventas, forecast de ingresos y trazabilidad cliente → servicios.

---

## Diagnóstico del Estado Actual

### Datos Existentes

```text
┌─────────────────────────────────────────────────────────────────┐
│                     BRECHA DE DATOS                            │
├─────────────────────────────────────────────────────────────────┤
│  servicios_custodia.nombre_cliente: 399 clientes               │
│  pc_clientes (registro formal):      60 clientes               │
│                                                                 │
│  Gap: 339 clientes con servicios no registrados formalmente    │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Existentes Reutilizables
- `ClientAnalytics`: Dashboard de performance por cliente (GMV, AOV, servicios)
- `useClientAnalytics`: Hook completo con métricas por cliente
- `AcquisitionOverview`: Métricas de adquisición y CPA
- Webhook infrastructure: VAPI, WhatsApp, Dialfire (patrón establecido)

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    CRM HUB - FLUJO DE DATOS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐                                                       │
│  │   PIPEDRIVE  │                                                       │
│  │              │                                                       │
│  │  ┌────────┐  │    Webhook (create/update/delete)                     │
│  │  │ Deals  │──┼────────────────────────┐                              │
│  │  └────────┘  │                        │                              │
│  │  ┌────────┐  │                        ▼                              │
│  │  │ Leads  │──┼───────► pipedrive-webhook (Edge Function)             │
│  │  └────────┘  │                        │                              │
│  │  ┌────────┐  │                        ▼                              │
│  │  │Pipeline│──┼─────────────┐    ┌─────────────────────────┐          │
│  │  │ Stages │  │             │    │     SUPABASE            │          │
│  └──────────────┘             │    │                         │          │
│                               │    │  crm_deals              │          │
│                               └────►  crm_leads              │          │
│                                    │  crm_pipeline_stages    │          │
│                                    │  crm_activities         │          │
│                                    └──────────┬──────────────┘          │
│                                               │                          │
│                                               ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                      CRM HUB UI                              │        │
│  │  ┌─────────────┬─────────────┬───────────────┬────────────┐ │        │
│  │  │  Pipeline   │  Forecast   │   Clientes    │ Actividad  │ │        │
│  │  │  de Ventas  │  Revenue    │   → Servicios │   Feed     │ │        │
│  │  └─────────────┴─────────────┴───────────────┴────────────┘ │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                   MATCH ENGINE                               │        │
│  │  crm_deals.organization_name ←→ servicios_custodia.nombre   │        │
│  │  Fuzzy matching + manual override                            │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Plan de Implementación

### Fase 1: Esquema de Base de Datos

**Nuevas tablas para datos CRM:**

```sql
-- Pipeline stages (sincronizado de Pipedrive)
CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pipeline_name TEXT DEFAULT 'Default',
  order_nr INTEGER DEFAULT 0,
  deal_probability INTEGER DEFAULT 0, -- Para forecast
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads comerciales
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  person_name TEXT,
  organization_name TEXT,
  email TEXT,
  phone TEXT,
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  source TEXT, -- Facebook, Website, Referral, etc.
  status TEXT DEFAULT 'open', -- open, converted, lost
  owner_name TEXT,
  notes TEXT,
  pipedrive_data JSONB, -- Raw Pipedrive payload
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deals/Oportunidades
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  organization_name TEXT,
  person_name TEXT,
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  stage_id UUID REFERENCES crm_pipeline_stages(id),
  status TEXT DEFAULT 'open', -- open, won, lost
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  won_time TIMESTAMPTZ,
  lost_reason TEXT,
  owner_name TEXT,
  pipedrive_data JSONB,
  
  -- Vinculacion con Detecta
  pc_cliente_id UUID REFERENCES pc_clientes(id),
  matched_client_name TEXT, -- nombre_cliente de servicios_custodia
  match_confidence NUMERIC(3,2), -- 0.0 a 1.0
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Actividades comerciales
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE,
  deal_id UUID REFERENCES crm_deals(id),
  lead_id UUID REFERENCES crm_leads(id),
  type TEXT NOT NULL, -- call, meeting, email, task
  subject TEXT,
  done BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  note TEXT,
  owner_name TEXT,
  pipedrive_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de cambios de etapa
CREATE TABLE crm_deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES crm_deals(id) NOT NULL,
  from_stage_id UUID REFERENCES crm_pipeline_stages(id),
  to_stage_id UUID REFERENCES crm_pipeline_stages(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  time_in_previous_stage INTERVAL
);

-- Vista para forecast
CREATE VIEW crm_forecast_view AS
SELECT 
  s.name as stage_name,
  s.deal_probability,
  COUNT(d.id) as deals_count,
  SUM(d.value) as total_value,
  SUM(d.value * s.deal_probability / 100) as weighted_value
FROM crm_deals d
JOIN crm_pipeline_stages s ON d.stage_id = s.id
WHERE d.status = 'open'
GROUP BY s.id, s.name, s.deal_probability, s.order_nr
ORDER BY s.order_nr;
```

---

### Fase 2: Webhook Receiver (Edge Function)

**Nuevo archivo:** `supabase/functions/pipedrive-webhook/index.ts`

```text
Funcionalidad:
1. Autenticación vía secret token de Pipedrive
2. Manejo de eventos:
   - deal.created / deal.updated / deal.deleted
   - person.created / person.updated
   - activity.created / activity.updated
3. Upsert en tablas CRM
4. Auto-match con clientes existentes (fuzzy search)
5. Logging detallado para debugging
```

**Webhook Events de Pipedrive a manejar:**
- `deal.added` → INSERT en crm_deals
- `deal.updated` → UPDATE en crm_deals + historial de etapas
- `deal.deleted` → SOFT DELETE
- `deal.won` → UPDATE status + won_time
- `deal.lost` → UPDATE status + lost_reason

---

### Fase 3: Motor de Matching Cliente

**Nuevo hook:** `src/hooks/useCrmClientMatcher.ts`

```text
Lógica de matching:
1. Normalizar nombres (mayúsculas, eliminar S.A. DE C.V., etc.)
2. Buscar match exacto en servicios_custodia.nombre_cliente
3. Si no hay exacto, fuzzy match con Levenshtein distance
4. Calcular confidence score (0.0 - 1.0)
5. Permitir override manual por usuario
```

---

### Fase 4: UI del CRM Hub

**Nueva página:** `src/pages/CRMHub/CRMHub.tsx`

**Estructura de tabs:**

| Tab | Contenido |
|-----|-----------|
| **Pipeline** | Kanban visual de deals por etapa, con valores y días en etapa |
| **Forecast** | Proyección de ingresos con probabilidades ponderadas |
| **Clientes** | Tabla de deals → servicios, matching status, GMV real vs. deal value |
| **Actividad** | Timeline de eventos recientes: nuevos deals, cambios de etapa, cierres |

---

### Fase 5: Dashboard de Pipeline de Ventas

**Componente:** `src/components/crm/PipelineKanban.tsx`

```text
Visualización:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Lead       │  Propuesta   │ Negociación  │    Cierre    │
│   In ($200K) │  Sent ($150K)│   ($80K)     │    ($50K)    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│  [Deal A]    │  [Deal C]    │  [Deal E]    │  [Deal G]    │
│  $45,000     │  $65,000     │  $30,000     │  $25,000     │
│  3 días      │  5 días      │  12 días     │  2 días      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│  [Deal B]    │  [Deal D]    │  [Deal F]    │  [Deal H]    │
│  ...         │  ...         │  ...         │  ...         │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

### Fase 6: Forecast de Ingresos

**Componente:** `src/components/crm/RevenueForecast.tsx`

```text
Métricas:
- Pipeline Value Total: Suma de todos los deals abiertos
- Weighted Forecast: Suma ponderada por probabilidad de etapa
- Expected Closes (MTD): Deals con expected_close_date en mes actual
- Win Rate: Won / (Won + Lost) del período
- Average Deal Size: Promedio de deals cerrados
- Sales Cycle Length: Días promedio desde lead hasta won
```

---

### Fase 7: Vinculación Cliente → Servicios

**Componente:** `src/components/crm/ClientServicesLink.tsx`

```text
Vista de tabla:
┌─────────────────┬───────────────┬────────────┬──────────────┬───────────────┐
│ Deal/Cliente    │ Status Match  │ Deal Value │ GMV Real     │ Conversion %  │
├─────────────────┼───────────────┼────────────┼──────────────┼───────────────┤
│ ASTRA ZENECA    │ ✓ Verified    │ $500K      │ $23M         │ 4,600%        │
│ COMARKET        │ ✓ Auto-match  │ $300K      │ $29M         │ 9,667%        │
│ TYASA           │ ⚠ Pending     │ $200K      │ $7M          │ --            │
│ FERRER          │ ✗ New Client  │ $80K       │ $62K         │ 77% (growing) │
└─────────────────┴───────────────┴────────────┴──────────────┴───────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/functions/pipedrive-webhook/index.ts` | CREAR | Edge function para recibir webhooks de Pipedrive |
| `src/pages/CRMHub/CRMHub.tsx` | CREAR | Página principal del módulo CRM |
| `src/pages/CRMHub/components/PipelineKanban.tsx` | CREAR | Visualización kanban del pipeline |
| `src/pages/CRMHub/components/RevenueForecast.tsx` | CREAR | Dashboard de forecast |
| `src/pages/CRMHub/components/ClientServicesLink.tsx` | CREAR | Tabla de vinculación deals → servicios |
| `src/pages/CRMHub/components/ActivityFeed.tsx` | CREAR | Timeline de actividades |
| `src/hooks/useCrmDeals.ts` | CREAR | Hook para datos de deals |
| `src/hooks/useCrmPipeline.ts` | CREAR | Hook para pipeline y stages |
| `src/hooks/useCrmForecast.ts` | CREAR | Hook para cálculos de forecast |
| `src/hooks/useCrmClientMatcher.ts` | CREAR | Hook para matching de clientes |
| `src/types/crm.ts` | CREAR | Tipos TypeScript para CRM |
| `src/config/navigationConfig.ts` | MODIFICAR | Agregar módulo CRM al menú |

---

## Configuración de Pipedrive

### Webhook Setup (en Pipedrive)

1. Ir a Settings → Webhooks
2. Crear nuevo webhook con URL: `https://yydzzeljaewsfhmilnhm.functions.supabase.co/pipedrive-webhook`
3. Eventos a suscribir:
   - `deal.*` (added, updated, merged, deleted)
   - `activity.*` (added, updated, deleted)
   - `person.*` (added, updated)
4. Copiar el **Webhook Secret** para autenticación

### Secrets Requeridos

| Secret | Descripción |
|--------|-------------|
| `PIPEDRIVE_WEBHOOK_SECRET` | Token para validar webhooks entrantes |
| `PIPEDRIVE_API_TOKEN` | (Opcional) Para sincronización inicial |

---

## Roles y Acceso

```text
ROLES CON ACCESO AL CRM HUB:
├── admin / owner:          Acceso completo + configuración
├── ejecutivo_ventas:       Pipeline + Forecast + Actividades
├── coordinador_operaciones: Solo lectura Clientes → Servicios
└── supply_admin:           Solo lectura
```

---

## Métricas del Dashboard

### KPIs Principales

| Métrica | Fórmula | Objetivo |
|---------|---------|----------|
| Pipeline Value | SUM(deals.value WHERE status='open') | Visibilidad |
| Weighted Forecast | SUM(value * probability) | Proyección |
| Win Rate | Won / (Won + Lost) * 100 | > 30% |
| Avg Deal Size | SUM(won.value) / COUNT(won) | Crecimiento |
| Sales Velocity | (Deals * Win% * Avg$) / Cycle Days | Eficiencia |
| Deal → Service Conversion | GMV Real / Deal Value * 100 | > 100% |

---

## Flujo de Usuario

```text
1. Ventas crea deal en Pipedrive
   └── Webhook → crm_deals (nuevo registro)

2. Deal avanza de etapa en Pipedrive
   └── Webhook → crm_deal_stage_history (registro de cambio)
   └── UI actualiza kanban en tiempo real

3. Deal se cierra como "Won"
   └── Webhook → crm_deals.status = 'won'
   └── Auto-match busca cliente en servicios_custodia
   └── Si match: vincula pc_cliente_id
   └── Si no: crea registro en pc_clientes

4. Usuario revisa CRM Hub
   └── Ve pipeline, forecast, y GMV real vs. proyectado
   └── Puede corregir matching manual si es necesario

5. Reportes ejecutivos
   └── Comparación Deal Value vs. GMV generado
   └── Identificación de clientes high-value
   └── Análisis de ciclo de ventas
```

---

## Dependencias

### Pre-requisitos
1. Secret `PIPEDRIVE_WEBHOOK_SECRET` configurado en Supabase
2. Webhook configurado en Pipedrive apuntando a la Edge Function
3. Sincronización inicial de pipeline stages (one-time)

### Datos Iniciales
- Pipeline stages de Pipedrive (manual o via API)
- Mapeo inicial de clientes existentes (339 sin vincular)

---

## Consideraciones de Seguridad

- Webhook valida signature de Pipedrive antes de procesar
- RLS policies en tablas CRM para roles autorizados
- Logs de auditoría en todas las operaciones de sync
- No se almacenan datos sensibles de clientes (solo operativos)

---

## Sección Técnica

### Edge Function: Pipedrive Webhook Handler

```typescript
// Pseudocódigo de validación
const signature = req.headers.get('x-pipedrive-signature');
const isValid = await validatePipedriveSignature(signature, body);
if (!isValid) return new Response('Unauthorized', { status: 401 });

// Routing por evento
switch (payload.event) {
  case 'added.deal':
    await handleDealCreated(payload.current);
    break;
  case 'updated.deal':
    await handleDealUpdated(payload.current, payload.previous);
    break;
  case 'deleted.deal':
    await handleDealDeleted(payload.previous);
    break;
}
```

### Algoritmo de Matching

```typescript
function matchClient(dealOrgName: string): MatchResult {
  // 1. Normalizar nombre
  const normalized = normalizeCompanyName(dealOrgName);
  
  // 2. Buscar exacto
  const exact = await findExactMatch(normalized);
  if (exact) return { match: exact, confidence: 1.0 };
  
  // 3. Fuzzy match
  const fuzzy = await findFuzzyMatch(normalized);
  if (fuzzy && fuzzy.score > 0.85) {
    return { match: fuzzy.client, confidence: fuzzy.score };
  }
  
  // 4. Sin match - pendiente revisión manual
  return { match: null, confidence: 0 };
}
```

### Estructura de Tipos

```typescript
interface CrmDeal {
  id: string;
  pipedrive_id: number;
  title: string;
  organization_name: string;
  value: number;
  stage_id: string;
  status: 'open' | 'won' | 'lost';
  probability: number;
  expected_close_date?: Date;
  pc_cliente_id?: string;
  matched_client_name?: string;
  match_confidence?: number;
}

interface PipelineForecast {
  stage_name: string;
  deal_probability: number;
  deals_count: number;
  total_value: number;
  weighted_value: number;
}
```

