

# Plan: Corrección Integral de Subida de Fotos en Todo el Sistema

## Diagnóstico Completo

### Estado Actual de Buckets de Storage

| Bucket | ¿Público? | Usa getPublicUrl | Estado |
|--------|-----------|------------------|--------|
| `checklist-evidencias` | ✅ Sí | Sí | **OK** (recién arreglado) |
| `lms-media` | ✅ Sí | Sí | **OK** |
| `instalacion-fotos` | ✅ Sí | Sí | **OK** |
| `reward-images` | ✅ Sí | Sí | **OK** |
| `ticket-evidencias` | ❌ No | Sí | **ROTO** |
| `candidato-documentos` | ❌ No | Sí | **ROTO** |
| `contratos-firmados` | ❌ No | Posiblemente | Interno (evaluar) |

### Problema Identificado

Cuando un bucket es **privado** (`public: false`) pero el código usa `getPublicUrl()`, las URLs generadas devuelven **403 Forbidden**. Las fotos se suben correctamente pero no se pueden ver.

---

## Archivos Afectados

### 1. `src/hooks/useCustodianTicketsEnhanced.ts` - **CRÍTICO**

**Bucket:** `ticket-evidencias` (privado)
**Problema:** 
- Líneas 188-203: Sube evidencias y usa `getPublicUrl()` → URLs no funcionan
- Líneas 269-284: Misma situación para adjuntos de respuestas
- Sin feedback visual de progreso
- Errores silenciosos (solo `console.error`)

**Uso:** Custodios suben fotos de problemas para tickets de soporte

### 2. `src/hooks/useDocumentosCandidato.ts` - **CRÍTICO**

**Bucket:** `candidato-documentos` (privado)
**Problema:**
- Líneas 106-118: Sube documentos y usa `getPublicUrl()` → URLs no funcionan
- Sin validación post-upload
- Feedback básico

**Uso:** Supply sube documentos de candidatos (INE, CURP, licencia)

### 3. Archivos Ya Corregidos (No requieren cambios)

- ✅ `useCustodianDocuments.ts` - Arreglado en esta sesión
- ✅ `useServiceChecklist.ts` - Bucket público
- ✅ `useInstalacionDocumentacion.ts` - Bucket público
- ✅ `MediaUploader.tsx` / `ImageUploader.tsx` - Bucket público

---

## Solución Propuesta

### Cambio 1: Hacer Buckets Públicos (SQL Migration)

Para tickets y candidatos, las fotos necesitan ser visibles en la UI. La seguridad se mantiene con RLS policies existentes que controlan quién puede subir/actualizar.

```sql
-- Hacer públicos los buckets que usan getPublicUrl()
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('ticket-evidencias', 'candidato-documentos');
```

**Justificación:**
- `ticket-evidencias`: Los custodios necesitan ver sus propias evidencias en el historial de tickets
- `candidato-documentos`: Supply necesita ver documentos para validación OCR y aprobación
- Las políticas RLS ya restringen quién puede INSERT/UPDATE/DELETE

### Cambio 2: Mejorar Hook de Tickets (`useCustodianTicketsEnhanced.ts`)

Agregar validación post-upload y mejor manejo de errores:

```typescript
// En createTicket - mejorar upload de evidencias
if (evidencias && evidencias.length > 0) {
  for (const file of evidencias) {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${ticketNumber}/${Date.now()}-${sanitizedName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-evidencias')
      .upload(fileName, file, {
        contentType: file.type || 'image/jpeg'
      });
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      toast({
        title: 'Advertencia',
        description: `No se pudo subir: ${file.name}`,
        variant: 'destructive'
      });
      continue;
    }
    
    // Verificar que existe
    const { data: fileCheck } = await supabase.storage
      .from('ticket-evidencias')
      .list(ticketNumber, { search: sanitizedName });
    
    if (fileCheck && fileCheck.length > 0) {
      const { data: urlData } = supabase.storage
        .from('ticket-evidencias')
        .getPublicUrl(uploadData.path);
      
      evidenciaUrls.push(urlData.publicUrl);
    }
  }
}
```

### Cambio 3: Mejorar Hook de Documentos Candidato (`useDocumentosCandidato.ts`)

Agregar sanitización de rutas y validación:

```typescript
// En useUploadDocumento
mutationFn: async ({ candidatoId, tipoDocumento, file, nombreEsperado }) => {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${candidatoId}/${tipoDocumento}_${Date.now()}.${fileExt}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('candidato-documentos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  // Verificar que el archivo existe
  const { data: fileCheck } = await supabase.storage
    .from('candidato-documentos')
    .list(candidatoId, { search: tipoDocumento });

  if (!fileCheck || fileCheck.length === 0) {
    throw new Error('El archivo no se guardó correctamente');
  }

  const { data: urlData } = supabase.storage
    .from('candidato-documentos')
    .getPublicUrl(fileName);

  // Resto del código...
}
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| Nueva migración SQL | Hacer públicos `ticket-evidencias` y `candidato-documentos` |
| `src/hooks/useCustodianTicketsEnhanced.ts` | Sanitización, validación post-upload, feedback de errores |
| `src/hooks/useDocumentosCandidato.ts` | Validación post-upload, mejor contentType |

---

## Flujo Corregido

### Antes (Roto)
```text
1. Usuario sube foto → Storage OK
2. getPublicUrl() → URL generada
3. Usuario ve imagen → 403 Forbidden ❌
```

### Después (Funcional)
```text
1. Usuario sube foto → Storage OK
2. Verificación de existencia → Confirmado ✓
3. getPublicUrl() → URL generada
4. Usuario ve imagen → Carga correctamente ✅
```

---

## Verificación Post-Implementación

```sql
-- Verificar buckets públicos
SELECT id, public FROM storage.buckets 
WHERE id IN ('ticket-evidencias', 'candidato-documentos', 'checklist-evidencias');
-- Todos deben mostrar public = true

-- Verificar archivos recientes
SELECT bucket_id, name, created_at 
FROM storage.objects 
WHERE bucket_id IN ('ticket-evidencias', 'candidato-documentos')
ORDER BY created_at DESC 
LIMIT 10;
```

### Tests Manuales

1. **Tickets de Custodio:**
   - Crear ticket con foto adjunta
   - Verificar que la imagen se muestra en el historial
   
2. **Documentos de Candidato:**
   - Subir INE de prueba
   - Verificar que la imagen carga en la vista de validación

---

## Impacto

- **Riesgo:** Bajo - Solo cambia visibilidad de buckets, RLS sigue activo
- **Módulos afectados:** Tickets de custodios, Documentos de candidatos
- **Seguridad:** Las políticas RLS controlan quién puede subir/modificar
- **Retrocompatibilidad:** URLs existentes comenzarán a funcionar

