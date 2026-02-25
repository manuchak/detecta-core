

# Fix: Botón "Continuar" no navega al siguiente contenido

## Problema

Cuando el alumno termina un quiz y hace clic en "Continuar", el sistema solo marca el contenido como completado pero **no navega al siguiente contenido**. El usuario se queda viendo la misma pantalla de resultados.

La cadena actual es:
1. QuizResults -> `onContinuar` -> QuizComponent `handleContinuar` -> `onComplete()`
2. CursoViewer `handleComplete` -> solo llama `marcarCompletado.mutate()`
3. No hay navegacion automatica

## Solucion

Modificar `handleComplete` en `CursoViewer.tsx` para que, despues de marcar como completado, avance automaticamente al siguiente contenido disponible.

## Cambios

### Archivo: `src/pages/LMS/CursoViewer.tsx`

Modificar `handleComplete` (lineas 140-147) para que despues de marcar completado, navegue al siguiente contenido:

```tsx
const handleComplete = () => {
  if (contenidoActualId && inscripcion?.id && contenidoActual) {
    marcarCompletado.mutate({ 
      contenidoId: contenidoActualId,
      tipoContenido: contenidoActual.tipo
    }, {
      onSuccess: () => {
        // Auto-avanzar al siguiente contenido
        if (hasNext) {
          setContenidoActualId(todosLosContenidos[indiceActual + 1].id);
        }
      }
    });
  }
};
```

Esto asegura que:
- Despues de completar un quiz y hacer clic en "Continuar", el alumno avanza al siguiente contenido
- Despues de completar cualquier otro tipo de contenido (video, documento, texto, flashcards), tambien avanza
- Si es el ultimo contenido del curso, se queda en la misma pantalla (donde vera el mensaje de curso completado)
- La navegacion solo ocurre despues de que el servidor confirme el completado (`onSuccess`)

### Archivo: `src/components/lms/QuizComponent.tsx`

Sin cambios necesarios -- la cadena `onContinuar -> onComplete` ya funciona correctamente. El problema estaba solo en el handler final.

## Archivos a modificar

| Archivo | Accion |
|---|---|
| `src/pages/LMS/CursoViewer.tsx` | Agregar auto-navegacion en `handleComplete` con `onSuccess` callback |

