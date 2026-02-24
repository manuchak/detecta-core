

# Plan: Completar la unificacion GMV MTD en la pagina /dashboard/kpis

## Problema

Estas viendo la pagina `/dashboard/kpis` que usa el componente `OperationalOverview`, el cual consume el hook `useOperationalMetrics`. Este hook **no fue migrado** en la fase anterior porque tiene 857 lineas y una arquitectura compleja. Es el consumidor mas grande que sigue calculando GMV de forma independiente.

### Inconsistencias activas en `useOperationalMetrics`

| Problema | Detalle |
|----------|---------|
| Sin paginacion | Usa `supabase.from().select()` directo, limitado a 1000 rows. Con >600 servicios MTD, los datos se truncan |
| Filtro GMV inconsistente | Lineas 276-278: ya corregido a "non-cancelled", pero la query principal (linea 212) no pagina |
| Query duplicada | Hace 2 queries enormes (current + prev year) sin usar el cache unificado |

## Solucion

### Archivo 1: `src/hooks/useOperationalMetrics.ts`

Agregar `fetchAllPaginated` a las dos queries principales (lineas 194-213 y 223-231) para eliminar el truncamiento de datos a 1000 rows. Los cambios son quirurgicos:

1. **Importar** `fetchAllPaginated` desde `@/utils/supabasePagination`
2. **Reemplazar** la query principal (linea 194-213) para usar `fetchAllPaginated` con el mismo select y filtros
3. **Reemplazar** la query de ano anterior (lineas 223-231) para usar `fetchAllPaginated`
4. **Mantener** toda la logica de calculo intacta (las 600+ lineas restantes no cambian)

### Archivo 2: `src/components/executive/OperationalOverview.tsx`

No requiere cambios — ya consume `useOperationalMetrics` correctamente.

## Detalle tecnico

Las dos queries a reemplazar:

```text
ANTES (linea 212):
  const { data: services } = await query;  // Limitado a 1000 rows

DESPUES:
  const services = await fetchAllPaginated(() => query);  // Sin limite
```

Lo mismo para la query del ano anterior (linea 223).

Esto asegura que la tarjeta "GMV MTD" en el tab Operacional de `/dashboard/kpis` reporte el mismo numero que la barra superior del Dashboard Ejecutivo.

## Resultado esperado

- La tarjeta "GMV MTD" en `/dashboard/kpis` mostrara datos completos (sin truncamiento)
- Los logs `[GMV-AUDIT]` del servicio unificado ya estan activos en el Dashboard Ejecutivo
- Ambas paginas reportaran cifras consistentes
