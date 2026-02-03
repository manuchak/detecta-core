
# Plan: Adaptar Mapa al Viewport Sin Scroll

## Problema Identificado

El mapa tiene altura fija de `500px` que causa scroll vertical cuando el viewport no es suficientemente alto. Con el 70% de zoom global y todos los elementos de navegacion, el espacio disponible es limitado.

## Solucion

Cambiar la altura fija a una altura dinamica basada en el viewport disponible usando `calc(100vh - offset)`.

## Calculo del Offset

```text
SimplifiedTopBar:     48px (3rem)
Tabs de navegacion:   ~48px
Header seccion:       ~60px
Metricas grid:        ~100px
CardHeader del mapa:  ~56px
Footer info:          ~32px
Padding/gaps:         ~56px
────────────────────────────
Total offset:         ~400px
```

## Implementacion

### CustodianZoneBubbleMap.tsx

Agregar soporte para altura responsiva:

```tsx
interface CustodianZoneBubbleMapProps {
  estadisticasZona: [string, number][];
  height?: number | string; // Permitir string para valores como 'auto' o calc()
}

// En el componente, cambiar:
style={{ height: typeof height === 'number' ? height : height }}
```

### CustodiosZonasTab.tsx

Usar altura calculada basada en viewport:

```tsx
// Antes
<CustodianZoneBubbleMap estadisticasZona={estadisticasZona} height={500} />

// Despues
<CustodianZoneBubbleMap 
  estadisticasZona={estadisticasZona} 
  height="calc(100vh - 400px)" 
/>
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `CustodianZoneBubbleMap.tsx` | Permitir height string, ajustar min-height |
| `CustodiosZonasTab.tsx` | Usar altura dinamica `calc(100vh - 400px)` |

## Ajustes Adicionales

- Agregar `min-h-[280px]` para evitar que el mapa sea demasiado pequeno en viewports muy reducidos
- El contenedor del mapa y la leyenda usaran `flex-1` con la altura calculada
