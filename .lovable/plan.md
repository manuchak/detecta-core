

# Fix: Error "column telefono of relation pc_custodios does not exist"

## Causa raiz

Existen **dos versiones** de la funcion `liberar_custodio_a_planeacion_v2` en la base de datos con firmas diferentes:

| Version | Parametros | Columna usada |
|---------|-----------|---------------|
| Migration `174401` (vieja) | 3 params: `(uuid, uuid, boolean)` | `telefono` (INCORRECTO) |
| Migration `194620` (nueva) | 2 params: `(uuid, uuid)` | `tel` (correcto) |

El frontend llama con **3 parametros** (`p_custodio_liberacion_id`, `p_aprobado_por`, `p_forzar_liberacion`), asi que PostgreSQL resuelve a la version vieja con la firma de 3 parametros, que todavia usa `telefono` — una columna que no existe en `pc_custodios` (la correcta es `tel`).

## Solucion

Crear una nueva migracion que:

1. Haga `DROP FUNCTION` de ambas versiones (2 y 3 parametros)
2. Recree **una sola version** con los 3 parametros (`p_forzar_liberacion boolean DEFAULT false`) usando la columna correcta `tel`
3. Otorgue permisos a `authenticated`

## Detalle tecnico

### Nueva migracion SQL

```text
-- Drop both overloads to clean up
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid);
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean);

-- Recreate single version with 3 params and correct column name 'tel'
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion_v2(
  p_custodio_liberacion_id UUID,
  p_aprobado_por UUID,
  p_forzar_liberacion BOOLEAN DEFAULT false
)
RETURNS JSONB
...
-- Key fix in section 3 (pc_custodios):
--   INSERT: usar 'tel' en vez de 'telefono'  
--   UPDATE: usar 'tel' en vez de 'telefono'
...
```

Las lineas especificas a corregir (tomadas de la migracion `194620` que ya tiene la logica correcta):

- Linea INSERT: `nombre, email, tel, estado, vehiculo_propio`
- Linea UPDATE: `tel = COALESCE(v_candidato_telefono, tel)`

### Sin cambios en el frontend

`useCustodioLiberacion.ts` ya pasa los 3 parametros correctamente. Solo se necesita la correccion en la funcion SQL.

## Archivos a modificar

- **Nuevo archivo**: `supabase/migrations/[timestamp].sql` con el DROP + CREATE corregido

