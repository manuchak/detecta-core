

## Fix: Loop Infinito de "Guardando..." en Formularios Vacios

### Problema

Cuando el formulario del wizard esta vacio (sin titulo ni modulos), el indicador "Guardando..." se queda en loop infinito. La causa:

1. Los efectos de sincronizacion (`step`, `modulos`, `formValues`) disparan `scheduleSave`
2. `scheduleSave` pone `hasUnsavedChanges = true` inmediatamente
3. Cuando el debounce expira, `saveToStorage` verifica `isMeaningful(data)` y retorna `false` (datos vacios)
4. `saveToStorage` sale sin ejecutar `setHasUnsavedChanges(false)`
5. El indicador muestra "Guardando..." indefinidamente

### Sobre el curso generado

El curso que se genero con IA fue victima de la race condition que se corrigio en el commit anterior. El borrador en localStorage ya perdio los modulos antes del fix. La solucion es limpiar el borrador corrupto y regenerar el curso -- el fix ya aplicado evitara que vuelva a ocurrir.

### Solucion

En `saveToStorage`, cuando `isMeaningful` retorna `false`, resetear el flag `hasUnsavedChanges` antes de salir:

```typescript
const saveToStorage = useCallback((dataToSave: T, forceDraftId?: string) => {
    if (!enabled || !isMeaningful(dataToSave)) {
      setHasUnsavedChanges(false); // <-- NUEVO: reset flag para datos no significativos
      return;
    }
    // ... resto igual
```

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useFormPersistence.ts` | Agregar `setHasUnsavedChanges(false)` en el early return de `saveToStorage` cuando `isMeaningful` es false (1 linea) |

### Resultado

- Formularios vacios: el indicador no muestra "Guardando..." -- muestra nada (correcto, no hay nada que guardar)
- Formularios con datos: el flujo sigue funcionando igual (save exitoso pone `hasUnsavedChanges=false`)
- Para el curso perdido: limpiar el borrador y regenerar con IA, esta vez los modulos se persistiran correctamente gracias al fix de `dataRef` sincrono

