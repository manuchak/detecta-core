

# Fix: Error "column 'role' does not exist" en Liberacion

## Causa Raiz

La funcion RPC `liberar_custodio_a_planeacion_v2` en la linea 27 hace:

```sql
SELECT role INTO v_user_role FROM profiles WHERE id = p_aprobado_por;
```

Pero la tabla `profiles` **no tiene columna `role`**. Los roles estan en la tabla `user_roles`.

## Solucion

Crear una migracion SQL que reemplace la funcion RPC, cambiando la linea 27 de:

```sql
SELECT role INTO v_user_role FROM profiles WHERE id = p_aprobado_por;
```

A:

```sql
SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_aprobado_por AND is_active = true LIMIT 1;
```

## Implementacion

### Archivo a crear

| Archivo | Descripcion |
|---------|-------------|
| `supabase/migrations/..._fix_liberacion_role_column.sql` | `CREATE OR REPLACE FUNCTION` con la correccion |

La migracion reemplazara la funcion completa `liberar_custodio_a_planeacion_v2` con el unico cambio en la linea que consulta el rol, apuntando a `user_roles` en lugar de `profiles`.

### Sin cambios en frontend

El hook `useCustodioLiberacion.ts` ya llama correctamente al RPC. El problema es exclusivamente en la definicion SQL de la funcion.

### Impacto

- Marbelli y cualquier usuario con rol autorizado podra liberar custodios nuevamente
- No hay cambios de logica, solo la tabla de donde se lee el rol

