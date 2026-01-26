
# Plan de Implementación: Edge Function Pipedrive + CRM Hub

## Resumen

Crear la Edge Function para recibir webhooks de Pipedrive y el módulo completo CRM Hub con UI, tipos, y hooks de datos. La función se implementará **sin autenticación HTTP inicial** para resolver los errores 404 actuales y comenzar a recibir datos de Pipedrive inmediatamente.

---

## Fase 1: Edge Function - Pipedrive Webhook

### Archivo: `supabase/functions/pipedrive-webhook/index.ts`

| Aspecto | Detalle |
|---------|---------|
| **Endpoint** | `https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/pipedrive-webhook` |
| **Método** | POST |
| **Auth** | `verify_jwt = false` (webhook público) |
| **Eventos** | `added.deal`, `updated.deal`, `deleted.deal` |

### Funcionalidad

```text
1. Recibir payload de Pipedrive
2. Logear en crm_webhook_logs para debugging
3. Parsear evento (meta.action + meta.object)
4. Según el tipo de evento:
   - added.deal    → INSERT en crm_deals
   - updated.deal  → UPDATE + historial de etapa si cambió
   - deleted.deal  → Soft delete (is_deleted = true)
5. Auto-match con servicios_custodia.nombre_cliente
6. Responder 200 OK inmediatamente
```

### Estructura del Payload de Pipedrive

```typescript
interface PipedriveWebhookPayload {
  v: number;                    // Version
  matches_filters: object;      // Filtros aplicados
  meta: {
    action: 'added' | 'updated' | 'deleted' | 'merged';
    object: 'deal' | 'person' | 'activity';
    id: number;                 // ID del objeto
    company_id: number;
    user_id: number;
    timestamp: number;
  };
  current: DealData | null;     // Estado actual (null si deleted)
  previous: DealData | null;    // Estado anterior (null si added)
}
```

---

## Fase 2: Configuración de Edge Function

### Modificar: `supabase/config.toml`

Agregar al final:

```toml
[functions.pipedrive-webhook]
verify_jwt = false
```

---

## Fase 3: Tipos TypeScript

### Crear: `src/types/crm.ts`

```typescript
// Tipos para el CRM Hub
export interface CrmPipelineStage {
  id: string;
  pipedrive_id: number;
  name: string;
  pipeline_name: string;
  order_nr: number;
  deal_probability: number;
  is_active: boolean;
}

export interface CrmDeal {
  id: string;
  pipedrive_id: number;
  title: string;
  organization_name: string | null;
  person_name: string | null;
  value: number;
  currency: string;
  stage_id: string | null;
  stage?: CrmPipelineStage;
  status: 'open' | 'won' | 'lost';
  probability: number;
  expected_close_date: string | null;
  won_time: string | null;
  lost_reason: string | null;
  owner_name: string | null;
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
  deal_id: string | null;
  type: string;
  subject: string | null;
  done: boolean;
  owner_name: string | null;
  created_at: string;
}
```

---

## Fase 4: Hooks de Datos

### Crear: `src/hooks/useCrmPipeline.ts`
- Obtiene stages del pipeline desde `crm_pipeline_stages`
- Ordena por `order_nr`

### Crear: `src/hooks/useCrmDeals.ts`
- Lista deals con filtros por status, stage, owner
- Incluye join con `crm_pipeline_stages`
- Soporte para paginación

### Crear: `src/hooks/useCrmForecast.ts`
- Lee datos de `crm_forecast_view`
- Calcula métricas agregadas (pipeline total, weighted forecast)
- Win rate y avg deal size

### Crear: `src/hooks/useCrmClientMatcher.ts`
- Busca matches en `servicios_custodia`
- Calcula GMV real por cliente
- Permite vinculación manual

---

## Fase 5: UI del CRM Hub

### Estructura de Archivos

```text
src/pages/CRMHub/
├── CRMHub.tsx                    # Página principal con 4 tabs
└── components/
    ├── PipelineKanban.tsx        # Kanban visual de deals
    ├── RevenueForecast.tsx       # Dashboard de forecast
    ├── ClientServicesLink.tsx    # Vinculación deal → servicios
    └── ActivityFeed.tsx          # Timeline de actividad
```

### Tab 1: Pipeline (Kanban)

Vista Kanban con columnas por etapa del pipeline:
- Cada columna muestra: nombre de etapa, probabilidad, valor total
- Cards de deals con: título, valor, días en etapa, owner
- Código de colores por status (open/won/lost)

### Tab 2: Forecast

Métricas principales:
- Pipeline Value Total
- Weighted Forecast (valor × probabilidad)
- Win Rate
- Average Deal Size

Gráfico de barras por etapa con valor ponderado.

### Tab 3: Clientes → Servicios

Tabla de vinculación:
- Deal/Cliente
- Status de Match (Verificado, Auto-match, Pendiente, Sin match)
- Deal Value
- GMV Real (de servicios_custodia)
- Acciones (Ver servicios, Vincular)

### Tab 4: Actividad

Timeline de eventos recientes:
- Deal Won (verde)
- Stage Change (azul)
- New Deal (amarillo)
- Deal Lost (rojo)

---

## Fase 6: Navegación

### Modificar: `src/config/navigationConfig.ts`

Agregar módulo CRM en grupo `dashboard`:

```typescript
{
  id: 'crm',
  label: 'CRM Hub',
  icon: Briefcase,
  path: '/crm',
  group: 'dashboard',
  roles: ['admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi'],
  children: [
    { id: 'crm_pipeline', label: 'Pipeline', path: '/crm', icon: LayoutDashboard },
    { id: 'crm_forecast', label: 'Forecast', path: '/crm?tab=forecast', icon: TrendingUp },
    { id: 'crm_clients', label: 'Clientes', path: '/crm?tab=clients', icon: Users }
  ]
}
```

### Modificar: `src/App.tsx`

Agregar lazy import y ruta:

```typescript
const CRMHub = lazy(() => import('@/pages/CRMHub/CRMHub'));

// En Routes:
<Route path="/crm" element={
  <ProtectedRoute>
    <RoleProtectedRoute allowedRoles={['admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi']}>
      <UnifiedLayout>
        <CRMHub />
      </UnifiedLayout>
    </RoleProtectedRoute>
  </ProtectedRoute>
} />
```

---

## Fase 7: Migración SQL

Las siguientes tablas serán creadas automáticamente por Lovable Cloud:

| Tabla | Descripción |
|-------|-------------|
| `crm_pipeline_stages` | Etapas del pipeline sincronizadas de Pipedrive |
| `crm_deals` | Deals/Oportunidades con vinculación a clientes |
| `crm_deal_stage_history` | Historial de cambios de etapa |
| `crm_activities` | Actividades comerciales (futuro) |
| `crm_webhook_logs` | Log de webhooks para debugging |

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/functions/pipedrive-webhook/index.ts` | Edge Function para webhooks |
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
| `supabase/config.toml` | Agregar `[functions.pipedrive-webhook]` |
| `src/config/navigationConfig.ts` | Agregar módulo CRM |
| `src/App.tsx` | Agregar ruta `/crm` |

---

## Orden de Implementación

1. **Edge Function** → Resolver los 404 de webhooks de Pipedrive
2. **Config.toml** → Registrar la función
3. **Tipos TypeScript** → Base para todo el módulo
4. **Hooks de datos** → Lógica de acceso a datos
5. **UI Components** → Visualización del CRM Hub
6. **Navegación** → Agregar acceso al módulo

---

## Próximos Pasos Post-Implementación

1. Verificar que los webhooks de Pipedrive dejen de dar 404
2. Crear un deal de prueba en Pipedrive para validar la recepción
3. Revisar `crm_webhook_logs` para confirmar que los datos lleguen
4. Sincronizar las etapas reales del pipeline de Pipedrive
5. (Opcional) Agregar autenticación HTTP Basic si se desea mayor seguridad
