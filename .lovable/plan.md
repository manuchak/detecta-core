
# Plan: Debugging Robusto para Captura de Fotos en Android

## Diagnóstico Confirmado

El componente `DocumentUploadStep.tsx` tiene una falla silenciosa cuando `e.target.files?.[0]` es `undefined`. Esto es común en algunos dispositivos Android donde el evento onChange se dispara pero sin datos del archivo.

## Solución Propuesta

### 1. Agregar Logging Defensivo al INICIO del Handler

Modificar `handleFileSelect` para loguear inmediatamente al entrar, antes de cualquier verificación:

```typescript
const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  // LOG INMEDIATO - antes de cualquier verificación
  console.log('[DocumentUpload] v4 - onChange disparado:', {
    hasTarget: !!e.target,
    hasFiles: !!e.target?.files,
    filesLength: e.target?.files?.length ?? 0,
    firstFile: e.target?.files?.[0] ? {
      name: e.target.files[0].name,
      size: e.target.files[0].size,
      type: e.target.files[0].type
    } : 'NO FILE'
  });

  const selectedFile = e.target.files?.[0];
  
  // FEEDBACK VISUAL si no hay archivo
  if (!selectedFile) {
    console.warn('[DocumentUpload] v4 - NO HAY ARCHIVO - Android issue detectado');
    toast.error('No se recibió la foto', {
      description: 'Intenta tomar la foto de nuevo o reinicia la app',
      duration: 5000
    });
    return;
  }
  
  // Toast de confirmación al recibir archivo
  toast.info(`Procesando: ${selectedFile.name}`, { duration: 2000 });
  
  // ... resto del código
}, [preview]);
```

### 2. Agregar Banner de Versión Visible

Mostrar versión del código en la UI para confirmar que el código actualizado está activo:

```typescript
// Al inicio del componente, agregar badge de versión visible
<div className="absolute top-2 right-2 bg-primary/10 px-2 py-1 rounded text-xs font-mono">
  v4
</div>
```

### 3. Fallback: Input Dinámico como PhotoSlot

Si el problema persiste, implementar el patrón de `PhotoSlot.tsx` que crea el input dinámicamente:

```typescript
const handleCameraClick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    console.log('[DocumentUpload] Dynamic input - file:', file);
    if (file) {
      processFile(file);
    } else {
      toast.error('No se recibió la foto');
    }
  };
  input.click();
};
```

### 4. Agregar Toast al Montar el Componente

Para confirmar que el código nuevo está activo:

```typescript
useEffect(() => {
  toast.info('DocumentUpload v4 cargado', { duration: 3000 });
  console.log('[DocumentUpload] v4 montado');
}, []);
```

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Agregar logging al inicio, toast de error, badge de versión | Alta |

## Flujo Esperado Post-Implementación

```text
┌────────────────────────────────────────────────────────────────────┐
│  Usuario abre onboarding → Ve badge "v4" (confirma código nuevo)  │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  Usuario toca "Tomar foto" → Cámara se abre → Toma foto           │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  onChange se dispara → LOG INMEDIATO "[DocumentUpload] v4..."     │
└────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐      ┌───────────────────────┐
        │ Archivo recibido ✓   │      │ Archivo NO recibido ✗ │
        │ Toast: "Procesando"  │      │ Toast: "No se recibió │
        │ → Compresión         │      │  la foto. Reintenta"  │
        │ → Preview            │      │ → Usuario sabe qué    │
        │ → Listo para submit  │      │   pasó y puede actuar │
        └───────────────────────┘      └───────────────────────┘
```

## Verificación Post-Implementación

1. Refrescar la app en el Android de prueba
2. Verificar que aparece badge "v4" en la pantalla de documento
3. Tomar foto
4. Si aparece toast "No se recibió la foto" → Confirma que es problema de Android
5. Si aparece toast "Procesando..." → El código funciona y debería mostrar preview

## Sección Técnica

### Por qué puede fallar el input file en Android

1. **Page lifecycle**: Cuando se abre la cámara nativa, el navegador puede "congelar" la página. Al volver, el estado del componente React se puede perder en algunos dispositivos.

2. **Memory pressure**: En dispositivos con poca RAM, Android puede matar la pestaña del navegador mientras la cámara está abierta.

3. **Browser bugs**: Algunos navegadores Android (especialmente versiones antiguas de Chrome o WebView) tienen bugs conocidos con `capture="environment"`.

### Solución alternativa si persiste

Si después de agregar logging vemos que el problema es que Android no envía el archivo, podemos implementar:

1. **WebRTC camera**: Usar `navigator.mediaDevices.getUserMedia()` para abrir la cámara dentro del navegador (sin salir a la app de cámara nativa)

2. **Almacenamiento de estado**: Usar `sessionStorage` para preservar el estado antes de abrir la cámara

3. **Service Worker**: Capturar la foto en un Service Worker que no se ve afectado por el ciclo de vida de la página
