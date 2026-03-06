

# Análisis Fishbone: Recovery Link Expirado Inmediatamente

## Evidencia de los Logs

Timeline del incidente de Liliana (06 Mar 2026):

```text
20:11:06Z  generate_link → status 200 (link generado OK)
20:11:19Z  /verify desde IP 100.54.208.164 (IAD, Virginia) → LOGIN exitoso ← BOT
20:11:25Z  /verify desde IP 201.113.215.182 (QRO, México) → "One-time token not found" ← LILIANA
20:11:37Z  /verify desde IP 201.113.215.182 (QRO, México) → "One-time token not found" ← LILIANA retry
```

## Causa Raíz Identificada

```text
                              LINK EXPIRADO
                                   │
         ┌─────────────┬───────────┼───────────┬──────────────┐
         │             │           │           │              │
    GENERACIÓN     TRANSPORTE   CONSUMO    FRONTEND      SUPABASE
         │             │           │           │              │
    Link OK ✓     Compartido   ★ BOT DE    AuthLayout     Token es
    Token OK ✓    por Teams    PREFETCH    redirige si    one-time
    redirect_to   o chat       consume     hay sesión     use only
    corregido ✓   interno      el token    activa         (by design)
                       │        antes del       │
                  El chat       usuario     No detecta
                  genera        real        PASSWORD_
                  preview           │       RECOVERY
                  del link     IP 100.54    si el token
                       │       (Virginia    ya fue
                  GET a        = AWS/bot)   consumido
                  /verify          │
                  endpoint    Liliana ve
                              "otp_expired"
```

**Causa raíz:** El link de recuperación apunta directamente al endpoint `/auth/v1/verify` de Supabase, que es una petición GET. Cuando se comparte por **Teams, Slack o cualquier chat**, el bot del chat **pre-fetches la URL** para generar la vista previa del enlace. Esto **consume el token one-time** antes de que el usuario real haga clic.

La IP `100.54.208.164` (Virginia/IAD) es un bot de prefetch — NO es Liliana. La IP real de Liliana es `201.113.215.182` (Querétaro).

## Solución Definitiva

En lugar de compartir el link directo de Supabase (`/auth/v1/verify?token=...`), construir un **link indirecto** que apunte a la app:

```text
ANTES (vulnerable a prefetch):
https://supabase.co/auth/v1/verify?token=ABC&type=recovery&redirect_to=...
  → Bot hace GET → token consumido → usuario ve "expirado"

DESPUÉS (inmune a prefetch):
https://detecta-core.lovable.app/reset-password?token_hash=ABC&type=recovery
  → Bot hace GET → ve HTML estático (no consume token)
  → Usuario carga la página → JS llama verifyOtp() → sesión establecida → formulario
```

### Cambios requeridos

**1. Edge Function `generate-recovery-link/index.ts`**
- Extraer `token_hash` del `action_link` generado por Supabase
- Construir URL que apunte a la app con `token_hash` como query param
- Ya no compartir el link directo de Supabase

**2. `ResetPassword.tsx`**
- Detectar `token_hash` y `type` en query params (no en hash)
- Llamar `supabase.auth.verifyOtp({ token_hash, type: 'recovery' })` para establecer sesión
- Mantener el fallback para hash params (compatibilidad con forgot-password nativo)

**3. Sin cambios en AuthContext ni AuthLayout** — la lógica de `isRecoveryMode` ya funciona correctamente una vez que el evento `PASSWORD_RECOVERY` se emite (lo cual ocurre después de `verifyOtp`).

### Detalle técnico

Edge Function — extraer token_hash:
```typescript
const actionUrl = new URL(actionLink);
const tokenHash = actionUrl.searchParams.get('token');
const recoveryUrl = `${appOrigin}/reset-password?token_hash=${tokenHash}&type=recovery`;
```

ResetPassword — verificar token en el cliente:
```typescript
const params = new URLSearchParams(window.location.search);
const tokenHash = params.get('token_hash');
const type = params.get('type');

if (tokenHash && type === 'recovery') {
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
  if (error) { /* mostrar error específico */ }
  else { setSessionReady(true); }
}
```

Esta solución está documentada en la guía oficial de Supabase como "Option 2" para mitigar email prefetching, y es compatible con la experiencia de 1 clic que se requiere.

