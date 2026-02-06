

# Plan v8: Diagnóstico y Fix del Preview que No Se Muestra

## Problema Confirmado

El usuario reporta:
- ✅ Toast "Foto lista" aparece
- ❌ El preview de la imagen NO se muestra

Esto confirma que:
1. El patrón de input dinámico (v7) FUNCIONA
2. El archivo se recibe correctamente
3. `setPreview(url)` se ejecuta
4. **Pero el renderizado del `<img>` falla**

## Posibles Causas

### Causa 1: El componente se desmonta/remonta

Si el padre (`CustodianOnboarding`) se re-renderiza mientras se procesa la foto, React puede recrear el componente hijo, perdiendo el estado local (`preview`).

Evidencia: El `documents` se pasa como prop y puede cambiar cuando hay actualizaciones en el hook.

### Causa 2: El `<img>` falla silenciosamente

La imagen puede recibir el `src` pero fallar al cargar el blob. Android WebViews tienen bugs conocidos con blob URLs.

### Causa 3: Estado no persistido

React puede "batear" las actualizaciones de estado y perder alguna si hay un error asíncrono.

## Solución Propuesta

### 1. Agregar handlers `onLoad` y `onError` al `<img>`

Para confirmar si la imagen está intentando cargar o fallando silenciosamente:

```typescript
<img 
  src={preview} 
  alt="Preview"
  className="w-full h-full object-cover"
  onLoad={() => {
    console.log(`[DocumentUpload] v8 - IMG onLoad exitoso`);
    toast.success('✓ Imagen visible', { duration: 1500 });
  }}
  onError={(e) => {
    console.error(`[DocumentUpload] v8 - IMG onError:`, e);
    toast.error('Error al mostrar imagen');
  }}
/>
```

### 2. Agregar logging en el render

Para ver cuántas veces se renderiza y con qué estado:

```typescript
// Al inicio del return principal
console.log(`[DocumentUpload] v8 - RENDER:`, {
  preview: preview ? preview.substring(0, 30) + '...' : null,
  file: file?.name,
  uploadStatus
});
```

### 3. Usar `key` para estabilizar el componente (en padre)

En `CustodianOnboarding.tsx`, agregar `key` al `DocumentUploadStep`:

```jsx
<DocumentUploadStep
  key={`doc-step-${currentStepInfo.tipo}`}
  tipoDocumento={currentStepInfo.tipo}
  ...
/>
```

Esto evita que React recicle el componente incorrectamente cuando cambian los steps.

### 4. Fallback visual si la imagen falla

Si la imagen no carga, mostrar un placeholder con la información del archivo:

```typescript
{preview ? (
  <div className="relative">
    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
      <img 
        src={preview}
        onError={(e) => {
          // Mostrar fallback
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
        ...
      />
      {/* Fallback si imagen falla */}
      <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm">{file?.name}</p>
          <p className="text-xs text-muted-foreground">
            ({(file?.size / 1024 / 1024).toFixed(1)}MB)
          </p>
        </div>
      </div>
    </div>
  </div>
) : (...)}
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Agregar handlers img + logging render + fallback visual |
| `src/pages/custodian/CustodianOnboarding.tsx` | Agregar `key` prop al componente |

## Flujo de Diagnóstico v8

```text
Usuario toca "Tomar foto"
         │
         ▼
Toast: "📷 Abriendo cámara..."
         │
         ▼
Cámara toma foto → input.onchange dispara
         │
         ▼
Toast: "Foto recibida, procesando..."
         │
         ▼
setPreview(url) ejecutado
         │
         ▼
Toast: "Foto lista ✓"
         │
         ▼
React re-render → Log: "RENDER: preview=blob:..."
         │
         ├─────────────────────────────────┐
         ▼                                 ▼
IMG onLoad dispara                   IMG onError dispara
Toast: "✓ Imagen visible"            Toast: "Error al mostrar imagen"
         │                                 │
         ▼                                 ▼
    ÉXITO ✓                          Mostrar fallback visual
```

## Verificación

1. Actualizar app y confirmar badge **"v8"**
2. Tomar foto
3. Verificar secuencia de toasts:
   - "📷 Abriendo cámara..."
   - "Foto recibida, procesando..."
   - "Foto lista ✓"
   - **"✓ Imagen visible"** (nuevo) O **"Error al mostrar imagen"** (nuevo)
4. Si aparece "Error al mostrar imagen", el fallback visual debe mostrar el nombre del archivo

## Sección Técnica

### Por qué blob URLs pueden fallar en Android

1. **Garbage Collection prematura**: Si el blob original se recolecta antes de que la imagen cargue
2. **URL revocada**: Si accidentalmente se llama `URL.revokeObjectURL` antes del render
3. **WebView bug**: Algunos Android WebViews no soportan blob URLs en tags `<img>`
4. **Tamaño excesivo**: Blobs muy grandes (>10MB) pueden fallar en algunos dispositivos

### Plan B: Si blob URLs no funcionan

Usar `FileReader.readAsDataURL()` en lugar de `URL.createObjectURL()`:

```typescript
const reader = new FileReader();
reader.onload = (e) => {
  const dataUrl = e.target?.result as string;
  setPreview(dataUrl); // data:image/jpeg;base64,/9j/4AAQ...
};
reader.readAsDataURL(selectedFile);
```

Las data URLs son más compatibles pero más lentas y usan más memoria.

