

## Fix: Falso Positivo "Email ya registrado" en Registro de Custodios

### Problema diagnosticado

El custodio **Ignacio Villegas Sanchez** (nashcrash230@gmail.com) no puede registrarse. La edge function `create-custodian-account` retorna 400.

**Causa raiz**: En la linea 60-64, se usa `listUsers` con un parametro `filter` que NO funciona en la GoTrue Admin API de Supabase:

```typescript
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
  filter: `email.eq.${email}`,  // <-- NO es syntax valida de GoTrue
  page: 1,
  perPage: 1
});
```

El filtro es ignorado silenciosamente, y `listUsers` retorna el primer usuario de la base de datos (cualquier usuario). Como hay 51 usuarios, `existingUsers.users.length > 0` siempre es `true`, y TODOS los registros nuevos son rechazados con "Email ya registrado".

### Solucion

Reemplazar `listUsers` con el metodo correcto: `getUserByEmail`, que es un lookup directo por email.

```typescript
// ANTES (roto):
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
  filter: `email.eq.${email}`,
  page: 1,
  perPage: 1
});
if (existingUsers?.users?.length > 0) { ... }

// DESPUES (correcto):
const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
if (existingUser?.user) { ... }
```

Tambien agregar un log para facilitar debugging futuro:

```typescript
console.log(`[create-custodian-account] Email check: ${existingUser?.user ? 'EXISTS' : 'available'}`);
```

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/create-custodian-account/index.ts` | Reemplazar `listUsers` con `getUserByEmail` (lineas 59-68) y actualizar version a v2.3.0 |

### Resultado

- Custodios con email nuevo podran registrarse correctamente
- Custodios con email duplicado seguiran recibiendo error "Email ya registrado" (correcto)
- Se requiere redesplegar la edge function despues del cambio

