

# Plan v7: Cambio de Patrón de Input + Bypass de Compresión

## Causa Raíz Confirmada

El problema NO es la compresión de imagen. El problema es el **patrón de input file usando `useRef`** que se desincroniza en Android cuando la app de cámara nativa se abre y cierra.

**Evidencia**: `PhotoSlot.tsx` usa input dinámico (`document.createElement`) y funciona perfectamente. `DocumentUploadStep.tsx` usa `useRef` y falla.

## Solución

### Cambio 1: Adoptar el Patrón de PhotoSlot (Input Dinámico)

Reemplazar el sistema actual de `useRef` por creación dinámica de input:

```typescript
// ANTES (no funciona en Android)
const fileInputRef = useRef<HTMLInputElement>(null);
<input ref={fileInputRef} onChange={handleFileSelect} />
<button onClick={() => fileInputRef.current?.click()}>Tomar foto</button>

// DESPUÉS (patrón de PhotoSlot que SÍ funciona)
const handleCameraClick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      await processFile(file);
    }
  };
  input.click();
};

<button onClick={handleCameraClick}>Tomar foto</button>
```

### Cambio 2: Desactivar Compresión Temporalmente

Para aislar el problema y confirmar que es el input (no la compresión):

```typescript
// v7: Skip compresión para diagnóstico
const processFile = async (selectedFile: File) => {
  console.log(`[DocumentUpload] v7 - Archivo recibido:`, {
    name: selectedFile.name,
    size: selectedFile.size,
    type: selectedFile.type
  });
  
  toast.info(`Procesando: ${selectedFile.name}`);
  
  // v7: SIN COMPRESIÓN - usar archivo directo
  const url = URL.createObjectURL(selectedFile);
  setFile(selectedFile);
  setPreview(url);
  
  toast.success('Foto lista ✓');
  console.log(`[DocumentUpload] v7 - Preview creado`);
};
```

### Cambio 3: Logging Ultra-Detallado

Agregar toasts visibles en CADA paso para confirmar flujo:

```typescript
const handleCameraClick = () => {
  toast.info('📷 Abriendo cámara...', { duration: 2000 });
  console.log(`[DocumentUpload] v7 - Creando input dinámico`);
  
  const input = document.createElement('input');
  // ... configuración
  
  input.onchange = async (e) => {
    toast.info('Foto recibida, procesando...', { duration: 2000 });
    // ... procesar
  };
  
  input.click();
};
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Cambiar a input dinámico + skip compresión |

## Flujo Esperado v7

```text
Usuario toca "Tomar foto"
         │
         ▼
Toast: "📷 Abriendo cámara..."
         │
         ▼
[Se crea input DINÁMICO - document.createElement]
         │
         ▼
Cámara nativa se abre → Usuario toma foto
         │
         ▼
input.onchange dispara (nuevo input, no hay desincronización)
         │
         ▼
Toast: "Foto recibida, procesando..."
         │
         ▼
[SIN COMPRESIÓN - uso directo del archivo]
         │
         ▼
setPreview(url) → UI muestra foto
         │
         ▼
Toast: "Foto lista ✓"
```

## Por Qué Esto Funcionará

1. **Input dinámico**: El elemento se crea FRESCO cada vez, sin posibilidad de desincronización de ref
2. **Sin compresión**: Eliminamos una variable del problema para confirmar que el input es la causa
3. **Mismo patrón que PhotoSlot**: Que ya funciona perfectamente en el checklist

## Verificación

1. Actualizar la app (confirmar badge **"v7"**)
2. Confirmar toast "📷 Abriendo cámara..." al tocar botón
3. Tomar foto
4. Confirmar toast "Foto recibida, procesando..."
5. Verificar que el preview aparece
6. Si funciona → reactivar compresión
7. Si NO funciona → el problema es más profundo (posiblemente WebView del dispositivo)

## Sección Técnica

### Por qué useRef falla en Android pero createElement no

**useRef + input hidden:**
1. El input existe en el DOM desde el render inicial
2. Cuando Android abre la cámara, puede pausar/matar el proceso del navegador
3. Al regresar, React puede re-renderizar el componente
4. El ref puede apuntar a un elemento "huérfano" o recreado
5. El onChange se dispara pero el callback puede estar desactualizado (closure problem)

**createElement dinámico:**
1. El input se crea JUSTO cuando el usuario toca el botón
2. El onchange se asigna INMEDIATAMENTE antes de input.click()
3. No hay estado previo que pueda corromperse
4. Cuando la cámara regresa, el input aún tiene su callback fresco
5. No depende de React refs ni closures antiguos

### Riesgo de la solución

- **Bajo**: Es el mismo patrón usado en PhotoSlot que funciona
- El archivo sin comprimir pesará más (~2-5MB vs ~400KB) pero Supabase Storage lo maneja
- Una vez confirmado que funciona, podemos reactivar compresión progresivamente

