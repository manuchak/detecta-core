

# Evaluacion Completa del Modulo de Checklist — Bugs y Riesgos

## Bugs Confirmados

### Bug 1 — Race condition en PhotoSlot (memory leak persiste)

**Archivo**: `src/components/custodian/checklist/PhotoSlot.tsx` (lineas 36-58)

El fix anterior del memory leak tiene una race condition. La variable `objectUrl` se asigna dentro de `loadPreview` (asincrona), pero el cleanup captura la referencia por closure. Si el componente se desmonta ANTES de que `loadPreview` termine, `objectUrl` sigue siendo `null` al momento del cleanup, y el URL creado nunca se revoca.

**Solucion**: Usar una ref o un flag `cancelled` para manejar correctamente la limpieza asincrona:

```text
useEffect(() => {
  let cancelled = false;
  let objectUrl: string | null = null;

  const loadPreview = async () => {
    if (foto?.localBlobId) {
      const photoBlob = await getPhotoBlob(foto.localBlobId);
      if (photoBlob && !cancelled) {
        objectUrl = URL.createObjectURL(photoBlob.blob);
        setPreviewUrl(objectUrl);
      }
    } else if (foto?.url) {
      if (!cancelled) setPreviewUrl(foto.url);
    } else {
      if (!cancelled) setPreviewUrl(null);
    }
  };

  loadPreview();

  return () => {
    cancelled = true;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [foto]);
```

Ademas, cuando se carga una foto nueva (el `foto` cambia), el objectUrl anterior no se revoca porque el efecto anterior ya termino y el nuevo efecto crea un nuevo `objectUrl`. Se necesita revocar el URL previo al inicio del efecto.

### Bug 2 — SignaturePad no restaura firma de borrador

**Archivo**: `src/components/custodian/checklist/SignaturePad.tsx` (linea 54)

El `useEffect` que carga la firma tiene `[]` como dependencias pero usa `value`. Cuando el wizard restaura un borrador y pasa el `value` de la firma guardada, el canvas no se actualiza porque el efecto solo corre una vez al montar. Si el componente monta antes de que el borrador cargue, la firma nunca se dibuja.

**Solucion**: Cambiar dependencias a `[value]` y limpiar el canvas antes de redibujar, con un guard para evitar loop infinito (solo redibujar si el value es diferente del estado actual del canvas).

### Bug 3 — reportProgress duplicado

**Archivo**: `src/hooks/useServiceChecklist.ts` (lineas 198 y 235)

`reportProgress('Guardando...')` se llama dos veces: en linea 198 (despues del Promise.all) y en linea 235 (antes de savePhotoBlob). Es redundante — el segundo sobreescribe al primero sin efecto visible, pero es codigo muerto.

**Solucion**: Eliminar la linea 198 y dejar solo la de linea 235.

### Bug 4 — Interval leak en useOfflineSync

**Archivo**: `src/hooks/useOfflineSync.ts` (linea 205)

`setInterval(checkCompletion, 1000)` se crea dentro del callback `syncAll` sin ningun mecanismo de limpieza. Si `syncAll` se llama multiples veces (ej: conexion intermitente), se acumulan intervals que nunca se limpian. Ademas, si el componente se desmonta mientras el interval esta corriendo, sigue ejecutandose.

**Solucion**: Usar `setTimeout` recursivo en lugar de `setInterval`, o almacenar el interval en una ref para limpiarlo en el unmount.

### Bug 5 — capturePhoto tiene dependencias excesivas que causan re-renders

**Archivo**: `src/hooks/useServiceChecklist.ts` (linea 284)

El `useCallback` de `capturePhoto` depende de `[items, observaciones, firma]` solo porque llama `saveDraft` al final (lineas 272-280). Esto significa que cada cambio en observaciones/firma/items recrea `capturePhoto`, causando que los 4 `PhotoSlot` se re-rendericen innecesariamente.

**Solucion**: Usar una ref para `items`, `observaciones` y `firma` dentro del saveDraft call, o extraer el saveDraft a una funcion separada con sus propias refs.

## Riesgos de Estabilidad (no son bugs pero pueden causar fallas)

### Riesgo 1 — Fotos huerfanas en IndexedDB

No hay mecanismo para limpiar blobs de fotos de servicios anteriores ya sincronizados. Con el tiempo, IndexedDB crece hasta que el navegador hace eviction (especialmente en iOS Safari), potencialmente borrando datos del servicio actual.

### Riesgo 2 — Firma base64 puede ser muy grande

`SignaturePad` exporta como PNG data URL sin compresion. En dispositivos de alta densidad (3x DPR), el canvas es 3x mas grande, generando strings base64 de 200KB+. Esto se almacena directamente en la columna `firma_base64` de la BD.

### Riesgo 3 — Sin validacion de tipo MIME real

`PhotoSlot` acepta `accept="image/*"` pero no valida que el archivo sea realmente una imagen. Un archivo renombrado a .jpg pasaria el filtro HTML pero fallaria silenciosamente en la compresion.

## Plan de Correccion

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `PhotoSlot.tsx` | Fix race condition con flag `cancelled` + revocar URL previo | P1 |
| `SignaturePad.tsx` | Agregar `value` a dependencias del useEffect con guard anti-loop | P1 |
| `useServiceChecklist.ts` | Eliminar reportProgress duplicado (linea 198), usar refs para deps de capturePhoto | P2 |
| `useOfflineSync.ts` | Reemplazar setInterval con setTimeout recursivo + cleanup | P2 |

Total: 4 archivos, correcciones quirurgicas sin cambios funcionales.

