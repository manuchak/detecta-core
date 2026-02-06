

# Plan: Agregar Timeout y Logging Robusto en Compresión de Imágenes

## Diagnóstico Confirmado

El usuario reporta que ve "Procesando: [nombre]" pero luego la imagen nunca aparece. Esto confirma:

1. **El archivo SÍ se recibe** (el toast aparece en línea 131)
2. **La compresión se inicia** pero nunca termina
3. **La Promise de `compressImage` se queda colgada** - probablemente `canvas.toBlob()` no llama al callback en este Android

## Causa Raíz

En `imageUtils.ts`, la función `compressImage` usa:
```typescript
canvas.toBlob((blob) => {
  // Este callback NUNCA se llama en algunos Android
}, mimeType, quality);
```

Este es un **bug conocido en algunos navegadores Android** donde `toBlob()` falla silenciosamente sin llamar al callback ni generar error.

## Solución Propuesta

### 1. Agregar Timeout a `compressImage` (imageUtils.ts)

Envolver la Promise en un timeout de 10 segundos:

```typescript
export async function compressImage(
  file: File | Blob,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const TIMEOUT_MS = 10000; // 10 segundos máximo
  
  const compressionPromise = new Promise<CompressionResult>((resolve, reject) => {
    // ... código existente
  });
  
  // Timeout wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout: La compresión tardó demasiado'));
    }, TIMEOUT_MS);
  });
  
  return Promise.race([compressionPromise, timeoutPromise]);
}
```

### 2. Agregar Fallback: Usar toDataURL si toBlob Falla

`toDataURL` es más confiable en Android:

```typescript
// Si toBlob falla, usar toDataURL como fallback
canvas.toBlob(
  (blob) => {
    if (!blob) {
      // Fallback a toDataURL
      const dataUrl = canvas.toDataURL(mimeType, config.quality);
      const byteString = atob(dataUrl.split(',')[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const fallbackBlob = new Blob([uint8Array], { type: mimeType });
      resolve({ blob: fallbackBlob, ... });
      return;
    }
    resolve({ blob, ... });
  },
  mimeType,
  config.quality
);
```

### 3. Agregar Logging Detallado (DocumentUploadStep.tsx)

Agregar toasts y logs después de cada paso crítico:

```typescript
// Después de compresión
console.log(`[DocumentUpload] ${VERSION} - Compresión completada`);
toast.success('Imagen comprimida', { duration: 1500 });

// Después de crear preview
console.log(`[DocumentUpload] ${VERSION} - Preview creado:`, url);
toast.success('Foto lista ✓', { duration: 2000 });
```

### 4. Agregar Timeout en el Handler (Plan B)

Si la compresión tarda más de 10 segundos, mostrar error y ofrecer retry:

```typescript
const handleFileSelect = useCallback(async (e) => {
  // ... código existente
  
  const compressionTimeout = setTimeout(() => {
    if (isCompressing) {
      setIsCompressing(false);
      toast.error('La compresión tardó demasiado', {
        description: 'Intenta con una foto más pequeña',
        duration: 5000
      });
    }
  }, 12000);
  
  // ... compresión
  
  clearTimeout(compressionTimeout);
}, []);
```

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/lib/imageUtils.ts` | Agregar timeout de 10s + fallback toDataURL | Alta |
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Agregar toast después de cada paso + timeout handler | Alta |

## Flujo Esperado Post-Implementación

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Usuario toma foto → Toast "Procesando: IMG_001.jpg"                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Compresión inicia → Log: "Comprimiendo imagen: 3500KB"             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐    ┌─────────────────────────────────┐
    │ Compresión exitosa < 10s  │    │ Timeout después de 10s          │
    │ Toast: "Imagen comprimida"│    │ Error: "Compresión tardó mucho" │
    │ → Preview aparece ✓       │    │ → Intenta con toDataURL         │
    │ → Toast: "Foto lista ✓"   │    │ → Si falla: usa original        │
    └───────────────────────────┘    └─────────────────────────────────┘
```

## Verificación Post-Implementación

1. Refrescar la app en el Android de prueba
2. Ver badge **"v5"** en la pantalla
3. Tomar foto
4. Verificar secuencia de toasts:
   - "Procesando: [nombre]"
   - "Imagen comprimida" o "Timeout..."
   - "Foto lista ✓" con preview visible

## Sección Técnica

### Por qué canvas.toBlob() falla en Android

1. **Memory pressure**: Si el dispositivo tiene poca RAM, el navegador puede abortar operaciones costosas como toBlob sin generar error

2. **WebView bugs**: Algunos fabricantes (Samsung, Xiaomi) tienen WebViews con bugs conocidos en canvas

3. **Imagen corrupta**: Si la foto de la cámara tiene metadatos mal formados, el canvas puede no poder procesarla

### Por qué toDataURL es más confiable

`toDataURL` es sincrónico y no depende de callbacks asincrónicos que pueden perderse. Es más lento pero más predecible.

