
# Plan: Corregir Propagación de Errores en Onboarding de Documentos

## Problema Identificado

El flujo de errores está "tragándose" las excepciones, causando fallas silenciosas:

```text
┌─────────────────────────────────────────────────────────────────┐
│ FLUJO ACTUAL (ROTO)                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Usuario toma foto y presiona "Subir documento"               │
│ 2. DocumentUploadStep.handleSubmit() llama onUpload()           │
│ 3. CustodianOnboarding.handleDocumentUpload() ejecuta mutation  │
│ 4. useCustodianDocuments valida teléfono → LANZA ERROR          │
│ 5. handleDocumentUpload CAPTURA el error (try/catch)            │
│ 6. Muestra toast genérico "Error al subir el documento"         │
│ 7. ⚠️ NO RE-LANZA EL ERROR                                      │
│ 8. DocumentUploadStep piensa que onUpload() terminó bien        │
│ 9. Usuario no ve ningún estado de error en UI                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Código con el bug (CustodianOnboarding.tsx líneas 73-94):

```typescript
const handleDocumentUpload = async (file: File, fechaVigencia: string) => {
  try {
    await updateDocument.mutateAsync({ tipoDocumento, file, fechaVigencia });
    // ...éxito...
  } catch (error) {
    console.error('Error uploading document:', error);
    toast.error('Error al subir el documento');
    // ⚠️ BUG: El error se "traga" aquí - no se propaga a DocumentUploadStep
  }
};
```

---

## Solución

### 1. Re-lanzar Error en handleDocumentUpload

El error debe propagarse para que `DocumentUploadStep` pueda mostrar la UI específica:

```typescript
const handleDocumentUpload = async (file: File, fechaVigencia: string) => {
  try {
    await updateDocument.mutateAsync({ tipoDocumento, file, fechaVigencia });
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < REQUIRED_DOCUMENTS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 500);
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    // Quitar el toast genérico - DocumentUploadStep mostrará error específico
    throw error; // ← AGREGAR: Propagar el error
  }
};
```

### 2. Remover Toast Genérico

El toast "Error al subir el documento" es redundante porque `DocumentUploadStep` ya tiene UIs de error específicas:
- `invalid_phone` → Mensaje con instrucciones para actualizar perfil
- `storage_low` → Instrucciones para liberar espacio
- `upload_failed` → Mensaje genérico

---

## Flujo Corregido

```text
┌─────────────────────────────────────────────────────────────────┐
│ FLUJO NUEVO (CORREGIDO)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Usuario toma foto y presiona "Subir documento"               │
│ 2. DocumentUploadStep.handleSubmit() llama onUpload()           │
│ 3. CustodianOnboarding.handleDocumentUpload() ejecuta mutation  │
│ 4. useCustodianDocuments valida teléfono → LANZA ERROR          │
│ 5. handleDocumentUpload RE-LANZA el error (throw error)         │
│ 6. DocumentUploadStep.handleSubmit() CAPTURA el error           │
│ 7. Detecta "teléfono no es válido" en mensaje                   │
│ 8. setErrorType('invalid_phone') → UI específica visible        │
│ 9. Usuario ve mensaje claro: "Teléfono no válido"               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/custodian/CustodianOnboarding.tsx` | Re-lanzar error en catch, remover toast genérico |

---

## Resultado Esperado

| Escenario | Antes | Después |
|-----------|-------|---------|
| Teléfono "Sin telefono" | Falla silenciosa | UI naranja con mensaje claro |
| Error de storage | Toast genérico + nada | UI con instrucciones |
| Error de subida | Toast genérico + nada | UI con opción de reintentar |

---

## Verificación Adicional

También verificaré que la validación de teléfono en el hook coincida exactamente con el mensaje esperado en el componente:

- **Hook lanza**: `'Tu número de teléfono no es válido. Por favor actualiza tu perfil.'`
- **Componente busca**: `errorMsg.includes('teléfono no es válido')` ✓

Los mensajes son compatibles.
