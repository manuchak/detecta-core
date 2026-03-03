

# Fix: Efectividad de controles muestra 2% — campos incorrectos

## Causa raíz

El hook `useSecurityDashboard.ts` filtra `fillRateData` usando `r.anio` y `r.mes` (líneas 170-176), pero la tabla `siniestros_historico` **no tiene esas columnas**. Tiene una columna `fecha` (tipo date, ej: `2026-02-01`).

Resultado: el filtro no matchea nada → `servicesInChecklistPeriod = 0` → cae al fallback `totalServicesAll = 22,523` (27 meses completos) → 381/22,523 = **2%**.

## Datos reales en BD

| fecha | servicios_completados |
|-------|----------------------|
| 2026-02-01 | 850 |

Solo hay 1 mes relevante (Feb 2026) con 850 servicios. El cálculo correcto: **381 / 850 = 45%**.

## Corrección

### `useSecurityDashboard.ts`

1. **Query**: Ya trae `fecha` y `servicios_completados` pero el tipo TypeScript dice `mes, anio` — corregir el tipo a `{ fecha: string; servicios_completados: number }`.
2. **Filtro**: Reemplazar `r.anio >= 2026 && r.mes >= 2` por `r.fecha >= '2026-02-01'` (comparación directa de fecha string).
3. **Eliminar fallback engañoso**: Si no hay servicios en el periodo de checklists, mostrar `0%` o "Sin datos", no caer al total histórico.

