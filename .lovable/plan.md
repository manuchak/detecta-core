

# Plan v9: Diagnóstico Final y Solución Definitiva

## Análisis como Product Owner/QA

### Lo que SÍ funciona:
- Toast "📷 Abriendo cámara..." aparece
- Toast "Foto recibida, procesando..." aparece  
- Toast "Foto lista ✓" aparece
- Esto confirma que el archivo SE RECIBE correctamente

### Lo que NO funciona:
- La imagen NO se muestra en pantalla
- Ni `onLoad` ni `onError` del `<img>` se disparan
- El fallback visual tampoco aparece

### Causa raíz identificada:

**El problema es el uso de `URL.createObjectURL()` (blob URLs) en Android WebViews.**

Cuando ni `onLoad` ni `onError` se disparan, significa que el navegador **ignora silenciosamente** el blob URL. Esto es un bug conocido en ciertos Android WebViews donde:

1. El blob URL se crea correctamente (`blob:https://...`)
2. Se asigna al `<img src>`
3. El WebView no reconoce el protocolo `blob:` o lo bloquea por seguridad
4. No dispara ningún evento, simplemente no carga nada

### Por qué PhotoSlot funciona pero DocumentUploadStep no:

| Aspecto | PhotoSlot | DocumentUploadStep |
|---------|-----------|-------------------|
| **Origen del preview** | IndexedDB (persistente) | Estado local (volátil) |
| **Flujo** | Foto → Padre procesa → Guarda en IDB → Carga desde IDB | Foto → Blob URL directo |
| **Dependencia de blob URL** | Solo temporalmente durante guardado | 100% para el preview |

## Solución: Usar FileReader + Base64 (Data URL)

En lugar de:
```typescript
const url = URL.createObjectURL(selectedFile);
setPreview(url); // blob:https://...
```

Usar:
```typescript
const reader = new FileReader();
reader.onload = (e) => {
  const dataUrl = e.target?.result as string;
  setPreview(dataUrl); // data:image/jpeg;base64,/9j/4AAQ...
};
reader.readAsDataURL(selectedFile);
```

### Por qué Base64 es más confiable:

1. **Compatibilidad universal**: Todos los navegadores/WebViews soportan data URLs
2. **No depende de memoria**: El string base64 es autocontenido
3. **Sin bloqueo de seguridad**: No usa protocolo `blob:` que algunos WebViews bloquean
4. **React-friendly**: Es un string normal que React maneja sin problemas

### Desventajas (aceptables):

- Más lento para imágenes grandes (~1-2 segundos extra)
- Usa ~33% más memoria que blob URL
- Para fotos de 2-5MB es perfectamente manejable

## Cambios en DocumentUploadStep.tsx

### 1. Nueva función para convertir File a base64:

```typescript
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader no devolvió string'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};
```

### 2. Modificar processFile:

```typescript
const processFile = useCallback(async (selectedFile: File) => {
  console.log(`[DocumentUpload] v9 - Archivo recibido:`, {
    name: selectedFile.name,
    size: selectedFile.size,
    type: selectedFile.type
  });

  toast.info('Foto recibida, procesando...', { duration: 2000 });

  try {
    // v9: Usar base64 en lugar de blob URL
    console.log(`[DocumentUpload] v9 - Convirtiendo a base64...`);
    const dataUrl = await fileToBase64(selectedFile);
    
    console.log(`[DocumentUpload] v9 - Base64 creado: ${dataUrl.substring(0, 50)}...`);
    
    setImageLoadFailed(false);
    setFile(selectedFile);
    setPreview(dataUrl);
    
    toast.success('Foto lista ✓', { duration: 2000 });
    console.log(`[DocumentUpload] v9 - Estado actualizado con base64`);
    
  } catch (error) {
    console.error(`[DocumentUpload] v9 - Error en FileReader:`, error);
    toast.error('Error al procesar la foto');
    setUploadStatus('error');
    setErrorType('generic');
    setErrorMessage('No se pudo leer la imagen');
  }
}, []);
```

### 3. Eliminar cleanup de blob URL (ya no es necesario):

El `useEffect` que limpia blob URLs ya no es necesario para base64, pero lo podemos dejar por seguridad para casos mixtos.

### 4. Mantener los handlers de diagnóstico:

```typescript
<img 
  src={preview} 
  alt="Preview"
  className={`w-full h-full object-cover ${imageLoadFailed ? 'hidden' : ''}`}
  onLoad={() => {
    console.log(`[DocumentUpload] v9 - IMG onLoad EXITOSO`);
    toast.success('✓ Imagen visible', { duration: 1500 });
  }}
  onError={(e) => {
    console.error(`[DocumentUpload] v9 - IMG onError:`, e);
    toast.error('Error al mostrar imagen');
    setImageLoadFailed(true);
  }}
/>
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Cambiar de blob URL a base64 + mantener diagnósticos |

## Flujo Esperado v9

```text
Usuario toca "Tomar foto"
         │
         ▼
Toast: "📷 Abriendo cámara..."
         │
         ▼
Cámara nativa → Usuario toma foto
         │
         ▼
input.onchange dispara
         │
         ▼
Toast: "Foto recibida, procesando..."
         │
         ▼
FileReader.readAsDataURL() ejecutándose
         │
         ▼
reader.onload dispara con string base64
         │
         ▼
setPreview(dataUrl) con "data:image/jpeg;base64,..."
         │
         ▼
Toast: "Foto lista ✓"
         │
         ▼
React re-render → <img src="data:image/jpeg;base64,...">
         │
         ▼
img.onLoad dispara (compatible con todos los WebViews)
         │
         ▼
Toast: "✓ Imagen visible"
         │
         ▼
ÉXITO - Usuario ve la foto ✓
```

## Verificación

1. Actualizar app y confirmar badge **"v9"**
2. Tomar foto
3. Verificar secuencia completa de toasts:
   - "📷 Abriendo cámara..."
   - "Foto recibida, procesando..."
   - "Foto lista ✓"
   - **"✓ Imagen visible"** (DEBE aparecer ahora)
4. Confirmar que la imagen es visible en pantalla

## Plan de Contingencia

Si base64 tampoco funciona (muy improbable), el siguiente paso sería:
1. Subir la imagen inmediatamente a Supabase Storage
2. Obtener la URL pública de Supabase
3. Mostrar el preview con la URL de Supabase

Pero esto añade latencia y requiere conexión, por lo que base64 es la mejor primera opción.

## Impacto en el Checklist

Una vez que DocumentUploadStep funcione con base64, este patrón se puede replicar a otros componentes si es necesario. Sin embargo, PhotoSlot ya funciona porque usa un flujo diferente (IndexedDB), así que no necesita cambios.

