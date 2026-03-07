

# Plan: Drawer de Servicios por Fase (Double-Tap en Phase Cards)

## Concepto

Doble toque en cualquier tarjeta de fase abre un Drawer con el listado de servicios en ese estatus, mostrando: folio, cliente, ruta, hora de salida, custodio y armado.

## Limitación: Completados

Actualmente los completados son solo un **count** (query `HEAD`), no traen objetos completos. Se necesita una query adicional para listarlos.

## Cambios

### 1. `src/hooks/useServiciosTurnoLive.ts`

- Agregar `armado_asignado, requiere_armado` al `select` de Q1 (active) y Q2 (pending)
- Agregar esos campos al `RadarService` interface y al `computeRadarService` return
- Cambiar Q4 (completed) de `count` a query completa con los mismos campos, limitada a hoy, para poder listar los servicios completados

### 2. Nuevo: `src/components/executive/PhaseServicesDrawer.tsx`

Drawer (vaul) que recibe:
- `phase`: string label ("Por Salir", "En Ruta", etc.)
- `services`: `RadarService[]` filtrados
- `open` / `onOpenChange`

Contenido:
- Header con nombre de fase, count y color
- Lista de tarjetas compactas por servicio:
  - **Folio** (`id_servicio`) — bold, monospace
  - **Cliente** (`nombre_cliente`)
  - **Ruta** (`origen → destino`)
  - **Hora cita** (formateada HH:mm)
  - **Custodio** (`custodio_asignado` o "Sin asignar")
  - **Armado** (solo si `requiere_armado`, muestra nombre o "Pendiente")
  - Para alertas: badge con minutos de inactividad
- ScrollArea para listas largas

### 3. `src/components/executive/MobileOperationalDashboard.tsx`

- Agregar estado `selectedPhase: string | null`
- Agregar `onDoubleClick` al `PhaseCard` component
- Lógica de filtrado por fase usando `pulse.rawServicios`:
  - "Por Salir" → `phase === 'por_iniciar'`
  - "En Ruta" → `phase === 'en_curso' && alertLevel === 'normal'`
  - "En Destino" → `phase === 'en_destino'`
  - "Evento" → `phase === 'evento_especial'`
  - "Alerta" → `alertLevel === 'warning' || 'critical'`
  - "Completados" → `phase === 'completado'`
- Renderizar `PhaseServicesDrawer`

### 4. `src/hooks/useOperationalPulse.ts`

- Actualizar `RadarService` usage para pasar los nuevos campos (armado)

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/hooks/useServiciosTurnoLive.ts` | Editar — agregar armado fields + completados full query |
| `src/components/executive/PhaseServicesDrawer.tsx` | Crear |
| `src/components/executive/MobileOperationalDashboard.tsx` | Editar — double-click + drawer |

