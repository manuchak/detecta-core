

# Análisis Exhaustivo: Por qué la Liberación sigue rompiendo

## Hallazgo Principal: El bug actual

El error en tu screenshot es claro:
> `new row for relation "candidatos_custodios" violates check constraint "candidatos_custodios_estado_proceso_check"`

**Causa directa**: La RPC `liberar_custodio_a_planeacion_v2` (migración `20260306180848`) ejecuta en línea 192:
```sql
UPDATE candidatos_custodios
SET estado_proceso = 'liberado'  -- ← ESTE VALOR NO EXISTE EN EL CONSTRAINT
```

Pero el CHECK constraint (definido en migración `20251118184636`) solo permite:
```
'lead', 'entrevista', 'documentacion', 'aprobado', 'en_liberacion', 'activo', 'rechazado', 'inactivo'
```

**`'liberado'` NO está en la lista.** El constraint nunca fue actualizado.

---

## Análisis Fishbone: Por qué esto sigue pasando

```text
                  BUGS RECURRENTES EN LIBERACIÓN
                              |
    ┌──────────┬──────────────┼──────────────┬──────────────┐
    |          |              |              |              |
  CONSTRAINT  RPC DRIFT    SIGNATURE      INCONSISTENCIA  NO HAY
  ESTÁTICO    SEMÁNTICO    MISMATCH       HISTÓRICA       TESTS
    |          |              |              |              |
 El CHECK    La RPC se     El DROP más    12 versiones   No existe
 constraint  reescribió    reciente       de la RPC      validación
 se creó en  12+ veces,    (migration     usan valores   automática
 Nov 2025    alternando    20260306...)   diferentes:    que compare
 y NUNCA     entre         targeta        - 'liberado'   el valor
 se tocó     'activo' y    (uuid,uuid,    - 'activo'     que la RPC
 de nuevo    'liberado'    boolean) pero  - flip-flop    escribe vs
             sin verificar la función     constante      el CHECK
             el constraint actual tiene                  constraint
                           4 params
                           (uuid,uuid,
                           boolean,text)
                           → NO SE BORRÓ
```

### Detalle de cada rama:

**1. Constraint Estático**: Creado una sola vez en `20251118` con 8 valores. Nunca se le agregó `'liberado'`. Cada vez que una nueva versión de la RPC usa `'liberado'`, explota.

**2. RPC Drift Semántico** (la causa raíz de los bugs recurrentes):
- Versiones que usan `estado_proceso = 'activo'` (FUNCIONA): `20251204`, `20251215`, `20260116211254`, `20260119`, `20260126`
- Versiones que usan `estado_proceso = 'liberado'` (ROMPE): `20251203171509`, `20260105145806`, `20260105181128`, `20260116173206`, `20260116173706`, **`20260306180848` (ACTUAL)**

Cada vez que se reescribe la RPC, hay 50/50 de que alguien ponga `'liberado'` vs `'activo'`.

**3. Signature Mismatch**: La migración `20260306193845` hace `DROP FUNCTION ... (uuid, uuid, boolean)` — 3 parámetros. Pero la versión actual (`20260306180848`) tiene **4 parámetros** `(uuid, uuid, boolean, text)`. El DROP no elimina la función porque la firma no coincide. Esto genera fantasmas de overloads que confunden futuras recreaciones.

**4. No hay tests**: No existe ninguna validación que verifique que los valores escritos por la RPC sean compatibles con los constraints de la tabla destino.

---

## Problemas Secundarios Detectados

1. **El frontend también escribe `'en_liberacion'`** directamente (línea 94, `useCustodioLiberacion.ts`) — esto SÍ funciona porque está en el constraint, pero es frágil: si el constraint cambia, el frontend también rompe.

2. **`pc_custodio_id`** en `custodio_liberacion` — la RPC lo escribe (línea 184) pero el tipo TypeScript (`CustodioLiberacion`) no incluye este campo, causando posibles errores de tipado silenciosos.

---

## Plan de Fix (2 cambios)

### Cambio 1: Nueva migración SQL — Actualizar constraint + recrear RPC limpia

```sql
-- 1. Actualizar CHECK constraint para incluir 'liberado'
ALTER TABLE candidatos_custodios 
  DROP CONSTRAINT IF EXISTS candidatos_custodios_estado_proceso_check;

ALTER TABLE candidatos_custodios 
  ADD CONSTRAINT candidatos_custodios_estado_proceso_check 
  CHECK (estado_proceso IN (
    'lead', 'entrevista', 'documentacion', 'aprobado',
    'en_liberacion', 'activo', 'rechazado', 'inactivo',
    'liberado'  -- ← AGREGAR
  ));

-- 2. Limpiar TODOS los overloads fantasma
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid);
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean, text);

-- 3. Recrear función con firma canónica de 4 params
-- (copiar la versión de 20260306180848 que es correcta excepto por el constraint)

-- 4. Grant explícito
GRANT EXECUTE ON FUNCTION public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean, text) TO authenticated;
```

### Cambio 2: Agregar `pc_custodio_id` al tipo TypeScript

En `src/types/liberacion.ts`, agregar el campo que la RPC escribe pero el tipo no declara:
```typescript
pc_custodio_id?: string;
```

### Sin cambios al frontend
El hook `useCustodioLiberacion.ts` ya llama correctamente con 4 params. Solo necesita que la DB acepte el valor `'liberado'`.

