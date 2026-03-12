

# Histórico de Apoyos + Counter de Pendientes

## Cambios

### 1. `AprobacionGastosPanel.tsx` — Dividir en dos sub-tabs
Agregar un toggle interno "Pendientes" / "Histórico":
- **Pendientes**: Filtro fijo `estado = 'pendiente'` (sin selector de estado). Esta es la vista de acción.
- **Histórico**: Muestra aprobados, rechazados y pagados con filtro por estado. Vista de consulta.

Eliminar el `Select` de filtro de estado de la vista principal — ya no tiene sentido si la vista default es solo pendientes.

### 2. `EgresosTab.tsx` — Counter en el botón "Gastos Custodios"
- Agregar un query ligero para contar pendientes: `SELECT count(*) FROM solicitudes_apoyo_extraordinario WHERE estado = 'pendiente'`
- Mostrar un badge numérico rojo junto al texto "Gastos Custodios" en el segment control (similar al badge "182" que ya se usa en Rutas en el sidebar).

### Archivos a modificar
1. `src/pages/Facturacion/components/GastosExtraordinarios/AprobacionGastosPanel.tsx` — sub-tabs Pendientes/Histórico
2. `src/pages/Facturacion/components/EgresosTab.tsx` — query de count + badge en botón

