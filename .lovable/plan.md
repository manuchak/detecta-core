

## Mejora del Editor de Contenidos + Integración de Evaluaciones

### Problema Actual

1. **ContenidoInlineEditor** solo permite editar el titulo del contenido. No hay forma de editar la URL de un video, el texto enriquecido, las preguntas de un quiz, ni ningun otro campo especifico del tipo de contenido.

2. **Las evaluaciones (quizzes)** ya existen en el sistema como un tipo de contenido (`quiz`) dentro de los modulos. Las preguntas se almacenan en la tabla `lms_preguntas` y se referencian por IDs en el campo `contenido.preguntas_ids`. Se crearon durante el wizard de creacion usando el `InlineQuizEditor`. Sin embargo, desde el editor de curso no hay forma de ver ni editar esas preguntas.

### Solucion

Agregar un editor expandible al `ContenidoInlineEditor` que, al hacer clic en el icono de edicion, muestre un panel inline con los campos especificos segun el tipo de contenido -- reutilizando los componentes del wizard (`MediaUploader`, `InlineQuizEditor`, `InlineFlashcardEditor`, `VideoScriptGenerator`).

```text
Antes:
  [>] Los 5 Puntos de Dolor    Video  5m  [Pencil] [Trash]
  (clic en Pencil -> solo cambia titulo)

Despues:
  [>] Los 5 Puntos de Dolor    Video  5m  [Pencil] [Trash]
  (clic en Pencil -> expande panel completo):
  +-----------------------------------------------+
  |  [Video icon] Video - Editando contenido       |
  |                                                |
  |  Titulo: [Los 5 Puntos de Dolor...          ]  |
  |  Duracion: [5] min                             |
  |                                                |
  |  Video: [URL o subir archivo]                  |
  |  [Generar guion con IA]                        |
  |                                                |
  |              [Cancelar]  [Guardar]             |
  +-----------------------------------------------+
```

Para quizzes, el panel mostrara el `InlineQuizEditor` cargando las preguntas existentes desde `lms_preguntas`:

```text
  [?] Evaluacion Final          Quiz  10m  [Pencil] [Trash]
  (clic en Pencil -> expande):
  +-----------------------------------------------+
  |  [Quiz icon] Quiz - Editando contenido         |
  |                                                |
  |  Preguntas (3):                                |
  |  1. Cual es el punto critico...  [Edit][Del]   |
  |  2. Que significa OTIF?          [Edit][Del]   |
  |  3. Selecciona los KPIs...       [Edit][Del]   |
  |                                                |
  |  [+ Agregar pregunta]  [Generar con IA]        |
  |                                                |
  |              [Cancelar]  [Guardar]             |
  +-----------------------------------------------+
```

### Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/lms/admin/editor/ContenidoInlineEditor.tsx` | **Reescribir** | Agregar estado expandido con editor completo segun tipo de contenido |
| `src/components/lms/admin/editor/ContenidoExpandedEditor.tsx` | **Crear** | Panel expandido que adapta `ContentEditor` del wizard para trabajar con `LMSContenido` (datos de DB) en lugar de `ContentOutline` (estado del wizard) |
| `src/hooks/lms/useLMSAdminPreguntas.ts` | **Sin cambios** | Ya existe `fetchPreguntasByIds` para cargar preguntas -- se reutiliza |

### Detalle Tecnico

**ContenidoExpandedEditor** sera un componente nuevo que:
- Recibe un `LMSContenido` (registro de BD) en lugar de `ContentOutline` (estado del wizard)
- Segun `contenido.tipo`, renderiza los campos apropiados:
  - `video`: `MediaUploader` + `VideoScriptGenerator` (reutilizados del wizard)
  - `documento`: `MediaUploader` (reutilizado del wizard)
  - `texto_enriquecido`: `Textarea` con boton "Generar con IA" usando `useLMSAI`
  - `quiz`: `InlineQuizEditor` (reutilizado) + carga inicial de preguntas via `fetchPreguntasByIds(contenido.contenido.preguntas_ids)`
  - `interactivo`: `InlineFlashcardEditor` (reutilizado)
  - `embed`: Campo de HTML para iframe
- Al guardar, llama a `useLMSActualizarContenido` con los datos actualizados
- Para quizzes, tambien llama a `useLMSCrearPreguntas` para persistir preguntas nuevas/modificadas en `lms_preguntas`

**ContenidoInlineEditor** se modifica para:
- Agregar estado `showEditor` (boolean)
- Al hacer clic en Pencil, en lugar de entrar en modo edicion de titulo, expandir el `ContenidoExpandedEditor` debajo
- El editor expandido reemplaza toda la fila mientras esta abierto

### Resultado

- Edicion completa de cualquier tipo de contenido desde la misma pagina del editor de cursos
- Las evaluaciones (quizzes) se pueden ver, editar y agregar preguntas sin salir del editor
- Se reutilizan los componentes del wizard sin duplicar logica
- El flujo es consistente: tanto en creacion (wizard) como en edicion (editor) se usa la misma experiencia

