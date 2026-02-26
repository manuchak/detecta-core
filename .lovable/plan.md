

# Permitir subida de documentos desde el panel de administracion

## Problema
En la pestaña "Docs" de Perfiles Operativos, la seccion "Documentos del Custodio (Portal)" es solo lectura. El equipo no puede subir documentos en nombre del custodio cuando reciben documentos fisicos digitalizados. Solo pueden verificar/rechazar lo que el custodio sube desde su portal.

## Solucion
Agregar un boton "Subir Documento" en la seccion de documentos del custodio dentro de `DocumentacionTab`, con un dialog que permita seleccionar tipo de documento, archivo (PDF/imagen), fecha de vigencia y numero de documento opcional. Se reutiliza la logica de `useCustodianDocuments.updateDocument` que ya maneja upsert, compresion y storage.

## Cambios

### 1. Crear `AdminDocumentUploadDialog.tsx`
**Archivo:** `src/pages/PerfilesOperativos/components/tabs/AdminDocumentUploadDialog.tsx`

Dialog con:
- Select de tipo de documento (tarjeta_circulacion, poliza_seguro, verificacion_vehicular, licencia_conducir, credencial_custodia, portacion_arma, registro_arma)
- Input de fecha de vigencia (obligatorio)
- Input de numero de documento (opcional)
- Zona de drop/seleccion de archivo (PDF, JPG, PNG, WebP - max 20MB)
- Preview de imagen o icono de PDF
- Boton "Subir Documento"

Reutiliza `useCustodianDocuments` pasando el telefono del custodio para invocar `updateDocument.mutateAsync`.

### 2. Actualizar `DocumentacionTab.tsx`
**Archivo:** `src/pages/PerfilesOperativos/components/tabs/DocumentacionTab.tsx`

- Importar `AdminDocumentUploadDialog` y `useCustodianDocuments`
- Agregar boton "Subir Documento" junto al titulo de la seccion "Documentos del Custodio (Portal)"
- Agregar estado para controlar el dialog
- Invalidar queries al completar la subida

### Detalles tecnicos

- El upsert existente en `useCustodianDocuments` funciona con `onConflict: 'custodio_telefono,tipo_documento'`, lo que significa que si ya existe un documento del mismo tipo, se actualiza automaticamente
- Se reutiliza la compresion de imagenes existente (`compressImage`)
- Se reutiliza el patron Verify-Before-Commit del storage
- Los documentos subidos por el admin quedan con `verificado: false` por defecto; el equipo puede verificarlos inmediatamente despues si lo desea
- El bucket `checklist-evidencias` ya es publico y tiene las politicas RLS necesarias

