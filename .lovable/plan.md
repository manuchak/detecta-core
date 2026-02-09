
# Fix: "Error de Conexión" Falso en Registro de Custodio

## Diagnostico

El usuario `daniela.castaneda@detectasecurity.io` **ya existe** en la base de datos (creada 2025-09-30). La edge function correctamente retorna HTTP 400 con el mensaje "Email ya registrado", pero el cliente muestra "Error de Conexion" en vez del mensaje real.

**Causa raiz**: `supabase.functions.invoke()` trata cualquier respuesta HTTP no-2xx como un `error`. El codigo en `CustodianSignup.tsx` linea 140 asume que TODO error = problema de red, sin intentar leer el mensaje real de la respuesta.

Los logs confirman: 7 intentos, TODOS retornaron HTTP 400 en ~600ms (no timeout, no red).

## Cambios

### 1. `src/pages/Auth/CustodianSignup.tsx` - Manejo correcto de errores

Modificar el bloque `if (error)` (lineas 140-148) para:
- Intentar extraer el mensaje de error del contexto de la respuesta (el objeto `error` de `invoke` puede contener `context` con la respuesta JSON)
- Solo mostrar "Error de Conexion" como ultimo recurso si realmente no hay datos de respuesta
- Agregar un `useRef` para prevenir clicks multiples (el usuario envio 7 requests en 2 minutos)

```text
// Antes (lineas 140-148):
if (error) {
  console.error('[CustodianSignup] Edge function network error');
  toast({
    title: 'Error de Conexión',
    description: 'No se pudo conectar con el servidor...',
    variant: 'destructive',
  });
  return;
}

// Despues:
if (error) {
  // supabase.functions.invoke returns error for non-2xx responses
  // Try to extract the actual error message from the response context
  let errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  let errorTitle = 'Error de Conexión';

  try {
    // The error.context contains the Response object for non-2xx
    if (error.context?.body) {
      const reader = error.context.body.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      const parsed = JSON.parse(text);
      if (parsed?.error) {
        errorMessage = parsed.error;
        errorTitle = 'Error en Registro';
      }
    }
  } catch {
    // If parsing fails, keep the default connection error message
  }

  console.error('[CustodianSignup] Edge function error:', errorTitle);
  toast({ title: errorTitle, description: errorMessage, variant: 'destructive' });
  return;
}
```

### 2. `src/pages/Auth/CustodianSignup.tsx` - Prevenir clicks multiples

Agregar un `useRef` para bloquear envios duplicados mientras una peticion esta en curso:

```text
const submittingRef = useRef(false);

// Al inicio de handleSubmit:
if (submittingRef.current) return;
submittingRef.current = true;

// En el finally:
submittingRef.current = false;
```

### 3. `supabase/functions/create-custodian-account/index.ts` - Optimizar busqueda de usuario existente

Reemplazar `listUsers()` (linea 60) que carga TODOS los usuarios, por una busqueda directa por email:

```text
// Antes (lineas 59-64):
const { data: users } = await supabaseAdmin.auth.admin.listUsers();
if (users?.users?.some(u => u.email === email)) { ... }

// Despues:
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
  filter: `email.eq.${email}`,
  page: 1,
  perPage: 1
});
if (existingUsers?.users?.length > 0) { ... }
```

## Resultado

- El custodio vera **"Email ya registrado"** en vez de "Error de Conexion"
- Se previenen multiples envios al servidor con el mismo click
- La busqueda de usuarios existentes es mas eficiente
