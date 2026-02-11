

## Fix: Post-Generacion -- Transicion Clara al Contenido Generado

### Problema

Despues de que la IA genera el curso completo, ocurre lo siguiente:
1. El toast "Curso generado: 3 modulos, 5 contenidos" aparece brevemente en la esquina inferior
2. `setStep(2)` avanza al paso "Estructura" automaticamente
3. Pero la transicion es tan rapida y silenciosa que el usuario NO se da cuenta de que cambio de paso
4. El usuario queda desorientado: no sabe que se creo, donde esta, ni como editar el contenido

### Solucion

Mejorar la transicion post-generacion con dos cambios:

**A. Mostrar estado de exito en el generador antes de avanzar**

En lugar de llamar `setStep(2)` inmediatamente en el `onComplete`, agregar un breve estado de exito (1.5s) dentro del `AIFullCourseGenerator` que muestre un resumen visual de lo generado ANTES de disparar el avance. Esto da al usuario un momento para procesar que la generacion termino.

```text
+--------------------------------------------------+
| [check verde] Curso generado exitosamente        |
|                                                  |
| 3 modulos  |  5 contenidos  |  45 min            |
|                                                  |
| [ Revisar estructura --> ]                       |
+--------------------------------------------------+
```

**B. Banner de exito en StepEstructura**

Agregar un banner temporal en el paso 2 que confirme al usuario que esta viendo el contenido recien generado y que puede editarlo. Esto se controla con un prop `fromAIGeneration` o estado en el wizard.

```text
+--------------------------------------------------+
| [sparkles] Curso generado con IA                 |
| Revisa la estructura y edita lo que necesites.   |
| Los textos, quizzes y flashcards ya fueron       |
| generados dentro de cada contenido.              |
+--------------------------------------------------+
```

### Cambios tecnicos

| Archivo | Cambio |
|---------|--------|
| `AIFullCourseGenerator.tsx` | Agregar estado `completed` con resumen visual y boton "Revisar estructura" que dispara `onComplete` |
| `LMSCursoWizard.tsx` | Agregar flag `aiGenerated` para pasar a StepEstructura |
| `StepEstructura.tsx` | Recibir prop `fromAIGeneration` y mostrar banner de orientacion temporal |

### Detalle de cambios

**1. AIFullCourseGenerator.tsx**

Nuevo estado `completed` con los datos generados almacenados temporalmente:

```typescript
const [completedData, setCompletedData] = useState<{
  modulos: number;
  contenidos: number;
  duracion: number;
} | null>(null);
```

Cuando la generacion termina, en lugar de llamar `onComplete` inmediatamente:
- Guardar los datos generados en un ref
- Mostrar la vista de exito con el resumen
- El boton "Revisar estructura" llama a `onComplete` con los datos almacenados

La vista de progreso actual (linea 430-468) se extiende con un tercer estado: completado.

**2. LMSCursoWizard.tsx**

Agregar `const [aiGenerated, setAiGenerated] = useState(false)` que se activa en el callback de `onFullCourseGenerated` justo antes de `setStep(2)`.

**3. StepEstructura.tsx**

Recibir `fromAIGeneration?: boolean` como prop. Si es true, mostrar un banner de orientacion arriba del builder con un boton para descartarlo. El banner se oculta automaticamente despues de 10 segundos o al hacer clic en "Entendido".

### Resultado esperado

El flujo post-generacion sera:
1. Barra de progreso llega a 100% con "Curso generado!"
2. Se muestra resumen: "3 modulos, 5 contenidos, 45 min" con boton prominente "Revisar estructura"
3. Al hacer clic, avanza al paso 2 con un banner que dice "Revisa y edita la estructura generada por IA"
4. El usuario ve inmediatamente los modulos y contenidos editables

