
# Reconstruir graficos de Analisis de Tickets desde cero

## Problema raiz

El hook `useTicketMetrics` intenta hacer un JOIN a `ticket_categorias_custodio` usando sintaxis PostgREST incorrecta (`!left`). La query falla silenciosamente y retorna datos vacios, causando que ambos graficos muestren "Sin datos disponibles".

Los 7 tickets existentes (Dic 2025) tienen casi todos `categoria_custodio_id = null`, y la query nunca los recupera correctamente.

## Estrategia

Eliminar el JOIN problematico. Hacer dos queries separadas y unirlas en JavaScript. Esto es mas simple, mas robusto, y no depende de sintaxis especifica de PostgREST.

## Datos reales en BD

- 7 tickets en tabla `tickets` (6 cerrados, 1 resuelto)
- Columna `categoria_custodio_id` (FK a `ticket_categorias_custodio`) - mayoria son NULL
- Columna `category` (texto simple) - todos tienen "general"
- Columna `status` (texto) - valores: "cerrado", "resuelto"
- Rango: Dic 15-26, 2025

## Cambios

### Archivo: `src/hooks/useTicketMetrics.ts`

Reescribir la funcion `calculateMetrics` para:

1. **Query 1**: Obtener tickets planos sin JOIN
```typescript
const { data: tickets } = await supabase
  .from('tickets')
  .select('*')
  .gte('created_at', startStr)
  .lte('created_at', endStr + 'T23:59:59');
```

2. **Query 2**: Obtener categorias por separado (solo si hay tickets con categoria)
```typescript
const catIds = tickets.filter(t => t.categoria_custodio_id).map(t => t.categoria_custodio_id);
let categoriesMap = new Map();
if (catIds.length > 0) {
  const { data: cats } = await supabase
    .from('ticket_categorias_custodio')
    .select('id, nombre, color, departamento_responsable')
    .in('id', catIds);
  cats?.forEach(c => categoriesMap.set(c.id, c));
}
```

3. **Unir en JS**: Reemplazar todas las referencias a `ticket.ticket_categorias_custodio?.` por lookup en el Map:
```typescript
const cat = categoriesMap.get(ticket.categoria_custodio_id);
const catName = cat?.nombre || ticket.category || 'Sin categoria';
const catColor = cat?.color || '#6B7280';
const dept = cat?.departamento_responsable || 'Sin asignar';
```

4. **Mantener todo lo demas igual**: Los calculos de KPI, heatmap, agentes, SLA, CSAT permanecen sin cambios ya que usan campos correctos (`status`, `fecha_sla_resolucion`, `resolved_at`).

### Sin cambios en componentes de renderizado

`TicketDashboardCharts.tsx` ya maneja correctamente el caso vacio y renderiza los datos cuando los recibe. Solo necesitamos arreglar la fuente de datos.

## Resultado esperado

- Grafico "Tickets por Dia": Mostrara las 7 entradas distribuidas en Dic 2025
- Grafico "Distribucion por Area": Mostrara la distribucion (mayoria "Sin asignar" ya que la mayoria no tiene categoria asignada, y los que si la tienen mostraran su departamento real)
