

# Evidencias Fotograficas en la Cronologia de Incidentes

## Objetivo

Permitir adjuntar fotos (capturas de WhatsApp, fotos del evento, etc.) a cada entrada de la cronologia, ya sea al crearla o a las existentes.

---

## Cambios

### 1. Agregar columna de imagen a la tabla `incidente_cronologia`

**Migracion SQL**: Agregar columna `imagen_url TEXT` a la tabla existente.

```sql
ALTER TABLE public.incidente_cronologia ADD COLUMN imagen_url TEXT;
```

### 2. Crear bucket de storage `evidencias-incidentes`

**Migracion SQL**: Bucket publico para almacenar las fotos, con politicas RLS para staff.

### 3. Modificar el formulario de entrada en `IncidentTimeline.tsx`

- Agregar un boton de "Adjuntar foto" (icono de camara) junto al campo de descripcion
- Input de tipo `file` oculto que acepta imagenes
- Vista previa (thumbnail) de la imagen seleccionada antes de enviar
- Compresion automatica via Canvas API (1920x1080, 0.7 quality) siguiendo el estandar del proyecto

### 4. Actualizar la funcion `useAddCronologiaEntry` en `useIncidentesOperativos.ts`

- Aceptar un parametro opcional `imagen?: File`
- Si hay imagen: subir al bucket `evidencias-incidentes`, obtener URL publica, guardar en `imagen_url`
- Sanitizar nombre de archivo (sin espacios ni caracteres especiales)

### 5. Mostrar imagenes en las entradas de la cronologia

En cada entrada que tenga `imagen_url`, mostrar:
- Thumbnail clickeable debajo de la descripcion
- Al hacer click, abrir la imagen en un dialog/lightbox simple para verla en tamano completo

### 6. Soporte para entradas locales (modo borrador)

- `LocalTimelineEntry` se extiende con `imagenFile?: File` y `imagenPreview?: string`
- La imagen se sube al guardar el incidente (en `persistCronologiaEntries`)
- La preview se genera localmente con `URL.createObjectURL`

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/migrations/...evidencias_cronologia.sql` | Nueva migracion: columna `imagen_url` + bucket + politicas |
| `src/hooks/useIncidentesOperativos.ts` | Ampliar `EntradaCronologia` con `imagen_url`, actualizar mutation para subir foto |
| `src/components/monitoring/incidents/IncidentTimeline.tsx` | Agregar input de foto al formulario, mostrar thumbnails en entradas, lightbox |

---

## Detalles tecnicos

- **Compresion**: Canvas API, max 1920x1080, quality 0.7 (~400KB) con fallback al original
- **Ruta de archivo**: `{incidente_id}/{timestamp}_{random}.{ext}` sanitizada
- **Bucket**: `evidencias-incidentes`, publico, con politicas de insert/select/delete para staff
- **Lightbox**: Dialog simple de Radix con la imagen a tamano completo
- **Tipos aceptados**: image/jpeg, image/png, image/webp

