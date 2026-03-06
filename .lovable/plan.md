

# Plan: Generar Link de Recuperación Manual desde el Panel de Admin

## Problema
Cuando un usuario no recibe el email de recuperación de contraseña, el admin no tiene forma de ayudarle sin acceder al dashboard de Supabase.

## Solución
Crear una edge function `generate-recovery-link` que genera un link de recuperación y lo retorna al admin para compartirlo manualmente (por WhatsApp, mensaje, etc.). Agregar un botón "Generar link de recuperación" en cada tarjeta de usuario en el RoleManager.

## Componentes

### 1. Edge Function: `generate-recovery-link`
- Recibe `{ email }` via POST
- Valida que el caller sea admin/owner (JWT + `is_admin_user_secure`)
- Usa `auth.admin.generateLink({ type: 'recovery', email })` para obtener el link
- Retorna el link en la respuesta (NO envía email — ese es el punto)
- El link generado por Supabase contiene un token válido que redirige al `/reset-password`

### 2. UI en `RoleManager.tsx` → `UserRoleCard`
- Agregar botón "Generar link de recuperación" (icono `Link`) en cada usuario activo (no archivado)
- Al hacer clic: llama a la edge function, muestra el link en un dialog copiable
- Incluir botón "Copiar link" para que el admin lo pegue en WhatsApp/mensaje
- Toast de confirmación al copiar

### 3. Nuevo componente: `RecoveryLinkDialog.tsx`
- Dialog que muestra el link generado con campo de solo lectura + botón copiar
- Nota de seguridad: "Este link expira en 1 hora. Compártelo de forma segura."

## Archivos
| Archivo | Acción |
|---|---|
| `supabase/functions/generate-recovery-link/index.ts` | Crear |
| `src/components/settings/roles/RecoveryLinkDialog.tsx` | Crear |
| `src/components/settings/roles/RoleManager.tsx` | Agregar botón + dialog |
| `supabase/config.toml` | Registrar función |

