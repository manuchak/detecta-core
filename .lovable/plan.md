
# Plan: Implementar Signup con Resend para Evitar Rate Limits

## Problema Actual

El flujo actual usa `supabase.auth.signUp()` que internamente envía emails via el sistema nativo de Supabase, el cual tiene un **rate limit de ~4 emails/hora por dirección**. Cuando los custodios reintentan el registro, este límite se excede rápidamente.

## Solución Propuesta

Replicar el patrón exitoso de `send-password-reset`: usar la Admin API de Supabase para crear usuarios y generar links, luego enviar el email via Resend (sin rate limits restrictivos).

## Arquitectura del Cambio

```text
ANTES (con rate limits):
┌─────────────┐      ┌─────────────────┐      ┌──────────────┐
│ CustodianSignup │─────▶│ supabase.auth   │─────▶│ Supabase     │
│    .tsx      │      │ .signUp()       │      │ Email (4/hr) │
└─────────────┘      └─────────────────┘      └──────────────┘

DESPUÉS (sin rate limits):
┌─────────────┐      ┌──────────────────────┐      ┌──────────────┐
│ CustodianSignup │─────▶│ Edge Function        │─────▶│ Resend       │
│    .tsx      │      │ create-custodian-    │      │ (ilimitado)  │
│             │      │ account              │      │              │
└─────────────┘      └──────────────────────┘      └──────────────┘
                              │
                              ▼
                     ┌──────────────────────┐
                     │ supabaseAdmin.auth   │
                     │ .admin.createUser()  │
                     │ .admin.generateLink()│
                     └──────────────────────┘
```

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/functions/create-custodian-account/index.ts` | Crear | Edge function que crea usuario + envía email via Resend |
| `src/pages/Auth/CustodianSignup.tsx` | Modificar | Llamar a edge function en lugar de signUp() |
| `supabase/config.toml` | Modificar | Agregar nueva función |

## Detalle de Implementación

### 1. Nueva Edge Function: `create-custodian-account`

Esta función:
1. Recibe: `email`, `password`, `nombre`, `invitationToken`
2. Valida que el token de invitación sea válido
3. Crea el usuario con `supabaseAdmin.auth.admin.createUser()` (SIN email automático)
4. Genera link de confirmación con `supabaseAdmin.auth.admin.generateLink({ type: 'signup' })`
5. Envía el email de bienvenida via Resend con el link de confirmación
6. Retorna éxito o errores específicos

**Estructura del código:**

```typescript
// Validar invitación
const { data: invitation } = await supabase
  .from('custodian_invitations')
  .select('*')
  .eq('token', invitationToken)
  .is('used_at', null)
  .gte('expires_at', new Date().toISOString())
  .single();

if (!invitation) {
  return { error: 'Invitación inválida o expirada' };
}

// Crear usuario SIN enviar email automático
const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: false, // No confirmar automáticamente
  user_metadata: {
    display_name: nombre,
    invitation_token: invitationToken,
  }
});

// Generar link de confirmación
const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
  type: 'signup',
  email,
  options: { redirectTo: `${origin}/auth/email-confirmation?invitation=${invitationToken}` }
});

// Enviar email via Resend
await resend.emails.send({
  from: "Detecta <notificaciones@detecta.app>",
  to: [email],
  subject: "📧 Confirma tu cuenta - Detecta",
  html: emailTemplate
});
```

### 2. Modificar CustodianSignup.tsx

**Cambio principal (líneas 77-110):**

```typescript
// ANTES - Usa sistema nativo de Supabase
const { data, error } = await supabase.auth.signUp({ ... });

// DESPUÉS - Llama a edge function con Resend
const { data, error } = await supabase.functions.invoke('create-custodian-account', {
  body: {
    email,
    password,
    nombre: name,
    invitationToken: token,
  }
});
```

**Manejo de errores mejorado:**

```typescript
if (error) {
  let errorMessage = 'Error al crear la cuenta';
  
  if (error.message.includes('already registered')) {
    errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
  } else if (error.message.includes('invalid invitation')) {
    errorMessage = 'La invitación no es válida o ha expirado.';
  } else if (error.message.includes('password')) {
    errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
  }
  // No más errores de rate limit!
}
```

### 3. Email Template de Confirmación

Usar el mismo estilo visual que `send-custodian-invitation` pero para confirmación:

- Header con branding de Detecta
- Mensaje de bienvenida personalizado
- Botón CTA para confirmar email
- Link de respaldo
- Advertencia de expiración (24 horas estándar de Supabase)

## Beneficios

| Aspecto | Antes | Después |
|---------|-------|---------|
| Rate limit | 4 emails/hora | Sin límite práctico |
| Control de errores | Genérico | Específico |
| Personalización email | Limitada | Total |
| Tracking | Ninguno | Resend webhooks |
| Consistencia visual | Template de Supabase | Template de marca |

## Flujo de Usuario Final

1. Custodio llena formulario de registro
2. Frontend llama a `create-custodian-account`
3. Edge function crea usuario + envía email via Resend
4. Custodio recibe email con link de confirmación
5. Al hacer clic, se confirma el email y se redirige a la app
6. Hook existente asigna rol de custodio

## Consideraciones Técnicas

- La función usa `SUPABASE_SERVICE_ROLE_KEY` (solo disponible en edge functions)
- El link generado por `generateLink()` tiene el formato estándar de Supabase
- El webhook de Resend existente puede trackear bounces/delivers
- No requiere cambios en la configuración de Supabase Auth
