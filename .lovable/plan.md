

# Auto-asignación de Servicios 2 Horas Antes de su Inicio

## Contexto

Actualmente los servicios pendientes ("Por Iniciar") requieren asignación manual a monitoristas o uso del botón "Auto-distribuir". El coordinador quiere que los servicios se asignen automáticamente a monitoristas en turno cuando faltan 2 horas o menos para su `fecha_hora_cita`.

## Lógica

- Cada 30s (con el refetch del board), detectar servicios pendientes cuya `fecha_hora_cita` está a ≤2 horas
- Filtrar solo los que NO tienen asignación activa en `bitacora_asignaciones_monitorista`
- Distribuir equitativamente entre monitoristas en turno (round-robin por carga actual)
- Usar un `ref` para trackear IDs ya auto-asignados y no repetir

## Cambios

### `CoordinatorCommandCenter.tsx`

Agregar un `useEffect` que:
1. Calcula `pendingWithin2h` = servicios pendientes donde `fecha_hora_cita - now <= 2h`
2. Filtra los que no están en `assignedServiceIds` ni en el ref de ya-procesados
3. Si hay monitoristas en turno y servicios elegibles, ejecuta `autoDistribute.mutate()` automáticamente
4. Guarda los IDs procesados en el ref para evitar loops
5. Muestra un toast informativo: "X servicios auto-asignados (próximos 2h)"

| Archivo | Cambio |
|---------|--------|
| `CoordinatorCommandCenter.tsx` | useEffect para auto-asignar servicios pendientes dentro de 2h |

