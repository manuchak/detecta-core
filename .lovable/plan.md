

# Unificar features del ModuloInlineEditor

## Objetivo
Agregar al `ModuloInlineEditor` (editor inline con drag & drop) las 4 features que solo existen en el `LMSModuloForm` dialog antiguo:
1. Boton AI para generar descripcion
2. Sugerencias rapidas de titulo (chips)
3. Preview card visual del modulo
4. Toggle activo/inactivo con Switch

## Cambios

### Archivo: `src/components/lms/admin/editor/ModuloInlineEditor.tsx`

**Importaciones nuevas:**
- `Switch` de `@/components/ui/switch`
- `Sparkles`, `Loader2`, `Clock`, `Eye`, `EyeOff` de lucide-react
- `useLMSAI` de `@/hooks/lms/useLMSAI`
- `AIGenerateButton` de `../wizard/AIGenerateButton`
- `toast` de sonner

**En el modo de edicion (cuando `isEditing === true`):**

1. **Sugerencias rapidas** - Agregar chips ("Introduccion", "Fundamentos", "Conceptos Clave", "Practica Guiada", "Casos de Estudio", "Evaluacion Final") arriba del campo titulo. Al hacer clic, se rellena el titulo con la sugerencia + titulo del curso.

2. **AI en descripcion** - Agregar un `AIGenerateButton` junto al label "Descripcion" que llame a `generateCourseMetadata` con el titulo del modulo en contexto del curso para generar una descripcion automatica.

3. **Preview card** - Debajo de los campos de edicion, mostrar una mini tarjeta de vista previa con el numero de orden, titulo y descripcion (igual que en `LMSModuloForm`).

4. **Toggle activo/inactivo** - Agregar un `Switch` en la barra de botones de accion (junto a Guardar/Cancelar) que permita activar/desactivar el modulo. El estado se guardara al hacer clic en "Guardar".

**En el header (cuando `isEditing === false`):**

5. **Indicador visual de inactivo** - Si el modulo esta inactivo (`!modulo.activo`), mostrar un badge "Inactivo" y aplicar opacidad reducida al modulo.

**En `handleSaveModulo`:**
- Incluir el campo `activo` en la mutacion junto con titulo y descripcion.

### Estructura visual del modo edicion expandido

```text
+--------------------------------------------------+
| [Grip] [v] [Sugerencias: Intro | Fund | Conc...] |
|                                                    |
| Titulo: [________________________] [AI btn]        |
|                                                    |
| Descripcion: [____________________] [AI btn]       |
|              [____________________]                |
|                                                    |
| +--- Vista previa del modulo ---+                  |
| | [1] Titulo del modulo         |                  |
| |     Descripcion...            |                  |
| +-------------------------------+                  |
|                                                    |
| [Switch Activo] [Guardar] [Cancelar]               |
+--------------------------------------------------+
```

### Resumen de impacto
- **Archivo modificado:** 1 (`ModuloInlineEditor.tsx`)
- **Sin archivos nuevos**
- **Reutiliza:** `useLMSAI`, `AIGenerateButton`, `Switch` (ya instalados)
- **Drag & drop existente:** Se mantiene intacto, no se modifica

