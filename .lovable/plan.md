

# Plan: Corregir Flujo de Subida de Fotos para Custodios

## Resumen del Problema

El sistema actual tiene múltiples fallas en la gestión de fotos de documentos:

1. **Bucket Privado**: `checklist-evidencias` está configurado como privado pero el código usa `getPublicUrl()` que genera URLs que requieren acceso público
2. **Sin Feedback Visual**: El usuario ve un preview local pero no hay confirmación real de que la foto se subió correctamente
3. **Rutas con Caracteres Especiales**: Los teléfonos tienen espacios ("56 4129 6853") que pueden causar problemas en rutas de archivos
4. **Errores Silenciosos**: Si el upload falla, el usuario no recibe notificación clara

---

## Solución Propuesta (3 Cambios)

### Cambio 1: Hacer el Bucket Público

**Archivo:** Nueva migración SQL

El bucket `checklist-evidencias` necesita ser público para que las URLs generadas funcionen:

```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'checklist-evidencias';
```

**Justificación:**
- Los documentos de custodios necesitan ser visibles en la app móvil y panel de monitoreo
- Las políticas RLS en `storage.objects` ya controlan quién puede subir/actualizar
- Otros buckets como `lms-media` y `candidato-documentos` también son públicos

---

### Cambio 2: Mejorar Hook de Upload con Sanitización y Feedback

**Archivo:** `src/hooks/useCustodianDocuments.ts`

Mejoras a implementar:
- Sanitizar teléfono para rutas de archivo (remover espacios y caracteres especiales)
- Agregar validación de respuesta del storage
- Mejorar mensajes de error específicos
- Verificar que el archivo realmente existe después del upload

```typescript
const updateDocument = useMutation({
  mutationFn: async ({ tipoDocumento, file, fechaVigencia, numeroDocumento }) => {
    if (!custodioTelefono) throw new Error('No se encontró número de teléfono');

    // Sanitizar teléfono para ruta de archivo
    const sanitizedPhone = custodioTelefono.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `documentos/${sanitizedPhone}/${tipoDocumento}_${Date.now()}.${fileExt}`;

    // 1. Subir archivo con validación
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('checklist-evidencias')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Error al subir foto: ${uploadError.message}`);
    }

    // 2. Verificar que el archivo existe
    const { data: fileCheck } = await supabase.storage
      .from('checklist-evidencias')
      .list(`documentos/${sanitizedPhone}`, {
        search: `${tipoDocumento}_`
      });

    if (!fileCheck || fileCheck.length === 0) {
      throw new Error('La foto no se guardó correctamente. Por favor intenta de nuevo.');
    }

    // 3. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('checklist-evidencias')
      .getPublicUrl(fileName);

    // 4. Guardar en base de datos
    const { error: dbError } = await supabase
      .from('documentos_custodio')
      .upsert({
        custodio_telefono: custodioTelefono, // Original con formato
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        fecha_vigencia: fechaVigencia,
        foto_url: urlData.publicUrl,
        verificado: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'custodio_telefono,tipo_documento' });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Error al guardar registro: ${dbError.message}`);
    }

    return { url: urlData.publicUrl };
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['custodian-documents', custodioTelefono] });
    toast.success('¡Documento guardado correctamente!', {
      description: 'La foto se subió y el registro fue creado.',
      duration: 4000
    });
  },
  onError: (error) => {
    console.error('Error updating document:', error);
    toast.error('Error al guardar documento', {
      description: error.message || 'Por favor verifica tu conexión e intenta de nuevo.',
      duration: 5000
    });
  },
});
```

---

### Cambio 3: Mejorar UI con Estados de Carga y Confirmación

**Archivo:** `src/components/custodian/onboarding/DocumentUploadStep.tsx`

Mejoras visuales:
- Mostrar spinner durante upload
- Mostrar confirmación visual después del éxito
- Mostrar mensaje de error si falla
- Deshabilitar interacción durante upload

```typescript
// Estados adicionales
const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

// Antes de llamar onUpload
setUploadStatus('uploading');

try {
  await onUpload(file, fechaVigencia);
  setUploadStatus('success');
  
  // Mostrar confirmación visual por 2 segundos
  setTimeout(() => setUploadStatus('idle'), 2000);
} catch (error) {
  setUploadStatus('error');
}
```

Agregar indicadores visuales:
- Badge verde con checkmark cuando `uploadStatus === 'success'`
- Overlay de carga con spinner cuando `uploadStatus === 'uploading'`
- Mensaje de error con botón de reintentar cuando `uploadStatus === 'error'`

---

## Archivos a Modificar/Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/migrations/YYYYMMDD_fix_checklist_bucket_public.sql` | Crear | Hacer bucket público |
| `src/hooks/useCustodianDocuments.ts` | Modificar | Sanitización + validación + mejor feedback |
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Modificar | UI con estados de carga/éxito/error |

---

## Flujo Corregido

```text
1. Usuario toma foto → Preview local ✅
2. Click "Guardar" → UI muestra "Subiendo..." con spinner
3. Upload a Storage → Bucket PÚBLICO permite acceso
4. Verificación de archivo → Confirmar que existe
5. getPublicUrl() → URL válida y accesible
6. Guardar en BD → Registro con URL funcional
7. UI muestra "¡Guardado!" con checkmark verde ✅
8. Al recargar → Imagen carga correctamente ✅
```

---

## Verificación Post-Implementación

1. **Test de nuevo upload:**
   - Tomar foto de documento
   - Verificar spinner de carga
   - Confirmar mensaje de éxito
   - Recargar página y verificar que imagen persiste

2. **Test de error:**
   - Desconectar internet
   - Intentar subir foto
   - Verificar mensaje de error claro

3. **Query de verificación:**
```sql
-- Verificar bucket es público
SELECT id, public FROM storage.buckets WHERE id = 'checklist-evidencias';
-- Esperado: public = true

-- Verificar archivos subidos
SELECT name, created_at FROM storage.objects 
WHERE bucket_id = 'checklist-evidencias' 
ORDER BY created_at DESC LIMIT 5;

-- Verificar registros en BD
SELECT custodio_telefono, tipo_documento, foto_url 
FROM documentos_custodio 
ORDER BY created_at DESC LIMIT 5;
```

---

## Impacto

- **Riesgo:** Bajo - Solo cambia visibilidad del bucket y mejora UX
- **Usuarios afectados:** Todos los custodios nuevos y existentes
- **Seguridad:** Las políticas RLS siguen controlando quién puede subir
- **Retrocompatibilidad:** 100% - URLs existentes seguirán funcionando

