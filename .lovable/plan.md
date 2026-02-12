

## Fix: Confirmar email en rescue path del edge function

### Problema

En `create-custodian-account/index.ts`, la **rescue path** (cuando un usuario ya existe y se le asigna rol custodio) actualiza la contrasena pero NO confirma el email:

```typescript
// Linea actual (~linea 104)
await supabaseAdmin.auth.admin.updateUserById(userId, { password });
```

Usuarios que se registraron por signup generico tienen `email_confirmed_at = null`. La rescue path les da rol custodio y nueva contrasena, pero Supabase sigue rechazando el login porque el email no esta confirmado.

### Solucion

**Archivo: `supabase/functions/create-custodian-account/index.ts`**

1. Cambiar la linea de updateUserById en la rescue path para incluir confirmacion de email:

```typescript
await supabaseAdmin.auth.admin.updateUserById(userId, { 
  password, 
  email_confirm: true 
});
```

2. Actualizar el VERSION string a `v3.2.0` para trazabilidad.

Es un cambio de 2 lineas. Con esto, cualquier usuario rescatado quedara con email confirmado y podra hacer login inmediatamente.

### Accion inmediata (manual)

Ejecutar en SQL Editor para desbloquear a Silviano ahora:

```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE id = 'f199e6c3-3bc0-4479-b01c-221a9694407a';
```

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `supabase/functions/create-custodian-account/index.ts` | Agregar `email_confirm: true` en rescue path + bump version |

