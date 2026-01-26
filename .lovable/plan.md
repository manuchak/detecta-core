
# Plan: Sincronización Inicial de Pipedrive

## Resumen

Crear una Edge Function para hacer una **importación masiva inicial** de todos los deals, pipelines y stages desde Pipedrive hacia la base de datos de Core. Esto llenará el CRM Hub con datos reales del estado comercial actual.

---

## Datos Comerciales a Importar

| Entidad | Campos Relevantes |
|---------|-------------------|
| **Pipelines** | Nombre del pipeline |
| **Stages** | Nombre, orden, probabilidad |
| **Deals** | Título, valor, moneda, etapa, estado, fecha esperada de cierre, fecha ganado/perdido |
| **Organizaciones** | Nombre de empresa |
| **Personas** | Nombre, email, teléfono |
| **Owners** | Nombre del ejecutivo comercial |

### Métricas que Podremos Ver

- **Valor total del pipeline** por etapa
- **Forecast ponderado** (valor × probabilidad de etapa)
- **Win rate** (ganados vs cerrados)
- **Ticket promedio** de deals ganados
- **Tamaño de clientes** según valor del deal
- **Distribución por ejecutivo** comercial
- **Tiempo promedio** en cada etapa

---

## Arquitectura de Sincronización

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PIPEDRIVE SYNC FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. GET /api/v2/pipelines                                      │
│      └─► Obtener todos los pipelines                            │
│                                                                 │
│   2. GET /api/v2/stages                                         │
│      └─► Obtener etapas con nombre, orden y probabilidad        │
│      └─► UPSERT en crm_pipeline_stages (por pipedrive_id)       │
│                                                                 │
│   3. GET /api/v2/deals (paginado, limit=500)                    │
│      └─► Filtrar por status: open, won, lost                    │
│      └─► Incluir org, person, owner_name                        │
│      └─► UPSERT en crm_deals (por pipedrive_id)                 │
│      └─► Auto-match con servicios_custodia                      │
│                                                                 │
│   4. Responder con estadísticas de sincronización               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Secret Requerido

Para acceder a la API de Pipedrive, necesitamos el **API Token**:

| Secret | Descripción |
|--------|-------------|
| `PIPEDRIVE_API_TOKEN` | Token de API de Pipedrive (Settings > Personal Preferences > API) |

El usuario debe proporcionar este token para habilitar la sincronización.

---

## Fase 2: Edge Function - Pipedrive Sync

### Archivo: `supabase/functions/pipedrive-sync/index.ts`

### Funcionalidad

```text
1. Autenticación por API Token de Pipedrive
2. Sincronizar pipelines y stages
   - GET /api/v2/pipelines → Obtener pipelines
   - GET /api/v2/stages → Obtener todas las etapas
   - UPSERT en crm_pipeline_stages con nombres y probabilidades reales
3. Sincronizar deals (paginado)
   - GET /api/v2/deals con cursor pagination
   - Incluir open, won, lost
   - UPSERT en crm_deals
   - Ejecutar auto-match con servicios_custodia
4. Retornar estadísticas:
   - Stages sincronizados
   - Deals importados/actualizados
   - Matches encontrados
```

### Endpoints Pipedrive API v2

```typescript
// Base URL
const PIPEDRIVE_API = 'https://api.pipedrive.com/api/v2';

// Endpoints a usar
GET /pipelines                    // Listar pipelines
GET /stages?pipeline_id={id}      // Listar etapas de un pipeline
GET /deals?limit=500&cursor={c}   // Listar deals con paginación
```

### Lógica de Sincronización

```typescript
// Sincronizar stages
async function syncStages(apiToken: string) {
  // 1. Obtener todos los pipelines
  const pipelines = await fetch(`${PIPEDRIVE_API}/pipelines?api_token=${apiToken}`);
  
  // 2. Para cada pipeline, obtener sus stages
  for (const pipeline of pipelines.data) {
    const stages = await fetch(`${PIPEDRIVE_API}/stages?pipeline_id=${pipeline.id}&api_token=${apiToken}`);
    
    // 3. UPSERT cada stage
    for (const stage of stages.data) {
      await supabase.from('crm_pipeline_stages')
        .upsert({
          pipedrive_id: stage.id,
          name: stage.name,
          pipeline_name: pipeline.name,
          order_nr: stage.order_nr,
          deal_probability: stage.deal_probability || 50,
        }, { onConflict: 'pipedrive_id' });
    }
  }
}

// Sincronizar deals con paginación
async function syncDeals(apiToken: string) {
  let cursor = null;
  let totalDeals = 0;
  
  do {
    const url = new URL(`${PIPEDRIVE_API}/deals`);
    url.searchParams.set('api_token', apiToken);
    url.searchParams.set('limit', '500');
    if (cursor) url.searchParams.set('cursor', cursor);
    
    const response = await fetch(url);
    const data = await response.json();
    
    for (const deal of data.data || []) {
      // UPSERT deal
      const stageId = await getOrCreateStage(supabase, deal.stage_id);
      const match = await findClientMatch(supabase, deal.org_name);
      
      await supabase.from('crm_deals').upsert({
        pipedrive_id: deal.id,
        title: deal.title,
        organization_name: deal.org_name,
        person_name: deal.person_name,
        value: deal.value,
        currency: deal.currency,
        stage_id: stageId,
        status: deal.status,
        expected_close_date: deal.expected_close_date,
        won_time: deal.won_time,
        lost_time: deal.lost_time,
        lost_reason: deal.lost_reason,
        owner_name: deal.owner_name,
        matched_client_name: match.name,
        match_confidence: match.confidence,
      }, { onConflict: 'pipedrive_id' });
      
      totalDeals++;
    }
    
    cursor = data.additional_data?.next_cursor;
  } while (cursor);
  
  return totalDeals;
}
```

---

## Fase 3: Configuración

### Modificar: `supabase/config.toml`

```toml
[functions.pipedrive-sync]
verify_jwt = true  # Solo usuarios autenticados pueden sincronizar
```

---

## Fase 4: UI - Botón de Sincronización

### Modificar: `src/pages/CRMHub/CRMHub.tsx`

Agregar un botón "Sincronizar con Pipedrive" en el header que:
- Llame a la Edge Function `pipedrive-sync`
- Muestre un spinner mientras sincroniza
- Muestre un toast con resultados (X stages, Y deals sincronizados)
- Refresque los datos del CRM

```text
┌─────────────────────────────────────────────────────────────────┐
│  CRM Hub                                                        │
│  Pipeline de ventas, forecast e integración con Pipedrive       │
│                                                                 │
│  [🔄 Sincronizar con Pipedrive]                    [↻ Actualizar]│
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 5: Limpieza de Etapas Dummy

Eliminar las etapas genéricas que insertamos inicialmente y usar las reales de Pipedrive.

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/functions/pipedrive-sync/index.ts` | Edge Function de sincronización masiva |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/config.toml` | Agregar config de pipedrive-sync |
| `src/pages/CRMHub/CRMHub.tsx` | Agregar botón de sincronización |

---

## Próximo Paso Inmediato

Antes de implementar, necesito que me proporciones el **API Token de Pipedrive**:

1. Ve a **Pipedrive** > **Settings** (⚙️ arriba a la derecha)
2. **Personal preferences** > **API**
3. Copia el **API token**

Con este token podré:
- Configurar el secret `PIPEDRIVE_API_TOKEN`
- Crear la Edge Function de sincronización
- Importar todos tus deals y stages reales

---

## Resultado Esperado

Después de ejecutar la sincronización, el CRM Hub mostrará:

- **Pipeline Kanban** con todas las etapas reales de Pipedrive
- **Deals distribuidos** en sus etapas correspondientes
- **Forecast calculado** con valores reales
- **Métricas** de win rate, ticket promedio, etc.
- **Vinculación automática** con clientes de servicios_custodia
