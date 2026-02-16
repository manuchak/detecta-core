
# Fix: Mapa expandido no llena el ancho completo

## Causa raiz

El sitio tiene `zoom: 0.7` global en el `html`. Los dialogs compensan con `zoom: 1.428571` (1/0.7) para volver al 100%. Pero el dialog del mapa expandido usa `style={{ zoom: 1 }}`, lo que resulta en un zoom efectivo de 0.7. Mapbox GL lee el `offsetWidth` del contenedor (afectado por el zoom CSS) y solo renderiza tiles para el 70% del area visible. Por eso el mapa ocupa ~70% y hay un espacio blanco a la derecha.

## Solucion

Remover el override `zoom: 1` del `DialogContent` del mapa expandido, dejando que use el `zoom: 1.428571` por defecto del componente `Dialog`. Esto restaura el zoom efectivo al 100% y Mapbox calculara las dimensiones correctamente.

## Cambio

**Archivo: `src/components/monitoring/incidents/LocationPicker.tsx`** (linea 319)

Cambiar:
```tsx
<DialogContent className="max-w-4xl !flex !flex-col overflow-hidden" style={{ zoom: 1, height: '85vh' }}>
```

A:
```tsx
<DialogContent className="max-w-4xl !flex !flex-col overflow-hidden" style={{ height: '85vh' }}>
```

Se elimina `zoom: 1` del style, permitiendo que el dialog use su zoom compensatorio por defecto (1.428571). Esto hace que el zoom efectivo sea `0.7 x 1.428571 = 1.0` (100%), y Mapbox renderizara correctamente el canvas al 100% del contenedor.

Un solo cambio en una sola linea.
