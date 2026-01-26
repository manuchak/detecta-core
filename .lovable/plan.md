
# Plan de Implementación: CRM Hub con Pipedrive

## Resumen

Implementar el módulo CRM Hub completo con integración a Pipedrive mediante webhooks, incluyendo base de datos, Edge Function, y UI con 4 tabs principales.

---

## Pre-requisitos

### Secret Requerido
Se necesita configurar el secret para autenticación HTTP Basic de Pipedrive:

| Secret | Valor |
|--------|-------|
| `PIPEDRIVE_WEBHOOK_SECRET` | Base64 de `usuario:contraseña` configurado en webhooks de Pipedrive |

El usuario debe proporcionar las credenciales HTTP Basic que configuró en los 3 webhooks de Pipedrive.

---

## Fase 1: Esquema de Base de Datos

### Migración SQL

```sql
-- 1. Etapas del pipeline
CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pipeline_name TEXT DEFAULT 'Default',
  order_nr INTEGER DEFAULT 0,
  deal_probability INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Deals/Oportunidades
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  organization_name TEXT,
  person_name TEXT,
  person_email TEXT,
  person_phone TEXT,
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  stage_id UUID REFERENCES crm_pipeline_stages(id),
  status TEXT DEFAULT 'open',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  won_time TIMESTAMPTZ,
  lost_time TIMESTAMPTZ,
  lost_reason TEXT,
  owner_name TEXT,
  owner_id INTEGER,
  pipedrive_data JSONB,
  pc_cliente_id UUID REFERENCES pc_clientes(id),
  matched_client_name TEXT,
  match_confidence NUMERIC(3,2),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Historial de cambios de etapa
CREATE TABLE crm_deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES crm_deals(id) NOT NULL,
  from_stage_id UUID REFERENCES crm_pipeline_stages(id),
  to_stage_id UUID REFERENCES crm_pipeline_stages(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  time_in_previous_stage INTERVAL
);

-- 4. Actividades comerciales
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE,
  deal_id UUID REFERENCES crm_deals(id),
  type TEXT NOT NULL,
  subject TEXT,
  done BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  note TEXT,
  owner_name TEXT,
  pipedrive_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Log de webhooks para debugging
CREATE TABLE crm_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Vista para forecast
CREATE VIEW crm_forecast_view AS
SELECT 
  s.id as stage_id,
  s.name as stage_name,
  s.order_nr,
  s.deal_probability,
  COUNT(d.id) as deals_count,
  COALESCE(SUM(d.value), 0) as total_value,
  COALESCE(SUM(d.value * s.deal_probability / 100), 0) as weighted_value
FROM crm_pipeline_stages s
LEFT JOIN crm_deals d ON d.stage_id = s.id AND d.status = 'open' AND d.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, s.order_nr, s.deal_probability
ORDER BY s.order_nr;

-- Índices para performance
CREATE INDEX idx_crm_deals_status ON crm_deals(status);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage_id);
CREATE INDEX idx_crm_deals_org_name ON crm_deals(organization_name);
CREATE INDEX idx_crm_deals_pipedrive_id ON crm_deals(pipedrive_id);

-- RLS Policies
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para roles comerciales
CREATE POLICY "CRM data visible to authorized roles" ON crm_deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi')
    )
  );

CREATE POLICY "Pipeline stages visible to all authenticated" ON crm_pipeline_stages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Stage history visible to authorized roles" ON crm_deal_stage_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi')
    )
  );

CREATE POLICY "Activities visible to authorized roles" ON crm_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi')
    )
  );

CREATE POLICY "Webhook logs visible to admins" ON crm_webhook_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner')
    )
  );

-- Insert de etapas iniciales de pipeline (ajustar según tu Pipedrive)
INSERT INTO crm_pipeline_stages (pipedrive_id, name, order_nr, deal_probability) VALUES
(1, 'Lead In', 1, 10),
(2, 'Contactado', 2, 20),
(3, 'Propuesta Enviada', 3, 40),
(4, 'Negociación', 4, 60),
(5, 'Cierre', 5, 80);
```

---

## Fase 2: Edge Function - Pipedrive Webhook

### Archivo: `supabase/functions/pipedrive-webhook/index.ts`

```text
Funcionalidad:
1. Validación HTTP Basic Auth
2. Logging de todos los webhooks para debugging
3. Manejo de eventos:
   - added.deal → INSERT en crm_deals
   - updated.deal → UPDATE + historial de etapa si cambió
   - deleted.deal → Soft delete (is_deleted = true)
   - merged.deal → Actualizar referencia
4. Auto-match con servicios_custodia.nombre_cliente
5. Respuesta 200 OK rápida para evitar reintentos
```

### Lógica de Matching de Clientes

```typescript
// Normalización de nombres
function normalizeCompanyName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s*(S\.?A\.?\s*DE\s*C\.?V\.?|S\.?A\.?|S\.C\.?|S\.?DE R\.?L\.?).*$/i, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .trim();
}

// Búsqueda en servicios_custodia
async function findClientMatch(orgName: string) {
  const normalized = normalizeCompanyName(orgName);
  
  // 1. Match exacto
  const { data: exact } = await supabase
    .from('servicios_custodia')
    .select('nombre_cliente')
    .ilike('nombre_cliente', `%${normalized}%`)
    .limit(1);
  
  if (exact?.length) {
    return { name: exact[0].nombre_cliente, confidence: 1.0 };
  }
  
  // 2. Sin match → pendiente de vinculación manual
  return { name: null, confidence: 0 };
}
```

---

## Fase 3: Tipos TypeScript

### Archivo: `src/types/crm.ts`

```typescript
export interface CrmPipelineStage {
  id: string;
  pipedrive_id: number;
  name: string;
  pipeline_name: string;
  order_nr: number;
  deal_probability: number;
  is_active: boolean;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  pipedrive_id: number;
  title: string;
  organization_name: string | null;
  person_name: string | null;
  person_email: string | null;
  person_phone: string | null;
  value: number;
  currency: string;
  stage_id: string | null;
  stage?: CrmPipelineStage;
  status: 'open' | 'won' | 'lost';
  probability: number;
  expected_close_date: string | null;
  won_time: string | null;
  lost_time: string | null;
  lost_reason: string | null;
  owner_name: string | null;
  pipedrive_data: Record<string, any>;
  pc_cliente_id: string | null;
  matched_client_name: string | null;
  match_confidence: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmForecast {
  stage_id: string;
  stage_name: string;
  order_nr: number;
  deal_probability: number;
  deals_count: number;
  total_value: number;
  weighted_value: number;
}

export interface CrmActivity {
  id: string;
  pipedrive_id: number;
  deal_id: string | null;
  type: string;
  subject: string | null;
  done: boolean;
  due_date: string | null;
  duration_minutes: number | null;
  note: string | null;
  owner_name: string | null;
  created_at: string;
}
```

---

## Fase 4: Hooks de Datos

### Archivos a crear:

| Hook | Propósito |
|------|-----------|
| `useCrmPipeline.ts` | Obtiene stages y estructura del pipeline |
| `useCrmDeals.ts` | Lista de deals con filtros y paginación |
| `useCrmForecast.ts` | Métricas de forecast desde la vista |
| `useCrmClientMatcher.ts` | Lógica de matching y vinculación manual |

---

## Fase 5: UI del CRM Hub

### Estructura de archivos:

```text
src/pages/CRMHub/
├── CRMHub.tsx                    # Página principal con tabs
└── components/
    ├── PipelineKanban.tsx        # Vista Kanban de deals
    ├── RevenueForecast.tsx       # Dashboard de forecast
    ├── ClientServicesLink.tsx    # Vinculación deal → servicios
    └── ActivityFeed.tsx          # Timeline de actividades
```

### Tab 1: Pipeline (Kanban)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  PIPELINE DE VENTAS                                    [Filtros] [↻]   │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│   Lead In    │  Contactado  │  Propuesta   │ Negociación  │   Cierre   │
│   10% prob   │   20% prob   │   40% prob   │   60% prob   │  80% prob  │
│   $1.2M      │   $800K      │   $500K      │   $300K      │  $150K     │
├──────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │┌──────────┐│
│ │ EMPRESA A│ │ │ EMPRESA C│ │ │ EMPRESA E│ │ │ EMPRESA G│ ││ EMPRESA I││
│ │ $200,000 │ │ │ $150,000 │ │ │ $100,000 │ │ │ $120,000 │ ││ $80,000  ││
│ │ 5 días   │ │ │ 3 días   │ │ │ 8 días   │ │ │ 2 días   │ ││ 1 día    ││
│ │ Juan P.  │ │ │ María S. │ │ │ Carlos R.│ │ │ Ana L.   │ ││ Pedro M. ││
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │└──────────┘│
│ ┌──────────┐ │ ┌──────────┐ │              │              │            │
│ │ EMPRESA B│ │ │ EMPRESA D│ │              │              │            │
│ │ $180,000 │ │ │ $95,000  │ │              │              │            │
│ └──────────┘ │ └──────────┘ │              │              │            │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

### Tab 2: Forecast

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  FORECAST DE INGRESOS                                                   │
├────────────────────┬────────────────────┬────────────────────┬─────────┤
│  Pipeline Total    │  Forecast Ponderado│   Win Rate         │ Avg Deal│
│    $2.95M          │      $892K         │     34%            │  $125K  │
│    ▲ 12% vs mes    │      ▲ 8%          │     ▼ 2%           │  ▲ 5%   │
└────────────────────┴────────────────────┴────────────────────┴─────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  DESGLOSE POR ETAPA                                                     │
├───────────────────────────────────────────┬──────────┬──────────────────┤
│ Etapa                                     │ Deals    │ Valor Ponderado  │
├───────────────────────────────────────────┼──────────┼──────────────────┤
│ Lead In (10%)           ████████████      │    12    │      $120,000    │
│ Contactado (20%)        █████████         │     8    │      $160,000    │
│ Propuesta (40%)         ██████            │     5    │      $200,000    │
│ Negociación (60%)       ████              │     4    │      $180,000    │
│ Cierre (80%)            ██                │     2    │      $232,000    │
└───────────────────────────────────────────┴──────────┴──────────────────┘
```

### Tab 3: Clientes → Servicios

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  VINCULACIÓN CLIENTE → SERVICIOS                    [Solo pendientes ◉]│
├─────────────────┬───────────────┬──────────┬───────────┬────────────────┤
│ Deal/Cliente    │ Status Match  │ Deal $   │ GMV Real  │ Acciones       │
├─────────────────┼───────────────┼──────────┼───────────┼────────────────┤
│ ASTRA ZENECA    │ ✓ Verificado  │ $500K    │ $23.4M    │ [Ver servicios]│
│ COMARKET        │ ✓ Auto-match  │ $300K    │ $29.1M    │ [Ver servicios]│
│ TYASA           │ ⚠ Pendiente   │ $200K    │    --     │ [Vincular]     │
│ NUEVA EMPRESA   │ ✗ Sin match   │ $150K    │    --     │ [Vincular]     │
└─────────────────┴───────────────┴──────────┴───────────┴────────────────┘
```

### Tab 4: Actividad

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ACTIVIDAD RECIENTE                                     [Últimos 7 días]│
├─────────────────────────────────────────────────────────────────────────┤
│  🟢 Hace 2 min    DEAL WON: ASTRA ZENECA - $500,000                     │
│                   Cerrado por Juan Pérez                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  🔵 Hace 1 hora   STAGE CHANGE: COMARKET                                │
│                   Propuesta → Negociación                               │
├─────────────────────────────────────────────────────────────────────────┤
│  🟡 Hace 3 horas  NEW DEAL: TYASA - $200,000                            │
│                   Creado por María Sánchez                               │
├─────────────────────────────────────────────────────────────────────────┤
│  🔴 Ayer          DEAL LOST: EMPRESA X - $80,000                        │
│                   Razón: Precio fuera de presupuesto                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 6: Navegación

### Modificación: `src/config/navigationConfig.ts`

Agregar nuevo módulo en grupo "dashboard":

```typescript
{
  id: 'crm',
  label: 'CRM Hub',
  icon: TrendingUp, // o Briefcase
  path: '/crm',
  group: 'dashboard',
  roles: ['admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi'],
  children: [
    {
      id: 'crm_pipeline',
      label: 'Pipeline',
      path: '/crm',
      icon: LayoutDashboard
    },
    {
      id: 'crm_forecast',
      label: 'Forecast',
      path: '/crm?tab=forecast',
      icon: TrendingUp
    },
    {
      id: 'crm_clients',
      label: 'Clientes',
      path: '/crm?tab=clients',
      icon: Users
    }
  ]
}
```

### Modificación: `src/App.tsx`

Agregar ruta:

```typescript
const CRMHub = lazy(() => import('@/pages/CRMHub/CRMHub'));

// En Routes:
<Route path="/crm" element={<CRMHub />} />
```

---

## Fase 7: Configuración de Webhooks

### En Pipedrive (ya creados por el usuario):

| Webhook | Event Action | URL |
|---------|--------------|-----|
| Deal Added | added | `https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/pipedrive-webhook` |
| Deal Changed | change | `https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/pipedrive-webhook` |
| Deal Deleted | delete | `https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/pipedrive-webhook` |

### Credenciales HTTP Basic

El usuario debe proporcionar:
- **Usuario**: Ej. `detecta`
- **Contraseña**: Ej. `[contraseña segura]`

El secret `PIPEDRIVE_WEBHOOK_SECRET` será: `base64(usuario:contraseña)`

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/functions/pipedrive-webhook/index.ts` | Edge Function para recibir webhooks |
| `src/types/crm.ts` | Tipos TypeScript para CRM |
| `src/hooks/useCrmPipeline.ts` | Hook para pipeline stages |
| `src/hooks/useCrmDeals.ts` | Hook para deals |
| `src/hooks/useCrmForecast.ts` | Hook para forecast |
| `src/hooks/useCrmClientMatcher.ts` | Hook para matching de clientes |
| `src/pages/CRMHub/CRMHub.tsx` | Página principal |
| `src/pages/CRMHub/components/PipelineKanban.tsx` | Kanban de deals |
| `src/pages/CRMHub/components/RevenueForecast.tsx` | Dashboard forecast |
| `src/pages/CRMHub/components/ClientServicesLink.tsx` | Vinculación clientes |
| `src/pages/CRMHub/components/ActivityFeed.tsx` | Timeline actividad |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/config/navigationConfig.ts` | Agregar módulo CRM |
| `src/App.tsx` | Agregar ruta /crm |
| `supabase/config.toml` | Registrar edge function |

---

## Próximo Paso Inmediato

Antes de implementar, necesito que me proporciones las **credenciales HTTP Basic** que configuraste en los webhooks de Pipedrive:

1. **Usuario**: El nombre de usuario que pusiste
2. **Contraseña**: La contraseña que configuraste

Con esto generaré el secret `PIPEDRIVE_WEBHOOK_SECRET` y procederé con la implementación completa.
