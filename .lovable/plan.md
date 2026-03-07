

# Plan: Detalle de Servicio desde Alertas (Double-Tap Drawer)

## Concepto

Al hacer doble toque en una alerta del dashboard operativo móvil, se abre un **Drawer** (vaul) con el detalle completo del servicio: información de ruta, posición GPS en mapa estático, timeline de eventos y métricas de touchpoint.

## Arquitectura

Reutilizar los datos ya disponibles en `useServiciosTurnoLive` (que ya trae `RadarService` con GPS, eventos, fase, etc.) en lugar de hacer queries adicionales. El drawer se construye como componente nuevo `AlertServiceDrawer` específico para móvil.

## Cambios

### 1. Nuevo componente: `src/components/executive/AlertServiceDrawer.tsx`

Drawer móvil (vaul) que recibe un `RadarService` y sus eventos:

- **Header**: Cliente, custodio, badge de fase y tipo de servicio
- **Mapa estático**: Imagen de Mapbox Static API con marker en la última posición GPS conocida
- **Info de ruta**: Origen → Destino, hora de cita, tiempo en ruta, minutos de inactividad
- **Timeline de eventos**: Lista cronológica de los últimos eventos (checkpoint, especiales) con hora y descripción
- **Touchpoint analytics**: Promedio de intervalos entre eventos, gap máximo
- **Link a Tiempos**: Botón para navegar al detalle completo en `/monitoring`

### 2. Editar `MobileOperationalDashboard.tsx`

- Importar `useServiciosTurnoLive` directamente (ya lo usa vía `useOperationalPulse`, pero necesitamos acceso a `servicios` y eventos raw)
- Exponer `servicios` y `eventsByService` desde el pulse hook (o acceder directamente al hook de turno)
- Agregar estado `selectedAlertId` + handler `onDoubleClick` en `AlertRow`
- Renderizar `AlertServiceDrawer` al final del componente

### 3. Editar `useOperationalPulse.ts`

Exponer `servicios` (la lista de `RadarService[]`) y los eventos raw en el return del hook para que el dashboard pueda pasarlos al drawer sin queries extra.

## Flujo de datos

```text
useServiciosTurnoLive → servicios (RadarService[]) + eventos
         ↓
useOperationalPulse → pulse.alertas + pulse.rawServicios + pulse.rawEvents
         ↓
MobileOperationalDashboard → AlertRow (onDoubleClick → selectedId)
         ↓
AlertServiceDrawer ← RadarService + EventoRuta[]
```

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/components/executive/AlertServiceDrawer.tsx` | Crear |
| `src/components/executive/MobileOperationalDashboard.tsx` | Editar — double-click handler + drawer |
| `src/hooks/useOperationalPulse.ts` | Editar — exponer servicios raw y eventos |

