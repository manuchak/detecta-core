

## Plan: Mejorar catalogo de errores de autenticacion

### Problema raiz encontrado

Los logs de la edge function revelan el error real:

```
TypeError: supabaseAdmin.auth.admin.getUserByEmail is not a function
```

La funcion `getUserByEmail` no existe en la version de `@supabase/supabase-js@2` usada en el edge function. Esto causa que TODOS los intentos de registro de custodio fallen con el generico "Error interno", que es lo que se ve en la imagen.

### Cambios propuestos

#### 1. Corregir la edge function `create-custodian-account` (causa raiz)

**Archivo:** `supabase/functions/create-custodian-account/index.ts`

- Reemplazar `supabaseAdmin.auth.admin.getUserByEmail(email)` por `supabaseAdmin.auth.admin.listUsers()` con filtro por email, que si es una funcion valida
- Mejorar el catch general para incluir el tipo de error en el mensaje, en lugar de solo "Error interno"
- Subir la version a v3.1.0

Cambio especifico en linea 60:
```typescript
// ANTES (no funciona):
const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);

// DESPUES (correcto):
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ 
  filter: { email: email } 
});
// Tomar el primer resultado si existe
// Ajustar la logica posterior para usar users[0] en lugar de existingUser.user
```

Mejorar el catch generico (linea 203-206):
```typescript
// ANTES:
return new Response(JSON.stringify({ error: "Error interno" }), ...);

// DESPUES:
const errorMsg = error instanceof Error ? error.message : "Error interno del servidor";
console.error(`[create-custodian-account] Error:`, errorMsg);
return new Response(JSON.stringify({ 
  error: "Error interno del servidor. Por favor intenta de nuevo o contacta a soporte.",
  code: "INTERNAL_ERROR"
}), ...);
```

#### 2. Mejorar catalogo de errores en el frontend del registro de custodio

**Archivo:** `src/pages/Auth/CustodianSignup.tsx`

Mejorar el manejo de errores (lineas 161-183) para mapear errores especificos a mensajes amigables:

```typescript
// Catalogo de errores para registro de custodio
const errorCatalog: Record<string, { title: string; message: string }> = {
  'Invitacion invalida o expirada': {
    title: 'Invitacion No Valida',
    message: 'Tu enlace de invitacion ha expirado o ya fue utilizado. Solicita una nueva invitacion a tu coordinador.'
  },
  'Ya tienes una cuenta activa como custodio': {
    title: 'Cuenta Existente',
    message: 'Ya tienes una cuenta de custodio activa. Usa "Iniciar sesion" con tu email y contrasena.'
  },
  'Campos requeridos faltantes': {
    title: 'Datos Incompletos',
    message: 'Por favor completa todos los campos del formulario.'
  },
  'Contrasena debe tener minimo 6 caracteres': {
    title: 'Contrasena Muy Corta',
    message: 'La contrasena debe tener al menos 6 caracteres.'
  },
  'Error interno': {
    title: 'Error del Servidor',
    message: 'Hubo un problema en el servidor. Por favor intenta de nuevo en unos minutos. Si el problema persiste, contacta a soporte.'
  },
};
```

Usar este catalogo para traducir errores del edge function a mensajes claros con acciones especificas para el usuario.

#### 3. Mejorar catalogo de errores en AuthContext (login y registro general)

**Archivo:** `src/contexts/AuthContext.tsx`

Ampliar los errores manejados en `signIn` (lineas 320-328):

| Error de Supabase | Mensaje actual | Mensaje mejorado |
|---|---|---|
| `Invalid login credentials` | Credenciales incorrectas... | Credenciales incorrectas. Verifica tu email y contrasena. Si olvidaste tu contrasena, usa "Olvide mi contrasena". |
| `Email not confirmed` | Debes confirmar tu email... | (sin cambio, ya es claro) |
| `too_many_requests` | Demasiados intentos... | Demasiados intentos. Espera 5 minutos antes de intentar de nuevo. |
| `User not found` | (no manejado) | No existe una cuenta con este email. Verifica que sea correcto o crea una nueva cuenta. |
| `user_banned` | (no manejado) | Tu cuenta ha sido suspendida. Contacta a soporte para mas informacion. |
| `network`/`fetch` | (no manejado) | Sin conexion a internet. Verifica tu conexion e intenta de nuevo. |

Ampliar errores en `signUp` (lineas 384-392):

| Error de Supabase | Mensaje actual | Mensaje mejorado |
|---|---|---|
| `User already registered` | Este email ya esta registrado... | Este email ya esta registrado. Si ya tienes cuenta, inicia sesion. Si olvidaste tu contrasena, usa "Olvide mi contrasena". |
| `Password should be at least` | (sin cambio) | (sin cambio) |
| `Signup is disabled` | (sin cambio) | (sin cambio) |
| `invalid_email` | (no manejado) | El formato del email no es valido. Verifica que este escrito correctamente. |
| `weak_password` | (no manejado) | La contrasena es muy debil. Usa al menos 6 caracteres combinando letras y numeros. |

### Resumen de archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/create-custodian-account/index.ts` | Corregir `getUserByEmail` (causa raiz del "Error interno"), mejorar catch generico |
| `src/pages/Auth/CustodianSignup.tsx` | Agregar catalogo de errores con mensajes accionables |
| `src/contexts/AuthContext.tsx` | Ampliar manejo de errores en signIn y signUp con mas casos |

### Resultado esperado

1. El registro de custodio vuelve a funcionar (se corrige el error de `getUserByEmail`)
2. Cuando ocurra un error, el usuario vera un mensaje claro con la accion que debe tomar
3. No mas mensajes genericos de "Error interno" sin guia

