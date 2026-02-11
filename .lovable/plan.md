
## Fix: Check constraint violation en liberacion de custodios

### Problema

La RPC `liberar_custodio_a_planeacion_v2` (linea 176) hace:

```sql
UPDATE candidatos_custodios SET estado_proceso = 'liberado' ...
```

Pero el check constraint `candidatos_custodios_estado_proceso_check` solo permite estos valores:

- `lead`, `entrevista`, `documentacion`, `aprobado`, `en_liberacion`, `activo`, `rechazado`, `inactivo`

El valor `'liberado'` NO esta en la lista, causando el error que Supply ve en pantalla.

### Solucion

Crear una nueva migracion SQL que redefine la RPC cambiando `'liberado'` por `'activo'` en la linea que actualiza `candidatos_custodios.estado_proceso`. Este es el estado correcto: cuando un custodio se libera a planeacion, pasa a estar "activo".

### Cambio especifico

En la funcion `liberar_custodio_a_planeacion_v2`, seccion 8 ("Update candidato status"):

**Antes:**
```sql
UPDATE candidatos_custodios
SET estado_proceso = 'liberado', updated_at = NOW()
WHERE id = v_lib.candidato_id;
```

**Despues:**
```sql
UPDATE candidatos_custodios
SET estado_proceso = 'activo', updated_at = NOW()
WHERE id = v_lib.candidato_id;
```

### Archivo a crear

1. **Nueva migracion SQL** - Redefinir `liberar_custodio_a_planeacion_v2` con el valor corregido

### Impacto

- Fix directo del error que Supply reporta
- No requiere cambios en frontend
- Los custodios pendientes (RIVAS, CALDERON y cualquier otro) podran liberarse correctamente
