

# Plan: Histórico Insights — Timestamps operativos en Facturación

## Objetivo

Renombrar la sub-pestaña "Servicios" a "Histórico Insights" dentro de Operaciones, y agregar una nueva sub-pestaña "Tiempos Operativos" que clone la tabla de tiempos del módulo de Monitoreo (ServiceTimesTable + ServiceDetailView) directamente en el tablero de Facturación. Default: desde 6 de marzo 2026.

## Cambios

### 1. OperacionesTab.tsx — Renombrar + nueva pestaña

- Renombrar tab "Servicios" → "Histórico Insights"
- Agregar nueva tab "Tiempos Ops" con icono Clock
- La nueva tab renderiza un componente `TiemposOperativosPanel` (wrapper local)

### 2. Crear TiemposOperativosPanel.tsx (en Facturacion/components/)

Wrapper ligero que reutiliza directamente:
- `ServiceTimesTable` de `@/components/monitoring/tiempos/ServiceTimesTable`
- `ServiceDetailView` de `@/components/monitoring/tiempos/ServiceDetailView`

Misma lógica que `ServiceTimesPanel` de monitoreo pero con fecha por defecto `2026-03-06` en lugar de 7 días atrás. Para esto, el wrapper pasa props al `ServiceTimesTable` o lo clona con la fecha default ajustada.

**Problema**: `ServiceTimesTable` tiene las fechas hardcodeadas internamente (`useState(weekAgo)`). Para reutilizar sin duplicar, hay dos opciones:

**Opción elegida**: Refactorizar `ServiceTimesTable` para aceptar props opcionales `defaultDateFrom` y `defaultDateTo`, con fallback a los valores actuales. Cambio mínimo, no rompe nada en Monitoreo.

### 3. Refactorizar ServiceTimesTable.tsx

Agregar props opcionales:
```typescript
interface Props {
  onSelectService: (row: ServiceTimeRow) => void;
  defaultDateFrom?: string; // default: 7 days ago
  defaultDateTo?: string;   // default: today
}
```

Usar `defaultDateFrom ?? weekAgo` en el useState.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `OperacionesTab.tsx` | Renombrar "Servicios" → "Histórico Insights", agregar tab "Tiempos Ops" |
| `ServiceTimesTable.tsx` | Agregar props `defaultDateFrom`/`defaultDateTo` |
| Nuevo: `TiemposOperativosPanel.tsx` | Wrapper con fecha default 2026-03-06, reutiliza ServiceTimesTable + ServiceDetailView |

