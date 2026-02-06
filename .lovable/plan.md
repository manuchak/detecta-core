
# Plan: Resolver Error de Registro de Custodios de Raíz

## Diagnostico del Problema

### Hallazgos de la Investigacion

| Elemento | Estado | Problema |
|----------|--------|----------|
| Invitacion de Antonio | Token usado por prueba anterior | Necesita reset |
| Edge function | Funcional pero con bug de columna | `telefono` vs `phone` en profiles |
| Frontend | Mensajes de error incorrectos | Conflicto con AuthContext |
| Tabla profiles | Columna `phone` NOT NULL | Falla silenciosamente |

### Causa Raiz del Error "Error al crear la cuenta"

El mensaje "Error al crear la cuenta" viene EXCLUSIVAMENTE de `src/contexts/AuthContext.tsx` linea 369, que se usa en el flujo de registro NORMAL (`/auth/register`), NO en el flujo de custodios.

Posibles escenarios que causaron este error:
1. Antonio abrio el link de invitacion, pero antes de completar el registro, intento registrarse en la pagina normal
2. Hubo un cache de toast de un intento anterior
3. El navegador tenia una sesion anterior que disparo un error del AuthContext

---

## Problemas Tecnicos Identificados

### 1. Bug en Edge Function: Columna Incorrecta

```typescript
// ACTUAL (incorrecto)
await supabaseAdmin.from('profiles').upsert({
  telefono: telefono || null  // Columna NO existe
});

// CORRECTO
await supabaseAdmin.from('profiles').upsert({
  phone: telefono || ''  // Columna real, NOT NULL
});
```

La tabla `profiles` tiene:
- `phone` (text, NOT NULL) - no `telefono`
- Esto causa error silencioso que no falla el registro pero deja datos incompletos

### 2. Mensajes de Error Genericos

El frontend muestra errores genericos que no ayudan a diagnosticar:
- "Error de conexion" para cualquier error de fetch
- "Error al crear la cuenta" viene del AuthContext (flujo equivocado)

### 3. Token de Antonio Invalidado

Mi prueba anterior uso el token de Antonio para crear un usuario de prueba. Necesitamos:
- Eliminar el usuario test-debug
- Resetear la invitacion de Antonio

---

## Solucion Propuesta

### Cambio 1: Corregir Edge Function

**Archivo:** `supabase/functions/create-custodian-account/index.ts`

```typescript
// Cambios:
// 1. Usar columna correcta 'phone' en lugar de 'telefono'
// 2. Agregar VERSION para debugging
// 3. Mejorar mensajes de error con contexto

const VERSION = "v2.0.1";

// En el upsert de profiles:
const { error: profileErr } = await supabaseAdmin
  .from('profiles')
  .upsert({
    id: userData.user.id,
    email: email,
    display_name: nombre,
    phone: telefono || 'Sin telefono'  // Columna correcta, valor por defecto
  });

// Agregar version en respuesta para debugging:
return new Response(JSON.stringify({ 
  success: true, 
  message: "Cuenta creada exitosamente", 
  userId: userData.user.id,
  autoLogin: true,
  _version: VERSION
}), ...);
```

### Cambio 2: Mejorar Manejo de Errores en Frontend

**Archivo:** `src/pages/Auth/CustodianSignup.tsx`

```typescript
// Cambios:
// 1. Mensajes de error mas especificos
// 2. Logging mejorado para debugging
// 3. Capturar version de edge function

const { data, error } = await supabase.functions.invoke('create-custodian-account', {
  body: { email, password, nombre: name, invitationToken: token, telefono }
});

if (error) {
  console.error('[CustodianSignup] Edge function network error:', error);
  toast({
    title: 'Error de Conexion',
    description: 'No se pudo conectar con el servidor. Verifica tu conexion a internet.',
    variant: 'destructive',
  });
  return;
}

if (data?.error) {
  console.error('[CustodianSignup] Edge function returned error:', data.error);
  toast({
    title: 'Error en Registro',
    description: data.error,  // Mensaje especifico del servidor
    variant: 'destructive',
  });
  return;
}

console.log('[CustodianSignup] Success, version:', data?._version);
```

### Cambio 3: Limpiar Datos de Prueba

Ejecutar en Supabase:

```sql
-- 1. Eliminar usuario de prueba creado accidentalmente
DELETE FROM user_roles WHERE user_id = '83b5829f-c1a5-46be-a8fb-6a544ff63e73';
DELETE FROM profiles WHERE id = '83b5829f-c1a5-46be-a8fb-6a544ff63e73';
-- El usuario en auth.users se elimina via Admin API

-- 2. Resetear invitacion de Antonio
UPDATE custodian_invitations 
SET used_at = NULL, used_by = NULL 
WHERE token = 'f84cbe200ddec13fd4cf1367d6a61eb9f29ab8ed3ae7983f3d32f70b7a379461';
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/create-custodian-account/index.ts` | Corregir columna `phone`, agregar VERSION, mejorar logs |
| `src/pages/Auth/CustodianSignup.tsx` | Mensajes de error mas especificos, logging mejorado |

## Resultado Esperado

1. Antonio podra registrarse exitosamente con su token restaurado
2. Errores futuros mostraran mensajes especificos del servidor
3. Logs permitiran diagnosticar problemas rapidamente
4. Perfil de custodio se creara correctamente con telefono

## Proximos Pasos Post-Implementacion

1. Probar registro con token de Antonio
2. Verificar que el perfil se crea correctamente
3. Monitorear logs de edge function para futuros errores
