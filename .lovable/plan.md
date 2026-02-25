

# Editor de Texto Enriquecido (WYSIWYG) para LMS

## Problema

Actualmente, el editor de contenido tipo "texto_enriquecido" es un simple `<Textarea>` donde el creador del curso debe escribir HTML crudo. Esto produce textos planos sin formato visual, lo que es antipedagogico y limita completamente al creador de cursos.

## Solucion

Integrar **TipTap** (editor WYSIWYG basado en ProseMirror, el estandar de la industria para React) con una barra de herramientas completa para formateo visual.

## Dependencias a instalar

- `@tiptap/react` - Core del editor para React
- `@tiptap/starter-kit` - Extensiones basicas (bold, italic, headings, lists, blockquotes, code)
- `@tiptap/extension-underline` - Subrayado
- `@tiptap/extension-text-align` - Alineacion de texto
- `@tiptap/extension-image` - Insercion de imagenes
- `@tiptap/extension-link` - Hipervinculos
- `@tiptap/extension-text-style` - Estilos de texto (color, font)
- `@tiptap/extension-color` - Colores de texto
- `@tiptap/extension-highlight` - Resaltado/marcador
- `@tiptap/extension-table` - Tablas
- `@tiptap/extension-table-row` - Filas de tabla
- `@tiptap/extension-table-cell` - Celdas de tabla
- `@tiptap/extension-table-header` - Headers de tabla
- `@tiptap/extension-placeholder` - Placeholder text

## Cambios

### 1. Nuevo componente: `src/components/lms/admin/RichTextEditor.tsx`

Componente reutilizable que encapsula TipTap con una barra de herramientas con los siguientes controles:

```text
Barra de herramientas:
[H1] [H2] [H3] | [B] [I] [U] [S] | [Color] [Highlight] |
[Align L] [Align C] [Align R] | [UL] [OL] [Blockquote] |
[Link] [Imagen] [Tabla] [Separador] | [Limpiar formato]
```

Funcionalidades clave:
- **Tipografia**: H1, H2, H3, parrafos
- **Formato inline**: Negrita, cursiva, subrayado, tachado
- **Color**: Color de texto y resaltado/marcador
- **Alineacion**: Izquierda, centro, derecha
- **Listas**: Con vinetas y numeradas
- **Bloques**: Citas (blockquote), separador horizontal
- **Media**: Insertar imagenes por URL o subir al storage (reutilizando MediaUploader)
- **Links**: Insertar/editar hipervinculos
- **Tablas**: Insertar tablas con controles de filas/columnas
- **Boton IA**: "Generar con IA" integrado en la barra

El componente recibe `value` (HTML string) y `onChange` (callback con HTML).

### 2. Modificar `ContentEditor.tsx` (wizard de creacion)

Reemplazar el `<Textarea>` del caso `texto_enriquecido` (lineas 198-226) por el nuevo `<RichTextEditor>`:

```tsx
// Antes: <Textarea value={html} onChange={...} />
// Despues: <RichTextEditor value={html} onChange={setHtml} onGenerateAI={handleGenerateText} aiLoading={aiLoading} />
```

### 3. Modificar `ContenidoExpandedEditor.tsx` (editor de curso existente)

Reemplazar el `<Textarea>` del caso `texto_enriquecido` (lineas 259-276) por el mismo `<RichTextEditor>`:

```tsx
// Antes: <Textarea value={textoHtml} onChange={...} className="font-mono" />
// Despues: <RichTextEditor value={textoHtml} onChange={setTextoHtml} onGenerateAI={handleGenerateText} aiLoading={aiLoading} />
```

### 4. Actualizar `TextoEnriquecidoViewer.tsx` (visor del alumno)

Mejorar los estilos CSS del viewer para soportar los nuevos elementos que TipTap genera:
- Agregar estilos para `text-align` (center, right)
- Agregar estilos para `<u>` (subrayado), `<s>` (tachado)
- Agregar estilos para `<mark>` (resaltado)
- Mejorar estilos de tablas (nested selectors en lugar de `>` directo)
- Mejorar el espaciado general para mejor legibilidad pedagogica

### 5. Estilos del editor en `src/index.css`

Agregar estilos base para el area editable de TipTap (`.ProseMirror`):
- Estilos de tipografia consistentes con el viewer
- Focus ring
- Placeholder styling
- Min-height del area editable

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/components/lms/admin/RichTextEditor.tsx` | **Nuevo** - Editor WYSIWYG con TipTap |
| `src/components/lms/admin/wizard/ContentEditor.tsx` | Reemplazar Textarea por RichTextEditor |
| `src/components/lms/admin/editor/ContenidoExpandedEditor.tsx` | Reemplazar Textarea por RichTextEditor |
| `src/components/lms/TextoEnriquecidoViewer.tsx` | Mejorar estilos para nuevo HTML |
| `src/index.css` | Estilos base de ProseMirror |

## Notas

- TipTap genera HTML estandar que es compatible con el viewer existente (usa `dangerouslySetInnerHTML`)
- La generacion con IA sigue funcionando igual: genera HTML que se inyecta en el editor
- Las imagenes insertadas pueden ser por URL o subidas al storage existente del proyecto
- No se requieren cambios en la base de datos: el campo `contenido->html` sigue siendo un string HTML

