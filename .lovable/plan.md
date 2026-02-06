
# Análisis Retrospectivo: Por qué fallamos 9 veces

## La Pista Clave que Ignoramos

El usuario reportó que **"siempre aparece el toast de teléfono después de tomar la foto"**. Esta pista nos indica exactamente qué está pasando.

## Línea del Tiempo del Bug

```text
1. Usuario toca "Tomar foto"
2. Se crea input dinámico + input.click()
3. Android PONE LA APP EN BACKGROUND
4. La cámara nativa se abre
5. Usuario toma foto y acepta
6. Android TRAE LA APP DE VUELTA (window focus)
         │
         ├──────────────────────────────────────────┐
         │                                          │
         ▼                                          ▼
   input.onchange dispara               TanStack Query detecta
   processFile() se ejecuta             "window focus" y hace
   setPreview(dataUrl)                  REFETCH de documents
   Toast "Foto lista"                           │
         │                                      │
         │                                      ▼
         │                              Query resuelve
         │                              (aunque nada cambió)
         │                                      │
         │                                      ▼
         │                              useEffect del padre
         │                              se dispara
         │                                      │
         │                                      ▼
         │                              Toast "📱 Teléfono: ..."
         │                                      │
         ▼                                      ▼
   Preview en estado local        PADRE SE RE-RENDERIZA
   del hijo                       con nuevos props
         │                                      │
         └──────────────────────────────────────┘
                        │
                        ▼
           ¿El hijo preserva su estado?
           NO - porque el timing del refetch
           puede causar que React descarte
           actualizaciones pendientes del hijo
```

## Causa Raíz Confirmada

### Problema 1: TanStack Query refetch en window focus

En `useCustodianDocuments.ts`, el query NO desactiva `refetchOnWindowFocus`:

```typescript
const query = useQuery({
  queryKey: ['custodian-documents', custodioTelefono],
  queryFn: async () => { ... },
  enabled: !!custodioTelefono,
  staleTime: 5 * 60 * 1000, // Solo esto
  // FALTA: refetchOnWindowFocus: false
});
```

Cuando la app regresa de la cámara, TanStack Query automáticamente hace refetch, causando re-render del padre.

### Problema 2: useEffect dispara toast en cada cambio

En `CustodianOnboarding.tsx` línea 67-79:

```typescript
useEffect(() => {
  if (profile && !profileLoading) {
    toast.info(`📱 Teléfono: ${profile.phone || 'No registrado'}`);
  }
}, [profile, documents, profileLoading, phoneValid]); // ← documents en deps!
```

Cuando `documents` cambia (por el refetch), este effect se dispara y muestra el toast de teléfono.

### Problema 3: Estado local se pierde

Aunque el `key` del componente es estable, el timing del refetch puede hacer que React descarte actualizaciones de estado del hijo si el padre se re-renderiza justo cuando el hijo está procesando `setPreview()`.

## Por qué las 9 versiones fallaron

| Versión | Enfoque | Por qué no funcionó |
|---------|---------|---------------------|
| v1-v6 | Compresión de imagen | El problema no era la compresión |
| v7 | Input dinámico | Solucionó recepción de archivo, no el rendering |
| v8 | Diagnósticos img | Reveló que img no dispara eventos |
| v9 | Base64 | Formato correcto, pero estado se pierde antes de render |

**Todas las versiones arreglaron síntomas, no la causa raíz.**

## Solución Definitiva (v10)

### Cambio 1: Desactivar refetchOnWindowFocus

En `useCustodianDocuments.ts`:

```typescript
const query = useQuery({
  queryKey: ['custodian-documents', custodioTelefono],
  queryFn: async () => { ... },
  enabled: !!custodioTelefono,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false, // NUEVO: Evitar refetch al volver de cámara
});
```

### Cambio 2: Eliminar toast de debug del teléfono

En `CustodianOnboarding.tsx`, remover o condicionar el toast:

```typescript
useEffect(() => {
  console.log('[CustodianOnboarding] Montado', { ... });
  // ELIMINAR el toast.info del teléfono - solo era para debug
  // y causa confusión al dispararse con cada cambio de documents
}, [profile, documents, profileLoading, phoneValid]);
```

### Cambio 3: Mantener Base64 y diagnósticos

El código de v9 (Base64) es correcto y debería funcionar una vez que evitemos los re-renders del padre.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCustodianDocuments.ts` | Agregar `refetchOnWindowFocus: false` |
| `src/pages/custodian/CustodianOnboarding.tsx` | Eliminar toast de teléfono del useEffect |
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Actualizar versión a v10 |

## Flujo Esperado v10

```text
Usuario toca "Tomar foto"
         │
         ▼
Toast: "📷 Abriendo cámara..."
         │
         ▼
Cámara nativa se abre (app va a background)
         │
         ▼
Usuario toma foto y acepta
         │
         ▼
App regresa a foreground (window focus)
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
   input.onchange dispara              TanStack Query NO hace
   processFile() se ejecuta            refetch (desactivado)
   fileToBase64() convierte                     │
   setPreview(dataUrl)                 Padre NO se re-renderiza
   Toast "Foto lista"                           │
         │                                      │
         ▼                              (sin cambios)
   React re-renderiza                           │
   SOLO DocumentUploadStep                      │
         │                                      │
         ▼                                      │
   img.onLoad dispara                           │
   Toast "✓ Imagen visible"                     │
         │                                      │
         ▼                                      │
   ÉXITO - Usuario ve la foto ✓                 │
         │                                      │
         └──────────────────────────────────────┘
```

## Sección Técnica

### Por qué TanStack Query hace refetch en window focus

TanStack Query asume que los datos pueden estar desactualizados cuando el usuario regresa a la app. Por defecto, hace refetch de todas las queries "stale" cuando la ventana recupera el foco.

En desktop esto es útil (el usuario puede haber editado algo en otra pestaña). En móvil causa problemas porque "abrir la cámara" cuenta como perder y recuperar el foco.

### Por qué el estado local se pierde

React 18 usa "concurrent rendering" que puede descartar actualizaciones de estado si un componente padre se re-renderiza durante una actualización del hijo. Aunque el `key` es estable, el timing exacto del refetch puede causar que `setPreview()` se ejecute pero su resultado se descarte antes de pintarse.

### Impacto en el Checklist

El hook `useCustodianDocuments` también se usa en el flujo del checklist. Agregar `refetchOnWindowFocus: false` beneficiará ambos flujos (onboarding y checklist) evitando re-renders innecesarios al usar la cámara.

## Verificación

1. Actualizar app y confirmar badge **"v10"**
2. Tomar foto
3. Verificar que **NO aparece** el toast "📱 Teléfono: ..."
4. Verificar secuencia correcta:
   - "📷 Abriendo cámara..."
   - "Foto recibida, convirtiendo..."
   - "Foto lista ✓"
   - "✓ Imagen visible"
5. Confirmar que la imagen es visible en pantalla
