

# Plan: Dar acceso completo al rol `customer_success` en el módulo CS

## Diagnóstico

El rol `customer_success` **ya tiene acceso** a la ruta `/customer-success` (está en `allowedRoles` de `App.tsx`) y las 6 pestañas se muestran sin filtro de rol. Sin embargo, hay 3 gaps que pueden causar problemas:

1. **`AuthContext.tsx`**: El rol cae en el `default` case de `getPermissionsForRole` → `canViewDashboard: false`. Aunque el módulo CS no usa este flag, otros componentes compartidos sí podrían.

2. **`useUnifiedAuth.ts`**: El tipo `UserRole` no incluye `customer_success` y no tiene entrada en `ROLE_PERMISSIONS`.

3. **`useStableAuth.ts`**: Mismo problema — falta el rol en el mapeo de permisos.

4. **Base de datos `role_permissions`**: El rol tiene **0 entradas** en la tabla. Si algún componente futuro usa `usePermissions()` para validar acceso a tabs CS, todo se bloqueará.

## Cambios

### 1. `src/contexts/AuthContext.tsx`
Agregar case `'customer_success'` en `getPermissionsForRole` con permisos apropiados:
- `canViewLeads: true` (necesita ver clientes)
- `canEditLeads: false`
- `canAssignLeads: false`
- `canManageUsers: false`
- `canViewDashboard: true`

### 2. `src/hooks/useUnifiedAuth.ts`
- Agregar `'customer_success'` al tipo `UserRole`
- Agregar entrada en `ROLE_PERMISSIONS`

### 3. `src/hooks/useStableAuth.ts`
- Agregar `'customer_success'` al tipo y al `PERMISSIONS_MAP`

### 4. Base de datos: insertar permisos en `role_permissions`
Insertar entradas para el rol `customer_success` con acceso a las páginas y features relevantes del módulo CS (dashboard, analytics, metrics).

| Archivo | Cambio |
|---|---|
| `src/contexts/AuthContext.tsx` | Agregar case `customer_success` |
| `src/hooks/useUnifiedAuth.ts` | Agregar al tipo y mapa |
| `src/hooks/useStableAuth.ts` | Agregar al tipo y mapa |
| DB migration | Insertar `role_permissions` para `customer_success` |

