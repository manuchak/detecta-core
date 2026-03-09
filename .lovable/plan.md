

# Fix: Servicios sin nombre de cliente en tarjetas de monitorista

## Causa raíz

El `serviceLabelMap` se construye solo con los servicios del tablero del día (pendientes + en curso). Pero las asignaciones en `bitacora_asignaciones_monitorista` pueden referenciar servicios de días anteriores o que no están en la vista actual del tablero.

Ejemplo de la data actual:
- **CTCOCGS-330** — asignado activo desde Mar 5, no aparece en el board de hoy
- **WILEOME-278** — asignado activo, no está en pending ni en curso del board

Al no estar en el mapa, el fallback es `a.servicio_id.slice(0, 12)` — solo folio, sin cliente.

## Solución

En `CoordinatorCommandCenter.tsx`, después de construir el `serviceLabelMap` con los datos del board, detectar qué `servicio_id`s de las asignaciones activas faltan en el mapa y hacer una consulta complementaria a `servicios_planificados` para obtener su `nombre_cliente`.

### Cambio en `CoordinatorCommandCenter.tsx`

1. Extraer todos los `servicio_id` de `assignmentsByMonitorista` que no estén en `serviceLabelMap`
2. Hacer un `useQuery` que busque esos IDs faltantes en `servicios_planificados` (select `id_servicio, nombre_cliente`)
3. Mergear los resultados en el `serviceLabelMap` antes de pasarlo a los componentes

| Archivo | Cambio |
|---------|--------|
| `CoordinatorCommandCenter.tsx` | Agregar query complementaria para servicios faltantes en el mapa de labels |

