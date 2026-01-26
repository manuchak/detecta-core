

# Plan: Corregir Filtro de Fecha en Tab Clientes

## Problema Identificado

El filtro de fecha usa `created_at` (fecha de sincronización a Supabase: 26 enero 2026) en lugar de la fecha real de creación del deal en Pipedrive (`add_time`).

**Datos actuales:**
- 178 deals tienen `created_at = 2026-01-26` (hoy, fecha de sync)
- El `pipedrive_data.add_time` contiene la fecha real (ej: "2022-10-17")
- Por eso el filtro "últimos 6 meses" muestra los 178 deals

## Solución

Cambiar la lógica de filtrado para usar `pipedrive_data->>'add_time'` o `expected_close_date` como fecha de referencia.

---

## Cambios Técnicos

### Archivo: `src/hooks/useCrmClientMatcher.ts`

**Problema actual (línea 38):**
```typescript
query = query.gte('created_at', cutoffDate);
```

**Opción A - Usar campo JSONB de Pipedrive:**

Supabase permite filtrar por campos JSONB. Podemos filtrar por `pipedrive_data->>'add_time'`:

```typescript
// En lugar de filtrar en Supabase (más complejo con JSONB),
// traer todos y filtrar en JavaScript
const { data: deals } = await query.order('value', { ascending: false });

// Filtrar por add_time de Pipedrive
const filteredDeals = deals?.filter(deal => {
  if (!cutoffDate) return true;
  const addTime = deal.pipedrive_data?.add_time;
  if (!addTime) return true; // Incluir deals sin fecha
  return new Date(addTime) >= new Date(cutoffDate);
});
```

**Opción B - Agregar columna `pipedrive_add_time` (mejor long-term):**

Modificar la sincronización de Pipedrive para extraer `add_time` a una columna real, luego filtrar normalmente.

---

## Implementación Recomendada (Opción A - rápida)

```text
Archivo: src/hooks/useCrmClientMatcher.ts

1. Agregar pipedrive_data al SELECT
2. Filtrar en JavaScript por pipedrive_data.add_time
3. Mantener el cutoffDate calculado igual
```

### Cambios específicos:

```typescript
// Línea 32-33: Agregar pipedrive_data al SELECT
.select('id, title, organization_name, matched_client_name, match_confidence, value, pipedrive_data')

// Líneas 37-39: Remover filtro .gte en Supabase
// if (cutoffDate) {
//   query = query.gte('created_at', cutoffDate);
// }

// Después de línea 46: Filtrar en JavaScript
const filteredDeals = (deals || []).filter(deal => {
  if (!cutoffDate) return true;
  const pipedriveData = deal.pipedrive_data as { add_time?: string } | null;
  const addTime = pipedriveData?.add_time;
  if (!addTime) return true; // Incluir deals sin fecha de Pipedrive
  return new Date(addTime) >= new Date(cutoffDate);
});

// Usar filteredDeals en el map final
return filteredDeals.map(deal => { ... });
```

---

## Resultado Esperado

| Filtro | Antes | Después |
|--------|-------|---------|
| Últimos 3 meses | 178 deals | ~20-30 deals (estimado) |
| Últimos 6 meses | 178 deals | ~40-60 deals (estimado) |
| Último año | 178 deals | ~80-100 deals (estimado) |
| Todos | 178 deals | 178 deals |

La tarjeta mostrará estadísticas correctas basadas en cuándo se creó realmente el deal en Pipedrive, no cuándo se sincronizó.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useCrmClientMatcher.ts` | Agregar `pipedrive_data` al SELECT, filtrar por `add_time` en JavaScript |

