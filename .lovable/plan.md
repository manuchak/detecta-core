
# Upgrade de AI Features para Editor de Video en LMS

## Problema actual
El editor de contenido tipo "Video" solo tiene dos funcionalidades: subir/pegar URL y generar guion con IA (`VideoScriptGenerator`). Otros tipos de contenido (quiz, flashcards, texto enriquecido) tienen botones de generacion AI integrados (titulos, contenido completo), pero el video carece de estas asistencias.

## Mejoras propuestas

### 1. Boton AI junto al titulo del video
Agregar un `AIGenerateButton` al lado del campo "Titulo" que sugiera un titulo optimizado para el contenido de video basado en el contexto del modulo y curso (mismo patron que `StepIdentidad` y `TabGeneral`).

### 2. Descripcion/notas del video con AI
Agregar un campo de "Notas/Descripcion" del video con generacion AI que produzca un resumen del contenido esperado, util para el instructor y como metadato del contenido.

### 3. Thumbnail AI (imagen de portada del video)
Agregar generacion de thumbnail con `generateCourseImage` del hook `useLMSAI`, guardandolo en `thumbnail_url` del `VideoContent`. Mostrara un preview de la imagen generada.

### 4. Placeholder de URL expandido
Actualizar el placeholder del `MediaUploader` para video para incluir "YouTube, Vimeo, TikTok, Instagram, Facebook o Canva URL..." reflejando los providers soportados en `VideoProvider`.

### 5. Deteccion automatica de provider
Al pegar una URL, detectar automaticamente el provider (youtube, vimeo, tiktok, etc.) y guardarlo en el campo `provider` del `VideoContent`.

## Cambios tecnicos

### Archivo: `src/components/lms/admin/editor/ContenidoExpandedEditor.tsx`
- Importar `AIGenerateButton` de wizard
- Agregar estado `videoDescription` y `videoThumbnail`
- En la seccion `contenido.tipo === 'video'`:
  - Agregar `AIGenerateButton` junto al campo titulo
  - Agregar campo Textarea para descripcion con boton AI
  - Agregar seccion de thumbnail con `AIGenerateButton` para generar imagen
  - Detectar provider automaticamente al cambiar `videoUrl`
- Actualizar `buildContenidoData` para incluir `thumbnail_url`, `provider`, y `descripcion`

### Archivo: `src/components/lms/admin/wizard/MediaUploader.tsx`
- Actualizar el placeholder de video para incluir todos los providers soportados: "YouTube, Vimeo, TikTok, Instagram, Facebook o Canva URL..."

### Archivo: `src/types/lms.ts`
- Agregar campo opcional `descripcion?: string` a `VideoContent` para almacenar la descripcion generada por AI

### Logica de deteccion de provider
Funcion utilitaria `detectVideoProvider(url: string): VideoProvider` que analiza la URL:
- `youtube.com` o `youtu.be` -> `'youtube'`
- `vimeo.com` -> `'vimeo'`
- `tiktok.com` -> `'tiktok'`
- `instagram.com` -> `'instagram'`
- `facebook.com` o `fb.watch` -> `'facebook'`
- `canva.com` -> `'canva'`
- URLs de storage/directas -> `'storage'`

## Resumen de archivos
- **Modificados (3):** `ContenidoExpandedEditor.tsx`, `MediaUploader.tsx`, `src/types/lms.ts`
- **Reutilizado sin cambios:** `AIGenerateButton`, `useLMSAI` (generateCourseImage, generateRichText, generateVideoScript)
