

# Agregar AI Features al Dialog LMSContenidoForm (Video)

## Problema
Las features de AI para video (titulo con IA, descripcion, thumbnail, deteccion de provider) solo se agregaron al `ContenidoExpandedEditor` del editor inline nuevo. El dialog `LMSContenidoForm` que se usa en la vista `LMSCursoDetalle` (la que el usuario esta viendo) no tiene ninguna de estas features.

## Cambios

### Archivo: `src/components/lms/admin/LMSContenidoForm.tsx`

**Nuevas importaciones:**
- `AIGenerateButton` de `../wizard/AIGenerateButton`
- `VideoScriptGenerator` y `VideoScriptData` de `../wizard/VideoScriptGenerator`
- `ImageIcon` de lucide-react
- `Badge` de `@/components/ui/badge`
- `Textarea` ya esta importado

**Nuevo estado:**
- `videoDescription` - descripcion/notas del video
- `videoThumbnail` - URL del thumbnail generado
- `videoProvider` - provider detectado automaticamente
- `videoScript` - guion generado por IA
- Estados de loading/success para cada boton AI (titulo, descripcion, thumbnail)

**Nuevos handlers AI:**
- `handleGenerateVideoTitle` - genera titulo con `generateCourseMetadata`
- `handleGenerateVideoDescription` - genera descripcion con `generateRichText` (modo corto, strip HTML)
- `handleGenerateVideoThumbnail` - genera thumbnail con `generateCourseImage`

**Modificaciones en la UI (seccion video, tab "contenido"):**
1. Agregar `AIGenerateButton` junto al campo de titulo (arriba, en la seccion de header fields)
2. Despues del `MediaUploader` de video, agregar badge de provider detectado
3. Agregar campo `Textarea` para descripcion con boton AI
4. Agregar seccion de thumbnail con boton AI y preview de imagen
5. Agregar `VideoScriptGenerator` al final

**Modificaciones en `buildContenidoData`:**
- Para tipo `video`, incluir `provider`, `descripcion`, `thumbnail_url`, y `guion_generado` en el objeto de retorno

**Modificaciones en `useEffect` (carga de contenido existente):**
- Para tipo `video`, cargar `descripcion`, `thumbnail_url`, `provider`, y `guion_generado` del contenido existente

**Modificaciones en `resetForm`:**
- Resetear `videoDescription`, `videoThumbnail`, `videoProvider`, `videoScript`

## Estructura visual actualizada del dialog para video

```text
+--- Editar Contenido ----------------------------+
|                                                   |
| TITULO *          [AI btn]  | TIPO DE CONTENIDO   |
| [________________]          | [Video v]            |
|                                                   |
| [Contenido]  [Configuracion]                      |
|                                                   |
| Video                                             |
| [URL] [Subir]                                     |
| [_________________________] [Aplicar]             |
| Provider: [youtube]                               |
|                                                   |
| Descripcion / Notas                    [AI btn]   |
| [_________________________________]               |
|                                                   |
| Thumbnail / Portada                    [AI btn]   |
| [imagen preview o placeholder]                    |
|                                                   |
| Guion de Video (AI)                               |
| [VideoScriptGenerator]                            |
|                                                   |
|                   [Cancelar] [Guardar Cambios]    |
+---------------------------------------------------+
```

## Resumen
- **Archivo modificado:** 1 (`LMSContenidoForm.tsx`)
- **Sin archivos nuevos**
- **Reutiliza:** `AIGenerateButton`, `VideoScriptGenerator`, `useLMSAI` (ya importado), `generateCourseImage`, `generateCourseMetadata`
- **Paridad:** El dialog tendra las mismas features AI que el `ContenidoExpandedEditor`
