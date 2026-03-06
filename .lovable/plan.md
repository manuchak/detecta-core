

# Análisis de Bugs: Flujo de Recovery Link

## Problema observado
Liliana recibe un link de recuperación, lo abre, y ve "Enlace inválido" con error `otp_expired` en la URL. Incluso si el link fuera válido, el flujo tiene bugs estructurales que impiden que funcione.

## Bugs identificados

### Bug 1 (CRÍTICO): AuthLayout redirige al usuario antes de que pueda cambiar contraseña
**Archivo:** `src/layouts/AuthLayout.tsx`, línea 32-35

Cuando un recovery link es válido, Supabase establece una sesión automáticamente. El `AuthContext.onAuthStateChange` detecta el `SIGNED_IN`, asigna `user` y `userRole`. `AuthLayout` envuelve la ruta `/reset-password` y tiene esta lógica:

```
if (user && userRole) {
  return <Navigate to={target} replace />;  // ← Redirige al dashboard
}
```

Resultado: el usuario nunca ve el formulario de nueva contraseña. Es redirigido al dashboard con la sesión temporal de recovery.

### Bug 2: No se detecta el evento PASSWORD_RECOVERY
**Archivo:** `src/contexts/AuthContext.tsx`

Supabase emite un evento `PASSWORD_RECOVERY` en `onAuthStateChange` cuando se usa un recovery link. El AuthContext no lo distingue de un login normal. No hay lógica para marcar que el usuario está en modo "recovery" y necesita cambiar su contraseña antes de navegar.

### Bug 3: Errores del hash no se parsean correctamente
**Archivo:** `src/pages/Auth/ResetPassword.tsx`, líneas 26-51

La página solo busca `access_token` y `type=recovery` en el hash. Cuando Supabase redirige con error (`#error=access_denied&error_code=otp_expired`), no parsea estos campos y muestra un mensaje genérico "Enlace inválido" sin explicar que el link **expiró**.

### Bug 4: Después de cambiar contraseña, cierra sesión innecesariamente
**Archivo:** `src/pages/Auth/ResetPassword.tsx`, líneas 112-116

Después de actualizar la contraseña exitosamente, el código hace `signOut()` y redirige al login. La expectativa del usuario es quedar logueado y entrar al sistema directamente.

## Solución propuesta

### 1. Agregar estado `isRecoveryMode` al AuthContext
- Detectar el evento `PASSWORD_RECOVERY` en `onAuthStateChange`
- Exponer `isRecoveryMode` y `clearRecoveryMode()` en el contexto
- Cuando `isRecoveryMode = true`, no mostrar toast de bienvenida

### 2. AuthLayout: no redirigir si está en recovery mode
- Si `isRecoveryMode` es `true` y la ruta actual es `/reset-password`, renderizar los children en lugar de redirigir al dashboard

### 3. ResetPassword: parsear errores del hash
- Detectar `error`, `error_code` y `error_description` del hash fragment
- Mostrar mensajes específicos: "El enlace ha expirado" vs "Enlace inválido"
- Usar `onAuthStateChange` para detectar `PASSWORD_RECOVERY` y marcar `sessionReady` en vez de parsear tokens manualmente

### 4. Después de cambiar contraseña, redirigir al dashboard
- Eliminar el `signOut()` post-actualización
- Llamar `clearRecoveryMode()`
- Redirigir al dashboard según el rol del usuario con `getTargetRouteForRole`

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/contexts/AuthContext.tsx` | Agregar `isRecoveryMode`, detectar `PASSWORD_RECOVERY`, exponer `clearRecoveryMode()` |
| `src/layouts/AuthLayout.tsx` | No redirigir si `isRecoveryMode && ruta === /reset-password` |
| `src/pages/Auth/ResetPassword.tsx` | Parsear errores del hash, usar recovery mode del contexto, no cerrar sesión post-update |

