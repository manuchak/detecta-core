

# Fix: Inscripción de usuarios falla por columna inexistente

## Problema

En `src/hooks/lms/useLMSAdminInscripciones.ts` linea 232, la query selecciona `role` de la tabla `profiles`:

```typescript
.select('id, email, display_name, role')
```

La columna `role` **no existe** en `profiles` (los roles estan en `user_roles`). Esto causa un error 400 que rompe toda la lista de usuarios disponibles, mostrando "No hay usuarios disponibles para inscribir".

## Corrección

Eliminar `role` del select en `useLMSUsuariosDisponibles`:

```typescript
.select('id, email, display_name')
```

Esto es suficiente porque el dialog de inscripcion solo muestra nombre y email del usuario. No necesita el rol.

### Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/lms/useLMSAdminInscripciones.ts` | Linea 232: quitar `role` del select |

