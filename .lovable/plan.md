

# Reasignación de Servicios Abandonados — Coordinador Ops

## Concepto

Cuando un monitorista se retira sin hacer entrega de turno, sus servicios quedan "huérfanos". El coordinador necesita una sección dedicada donde pueda ver todos los servicios asignados a monitoristas inactivos (sin actividad reciente) y reasignarlos con un click a otro monitorista disponible.

## Detección de "abandono"

Un monitorista se considera inactivo/ausente si:
- Tiene asignaciones activas (`activo = true`)
- No ha registrado eventos en `servicio_eventos_ruta` en las últimas 2 horas
- No tiene una pausa activa en `bitacora_pausas_monitorista`
- No está marcado como `en_turno` por actividad reciente

Esto no requiere cambios de base de datos — toda la lógica es derivada de datos existentes (asignaciones activas + actividad reciente + pausas).

## Cambios

### 1. Nuevo componente: `src/components/monitoring/coordinator/AbandonedServicesSection.tsx`

- Card con estilo similar a `DestinoCorrectionSection`
- Icono: `UserX` (lucide), color rojo/destructivo
- Lista servicios cuyo monitorista asignado está inactivo
- Cada fila muestra: cliente, monitorista original (tachado o dimmed), última actividad ("hace 3h"), selector para reasignar a monitorista en turno
- Usa `reassignService` del hook existente `useMonitoristaAssignment`
- Dialog de confirmación con `ConfirmTransitionDialog` (destructive, double confirm)

### 2. Actualizar `CoordinatorCommandCenter.tsx`

- Importar y renderizar `AbandonedServicesSection` entre "Equipo en Turno" y "Correcciones en Destino"
- Pasar datos necesarios: monitoristas, assignments, activity data
- Agregar conteo de abandonados al `CoordinatorAlertBar`

### 3. Actualizar `CoordinatorAlertBar.tsx`

- Nuevo prop `abandonedCount` con badge e icono `UserX`, color rojo

### 4. Lógica de detección (dentro del componente)

- Cruza `assignmentsByMonitorista` con `monitoristas` que tienen `en_turno = false`
- Filtra monitoristas sin pausa activa (consulta `bitacora_pausas_monitorista`)
- Agrupa servicios por monitorista ausente para mostrar agrupado

| Archivo | Cambio |
|---------|--------|
| `src/components/monitoring/coordinator/AbandonedServicesSection.tsx` | Nuevo: card con lista de servicios abandonados y selector de reasignación |
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Integrar sección + pasar conteo a alert bar |
| `src/components/monitoring/coordinator/CoordinatorAlertBar.tsx` | Nuevo badge `abandonedCount` |

