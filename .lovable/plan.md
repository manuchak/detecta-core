

# Rebalanceo seguro: proteger servicios activos y trazabilidad

## El problema que señalas

Un rebalanceo periódico "ciego" cada 5 minutos movería servicios que un monitorista ya está trabajando activamente (con eventos registrados, notas, comunicación con el custodio). Esto causa:

- Pérdida de contexto operativo (el nuevo monitorista no sabe qué se ha hablado)
- Confusión del custodio/cliente si cambia su contacto
- Registros de auditoría fragmentados entre dos monitoristas
- Posible duplicación de acciones

## Solución: Rebalanceo solo de servicios "fríos"

En lugar de mover cualquier servicio, el rebalanceo solo debe mover servicios que **aún no han sido tocados** por el monitorista. Un servicio es "inmovible" si tiene alguno de estos:

1. **Estado "en_curso"** — el monitorista ya inició monitoreo activo
2. **Evento especial activo** — ya está protegido (esto ya existe)
3. **Tiene eventos registrados** por ese monitorista — ya hay trazabilidad

Solo se mueven servicios en estado **pendiente** sin eventos del monitorista actual.

### Cambios concretos

**`src/hooks/useOrphanGuard.ts`** — BalanceGuard:

- Cambiar la línea 131 para agregar un segundo path: periódico cada 5 min (además del trigger por nuevo miembro)
- En la selección de servicios movibles (líneas 174-185), agregar filtro: excluir servicios `isEnCurso` (ya existe) **Y** servicios que tengan eventos registrados por el monitorista actual
- Agregar consulta ligera: al detectar desbalance, consultar `bitacora_eventos` para obtener qué servicios ya tienen actividad del monitorista asignado
- **Cooldown de 5 minutos** en lugar de 60 segundos para el path periódico

**`src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx`**:

- Agregar botón "Rebalancear" manual junto a "Auto-distribuir"
- Agregar badge de equidad: Verde (diff ≤1), Amarillo (2-3), Rojo (>3) con rango "max↔min"
- El botón manual usa la misma lógica segura (solo mueve servicios fríos)

### Lógica del filtro de servicios movibles

```text
ACTUAL:
  movible = !isEnCurso && !eventoEspecial
  (ordena por hora_cita DESC → mueve los más lejanos primero)

NUEVO:
  movible = !isEnCurso && !eventoEspecial && !tieneEventosDelMonitorista
  (ordena por hora_cita DESC → mueve los más lejanos primero)
```

Esto garantiza que si Karla tiene 18 servicios pero ya trabajó 12, solo se moverán los 6 que no ha tocado. Si ya tocó todos, no se mueve ninguno aunque haya desbalance — el coordinador verá el badge rojo y podrá decidir manualmente.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useOrphanGuard.ts` | Agregar path periódico (5 min), filtrar servicios con eventos existentes antes de moverlos |
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Botón "Rebalancear" manual + badge de equidad visual |

