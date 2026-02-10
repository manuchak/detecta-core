

## Limpieza de registros para re-registro de custodios

### Estado actual

| Email | auth.users | profiles | user_roles | Invitaciones |
|-------|-----------|----------|------------|-------------|
| jesuseloy70@gmail.com | Existe (sin confirmar) | Existe | Sin rol | 2 sin usar |
| mumartinez3345@gmail.com | No existe | No existe | N/A | 1 sin usar |

### Acciones necesarias

**1. jesuseloy70@gmail.com** - Eliminar usuario fantasma

Eliminar el usuario de `auth.users` (CASCADE eliminara automaticamente el perfil). Esto permitira que se registre correctamente via su link de invitacion.

```sql
-- Eliminar perfil (por si CASCADE no aplica en el trigger)
DELETE FROM profiles WHERE id = '1a627f0b-766f-4484-8133-e5bd2e84f6a4';
```

Ademas, eliminar el usuario de `auth.users` usando la API admin del edge function o directamente desde el dashboard de Supabase (Authentication > Users).

Conservar solo 1 de las 2 invitaciones duplicadas y eliminar la otra:
```sql
DELETE FROM custodian_invitations WHERE id = '7b9f3d37-7f22-4095-94ca-bde6bdef08cf';
```

**2. mumartinez3345@gmail.com** - Solo fix del edge function

Este email no tiene registros que limpiar. El problema es que la edge function `create-custodian-account` usa `listUsers({ filter: ... })` con un filtro que no funciona correctamente en la API de GoTrue, generando falsos positivos.

Fix en `supabase/functions/create-custodian-account/index.ts`: Reemplazar la busqueda filtrada por una busqueda directa usando `getUserByEmail`:

```typescript
// ANTES (buggy - filter no funciona bien):
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
  filter: `email.eq.${email}`,
  page: 1, perPage: 1
});
if (existingUsers?.users?.length > 0) { ... }

// DESPUES (correcto):
const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(email);
// O mejor aun, usar listUsers sin filter y buscar:
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
const exists = users.find(u => u.email === email);
```

La solucion mas robusta es intentar crear el usuario directamente y manejar el error de duplicado:

```typescript
// Eliminar la verificacion previa y dejar que createUser falle naturalmente
// si el email ya existe, Supabase retorna error especifico
const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({ ... });
if (createErr?.message?.includes('already been registered')) {
  return Response({ error: "Email ya registrado" }, ...);
}
```

**3. Eliminar invitacion duplicada de jesuseloy70**

Solo conservar la invitacion mas reciente para evitar confusion.

### Archivos a modificar

1. **SQL (datos)** - Eliminar perfil y usuario fantasma de jesuseloy70
2. **SQL (datos)** - Eliminar invitacion duplicada
3. **Dashboard Supabase** - Eliminar usuario `1a627f0b-766f-4484-8133-e5bd2e84f6a4` de Authentication > Users
4. **`supabase/functions/create-custodian-account/index.ts`** - Eliminar la verificacion previa de email duplicado y dejar que `createUser` maneje el error nativamente

### Resultado esperado

Ambos custodios podran usar su link de invitacion (`/auth/registro-custodio?token=...`) y completar el registro correctamente. El fix del edge function previene falsos positivos futuros de "Email ya registrado".
