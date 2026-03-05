

# Service Detail Drawer + Mejoras a Tarjetas de Bitacora

## Alcance actualizado (con feedback del usuario)

- **Tipo de servicio**: Solo 3 tipos: Custodia, Monitoreo, Transporte (badge discreto en tarjeta)
- **IDs de servicio**: Los folios largos son genéricos, truncamiento actual es aceptable -- sin cambios
- **Hora de cita**: Se descarta, no se considera relevante para el monitorista en la tarjeta activa
- **Icono de armado requerido**: Se mantiene (Shield icon cuando `requiere_armado = true`)
- **Drawer de detalle**: Se mantiene completo con doble clic

## 1. ServiceDetailDrawer (nuevo componente)

Componente `Sheet` (side="right") que se abre al hacer doble clic en cualquier tarjeta. Contenido:

```text
┌──────────────────────────────┐
│ PRIAPPE-209         Custodia │  ← Folio + badge tipo
│ ● En Curso                   │  ← Estado actual
├──────────────────────────────┤
│ Cliente: Primark Apparel     │
│ Origen → Destino             │
│ Cita: 06:00  Inicio: 06:12  │  ← Delta visual
│ Custodio: Oscar Patiño  [→] │  ← Link a perfil
│ Armado: Juan Pérez      [→] │  ← Si aplica
├──────────────────────────────┤
│ Timeline en vivo             │
│  🟢 06:12 Inicio             │
│  📍 06:45 Checkpoint - CDMX  │
│  ⛽ 07:20 Combustible (8m)   │
│  📍 07:35 Checkpoint - Qro   │
├──────────────────────────────┤
│ Touchpoints                  │
│  Promedio entre eventos: 25m │
│  Gaps > 45m: 0               │
├──────────────────────────────┤
│ Anomalías                    │
│  (ninguna detectada)         │
├──────────────────────────────┤
│ [Ver historial cliente]      │  ← Link a Tiempos filtrado
│ [Ver detalle completo]       │  ← Link a ServiceDetailView
└──────────────────────────────┘
```

**Datos consumidos**:
- `useServicioDetalle(service.id)` para campos completos del servicio (incluye `requiere_armado`, `armado_asignado`)
- `useBitacoraBoard.getEventsForService(id_servicio)` para timeline (ya disponible, no requiere query adicional)
- Links: `/perfiles-operativos/custodio/:custodio_id`, `/monitoring?tab=tiempos&search=CLIENTE`

## 2. Mejoras a tarjetas

**ServiceCardActive, ServiceCardPending, ServiceCardEnDestino, ServiceCardSpecialEvent**:
- Agregar `onDoubleClick` prop que abre el drawer con el servicio seleccionado
- Badge de tipo servicio: chip discreto (Custodia/Monitoreo/Transporte) basado en `tipo_servicio`
- Icono Shield junto al nombre del custodio cuando `requiere_armado = true` (requiere agregar campo al query)

## 3. Cambios en datos

**`useBitacoraBoard.ts`**: Agregar `requiere_armado` al select de ambas queries (pending y active) y al tipo `BoardService`.

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/bitacora/ServiceDetailDrawer.tsx` | **Nuevo** -- Sheet con timeline, links, touchpoints, anomalias |
| `src/components/monitoring/bitacora/BitacoraBoard.tsx` | Estado `selectedServiceId`, render drawer, pasar `onDoubleClick` |
| `src/components/monitoring/bitacora/BoardColumnEnCurso.tsx` | Propagar `onDoubleClick` a cards |
| `src/components/monitoring/bitacora/BoardColumnPorIniciar.tsx` | Propagar `onDoubleClick` a cards |
| `src/components/monitoring/bitacora/ServiceCardActive.tsx` | Badge tipo servicio, Shield icon, onDoubleClick handler |
| `src/components/monitoring/bitacora/ServiceCardPending.tsx` | Badge tipo servicio, Shield icon, onDoubleClick handler |
| `src/components/monitoring/bitacora/ServiceCardEnDestino.tsx` | onDoubleClick handler |
| `src/components/monitoring/bitacora/ServiceCardSpecialEvent.tsx` | onDoubleClick handler |
| `src/hooks/useBitacoraBoard.ts` | Agregar `requiere_armado` al select y a `BoardService` |

