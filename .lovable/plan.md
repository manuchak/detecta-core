

# Fix: 3 bugs en implementacion reciente

## Bug 1 — Memory leak en PhotoSlot.tsx

**Problema**: `URL.createObjectURL` nunca se revoca porque el cleanup `return () => URL.revokeObjectURL(url)` esta dentro de la funcion async `loadPreview`, no en el `useEffect`.

**Solucion**: Reestructurar el useEffect para trackear la URL creada y revocarla en el cleanup del effect.

```text
// Patron corregido:
useEffect(() => {
  let objectUrl: string | null = null;

  const loadPreview = async () => {
    if (foto?.localBlobId) {
      const photoBlob = await getPhotoBlob(foto.localBlobId);
      if (photoBlob) {
        objectUrl = URL.createObjectURL(photoBlob.blob);
        setPreviewUrl(objectUrl);
      }
    } else if (foto?.url) {
      setPreviewUrl(foto.url);
    } else {
      setPreviewUrl(null);
    }
  };

  loadPreview();

  return () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [foto]);
```

## Bug 2 — Mensajes de progreso misleading en useServiceChecklist.ts

**Problema**: `reportProgress('Obteniendo ubicacion...')` se muestra ANTES del `Promise.all`, pero la compresion aun esta corriendo. El usuario ve "Obteniendo ubicacion" cuando realmente esta comprimiendo la foto.

**Solucion**: Usar un solo mensaje durante la fase paralela: `'Procesando foto y ubicacion...'`, y mostrar "Guardando..." solo despues de que ambas operaciones terminen.

```text
// Antes:
reportProgress('Procesando foto...');
// ... compressionPromise
reportProgress('Obteniendo ubicacion...');  // <-- misleading
// ... gpsPromise
const [compressed, coords] = await Promise.all([...]);

// Despues:
reportProgress('Procesando foto y ubicacion...');
// ... compressionPromise + gpsPromise
const [compressed, coords] = await Promise.all([...]);
reportProgress('Guardando...');
```

## Bug 3 — Dependencia faltante en useMemo de LiberacionChecklistModal.tsx

**Problema**: `docPrefillData` en linea 165 usa `liberacion.tipo_operativo` para decidir que documentos mapear (armado vs no-armado), pero el array de dependencias solo tiene `[documentosExistentes]`.

**Solucion**: Agregar `liberacion.tipo_operativo` al array de dependencias.

```text
}, [documentosExistentes, liberacion.tipo_operativo]);
```

## Archivos a modificar

| Archivo | Cambio | Lineas |
|---------|--------|--------|
| `src/components/custodian/checklist/PhotoSlot.tsx` | Fix memory leak en useEffect | 36-53 |
| `src/hooks/useServiceChecklist.ts` | Corregir mensajes de progreso paralelo | 166, 190 |
| `src/components/liberacion/LiberacionChecklistModal.tsx` | Agregar dependencia tipo_operativo a useMemo | 185 |

Tres cambios quirurgicos, sin impacto en funcionalidad.

