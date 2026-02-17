
## Diagnostico y Correccion: Loop del Custodio en Checklist

### Problema Identificado

Se encontraron **2 problemas criticos** y 1 problema de UX que en conjunto causan que el custodio Carlos Octavio pierda su sesion de checklist.

---

### Problema 1 (CRITICO): `useStableAuth` resetea el rol en cada refresh de token

El hook `useStableAuth.ts` (usado por `CustodianPortal.tsx`) tiene un bug: en la funcion `updateAuthState` (linea 54-62), cada evento de auth -- incluyendo `TOKEN_REFRESHED` -- resetea `userRole` a `'unverified'` y `loading` a `true`.

```text
Token refresh ocurre
  -> useStableAuth: userRole = 'unverified', loading = true
  -> CustodianPortal linea 27: 'unverified' no esta en ['custodio','admin','owner']
  -> Navigate to="/" (REDIRECT)
  -> El custodio pierde su contexto
```

Esto explica el "loop" que experimenta el custodio. Cuando Supabase renueva el JWT (cada ~60 minutos, o en condiciones de red inestable en movil), el portal lo expulsa.

**Nota**: `AuthContext.tsx` ya tiene este fix (linea 225-227: preserva rol en TOKEN_REFRESHED), pero `useStableAuth` NO lo tiene.

**Correccion**: Modificar `useStableAuth.ts` para distinguir token refreshes de logins genuinos, igual que `AuthContext.tsx`:

```typescript
const lastUserId = useRef<string | null>(null);

const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    const isSameUser = lastUserId.current === session.user.id;
    const isTokenRefresh = event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && isSameUser);
    
    setUser(session.user);
    setSession(session);
    
    if (!isTokenRefresh) {
      // Login genuino: resolver rol
      lastUserId.current = session.user.id;
      setUserRole('unverified');
      setLoading(true);
      setTimeout(resolveRoleAndSet, 0);
    }
    // Token refresh: no tocar userRole ni loading
  } else {
    // Logout
    setUser(null);
    setSession(null);
    setUserRole('unverified');
    setLoading(false);
    lastUserId.current = null;
  }
});
```

---

### Problema 2: Sin manejo de errores en captura de fotos

En `PhotoSlot.tsx`, el handler `handleCapture` (linea 54-61) no tiene `catch`. Si `capturePhoto` falla (por ejemplo, IndexedDB lleno, error de compresion en un dispositivo Android antiguo), el error se propaga sin manejar y puede crashear el componente.

En el boton de "retomar foto" (linea 88-97), se crea un `input` dinamicamente y el `onchange` llama `handleCapture` sin try/catch. Si falla, el error es completamente silencioso en algunos navegadores o causa un crash en otros.

**Correccion**: Agregar try/catch con toast de error en:
- `PhotoSlot.handleCapture`  
- El handler inline del boton de retoma (linea 93-96)

---

### Problema 3 (UX): Custodio usando link de registro como punto de acceso

La captura de pantalla muestra que Carlos Octavio llega a `/auth/registro-custodio` y ve "Sesion Activa Detectada". Es probable que tenga guardado el link de invitacion original como su acceso al sistema.

**Correccion**: Mejorar la pantalla "Sesion Activa Detectada" en `CustodianSignup.tsx` para que el boton "Ir a mi portal de custodio" sea mas prominente y tenga prioridad visual sobre "Cerrar sesion". Tambien agregar un auto-redirect: si el usuario ya tiene rol `custodio`, redirigir automaticamente al portal despues de 3 segundos con un mensaje informativo.

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useStableAuth.ts` | Preservar rol durante token refresh (fix critico) |
| `src/components/custodian/checklist/PhotoSlot.tsx` | Agregar try/catch y toast en handlers de captura |
| `src/pages/Auth/CustodianSignup.tsx` | Auto-redirect para custodios con sesion activa |

### Secuencia

1. Fix critico en `useStableAuth.ts` (resuelve el loop)
2. Error handling en `PhotoSlot.tsx` (previene crashes futuros)
3. Mejora UX en `CustodianSignup.tsx` (previene confusion de acceso)
