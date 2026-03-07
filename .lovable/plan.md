

# Plan: Simplificar Dashboard Operativo — Gauge + Monitoristas Activos

## Concepto

Reemplazar la sección de barras "Touchpoints" por un **gauge semicircular SVG** que muestre el promedio global de touchpoints como indicador de performance. Filtrar la lista de monitoristas para mostrar **solo los activos (en turno)**, manteniendo el badge `3/9` para saber cuántos de la plantilla están trabajando. Cada fila de monitorista muestra servicios asignados y eventos realizados de forma compacta.

## Cambios en `MobileOperationalDashboard.tsx`

### 1. Nuevo componente inline: `TouchpointGauge`
- SVG semicircular (gauge 180°) renderizado directamente (no usa `@react-pdf/renderer`)
- Valor: `pulse.touchpoints.promedioGlobalMin` mapeado a escala 0-60 minutos
- Color por umbral: verde (≤15m), ámbar (≤30m), rojo (>30m)
- Label central con el valor en minutos y texto "Prom. Touchpoint"
- Estilo: limpio, sin bordes, integrado en card con fondo `bg-card`

### 2. Sección Monitoristas — solo activos
- Filtrar `pulse.monitoristas.listado` por `m.enTurno === true`
- Mantener badge `activos/totalEnTurno` (e.g. `3/9`)
- Cada fila: nombre, barra de carga (servicios), y `X evt` a la derecha
- Eliminar el punto verde/gris (todos son activos, no necesita indicador)

### 3. Eliminar sección Touchpoints con barras individuales
- Se reemplaza completamente por el gauge

## Layout resultante

```text
┌─────────────────────────┐
│ ● Pulso Operativo  hora │
├─────────────────────────┤
│ [Por Salir][Ruta][Dest] │  ← Phase grid (sin cambio)
│ [Evento][Alerta][Compl] │
├─────────────────────────┤
│ ⚡ Servicios activos  47│  ← Banner (sin cambio)
├─────────────────────────┤
│ ⚠ Alertas...            │  ← Alertas (sin cambio)
├─────────────────────────┤
│      ╭──────────╮       │
│      │  39m     │       │  ← Gauge SVG semicircular
│      │ Prom. TP │       │
│      ╰──────────╯       │
├─────────────────────────┤
│ 👥 MONITORISTAS    3/9  │
│ Jose Eduardo    4s  22e │  ← Solo activos
│ Iñaki Yael     10s 20e │
│ Maria Fern.     3s 20e │
└─────────────────────────┘
```

## Archivo

| Archivo | Acción |
|---------|--------|
| `src/components/executive/MobileOperationalDashboard.tsx` | Editar — gauge SVG + filtro activos |

