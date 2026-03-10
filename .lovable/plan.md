

# Problema: BalanceGuard roba servicios recién restaurados post-pausa

## Diagnóstico

La función `fn_finalizar_pausa` sí restaura correctamente los servicios a Karla (deactivate temporal → insert con `notas_handoff = 'retorno_pausa'`). **Pero** el BalanceGuard se ejecuta cada 5 minutos y ve que Karla de pronto tiene muchos más servicios que sus compañeros → los redistribuye como "fríos", deshaciendo la restauración.

El filtro actual de "servicios calientes" (líneas 307-314) solo protege:
- Servicios en curso (`isEnCurso`)
- Servicios con eventos del monitorista actual (`hotPairs`)
- Servicios auto-asignados hace <60s (`autoAssignedRef`)

No hay protección para servicios recién restaurados de una pausa.

## Corrección

### 1. BalanceGuard: proteger servicios restaurados de pausa (grace period 10 min)

En `useOrphanGuard.ts`, dentro del filtro de "cold services" (línea 307-314), agregar una condición: si la asignación tiene `notas_handoff = 'retorno_pausa'` y `inicio_turno` es menor a 10 minutos, tratarla como "hot" (inmovible).

```text
// Existing cold-service filter additions:
if (a.isEnCurso) return false;                           // already exists
if (hotPairs.has(...)) return false;                     // already exists
if (autoTs && Date.now() - autoTs < 60_000) return false; // already exists
// NEW: protect pause-restored assignments for 10 minutes
if (a.notasHandoff === 'retorno_pausa' && Date.now() - new Date(a.inicioTurno).getTime() < 600_000) return false;
```

Esto requiere agregar `notas_handoff` e `inicio_turno` al objeto `allFormalActive`.

### 2. BalanceGuard: proteger también servicios `en_curso` asignados a Karla

Los servicios en curso ya están protegidos por `isEnCurso`. Los servicios en evento especial ya se excluyen del rebalanceo (línea 257). Esto está bien.

### 3. fn_finalizar_pausa: solo restaurar servicios que aún están activos

Actualmente restaura TODOS los servicios de la lista `servicios_redistribuidos`, incluyendo servicios que pudieron haberse completado durante la pausa. Agregar un check: solo restaurar si el servicio aún tiene `hora_fin_real IS NULL` y `estado_planeacion` no es `completado`/`cancelado`.

```sql
-- Inside the FOR loop, before deactivating/recreating:
IF EXISTS (
  SELECT 1 FROM servicios_planificados 
  WHERE id_servicio = (v_item->>'servicio_id')
    AND hora_fin_real IS NULL 
    AND estado_planeacion NOT IN ('completado','cancelado')
) THEN
  -- proceed with restore
END IF;
```

### Archivos afectados

- `src/hooks/useOrphanGuard.ts` — ampliar `allFormalActive` con `notasHandoff`/`inicioTurno`, agregar grace period en filtro cold
- **Nueva migración SQL** — actualizar `fn_finalizar_pausa` para verificar que el servicio sigue activo antes de restaurar

