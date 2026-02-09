

# Fix: column "origen" of relation "custodios_operativos" does not exist

## Causa raiz

La migracion recien creada (`20260209220940`) referencia una columna `origen` en la tabla `custodios_operativos` (lineas 125 y 147), pero esa columna **no existe** en el esquema actual. La columna `fuente` si existe.

## Cambios

### Archivo: `supabase/migrations/20260209220940_9dc02ec3-b8e8-48e0-a56d-832dfbf7e71f.sql`

Dos correcciones puntuales:

1. **Linea 125 (INSERT)**: Eliminar `origen` de la lista de columnas y su valor `'liberacion'`
   - Antes: `nombre, telefono, email, estado, disponibilidad, vehiculo_propio, zona_base, pc_custodio_id, fuente, origen`
   - Despues: `nombre, telefono, email, estado, disponibilidad, vehiculo_propio, zona_base, pc_custodio_id, fuente`
   - Valores: eliminar `'liberacion'` del final

2. **Linea 147 (UPDATE)**: Eliminar la linea `origen = 'liberacion',`

La columna `fuente` si existe y se mantiene con valor `'supply'`.

No se toca ninguna otra parte de la funcion ni del frontend.

