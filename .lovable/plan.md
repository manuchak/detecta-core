

# Rebalanceo automático al incorporarse un monitorista

## Escenario
Un monitorista llega tarde, se loguea y queda `en_turno` con 0 servicios. El sistema detecta el desbalance y redistribuye equitativamente entre todos los monitoristas activos.

Ejemplo: 40 servicios en 1 persona → llega 2do → 20/20 → llega 3ro → 13/13/14.

## Mecanismo: "BalanceGuard" en CoordinatorCommandCenter

Un nuevo `useEffect` que:

1. **Detecta incorporaciones**: Mantiene un `useRef<Set>` con los IDs `en_turno` del ciclo anterior. Cuando el set actual tiene un miembro nuevo, se activa.
2. **Verifica desbalance**: El nuevo miembro tiene 0 asignaciones formales activas Y al menos otro monitorista tiene ≥2 servicios.
3. **Calcula target equitativo**: `Math.floor(totalServicios / totalMonitoristas)` por persona. Los servicios excedentes se toman de los más cargados.
4. **Ejecuta redistribución**: Reasigna servicios (usando `reassignService`) de los monitoristas sobrecargados al nuevo, hasta alcanzar el equilibrio.
5. **Toast informativo**: "Carga rebalanceada: 13 servicios c/u entre 3 monitoristas".
6. **Registro de anomalía**: Inserta en `bitacora_anomalias_turno` con tipo `rebalanceo_por_incorporacion`.

### Lógica de selección de servicios a mover

Para decidir **cuáles** servicios mover del monitorista sobrecargado al nuevo:
- Priorizar servicios **pendientes** (aún no iniciados) sobre los que están en curso
- Entre pendientes, mover los de cita más lejana (menos urgentes) para no romper contexto operativo

### Protecciones
- **Cooldown** de 60 segundos tras cada rebalanceo (evitar loops por refetch)
- **Umbral mínimo**: Solo rebalancear si la diferencia entre max y min es ≥ 2 servicios
- **No tocar servicios con evento especial activo** (ya están en gestión de crisis)

## Cambios

| Archivo | Cambio |
|---------|--------|
| `CoordinatorCommandCenter.tsx` | Nuevo `useEffect` "BalanceGuard" que detecta incorporación y ejecuta rebalanceo |
| `useMonitoristaAssignment.ts` | Nueva mutación `rebalanceLoad` que acepta un array de reasignaciones `{from, to, servicioId}[]` en batch |

No se requieren cambios de base de datos — usa la tabla `bitacora_asignaciones_monitorista` existente y `bitacora_anomalias_turno` para trazabilidad.

