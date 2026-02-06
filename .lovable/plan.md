

# Plan: Mejorar Manejo de Almacenamiento en Onboarding de Documentos

## Problema Identificado

El componente `DocumentUploadStep.tsx` usado en el onboarding de custodios tiene tres deficiencias críticas:

| Problema | Impacto |
|----------|---------|
| Sin compresión de imágenes | Fotos de 2-8MB saturan memoria del dispositivo |
| Sin manejo de errores de quota | FileReader falla silenciosamente en dispositivos con poco espacio |
| Sin guía al usuario | El custodio no sabe qué hacer cuando ocurre el error |

### Comparación con Checklist (que sí funciona)

```text
Checklist (useServiceChecklist.ts):
├── Detecta si imagen > 500KB
├── Comprime a 1920x1080 calidad 0.7
├── Reduce ~80% (2MB → 400KB)
└── Maneja errores de quota

Onboarding (DocumentUploadStep.tsx):
├── Lee imagen completa sin comprimir
├── FileReader.readAsDataURL sin try/catch
├── No detecta errores de almacenamiento
└── Usuario ve error genérico
```

---

## Solución Propuesta

### 1. Agregar Compresión de Imagen

Comprimir la foto ANTES de crear el preview, igual que en el checklist:

```text
Foto capturada (3MB) → Compresión → Preview (300KB)
                         ↓
              Canvas API 1920x1080 @ 0.7 quality
```

### 2. Manejo de Errores de Storage

Detectar errores específicos de quota y mostrar mensajes útiles:

```text
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Tu dispositivo tiene poco espacio                    │
│─────────────────────────────────────────────────────────│
│                                                         │
│ Para liberar espacio puedes:                            │
│                                                         │
│ • Borrar fotos o videos que ya no necesites             │
│ • Eliminar apps que no uses                             │
│ • Limpiar la caché del navegador                        │
│                                                         │
│ Después de liberar espacio, toca "Reintentar"           │
│                                                         │
│                               [Reintentar]              │
└─────────────────────────────────────────────────────────┘
```

### 3. Detección Proactiva de Espacio

Antes de intentar capturar, verificar si hay espacio disponible usando la Storage API:

```typescript
// Verificar espacio antes de capturar
if (navigator.storage?.estimate) {
  const { usage, quota } = await navigator.storage.estimate();
  const available = quota - usage;
  if (available < 10 * 1024 * 1024) { // <10MB disponible
    // Mostrar advertencia preventiva
  }
}
```

---

## Cambios Técnicos

### Archivo: `src/components/custodian/onboarding/DocumentUploadStep.tsx`

**Modificaciones:**

1. **Importar utilidades de compresión**
```typescript
import { compressImage, needsCompression } from '@/lib/imageUtils';
```

2. **Función para verificar espacio disponible**
```typescript
async function checkStorageAvailable(): Promise<{
  available: boolean;
  spaceLeft?: number;
}> {
  if (!navigator.storage?.estimate) return { available: true };
  
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  const spaceLeft = quota - usage;
  
  return {
    available: spaceLeft > 10 * 1024 * 1024, // >10MB
    spaceLeft
  };
}
```

3. **Modificar `handleFileSelect` para comprimir**
```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;

  setUploadStatus('idle');
  setErrorMessage(null);

  try {
    // Verificar espacio disponible
    const { available, spaceLeft } = await checkStorageAvailable();
    if (!available) {
      setUploadStatus('error');
      setErrorMessage('storage_low');
      return;
    }

    // Comprimir si es necesario
    let fileToUse = selectedFile;
    if (needsCompression(selectedFile)) {
      const { blob } = await compressImage(selectedFile, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.7
      });
      fileToUse = new File([blob], selectedFile.name, { type: 'image/jpeg' });
    }

    setFile(fileToUse);
    
    // Crear preview del archivo comprimido
    const url = URL.createObjectURL(fileToUse);
    setPreview(url);
    
  } catch (error) {
    console.error('Error processing image:', error);
    if (isQuotaError(error)) {
      setErrorMessage('storage_low');
    } else {
      setErrorMessage('Error al procesar la imagen');
    }
    setUploadStatus('error');
  }
};

// Detectar errores de quota
function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || 
           error.code === 22; // Legacy quota error code
  }
  return false;
}
```

4. **Nuevo estado para tipo de error**
```typescript
type ErrorType = 'storage_low' | 'upload_failed' | 'generic';
const [errorType, setErrorType] = useState<ErrorType | null>(null);
```

5. **Componente de error específico para almacenamiento**
```typescript
// Render de error de espacio bajo
if (errorType === 'storage_low') {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              Tu dispositivo tiene poco espacio
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Para continuar, libera espacio en tu teléfono:
            </p>
            <ul className="text-sm text-amber-700 mt-2 space-y-1">
              <li>• Borra fotos o videos que ya no necesites</li>
              <li>• Elimina apps que no uses</li>
              <li>• Limpia la caché del navegador</li>
            </ul>
          </div>
        </div>
      </div>
      
      <Button onClick={handleRetry} className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        Reintentar
      </Button>
    </div>
  );
}
```

6. **Limpiar URLs de objeto al desmontar**
```typescript
useEffect(() => {
  return () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };
}, [preview]);
```

---

## Resumen de Beneficios

| Mejora | Antes | Después |
|--------|-------|---------|
| Tamaño de imagen | 2-8MB sin procesar | ~300KB comprimida |
| Error de espacio | "Error desconocido" | Mensaje con pasos claros |
| Recuperación | Usuario confundido | Botón "Reintentar" visible |
| Prevención | Ninguna | Detecta espacio bajo antes |

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Agregar compresión, manejo de errores, UI de error |

---

## Flujo de Usuario Mejorado

```text
1. Usuario toca "Tomar foto"
2. Sistema verifica espacio disponible
   └── Si <10MB: Muestra advertencia preventiva
3. Cámara captura foto (3MB)
4. Sistema comprime automáticamente (3MB → 300KB)
5. Preview se muestra instantáneamente
6. Si error de quota:
   └── Muestra instrucciones para liberar espacio
   └── Botón "Reintentar" disponible
7. Usuario completa flujo sin problemas
```

