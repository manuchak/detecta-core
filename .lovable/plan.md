

## Evaluacion UX/UI - Motor de Diseno Instruccional con IA (Fases 1-6)

### Perspectiva: Product Designer evaluando coherencia, usabilidad y friccion

---

### 1. MAPA DE EXPERIENCIA DEL USUARIO

El wizard tiene 4 pasos: Identidad, Estructura, Configuracion, Vista Previa. Los features de IA se distribuyen asi:

```text
PASO 1 (Identidad)                   PASO 2 (Estructura)                 PASO 3 (Config)
+----------------------------+       +----------------------------+       +----------------------------+
| [Curso Completo con IA]   |       | [Generar estructura IA]    |       | Clasificacion              |
|  tema + rol + duracion     |       | Banner + boton             |       | Estrategia Evaluacion      |
|                            |       |                            |       |  - Slider aprobacion       |
| [Banner IA disponible]    |       | Stats bar (modulos/min)    |       |  - Slider intentos         |
|                            |       |                            |       |  - Toggle aleatorizar      |
| Codigo + Titulo + IA btn  |       | ModuleOutlineCard x N      |       |  - Toggle respuestas       |
| Sugerencia IA (aceptar)   |       |  > Objetivos aprendizaje   |       |  - [Recomendar con IA]     |
|                            |       |  > ContentOutlineItem x N  |       |                            |
| Descripcion               |       |    > ContentEditor         |       | Audiencia (roles)          |
| Imagen portada             |       |      > InlineQuizEditor   |       | Plazos                     |
+----------------------------+       |      > InlineFlashcardEditor      +----------------------------+
                                     |      > VideoScriptGenerator|
                                     |    > QuickContentCreator   |
                                     +----------------------------+
```

---

### 2. HALLAZGOS POSITIVOS (Lo que funciona bien)

**A. Progresion clara del wizard**
- La barra de progreso y los step indicators dan orientacion constante
- El auto-save con indicador "Guardado automaticamente" genera confianza
- DraftRestoreBanner para recuperar sesiones interrumpidas es excelente

**B. Patron consistente de IA**
- Todos los botones de IA usan el mismo patron visual: icono Sparkles + "Generar con IA"
- El componente AISuggestionCard permite aceptar/rechazar/regenerar de forma uniforme
- Los loading states son claros con spinners y textos descriptivos

**C. Jerarquia visual en Step 2**
- Los ModuleOutlineCard con drag-and-drop, expand/collapse y stats inline son intuitivos
- Los tipos de contenido tienen color-coding consistente (rojo=video, azul=doc, verde=texto, morado=quiz, naranja=interactivo)
- La QuickContentCreator con seleccion de tipo en grid de 5 es eficiente

**D. Full Course Generator (Fase 4)**
- El indicador de progreso paso a paso con porcentaje es excelente para operaciones largas
- La tolerancia a fallos parciales evita frustacion: si falla un quiz, continua con el siguiente
- El auto-avance a Step 2 tras completar da un flujo natural de "revisar lo generado"

---

### 3. PROBLEMAS DE UX IDENTIFICADOS

**CRITICO: Sobrecarga de IA en Step 1**

Step 1 (Identidad) tiene DOS mecanismos de IA compitiendo por atencion:
1. `AIFullCourseGenerator` (genera TODO el curso)
2. Banner "Asistente IA" + boton "Generar con IA" junto al titulo (genera solo metadata)

Problema: Un usuario nuevo no sabe cual usar. Si usa el Full Course Generator, el banner de metadata queda redundante. Si empieza llenando manualmente y luego ve el Full Generator, podria perder lo escrito.

Recomendacion: Hacer el Full Generator colapsable por defecto, o usar un patroon de "eleccion de camino" al inicio: "Quieres crear desde cero o generar con IA?" Dos cards grandes lado a lado.

---

**ALTO: Falta de contexto en editores inline**

En `ContentEditor.tsx` lineas 227-232 y 235-242, los editores de quiz y flashcards se renderizan con props vacias:
```
moduloTitulo=""
cursoTitulo=""
```

Esto significa que cuando el usuario genera preguntas de quiz o flashcards desde el ContentEditor, la IA NO recibe contexto del modulo ni del curso. Las preguntas generadas seran genericas ("Seguridad y custodia" como fallback). El mismo problema no existe en QuickContentCreator que si pasa `moduloTitulo` y `cursoTitulo`.

Recomendacion: Pasar el contexto real del modulo y curso al ContentEditor. Requiere propagarlo desde ModuleOutlineCard -> ContentOutlineItem -> ContentEditor.

---

**ALTO: VideoScriptGenerator tiene el mismo problema de contexto**

En ContentEditor linea 177-180:
```
cursoTitulo=""
moduloTitulo=""
```

El generador de guion de video no recibe contexto, produciendo scripts desconectados del curso.

---

**MEDIO: "Cancelar" en Full Course Generator no cancela realmente**

El `handleCancel` en AIFullCourseGenerator solo cambia estados locales (`setLoading(false)`), pero no cancela la promesa de `supabase.functions.invoke` que sigue ejecutandose en background. El usuario ve que "se cancelo" pero las llamadas siguen corriendo y podrían generar errores silenciosos.

Recomendacion: Implementar AbortController para cancelar las llamadas fetch realmente, o al minimo ignorar resultados post-cancelacion con un ref `isCancelled`.

---

**MEDIO: No hay preview del contenido generado por IA**

Cuando el Full Course Generator termina, avanza a Step 2 donde el usuario ve modulos colapsados. Para revisar el contenido generado (texto HTML, preguntas de quiz, flashcards), debe hacer click en cada modulo, luego en cada contenido, luego en "editar". Son 3 niveles de profundidad para verificar lo que la IA genero.

Recomendacion: Tras la generacion completa, expandir automaticamente los modulos y mostrar un resumen rapido de lo generado: "3 modulos, 8 textos, 2 quizzes (10 preguntas), 12 flashcards".

---

**MEDIO: Slider de duracion en Full Generator no muestra granularidad**

El slider va de 30-180 min con step de 15, pero no hay marcas visuales ni labels intermedios. El usuario solo ve "60 min" como valor actual. Para una Training Manager no tecnica, no es claro que significa "60 min" en terminos de estructura (cuantos modulos saldran, cuantos videos).

Recomendacion: Agregar una estimacion dinamica debajo: "~3-4 modulos, ~8-12 contenidos" basada en la duracion seleccionada.

---

**MEDIO: Evaluacion Strategy sin conexion visible con quizzes reales**

La seccion de "Estrategia de Evaluacion" en Step 3 configura sliders para porcentaje, intentos, etc., pero no hay indicacion visual de cuantos quizzes existen en el curso ni si estas configuraciones se aplicaran a algo real. Si el curso no tiene quizzes, esta seccion entera es irrelevante pero se muestra igual.

Recomendacion: Mostrar un badge "Se aplicara a X quizzes" contando los contenidos tipo quiz en los modulos. Si hay 0 quizzes, mostrar un aviso sutil.

---

**BAJO: Inconsistencia en tamanos de texto y spacing**

- InlineQuizEditor usa `text-[10px]` y `text-[11px]` extensivamente (lineas 177, 180, 223)
- InlineFlashcardEditor usa `text-xs` consistentemente
- VideoScriptGenerator usa `text-[10px]` para sub-labels
- StepConfiguracion usa `text-[11px]` para slider labels

Esto crea una inconsistencia visual micro que, en conjunto, da sensacion de "no pulido".

Recomendacion: Estandarizar en `text-xs` (12px) como minimo legible y `text-[11px]` solo para hints muy secundarios.

---

**BAJO: Emojis en VideoScriptGenerator**

Lineas 107, 129, 154 usan emojis (nota_de_prensa, robot, clipboard) mientras el resto del sistema usa iconos Lucide consistentemente. Esto rompe el lenguaje visual "Apple-inspired" del sistema.

Recomendacion: Reemplazar emojis con iconos Lucide semanticos (FileText, Bot, ClipboardList).

---

### 4. OPORTUNIDADES DE MEJORA UX

**A. Flujo de "Camino Guiado" vs "Experto"**

Actualmente todos los usuarios ven el mismo wizard. Una Training Manager que crea su primer curso necesita guidance; una que crea el curso 20 necesita velocidad.

Propuesta: Al inicio del wizard, ofrecer dos caminos:
- "Rapido con IA" - Full Course Generator prominente, genera todo y va directo a revision
- "Paso a paso" - El wizard actual con los formularios manuales y IA opcional

---

**B. Feedback loop de calidad**

No hay forma de que la Training Manager indique si la generacion fue buena o mala. Despues de aceptar una sugerencia, se pierde la oportunidad de mejorar el prompt.

Propuesta: Agregar un micro-feedback despues de generaciones IA (thumbs up/down) que se logge para analisis.

---

**C. Template Library**

El Full Course Generator siempre empieza de cero. Para cursos comunes (onboarding, compliance vehicular), deberia haber templates pre-armados que la Training Manager pueda elegir y personalizar.

---

### 5. RESUMEN DE PRIORIDADES

| # | Problema | Severidad | Esfuerzo | Accion |
|---|---|---|---|---|
| 1 | Props vacias en ContentEditor (moduloTitulo, cursoTitulo) | ALTO | Bajo | Propagar contexto desde ModuleOutlineCard |
| 2 | Props vacias en VideoScriptGenerator dentro de ContentEditor | ALTO | Bajo | Misma propagacion de contexto |
| 3 | Sobrecarga de IA en Step 1 | CRITICO UX | Medio | Redisenar como eleccion de camino |
| 4 | Cancel no cancela realmente | MEDIO | Bajo | AbortController o ref guard |
| 5 | Sin preview post-generacion | MEDIO | Medio | Auto-expand + summary card |
| 6 | Assessment sin conexion a quizzes reales | MEDIO | Bajo | Badge conteo dinamico |
| 7 | Emojis en VideoScriptGenerator | BAJO | Bajo | Reemplazar con Lucide icons |
| 8 | Inconsistencia text sizes | BAJO | Bajo | Estandarizar a text-xs minimo |

### Recomendacion inmediata

Resolver primero los items 1-2 (contexto vacio en editores) porque afectan directamente la calidad de la IA, que es el core value de toda la feature. Luego abordar item 3 (sobrecarga Step 1) para mejorar el first-time experience.

