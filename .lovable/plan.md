

# Root Cause: Duplicate `custodios_operativos` on release

## Problem

The RPC `liberar_custodio_a_planeacion_v2` step 6 looks for an existing `custodios_operativos` record **only by `pc_custodio_id`** (line 119). But "ANGEL DIONISIO MENDOZA PLONEDA" already has a record in `custodios_operativos` with `pc_custodio_id = NULL` (created from a different flow — likely manual or legacy). The lookup finds nothing, tries to INSERT a new row, and hits the unique constraint `custodios_operativos_nombre_unique`.

## Fix: Add fallback lookup by nombre and telefono

Modify the RPC to add a secondary lookup when no match is found by `pc_custodio_id`. Before attempting INSERT, check if a record with the same normalized name or phone exists, and if so, UPDATE it instead.

### SQL Migration

Update `liberar_custodio_a_planeacion_v2` step 6 from:

```sql
-- Current: only looks by pc_custodio_id
SELECT id INTO v_existing_operativo
FROM custodios_operativos
WHERE pc_custodio_id = v_pc_custodio_id
LIMIT 1;
```

To:

```sql
-- Primary: by pc_custodio_id
SELECT id INTO v_existing_operativo
FROM custodios_operativos
WHERE pc_custodio_id = v_pc_custodio_id
LIMIT 1;

-- Fallback: by normalized name or phone
IF v_existing_operativo IS NULL THEN
  SELECT id INTO v_existing_operativo
  FROM custodios_operativos
  WHERE TRIM(nombre) = v_nombre_normalizado
     OR (v_cand.telefono IS NOT NULL AND telefono = v_cand.telefono)
  LIMIT 1;
  
  IF v_existing_operativo IS NOT NULL THEN
    v_warnings := array_append(v_warnings, 
      'Operativo existente vinculado por nombre/teléfono (sin pc_custodio_id previo)');
  END IF;
END IF;
```

The rest of the logic (UPDATE if found, INSERT if not) stays the same. This makes the release idempotent for candidates who already have an operative record from any source.

### Data fix for current blocker

Also run a one-time data fix to link the existing record so the release works immediately:

```sql
UPDATE custodios_operativos 
SET pc_custodio_id = (SELECT id FROM pc_custodios WHERE TRIM(nombre) = 'ANGEL DIONISIO MENDOZA PLONEDA' LIMIT 1)
WHERE id = '7e79ce62-01a6-4956-b08e-05f0c0a2b132';
```

No frontend changes needed — the error originates entirely in the database function.

