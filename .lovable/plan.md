

## Diagnostico y Correccion: Custodio Bloqueado con Rol "pending"

### Causa Raiz

El custodio **Sergio Montano Gonzalez** (xmen_wolworian@hotmail.com) se registro a traves de la ruta generica `/auth/register` en lugar del enlace de invitacion `/auth/registro-custodio?token=...`. Esto causo:

1. El trigger `handle_email_confirmation` le asigno el rol `pending` (comportamiento normal para registro generico)
2. La edge function `create-custodian-account` nunca se ejecuto, por lo que el rol `custodio` nunca fue asignado
3. La invitacion quedo sin usar (`used_at: null`, `used_by: null`)
4. Hoy se genero una segunda invitacion, pero al intentar usarla, la edge function rechaza con "Email ya registrado"

**Evidencia en BD:**
- `user_roles`: Solo tiene `pending` (sin `custodio`)
- `custodian_invitations`: Dos invitaciones, ambas con `used_at: null`

### Problemas Estructurales Identificados

| # | Problema | Impacto |
|---|---------|---------|
| 1 | La ruta `/auth/register` no bloquea emails con invitaciones pendientes | Custodios pueden registrarse por la ruta equivocada |
| 2 | `getTargetRouteForRole('pending')` redirige a `/home` | Usuarios pending ven "Acceso Restringido" en todas las rutas admin |
| 3 | No existe mecanismo de recuperacion cuando un custodio se registra mal | Admin debe intervenir manualmente en la BD |
| 4 | Edge function no tiene ruta de "rescate" para usuarios existentes con invitacion valida | Segunda invitacion falla con "Email ya registrado" sin solucion |

### Plan de Correccion (4 cambios)

**Cambio 1: Correccion inmediata en BD (datos del usuario afectado)**

Ejecutar manualmente en Cloud View > Run SQL (Live):

```text
-- Asignar rol custodio al usuario existente
INSERT INTO user_roles (user_id, role) 
VALUES ('b3b71e9a-3496-44fa-bf17-1334e29c8d8a', 'custodio')
ON CONFLICT (user_id, role) DO NOTHING;

-- Eliminar rol pending
DELETE FROM user_roles 
WHERE user_id = 'b3b71e9a-3496-44fa-bf17-1334e29c8d8a' AND role = 'pending';

-- Marcar invitacion como usada
UPDATE custodian_invitations 
SET used_at = NOW(), used_by = 'b3b71e9a-3496-44fa-bf17-1334e29c8d8a'
WHERE id = 'fc8644cc-7b3c-40b1-ab23-d11954dce25f';
```

**Cambio 2: Edge function - Ruta de rescate para usuarios existentes**

Modificar `create-custodian-account/index.ts` para que cuando detecte "Email ya registrado", en lugar de solo rechazar, verifique si el usuario tiene una invitacion valida y le asigne el rol `custodio`:

- Si el usuario existe Y tiene rol `pending` Y la invitacion es valida: asignar `custodio`, borrar `pending`, marcar invitacion como usada, retornar `autoLogin: true`
- Si el usuario existe Y ya tiene rol `custodio`: retornar error amigable "Ya tienes una cuenta activa, inicia sesion"

**Cambio 3: Redireccion inteligente para rol `pending`**

Modificar `getTargetRouteForRole` en `src/constants/accessControl.ts`:
- `pending` debe redirigir a `/auth/pending-activation` en lugar de `/home`
- Esto previene que usuarios pending vean "Acceso Restringido" y les da un mensaje claro

**Cambio 4: Bloquear registro generico para emails con invitacion**

Modificar la pagina de registro generico (`SignUp`) para que al intentar registrarse con un email que tiene una invitacion pendiente, muestre un mensaje: "Este email tiene una invitacion de custodio pendiente. Usa el enlace de invitacion que te enviaron."

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/create-custodian-account/index.ts` | Agregar logica de rescate para usuarios existentes con invitacion valida |
| `src/constants/accessControl.ts` | `pending` redirige a `/auth/pending-activation` |
| `src/pages/Auth/SignUp.tsx` | Validar email contra invitaciones pendientes antes de permitir registro |

### Resultado Esperado

1. Sergio Montano puede acceder al portal custodio inmediatamente (despues del fix manual en BD)
2. Futuros custodios que se registren por la ruta equivocada pueden recuperarse usando su invitacion
3. Usuarios con rol `pending` ven una pagina informativa en lugar de "Acceso Restringido"
4. El registro generico advierte a usuarios con invitaciones pendientes
