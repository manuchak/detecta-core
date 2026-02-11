

## Feature: Campo de Enfoque Instruccional en el Generador de Cursos

### Pitch para Head de Producto

**Problema:** El generador de cursos con IA produce contenido generico porque solo recibe el tema. Un head de capacitacion no puede indicar si el curso debe ser practico vs teorico, formal vs coloquial, basado en casos vs basado en conceptos, ni a que nivel de escolaridad apuntar.

**Solucion:** Agregar un campo opcional "Enfoque instruccional" donde el responsable de capacitacion describe en lenguaje natural como quiere que se ensenbe el contenido. Esta instruccion se propaga a TODAS las generaciones de IA (textos, quizzes, flashcards, video scripts), logrando coherencia pedagogica de principio a fin.

**Valor de negocio:**
- Diferenciador vs Articulate/iSpring: esas plataformas no tienen un campo de contexto pedagogico que permee todo el curso
- Reduce ciclos de revision: el contenido sale mas alineado desde la primera generacion
- Empodera al head de capacitacion como disenador instruccional, no solo como "usuario que llena formularios"

### Cambios tecnicos

**1. AIFullCourseGenerator.tsx** - Agregar campo de texto

Agregar un `Textarea` opcional debajo del tema con placeholder orientador:

```
Enfoque instruccional (opcional)
"Describe como quieres que se ensene este contenido: metodologia,
tono, nivel de profundidad, tipo de ejemplos, etc."
```

Estado nuevo: `const [enfoque, setEnfoque] = useState("")`

**2. AIFullCourseGenerator.tsx** - Propagar el enfoque a TODAS las llamadas de IA

Actualmente el campo `contexto` se construye asi:
```
contexto: `Modulo: ${moduloTitulo}. Curso: ${tema}. Rol: ${rol}`
```

Se enriqueceria con:
```
contexto: `Modulo: ${moduloTitulo}. Curso: ${tema}. Rol: ${rol}. Enfoque instruccional: ${enfoque}`
```

Esto aplica a las llamadas de:
- `generate_course_structure` (nuevo param `enfoque`)
- `generate_rich_text` (via contexto)
- `generate_quiz_questions` (via contexto)
- `generate_flashcards` (via contexto)

**3. Edge function lms-ai-assistant/index.ts** - Incluir enfoque en los prompts

Para `generate_course_structure`, agregar el enfoque al user prompt:
```
Tema: "${data.tema}"
Duracion total: ${data.duracion_min} min
Enfoque instruccional: "${data.enfoque || 'General'}"
```

Para las demas acciones, el enfoque ya llega via el campo `contexto` que ya se incluye en los prompts.

**4. StepIdentidad.tsx** - Guardar el enfoque en el formulario

Agregar un campo `enfoque_instruccional` al schema del formulario para que se persista junto con los demas datos del curso y pueda usarse en futuras re-generaciones o ediciones.

**5. Persistencia** - El campo se guarda automaticamente

Como el enfoque se agrega al form o al state del generador, el sistema de persistencia existente (useFormPersistence con flush-on-unmount) lo captura sin cambios adicionales.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/lms/admin/wizard/AIFullCourseGenerator.tsx` | Agregar textarea de enfoque + propagarlo a todas las llamadas |
| `supabase/functions/lms-ai-assistant/index.ts` | Incluir enfoque en el user prompt de `generate_course_structure` |
| `src/components/lms/admin/wizard/StepIdentidad.tsx` | Agregar campo persistente de enfoque instruccional |

### UI propuesta

El campo se ubica entre el "Tema del curso" y la fila de "Rol objetivo / Duracion":

```text
+--------------------------------------------------+
| Curso Completo con IA                            |
|                                                  |
| Tema del curso *                                 |
| [Protocolos de seguridad en custodia de valores] |
|                                                  |
| Enfoque instruccional (opcional)                 |
| [Basado en casos reales. Tono directo, sin      |
|  tecnicismos. Priorizar ejercicios practicos...] |
|                                                  |
| Rol objetivo          | Duracion: 60 min         |
| [Custodio       v]    | ====O============        |
|                                                  |
| [ Generar Curso Completo ]                       |
+--------------------------------------------------+
```

### Riesgo

Bajo. Es un campo opcional que enriquece el contexto de las llamadas existentes. No cambia la arquitectura del pipeline de generacion.

