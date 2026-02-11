

## Auditoria de Rutas de Login: Flujos Administrativos vs Custodios

### Hallazgos Criticos

Se identificaron **6 mecanismos de redireccion independientes** que compiten entre si, creando multi-hops, inconsistencias y riesgo de loops 404:

```text
1. AuthLayout           → redirige usuario autenticado a /home
2. useSmartAuthRedirect → redirige post-login segun rol
3. SmartHomeRedirect    → redirige "/" segun auth
4. SmartRedirect        → redirige "/" y "/dashboard" segun rol (NO SE USA - dead code)
5. RoleBlockedRoute     → bloquea field operators de rutas admin
6. LastRouteRestorer    → restaura ultima ruta desde sessionStorage
7. useHomeData          → shouldRedirect en Home para custodios
```

### Flujo Actual: Admin Login

```text
/auth/login
  → (login exitoso)
  → useSmartAuthRedirect detecta rol admin → navigate("/home")
  → /home: ProtectedRoute ✓ → RoleBlockedRoute ✓ → Home renderiza
  ✅ OK (1 hop)
```

### Flujo Actual: Custodio Login

```text
/auth/login
  → (login exitoso)
  → useSmartAuthRedirect detecta rol custodio → navigate("/custodian")
  → /custodian: CustodianPortal verifica rol ✓ → OnboardingGuard → Dashboard
  ✅ OK en login fresco (1 hop)
```

### Problemas Detectados

**Problema 1: AuthLayout redirige TODOS los autenticados a /home**

Si un custodio ya autenticado visita `/auth/login` (por bookmark o link), `AuthLayout` lo manda a `/home` (linea 33). Luego:
- `/home` → `RoleBlockedRoute` detecta rol `custodio` → redirige a `/custodian`
- Resultado: 2 hops innecesarios (`/auth/login` → `/home` → `/custodian`)
- La redireccion deberia ser directa a `/custodian`

**Problema 2: SmartHomeRedirect renderiza Home para custodios**

Cuando un custodio autenticado visita `/`:
- `SmartHomeRedirect` renderiza `<Home />` directamente (no redirige)
- `Home` llama `useHomeData("custodio")` que retorna `shouldRedirect: "/custodian"`
- `Home` hace `<Navigate to="/custodian">` 
- Resultado: Renderiza Home innecesariamente antes de redirigir

**Problema 3: CustodianPortal sin ProtectedRoute en App.tsx**

```text
<Route path="/custodian" element={<CustodianPortal />}>
```

A diferencia de TODAS las demas rutas protegidas, `/custodian` NO esta envuelta en `<ProtectedRoute>`. El `CustodianPortal` maneja auth internamente, pero esto:
- Es inconsistente con el patron del resto de la app
- El redirect al fallar auth usa `<Navigate to="/auth/login">` pero sin preservar la ruta de retorno

**Problema 4: Conflicto LastRouteRestorer vs Role Redirects**

`LastRouteRestorer` guarda la ultima ruta en `sessionStorage`. Si un custodio estuvo en `/custodian/services` y cierra sesion, al re-loguear:
1. `useSmartAuthRedirect` → `/custodian`
2. `LastRouteRestorer` (300ms delay) → intenta restaurar `/custodian/services`
3. Potencial race condition entre ambos

**Problema 5: SmartRedirect es codigo muerto**

`SmartRedirect` en `src/components/SmartRedirect.tsx` NO se importa ni se usa en `App.tsx`. Es una version duplicada de la logica de `useSmartAuthRedirect`. Genera confusion al mantener el codigo.

**Problema 6: CustodianPortal muestra "Acceso Denegado" Y redirige simultaneamente**

En `CustodianPortal.tsx` linea 28-40, si el rol no es custodio/admin/owner:
```tsx
<div>  // Renderiza UI de "Acceso Denegado"
  <Navigate to="/" replace />  // Y TAMBIEN redirige
</div>
```
El usuario ve un flash del mensaje antes de ser redirigido. El `<Navigate>` dentro de un div con contenido es un anti-pattern.

### Plan de Correccion

**Cambio 1: AuthLayout - Redireccion inteligente por rol**

Modificar `AuthLayout.tsx` para usar `getTargetRouteForRole` en lugar de siempre redirigir a `/home`:
- Admin → `/home`
- Custodio → `/custodian`
- Instalador → `/installers/portal`
- Etc.

**Cambio 2: SmartHomeRedirect - Redireccion directa sin renderizar Home**

Modificar `SmartHomeRedirect.tsx` para redirigir con `<Navigate>` segun rol en lugar de renderizar `<Home />` que luego redirige internamente. Reutilizar `getTargetRouteForRole`.

**Cambio 3: Envolver CustodianPortal en ProtectedRoute**

En `App.tsx`, agregar `<ProtectedRoute>` al wrapper de `/custodian` para consistencia:
```tsx
<Route path="/custodian" element={
  <ProtectedRoute>
    <CustodianPortal />
  </ProtectedRoute>
}>
```
Y simplificar `CustodianPortal` para no manejar auth duplicado.

**Cambio 4: Fix CustodianPortal "Acceso Denegado" flash**

Eliminar el render de UI + Navigate simultaneo. Solo hacer `<Navigate to="/" replace />` (o al portal correcto segun rol).

**Cambio 5: Eliminar SmartRedirect (dead code)**

Borrar `src/components/SmartRedirect.tsx` ya que no se usa y duplica logica.

**Cambio 6: Centralizar getTargetRouteForRole**

Mover `getTargetRouteForRole` de `useSmartAuthRedirect.ts` a `src/constants/accessControl.ts` para que `AuthLayout`, `SmartHomeRedirect` y `useSmartAuthRedirect` compartan la misma logica.

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/constants/accessControl.ts` | Agregar `getTargetRouteForRole()` centralizado |
| `src/layouts/AuthLayout.tsx` | Redireccion inteligente por rol en lugar de siempre `/home` |
| `src/components/SmartHomeRedirect.tsx` | Redireccion directa por rol sin renderizar Home |
| `src/hooks/useSmartAuthRedirect.ts` | Importar `getTargetRouteForRole` desde accessControl |
| `src/App.tsx` | Envolver `/custodian` en `ProtectedRoute` |
| `src/pages/custodian/CustodianPortal.tsx` | Eliminar manejo duplicado de auth, fix flash de "Acceso Denegado" |
| `src/components/SmartRedirect.tsx` | **Eliminar** (dead code) |

### Resultado Esperado

- Login admin: `/auth/login` → (1 hop) → `/home`
- Login custodio: `/auth/login` → (1 hop) → `/custodian`
- Custodio ya autenticado visita `/`: → (1 hop) → `/custodian` (sin renderizar Home)
- Custodio ya autenticado visita `/auth/login`: → (1 hop) → `/custodian` (sin pasar por /home)
- Roles bloqueados no ven flash de "Acceso Denegado"
- Zero dead code de redireccion

