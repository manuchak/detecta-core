

# Plan Unificado: Gestión de Usuarios desde el Panel de Roles

## Objetivo
Permitir a admins crear cuentas pre-verificadas con rol asignado, y verificar/activar usuarios pendientes — todo desde Settings > Roles y Usuarios.

## Componentes

### 1. Edge Function: `create-staff-account`
- Recibe `{ email, nombre, rol }` via POST
- Valida que el caller sea admin/owner (JWT)
- Crea usuario con `auth.admin.createUser({ email, email_confirm: true, password: random })`
- Inserta rol en `user_roles`
- Actualiza `profiles.display_name`
- Genera link de recovery via `auth.admin.generateLink({ type: 'recovery' })` para que el usuario establezca su contraseña
- Retorna éxito o error descriptivo

### 2. UI: `CreateUserDialog.tsx` (nuevo)
- Dialog con campos: Nombre, Email, Selector de rol (usa `availableRoles` existente)
- Validación frontend (email válido, campos requeridos)
- Invoca edge function al confirmar
- Toast de éxito: "Se envió correo a [email] para establecer contraseña"

### 3. Verificación de usuarios pending en `RoleManager.tsx`
- Agregar `'pending'` y `'unverified'` a `availableRoles`
- Agregar entradas en `getRoleDisplayName`: `pending` → "Pendiente de Activación", `unverified` → "Sin Verificar"
- Agregar color en `getRoleBadgeColor`: amarillo para pending/unverified
- Para usuarios con rol `pending`/`unverified`: mostrar botón "Verificar y Activar" que llama a `verifyUserEmail` (ya existe en hook)
- Destructurar `verifyUserEmail` desde `useUserRoles` (ya expuesto, no se usa)

### 4. Integración en `RoleManager.tsx`
- Botón "Crear Usuario" junto al buscador → abre `CreateUserDialog`
- Refrescar lista al crear exitosamente

## Flujo del usuario creado
```text
Admin crea cuenta → Usuario recibe email "Establecer contraseña" → Establece contraseña → Login con rol activo
```

## Flujo de verificación manual
```text
Admin ve usuario "pending" → Click "Verificar y Activar" → Email verificado → Admin cambia rol desde selector
```

## Archivos a crear/modificar
| Archivo | Acción |
|---|---|
| `supabase/functions/create-staff-account/index.ts` | Crear |
| `src/components/settings/roles/CreateUserDialog.tsx` | Crear |
| `src/components/settings/roles/RoleManager.tsx` | Modificar: botón crear, pending visible, botón verificar |
| `supabase/config.toml` | Agregar `[functions.create-staff-account]` |

