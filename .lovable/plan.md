
## Fix: Error al verificar documentos - tipo de dato incorrecto

### Causa raiz

La columna `verificado_por` en la tabla `documentos_custodio` es de tipo **UUID**, pero el codigo en `DocumentacionTab.tsx` envia el string `'supply@detecta.mx'` (un email). PostgreSQL rechaza esto con error `22P02: invalid input syntax for type uuid`.

### Solucion

Cambiar el valor enviado de un email hardcodeado al UUID del usuario autenticado (`auth.uid()`), obtenido via Supabase auth.

### Cambios

**1. `src/pages/PerfilesOperativos/components/tabs/DocumentacionTab.tsx`**

- Obtener el usuario autenticado al inicio del componente usando `supabase.auth.getUser()` o el contexto de auth existente
- En `handleVerify` (linea 107), reemplazar `'supply@detecta.mx'` por el `user.id` del usuario logueado

Cambio especifico:
```typescript
// Antes:
verificadoPor: 'supply@detecta.mx' // TODO: Use actual user email

// Despues:
verificadoPor: user?.id || ''  // UUID del usuario autenticado
```

- Agregar import y uso del hook de auth (ej: `useStableAuth` o `supabase.auth.getUser()`) para obtener el ID

**2. Display del verificador (linea 196-200)**

Actualmente muestra `doc.verificado_por` directamente, que ahora sera un UUID. Se podria resolver el nombre desde profiles, pero como cambio minimo se puede mostrar "Verificado" sin el UUID crudo, o hacer un lookup ligero. Por ahora, mostrar solo "Verificado" con la fecha es suficiente para no bloquear la funcionalidad.

### Resultado

El boton "Verificar" enviara el UUID correcto y la operacion se completara sin error.
