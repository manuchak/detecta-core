

## Rediseno del Editor de Cursos LMS: De Formulario Plano a Editor Profesional con Tabs

### Diagnostico del Estado Actual

El editor actual (`LMSCursoForm.tsx`) tiene varios problemas criticos de UX:

1. **Formulario plano y largo**: 3 Cards apilados (Informacion General, Configuracion, Estado) que requieren scroll extenso
2. **Flujo fragmentado**: Para editar modulos/contenidos hay que salir al detalle (`LMSCursoDetalle`) -- son dos paginas separadas que deberian ser una sola experiencia
3. **Dialogs modales para todo**: Crear/editar modulos y contenidos abre dialogs que bloquean el contexto
4. **Sin reutilizacion del wizard**: El wizard de creacion tiene mejor UX pero el editor no comparte nada de esa logica
5. **Cero feedback visual**: No hay preview, no hay indicadores de completitud, no hay asistencia AI

### Solucion: Editor Unificado con Tabs

Transformar `LMSCursoEditar` en un editor profesional tipo Teachable/Thinkific con navegacion por tabs:

```text
+--------------------------------------------------+
|  <- Supply Chain (LOG-SUPP-004)    [Guardar] [v]  |
|  Borrador | Intermedio | 60 min                   |
+--------------------------------------------------+
|  [General]  [Estructura]  [Config]  [Publicacion] |
+--------------------------------------------------+
|                                                    |
|   Tab activo renderiza su contenido                |
|                                                    |
+--------------------------------------------------+
```

### Tabs Propuestos

**Tab 1 - General**: Codigo, titulo, descripcion, imagen de portada, categoria, nivel -- con AI assist para descripcion (reutilizando `AIGenerateButton`)

**Tab 2 - Estructura**: Vista completa de modulos y contenidos con edicion inline expandible (sin modals). Drag-and-drop para reordenar. Boton "+ Modulo" y "+ Contenido" que expanden formularios inline debajo del ultimo elemento

**Tab 3 - Configuracion**: Duracion, plazo, roles objetivo, obligatorio -- agrupados en secciones compactas con switches

**Tab 4 - Publicacion**: Estado (activo/publicado), preview card de como se vera el curso para los usuarios, y boton de publicar con checklist de prerequisitos

### Cambios Clave de UX

1. **Header sticky con contexto**: Titulo + codigo + badges de estado siempre visibles
2. **Edicion inline de estructura**: Los modulos se expanden in-place para editar titulo/descripcion, y cada contenido se edita con un panel lateral o inline accordion -- eliminando los dialogs modales
3. **AI en el editor**: Reutilizar los botones de generacion AI del wizard (descripcion, quiz, texto)
4. **Auto-save**: Reutilizar `useFormPersistence` con indicador visual de guardado
5. **Indicadores de completitud**: Cada tab muestra un checkmark o warning si falta informacion requerida

### Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/lms/admin/LMSCursoEditor.tsx` | **Crear** | Componente principal del editor con tabs (reemplaza LMSCursoForm) |
| `src/components/lms/admin/editor/TabGeneral.tsx` | **Crear** | Tab de informacion general con AI assist |
| `src/components/lms/admin/editor/TabEstructura.tsx` | **Crear** | Tab de estructura con edicion inline de modulos/contenidos |
| `src/components/lms/admin/editor/TabConfiguracion.tsx` | **Crear** | Tab de configuracion (roles, plazos, obligatoriedad) |
| `src/components/lms/admin/editor/TabPublicacion.tsx` | **Crear** | Tab de publicacion con preview y checklist |
| `src/components/lms/admin/editor/ModuloInlineEditor.tsx` | **Crear** | Editor inline de modulo (titulo, descripcion, contenidos) |
| `src/components/lms/admin/editor/ContenidoInlineEditor.tsx` | **Crear** | Editor inline de contenido dentro de cada modulo |
| `src/components/lms/admin/editor/EditorHeader.tsx` | **Crear** | Header sticky con titulo, badges y accion guardar |
| `src/pages/LMS/LMSAdminCursoEditar.tsx` | **Modificar** | Usar LMSCursoEditor en lugar de LMSCursoForm |
| `src/components/lms/admin/LMSCursoForm.tsx` | **Deprecar** | Reemplazado por LMSCursoEditor |

### Detalle Tecnico

- **Tabs**: Usar `@radix-ui/react-tabs` (ya instalado) con `TabsList` horizontal
- **Inline editing de estructura**: Cada `ModuloInlineEditor` es un `Collapsible` que al expandirse muestra el formulario de edicion + lista de contenidos. Los contenidos usan el mismo patron accordion
- **Persistencia**: `useFormPersistence` nivel `standard` con key `lms_curso_edit_{cursoId}`
- **Mutaciones**: Reutilizar hooks existentes (`useLMSActualizarCurso`, `useLMSCrearModulo`, etc.) pero llamarlos desde los editores inline
- **AI**: Reutilizar `useLMSAI` y componentes `AIGenerateButton`/`AISuggestionCard` del wizard
- **Drag-and-drop**: Reutilizar `@dnd-kit` (ya instalado) para reordenar modulos y contenidos

### Resultado Esperado

El usuario puede gestionar todo un curso (metadata, estructura, contenidos, publicacion) desde una sola pagina con tabs, sin navegar a otras rutas ni abrir modales. La experiencia es comparable a editores modernos como Teachable, Thinkific o Notion.

