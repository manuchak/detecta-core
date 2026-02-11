

## Fase 4: Generacion Completa de Curso con Un Click

### Resumen

Agregar un modo "Curso Completo con IA" al inicio del wizard que, a partir de un tema, rol objetivo y duracion, encadena multiples llamadas de IA para generar todo el curso: metadata, estructura con modulos, contenido de texto enriquecido para cada contenido de tipo texto, y preguntas para cada quiz. El usuario ve un indicador de progreso paso a paso y al finalizar puede revisar y editar todo en el wizard normal.

### Flujo del usuario

```text
+----------------------------------------------+
|  Generador de Curso Completo con IA          |
|                                               |
|  Tema: [____________________________]        |
|  Rol:  [Custodio v]  Duracion: [60 min]      |
|                                               |
|  [ Generar Curso Completo ]                  |
+----------------------------------------------+
         |
         v  (secuencial con progreso)
  1. Generando metadata...        [====      ]
  2. Generando estructura...      [======    ]
  3. Generando contenido 1/4...   [========  ]
  4. Generando quiz 1/2...        [========= ]
  5. Listo!                       [==========]
```

Al completar: se llenan todos los campos del form y se avanza automaticamente al paso 2 (Estructura) para que el usuario revise.

### Cambios tecnicos

**1. Nuevo archivo: `src/components/lms/admin/wizard/AIFullCourseGenerator.tsx`**

Componente con:
- Input de tema (texto libre)
- Select de rol objetivo (reutiliza ROLES_DISPONIBLES)
- Slider/input de duracion estimada (30-180 min)
- Boton "Generar Curso Completo"
- Barra de progreso con label del paso actual
- Logica de orquestacion que encadena llamadas:
  1. `generateCourseMetadata(tema)` - llena codigo, descripcion, categoria
  2. `generateCourseStructure(tema, duracion)` - genera modulos
  3. Para cada contenido tipo `texto_enriquecido`: `generateRichText(titulo, contexto_modulo)`
  4. Para cada contenido tipo `quiz`: `generateQuizQuestions(titulo_modulo, 5, contexto)`
  5. Para cada contenido tipo `interactivo`: `generateFlashcards(titulo_modulo, 6, contexto)`
- Manejo de errores parciales: si falla un paso de contenido, continua con los demas
- Timeout extendido a 45s por llamada individual (el total puede tomar 2-3 min)

Props: `onComplete: (formValues, modulos) => void` - callback para pasar los datos generados al wizard padre

**2. Modificar: `src/components/lms/admin/LMSCursoWizard.tsx`**

- Pasar `onModulosChange={setModulos}` y un callback `onFullCourseGenerated` a `StepIdentidad`
- El callback recibe los valores del form y los modulos, los aplica y avanza a step 2

**3. Modificar: `src/components/lms/admin/wizard/StepIdentidad.tsx`**

- Recibir nuevas props: `onFullCourseGenerated: (formValues, modulos) => void`
- Renderizar `AIFullCourseGenerator` como primera seccion (antes del banner actual de IA)
- Cuando el generador completa, llama `onFullCourseGenerated` con los datos

**4. Modificar: `src/hooks/lms/useLMSAI.ts`**

- Hacer `invokeAI` configurable con timeout custom (para llamadas largas)
- No se necesita una funcion `generateFullCourse` nueva en el hook; la orquestacion vive en el componente usando las funciones existentes

### Detalles de implementacion del generador

El componente `AIFullCourseGenerator` usa multiples instancias de `useLMSAI` internamente? No, ya que `loading` es compartido. En su lugar, el componente manejara su propio estado de progreso y llamara directamente a `supabase.functions.invoke` o reutilizara las funciones del hook con un wrapper que no bloquee el loading global.

Solucion: crear un hook local `useFullCourseGeneration` dentro del componente que:
- Tiene su propio `loading` y `progress` state
- Reutiliza la misma logica de `invokeAI` pero con timeout de 45s
- Expone `{ generate, loading, progress, currentStep }` 

Estructura del `progress`:
```text
{ step: number, totalSteps: number, label: string, percent: number }
```

### Archivos a crear
- `src/components/lms/admin/wizard/AIFullCourseGenerator.tsx`

### Archivos a modificar  
- `src/components/lms/admin/LMSCursoWizard.tsx` (pasar callback a StepIdentidad)
- `src/components/lms/admin/wizard/StepIdentidad.tsx` (renderizar generador, recibir callback)
- `src/hooks/lms/useLMSAI.ts` (parametro timeout opcional en invokeAI)
