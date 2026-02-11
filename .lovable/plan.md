

## Fix: Bucle infinito de renders en LMSCursoWizard

### Problema

El wizard no renderiza los nuevos features (AIFullCourseGenerator, banner removido) porque hay un error critico de **Maximum update depth exceeded** que crashea el componente.

### Causa raiz

En `LMSCursoWizard.tsx`, tres `useEffect` sincronizan datos con el draft:

```text
useEffect -> updateData({ modulos }) -> setState -> re-render -> updateData identity changes -> useEffect fires again -> LOOP
```

La cadena de dependencias inestables:
- `updateData` depende de `scheduleSave`
- `scheduleSave` depende de `saveToStorage`  
- `saveToStorage` depende de `draftId` (state)
- Cuando `saveToStorage` asigna `draftId` por primera vez (linea 309), se recrea, lo que recrea `scheduleSave`, que recrea `updateData`, que dispara los useEffects de nuevo

### Solucion

Modificar `LMSCursoWizard.tsx` para **estabilizar las llamadas a updateData** usando refs en lugar de depender de la identidad de `updateData` en los useEffects:

**Archivo: `src/components/lms/admin/LMSCursoWizard.tsx`**

1. Crear un `ref` para `updateData` que se mantenga estable:
```typescript
const updateDataRef = useRef(persistence.updateData);
useEffect(() => { updateDataRef.current = persistence.updateData; });
```

2. Reescribir los 3 useEffects (lineas 128-143) para usar el ref en lugar de la funcion directa:
```typescript
// Sync form changes — ya usa subscription, no necesita updateData en deps
useEffect(() => {
  const subscription = form.watch((values) => {
    updateDataRef.current({ formValues: values as CursoSchemaType });
  });
  return () => subscription.unsubscribe();
}, [form]); // Remove updateData from deps

// Sync modulos
useEffect(() => {
  updateDataRef.current({ modulos });
}, [modulos]); // Remove updateData from deps

// Sync step
useEffect(() => {
  updateDataRef.current({ step });
}, [step]); // Remove updateData from deps
```

### Resultado esperado

- El bucle infinito se elimina
- El componente renderiza correctamente
- Se muestra el `AIFullCourseGenerator` en Step 1
- Se muestra el formulario sin el banner viejo "Asistente de IA disponible"
- El auto-save sigue funcionando correctamente

### Archivos a modificar
- `src/components/lms/admin/LMSCursoWizard.tsx` (estabilizar useEffects)

### Riesgo
Bajo. Solo cambia como se referencian las funciones en los effects, no la logica de persistencia.
