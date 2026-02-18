

# Fix: Excluir datos futuros de los graficos historicos de Performance

## Problema

Los graficos de Performance muestran datos de meses futuros (ej. "Ago 2026") porque la query a `servicios_planificados` no tiene filtro de fecha maxima. Solo filtra `gte` (desde 12 meses atras) pero NO filtra `lte` (hasta hoy), asi que incluye todos los servicios planificados a futuro.

La vista diaria no se ve afectada porque tiene un filtro explicito `s.diaCDMX <= todayCDMX`, pero las vistas semanal, mensual y trimestral no tienen esta proteccion.

## Solucion

Dos cambios en `src/hooks/usePerformanceHistorico.ts`:

### 1. Agregar filtro superior en la query de `servicios_planificados`

Agregar `.lte('fecha_hora_cita', rangeEnd)` donde `rangeEnd` es el final del dia actual en CDMX. Esto evita traer datos de la BD que no necesitamos.

### 2. Filtrar servicios mergeados antes de agrupar (defensa en profundidad)

Aplicar `merged.filter(s => s.diaCDMX <= todayCDMX)` antes de generar las agrupaciones weekly, monthly y quarterly. Esto garantiza que ninguna vista muestre datos futuros, incluso si la query de custodia o checklist trae datos inesperados.

## Cambios concretos

| Linea(s) | Cambio |
|---|---|
| ~126 | Agregar variable `rangeEnd` con fecha de hoy + 23:59:59 CDMX |
| ~134 | Agregar `.lte('fecha_hora_cita', rangeEnd)` a query de planificados |
| ~195-222 | Usar `merged.filter(s => s.diaCDMX <= todayCDMX)` como base para weekly/monthly/quarterly |

## Impacto

- **Ninguno en otros componentes** — solo cambia el hook de datos historicos
- **Mejora rendimiento** — menos filas traidas de la BD al excluir futuro
- **No afecta la vista diaria** — ya tenia su propio filtro

