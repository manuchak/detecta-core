

# Validación de datos mínimos para Checkpoint: Coordenadas + Foto obligatorios

## Problema actual
El formulario de checkpoint permite enviar solo con descripción o foto. No exige coordenadas ni foto como datos mínimos.

## Cambio

En `src/components/monitoring/bitacora/CheckpointPopover.tsx`:

1. **Cambiar validación del botón "Enviar Checkpoint"** (línea 203): El botón debe estar deshabilitado si no hay coordenadas válidas O no hay al menos 1 foto.
2. **Cambiar validación en `handleSubmit`** (línea 104): Mostrar mensaje de error específico indicando qué falta (coordenadas o foto).
3. **Indicadores visuales**: Agregar borde rojo/asterisco en los campos de coordenadas y foto para indicar que son obligatorios.

### Lógica de validación
```
const coordsValid = parseCoords(coords) !== null;
const hasPhotos = photos.length > 0;
const canSubmit = coordsValid && hasPhotos && !busy;
```

El botón se deshabilita si falta coordenadas o foto. La descripción pasa a ser opcional.

| Archivo | Cambio |
|---|---|
| `CheckpointPopover.tsx` línea 104 | Validar coords + foto obligatorios |
| `CheckpointPopover.tsx` línea 203 | Deshabilitar botón si falta coords o foto |
| `CheckpointPopover.tsx` | Agregar indicadores visuales de campos requeridos |

