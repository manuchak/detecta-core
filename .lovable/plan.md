

## Fix: Race Condition en Persistencia que Pierde Modulos Generados

### Causa raiz

En `useFormPersistence.ts`, la funcion `updateData` lee de `dataRef.current` para hacer el merge:

```typescript
const updateData = useCallback((updates: Partial<T>) => {
    const newData = { ...dataRef.current, ...updates };
    setDataInternal(newData);
    scheduleSave(newData);
}, [scheduleSave]);
```

Pero `dataRef` solo se actualiza en un `useEffect` (asincrono):

```typescript
useEffect(() => {
    dataRef.current = data;  // se ejecuta DESPUES del render
}, [data]);
```

Cuando la generacion AI termina, tres updates ocurren casi simultaneamente:

```text
updateData({ modulos: [3 modulos...] })   --> dataRef = { modulos: [], step: 1 } --> merge = { modulos: [...], step: 1 }
updateData({ step: 2 })                   --> dataRef = { modulos: [], step: 1 } --> merge = { modulos: [], step: 2 }  <-- BUG
```

La segunda llamada lee el ref viejo (modulos: []) y sobreescribe los modulos. El debounce cancela la primera save y solo ejecuta la ultima, que tiene modulos vacios.

### Solucion

Actualizar `dataRef.current` de forma **sincrona** dentro de `updateData`, antes del `setDataInternal`:

```typescript
const updateData = useCallback((updates: Partial<T>) => {
    const newData = { ...dataRef.current, ...updates };
    dataRef.current = newData;  // sync update - prevents race conditions
    setDataInternal(newData);
    scheduleSave(newData);
}, [scheduleSave]);
```

Lo mismo para `setData`:

```typescript
const setData = useCallback((newData: T) => {
    dataRef.current = newData;  // sync update
    setDataInternal(newData);
    scheduleSave(newData);
}, [scheduleSave]);
```

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useFormPersistence.ts` | Agregar `dataRef.current = newData` sincrono en `updateData` y `setData` (2 lineas) |

### Resultado

Los tres updates consecutivos ahora se acumulan correctamente:

```text
updateData({ modulos: [...] })  --> dataRef sincronizado = { modulos: [...], step: 1 }
updateData({ step: 2 })        --> dataRef sincronizado = { modulos: [...], step: 2 }  <-- correcto
```

La estructura generada por IA se persiste correctamente y se muestra al regresar al paso 2.

