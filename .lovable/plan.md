

# Análisis Fishbone — MiDot no guarda para armados (Sergio Zúñiga)

## Diagrama Ishikawa

```text
                          ┌──────────────────────────────────┐
                          │  MiDot se queda en loop          │
                          │  de guardado para armados        │
                          └───────────────┬──────────────────┘
                                          │
        ┌─────────────────┬───────────────┼───────────────┬────────────────┐
        │                 │               │               │                │
   ┌────┴────┐      ┌────┴────┐    ┌─────┴─────┐   ┌────┴────┐    ┌──────┴──────┐
   │  BASE   │      │  CÓDIGO │    │    UI      │   │ STORAGE │    │  SILENCIO   │
   │ DE DATOS│      │ FRONTEND│    │  FEEDBACK  │   │         │    │  DE ERROR   │
   └────┬────┘      └────┬────┘    └─────┬─────┘   └────┬────┘    └──────┬──────┘
        │                │               │               │                │
   ★ FK apunta      Hook no tiene   No muestra      Upload PDF      mutateAsync
   SOLO a            manejo de       el error de     puede fallar    no tiene
   candidatos_       error en        FK al usuario   silenciosamente try/catch
   custodios(id)     handleSubmit                                   en handleSubmit
        │                │
   candidatos_       Reintenta
   armados NO        porque el
   está referenciado usuario no
                     sabe que falló
```

## CAUSA RAÍZ (★)

**Línea 5 de la migración original:**
```sql
candidato_id uuid NOT NULL REFERENCES public.candidatos_custodios(id) ON DELETE CASCADE
```

La FK `evaluaciones_midot.candidato_id` apunta **exclusivamente** a `candidatos_custodios`. Cuando se intenta insertar un registro con el `candidato_id` de un armado (que vive en `candidatos_armados`), PostgreSQL rechaza el INSERT con error de violación de FK. El frontend no muestra el error porque `handleSubmit` en `MidotResultForm.tsx` no tiene try/catch, así que `mutateAsync` lanza una excepción no capturada que se pierde, y el usuario ve el botón volver a estado normal sin feedback, intenta de nuevo → loop.

## Causas contribuyentes

1. **`handleSubmit` sin try/catch (línea 53-98):** El `await mutateAsync()` lanza pero nada lo captura. El toast de error del hook `onError` sí se dispara, pero el estado `uploading` puede quedar inconsistente si el upload de PDF sí fue exitoso.

2. **Sin feedback visual del error FK:** El toast genérico dice "No se pudo guardar la evaluación" pero no explica que es un problema de compatibilidad de tabla.

3. **Upload PDF exitoso pero insert falla:** El usuario ve que el PDF se subió (progreso completo) y asume que todo está bien, pero el registro en BD falla después.

## Plan de corrección

### 1. Migración SQL — Flexibilizar FK para soportar ambas tablas

Eliminar la FK actual y reemplazarla con un CHECK constraint que valide que el `candidato_id` exista en **cualquiera** de las dos tablas:

```sql
-- Eliminar FK restrictiva
ALTER TABLE evaluaciones_midot
  DROP CONSTRAINT evaluaciones_midot_candidato_id_fkey;

-- Crear función de validación dual
CREATE OR REPLACE FUNCTION check_candidato_exists(cid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM candidatos_custodios WHERE id = cid
    UNION ALL
    SELECT 1 FROM candidatos_armados WHERE id = cid
  );
$$;

-- Agregar CHECK constraint
ALTER TABLE evaluaciones_midot
  ADD CONSTRAINT evaluaciones_midot_candidato_check
  CHECK (check_candidato_exists(candidato_id));
```

### 2. Frontend — Agregar try/catch en handleSubmit

En `MidotResultForm.tsx`, envolver el submit en try/catch para prevenir estados inconsistentes y dar feedback claro:

```typescript
const handleSubmit = async () => {
  try {
    // ... upload PDF logic (ya existente) ...
    
    if (isEditMode) {
      await updateMidot.mutateAsync({ ... });
    } else {
      await createMidot.mutateAsync({ ... });
    }
    onSuccess?.();
  } catch (error) {
    // El hook ya muestra toast, pero aseguramos estado limpio
    setUploading(false);
  }
};
```

### Archivos impactados

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Drop FK + crear función + CHECK constraint |
| `src/components/recruitment/midot/MidotResultForm.tsx` | try/catch en handleSubmit |

