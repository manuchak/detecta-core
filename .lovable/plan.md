

# Plan: Agregar Timeout para img.onload + Logging Más Granular (v6)

## Diagnóstico Confirmado

El problema está en `imageUtils.ts` donde `img.onload` nunca se dispara en algunos dispositivos Android. El archivo se recibe correctamente (aparece toast "Procesando") pero la imagen nunca termina de cargar en el elemento `<img>`, causando que la Promise se quede colgada.

**Causa raíz**: El timeout de 10 segundos solo cubre el caso donde `toBlob()` falla, pero NO cubre el caso donde `img.onload` nunca se ejecuta.

## Solución

### 1. Agregar Timeout a la Carga de Imagen (imageUtils.ts)

Mover el timeout para cubrir TODO el proceso, incluyendo la carga de la imagen:

```typescript
export async function compressImage(
  file: File | Blob,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  
  console.log(`[ImageUtils] v6 - Iniciando compresión: ${(originalSize / 1024).toFixed(0)}KB`);

  // Timeout para TODA la operación (incluyendo carga de imagen)
  let timeoutId: NodeJS.Timeout;
  
  const compressionPromise = new Promise<CompressionResult>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    // v6: Timeout de 8s para img.onload específicamente
    const imgLoadTimeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      console.error('[ImageUtils] v6 - TIMEOUT: Imagen no cargó en 8 segundos');
      reject(new Error('Timeout: La imagen no se pudo cargar'));
    }, 8000);

    img.onload = () => {
      clearTimeout(imgLoadTimeout); // Limpiar timeout de carga
      URL.revokeObjectURL(url);
      console.log('[ImageUtils] v6 - Imagen cargada correctamente');
      
      // ... resto del código de compresión
    };

    img.onerror = (e) => {
      clearTimeout(imgLoadTimeout);
      URL.revokeObjectURL(url);
      console.error('[ImageUtils] v6 - Error al cargar imagen:', e);
      reject(new Error('Error al cargar imagen para compresión'));
    };

    img.src = url;
  });

  return compressionPromise;
}
```

### 2. Agregar Logging Antes de Compresión (DocumentUploadStep.tsx)

Mostrar toast ANTES de iniciar la compresión para confirmar que el flujo llega ahí:

```typescript
// Línea ~155
if (selectedFile.type.startsWith('image/') && needsCompression(selectedFile)) {
  setIsCompressing(true);
  
  // v6: Toast MÁS VISIBLE antes de compresión
  toast.info(`📷 Cargando imagen (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB)...`, { 
    duration: 5000 
  });
  console.log(`[DocumentUpload] v6 - Tipo de archivo: "${selectedFile.type}", Tamaño: ${selectedFile.size}`);
  
  try {
    const { blob, compressionRatio } = await compressImage(selectedFile, { ... });
    // ...
  } catch (compressionError) {
    console.error(`[DocumentUpload] v6 - Error completo:`, compressionError);
    toast.error('Error al procesar imagen', {
      description: compressionError instanceof Error ? compressionError.message : 'Error desconocido',
      duration: 5000
    });
    // Usar archivo original como fallback
    fileToUse = selectedFile;
  }
}
```

### 3. Fallback: Si la Compresión Falla, Usar Original

En lugar de quedarse colgado, usar el archivo original:

```typescript
// En el catch de compressImage
} catch (compressionError) {
  console.error(`[DocumentUpload] v6 - Compresión falló:`, compressionError);
  
  // v6: SIEMPRE usar archivo original como fallback
  toast.warning('Usando foto sin comprimir', { duration: 3000 });
  fileToUse = selectedFile;
  
  setIsCompressing(false);
}

// El preview se crea FUERA del try/catch de compresión
// Esto garantiza que siempre se muestre algo
```

## Archivos a Modificar

| Archivo | Cambio | 
|---------|--------|
| `src/lib/imageUtils.ts` | Agregar timeout de 8s para `img.onload` |
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Mejorar logging y asegurar fallback a original |

## Flujo Esperado v6

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Usuario toma foto → Toast "Procesando: IMG_001.jpg"                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Toast "📷 Cargando imagen (2.5MB)..."                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐    ┌─────────────────────────────────┐
    │ img.onload dispara < 8s   │    │ TIMEOUT: img.onload no dispara  │
    │ → Compresión inicia       │    │ → Toast "Usando foto sin        │
    │ → Preview aparece ✓       │    │   comprimir"                    │
    └───────────────────────────┘    │ → Usa archivo original          │
                                     │ → Preview aparece ✓             │
                                     └─────────────────────────────────┘
```

## Verificación

1. Refrescar app y confirmar badge **"v6"**
2. Tomar foto
3. Verificar secuencia de toasts:
   - "Procesando: [nombre]"
   - "📷 Cargando imagen (X.XMB)..."
   - "Imagen comprimida ✓" O "Usando foto sin comprimir"
   - "Foto lista ✓" con preview visible

## Sección Técnica

### Por qué img.onload puede no dispararse

1. **Blob URL inválida**: Algunos Android WebViews no manejan bien los blobs de la cámara
2. **EXIF corrupto**: Metadatos de orientación mal formados pueden causar que la imagen no cargue
3. **Formato no soportado**: HEIC/HEIF de cámaras nuevas no son soportados en todos los WebViews
4. **Memory pressure**: Android puede pausar la carga de imagen si hay poca memoria

### Por qué el fallback es seguro

Usar el archivo original sin comprimir es preferible a no mostrar nada porque:
1. El upload a Supabase Storage maneja archivos de cualquier tamaño (hasta el límite del bucket)
2. Una foto de 3-5MB sube en segundos con buena conexión
3. Es mejor tener la foto sin comprimir que no tenerla

