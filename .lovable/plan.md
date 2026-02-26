
# Agregar campo de prompt para guiar la IA en generacion de contenido

## Problema actual
Cuando el usuario hace clic en "Generar con IA" en flashcards, quizzes o texto enriquecido, la IA solo recibe el titulo del modulo/curso como contexto. No hay forma de darle instrucciones especificas como "enfocate en protocolos de emergencia" o "usa ejemplos de rutas Mexico-Puebla".

## Solucion
Agregar un campo de texto (prompt) que aparezca al lado del boton "Generar con IA" o en un popover, permitiendo al usuario escribir instrucciones antes de generar. El backend ya soporta un campo `contexto` que se inyecta al prompt de la IA -- solo falta exponerlo en la interfaz.

## Cambios

### 1. Componente reutilizable: `AIPromptPopover`
Crear un nuevo componente que envuelva el boton "Generar con IA" y muestre un popover con:
- Un `Textarea` para el prompt del usuario (placeholder: "Ej: Enfocate en protocolos de emergencia...")
- Boton "Generar" que ejecuta la accion con el prompt como contexto adicional

### 2. InlineFlashcardEditor.tsx
- Reemplazar el boton simple "Generar con IA" por el `AIPromptPopover`
- Pasar el prompt del usuario como parte del parametro `contexto` al llamar `generateFlashcards`
- El contexto combinara: curso + prompt del usuario

### 3. InlineQuizEditor.tsx
- Mismo cambio: reemplazar boton por `AIPromptPopover`
- Concatenar el prompt al `contexto` de `generateQuizQuestions`

### 4. Editores de texto enriquecido (QuickContentCreator, ContentEditor, ContenidoExpandedEditor)
- Agregar el `AIPromptPopover` donde se llama `generateRichText`
- Pasar el prompt del usuario como contexto adicional

### 5. useLMSAI.ts (sin cambios necesarios)
Las funciones ya aceptan `contexto` como parametro. El backend ya lo inyecta en el user prompt.

## Detalle tecnico del componente AIPromptPopover

```text
+----------------------------------+
| [Sparkles] Generar con IA  [v]   |  <-- Boton con dropdown/popover
+----------------------------------+
| Instrucciones para la IA:        |
| +------------------------------+ |
| | Ej: Enfocate en protocolos   | |
| | de seguridad en carretera... | |
| +------------------------------+ |
| [Generar]                        |
+----------------------------------+
```

- Popover con `Textarea` de 2-3 lineas
- Boton "Generar" dentro del popover ejecuta la generacion
- Si el usuario no escribe nada, se genera igual (como hoy)
- El prompt se concatena al contexto existente: `Curso: X. Instrucciones adicionales: {prompt}`

## Archivos
- **1 archivo nuevo**: `src/components/lms/admin/wizard/AIPromptPopover.tsx`
- **5 archivos modificados**: InlineFlashcardEditor, InlineQuizEditor, QuickContentCreator, ContentEditor, ContenidoExpandedEditor
- **0 cambios backend**: el campo `contexto` ya existe y se procesa

## Impacto
- No rompe flujo actual: si el usuario no escribe prompt, funciona igual que antes
- Mejora calidad de generacion al permitir instrucciones especificas
- Reutilizable en cualquier punto donde se use IA generativa
