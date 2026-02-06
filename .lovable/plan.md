
# Plan: Corrección de Bug en Subida de Documentos de Custodio

## Problema Identificado

El flujo de subida de documentos en el checklist de custodios tiene una **desconexión crítica** entre `StepDocuments.tsx` y `DocumentCard.tsx` que causa que las fotos nunca se suban a Supabase:

```text
┌─────────────────────────────────────────────────────────────────┐
│ FLUJO ACTUAL (ROTO)                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DocumentCard                          StepDocuments             │
│ ─────────────                         ─────────────             │
│ 1. Usuario selecciona fecha                                     │
│ 2. Usuario toma foto                                            │
│ 3. handleFileSelect llama:                                      │
│    onUpdate(file, fecha) ──────────▶ () => setUploadingDoc()   │
│                                       ↑                         │
│                                       │                         │
│                          ¡IGNORA file y fecha!                  │
│                          Solo abre otro dialog                  │
│                                                                 │
│ 4. El archivo NUNCA llega al hook useCustodianDocuments         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Evidencia**: La tabla `documentos_custodio` está completamente vacía - ningún documento se ha subido nunca.

---

## Solución Propuesta

### Opción A: Arreglar DocumentCard para usar el Dialog del padre (RECOMENDADO)

Simplificar `DocumentCard` para que solo muestre estado y botón "Actualizar", delegando TODO el proceso de upload al componente padre (`StepDocuments`) que ya tiene un Dialog funcional.

### Cambios Necesarios

### 1. Simplificar `DocumentCard.tsx`

Remover el formulario interno de actualización y solo exponer un botón que notifica al padre:

```typescript
// src/components/custodian/checklist/DocumentCard.tsx

interface DocumentCardProps {
  documento?: DocumentoCustodio;
  tipoDocumento: TipoDocumentoCustodio;
  onRequestUpdate: () => void;  // Cambio: solo notifica, no recibe params
  isUpdating?: boolean;
  className?: string;
}

export function DocumentCard({
  documento,
  tipoDocumento,
  onRequestUpdate,
  isUpdating,
  className,
}: DocumentCardProps) {
  const isExpired = documento
    ? new Date(documento.fecha_vigencia) < new Date()
    : false;

  return (
    <Card className={cn(
      'p-4 transition-all',
      isExpired && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10',
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        {/* Contenido existente */}
        
        {(isExpired || !documento) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestUpdate}
            disabled={isUpdating}
            className="shrink-0"
          >
            <Upload className="w-4 h-4 mr-1" />
            {isUpdating ? 'Subiendo...' : documento ? 'Actualizar' : 'Subir'}
          </Button>
        )}
      </div>
    </Card>
  );
}
```

### 2. Actualizar `StepDocuments.tsx` para usar el nuevo prop

```typescript
// src/components/custodian/checklist/StepDocuments.tsx

// Cambiar línea 117:
<DocumentCard
  key={tipo}
  tipoDocumento={tipo}
  documento={doc}
  onRequestUpdate={() => setUploadingDoc(tipo)}  // Renombrado para claridad
  isUpdating={uploadingDoc === tipo && isUploading}
/>
```

### 3. Agregar Logging para Debugging

Agregar logs en puntos críticos para facilitar futuras investigaciones:

```typescript
// En handleUpload de StepDocuments.tsx
const handleUpload = async () => {
  console.log('[StepDocuments] Iniciando upload:', { 
    tipo: uploadingDoc, 
    hasFile: !!uploadFile, 
    fecha: uploadDate 
  });
  
  if (!uploadingDoc || !uploadFile || !uploadDate) {
    console.warn('[StepDocuments] Faltan datos para upload');
    return;
  }
  
  // ... resto del código
};
```

---

## Archivos a Modificar

| Archivo | Cambio | Impacto |
|---------|--------|---------|
| `src/components/custodian/checklist/DocumentCard.tsx` | Simplificar: remover formulario interno, cambiar `onUpdate` → `onRequestUpdate` | CRÍTICO |
| `src/components/custodian/checklist/StepDocuments.tsx` | Actualizar prop name, agregar logging | CRÍTICO |
| `src/hooks/useCustodianDocuments.ts` | Agregar logging en `updateDocument.mutationFn` | MEDIO |

---

## Flujo Corregido

```text
┌─────────────────────────────────────────────────────────────────┐
│ FLUJO CORREGIDO                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DocumentCard                          StepDocuments             │
│ ─────────────                         ─────────────             │
│ 1. Usuario ve documento faltante/vencido                        │
│ 2. Click en "Subir" / "Actualizar"                              │
│    onRequestUpdate() ──────────────▶ setUploadingDoc(tipo)     │
│                                       ↓                         │
│                                       Abre Dialog               │
│                                       ↓                         │
│                            3. Usuario toma foto en Dialog       │
│                            4. Usuario selecciona fecha          │
│                            5. Click "Guardar documento"         │
│                                       ↓                         │
│                            handleUpload()                       │
│                                       ↓                         │
│                            updateDocument.mutateAsync({         │
│                              tipoDocumento,                     │
│                              file: uploadFile,                  │
│                              fechaVigencia: uploadDate          │
│                            })                                   │
│                                       ↓                         │
│                            ✅ Foto sube a Supabase Storage     │
│                            ✅ Registro en documentos_custodio  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verificación Post-Implementación

1. **Test de flujo completo**:
   - Ir a `/custodian/checklist/{serviceId}`
   - Click en "Subir" en un documento
   - Tomar foto
   - Seleccionar fecha
   - Click "Guardar documento"
   - ✅ Verificar que aparece toast de éxito
   - ✅ Verificar que el documento aparece en la lista

2. **Verificar en base de datos**:
```sql
SELECT * FROM documentos_custodio 
ORDER BY updated_at DESC 
LIMIT 5;
```

3. **Verificar en Storage**:
   - Bucket `checklist-evidencias` debe tener carpeta `documentos/{telefono}/`
   - Archivos con formato `{tipo_documento}_{timestamp}.jpg`

---

## Notas Adicionales

- El componente `CustodianOnboarding.tsx` usa `DocumentUploadStep.tsx` que SÍ funciona correctamente - ese flujo no necesita cambios
- El bug solo afecta al flujo de `ChecklistWizard` → `StepDocuments` → `DocumentCard`
- La confusión surgió porque hay dos flujos de upload con implementaciones diferentes
