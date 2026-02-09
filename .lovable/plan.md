

# Fix: column "telefono" of relation "pc_custodios" does not exist

## Problema

La funcion RPC `liberar_custodio_a_planeacion_v2` usa la columna `telefono` al insertar/actualizar en la tabla `pc_custodios`, pero esa tabla tiene la columna nombrada `tel`.

Lineas afectadas en la migracion mas reciente:
- **Linea 90** (INSERT): `nombre, email, telefono, estado, vehiculo_propio`
- **Linea 100** (UPDATE): `telefono = COALESCE(v_candidato_telefono, telefono)`

## Solucion

Crear una nueva migracion SQL que reemplaza la funcion RPC corrigiendo `telefono` por `tel` en las dos referencias a `pc_custodios`. El resto de la funcion permanece igual (la tabla `custodios_operativos` si usa `telefono` correctamente).

### Cambios especificos dentro de la funcion:

```text
-- INSERT (linea 90):
-- Antes:
INSERT INTO pc_custodios (nombre, email, telefono, estado, vehiculo_propio)
-- Despues:
INSERT INTO pc_custodios (nombre, email, tel, estado, vehiculo_propio)

-- UPDATE (linea 100):
-- Antes:
telefono = COALESCE(v_candidato_telefono, telefono),
-- Despues:
tel = COALESCE(v_candidato_telefono, tel),
```

### Archivo a crear

Una nueva migracion SQL que ejecuta `CREATE OR REPLACE FUNCTION` con la version corregida de `liberar_custodio_a_planeacion_v2`, identica a la actual pero con `tel` en lugar de `telefono` para la tabla `pc_custodios`.

