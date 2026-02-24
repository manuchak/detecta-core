
# Solucion definitiva para el mapa de Rutas y Zonas

## Diagnostico raiz

El mapa de Mapbox no renderiza tiles (area blanca) a pesar de que:
- El contenedor tiene dimensiones visibles (la leyenda y controles se muestran)
- El token se carga correctamente (`mapReady = true`)
- Los `resize()` escalonados se ejecutan

El problema es una combinacion de dos factores:

### 1. CSS Grid no propaga altura a hijos con `h-full`

El grid en `RouteRiskIntelligence` usa `flex-1` para obtener altura, pero **no tiene `grid-template-rows: 1fr`**. Sin esto, la fila del grid es `auto` y su altura se basa en el contenido. Como el contenido del mapa es `absolute inset-0` (no contribuye altura), la celda colapsa a `min-h-[420px]` en vez de llenar el espacio disponible. Y `h-full` en el wrapper no se resuelve correctamente dentro de una celda grid con altura `auto`.

### 2. `absolute inset-0` es fragil con `zoom: 1`

El patron `absolute inset-0` para el canvas de Mapbox depende de que el padre tenga dimensiones explicitas. Con `zoom: 1` neutralizando el zoom global de 0.7, las dimensiones reportadas al canvas pueden ser inconsistentes. El componente `IncidentesMap` (que SI funciona) usa un patron diferente: **altura explicita** + `w-full h-full` sin posicionamiento absoluto.

## Solucion: Alinear con el patron que funciona

Replicar el patron probado de `IncidentesMap` pero con altura dinamica en vez de fija.

### Cambio 1: `RouteRiskIntelligence.tsx`

- Agregar `grid-template-rows: 1fr` al grid para que la fila se estire
- Eliminar `h-full` del wrapper del mapa (el grid stretch lo maneja)
- Mantener `min-h-[420px]` como fallback

```tsx
// Grid con row explicita
<div 
  className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3 flex-1 min-h-0 mt-1" 
  style={{ minHeight: 0, gridTemplateRows: '1fr' }}
>
  <div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[420px]" style={{ zoom: 1 }}>
```

### Cambio 2: `RiskZonesMap.tsx`

- Cambiar el map container de `absolute inset-0` a `w-full h-full` (patron de IncidentesMap)
- Esto elimina la dependencia de que el padre tenga un height explicitamente computado

```tsx
// Antes:
<div ref={mapContainer} className="absolute inset-0 rounded-lg" />

// Despues:
<div ref={mapContainer} className="w-full h-full rounded-lg" />
```

### Cambio 3: Resolver el error de build `gl-matrix`

Agregar `skipLibCheck: true` a `tsconfig.node.json` para eliminar los errores de tipado de `gl-matrix` (dependencia transitiva de `mapbox-gl`) que aparecen en el build.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/security/routes/RouteRiskIntelligence.tsx` | Agregar `gridTemplateRows: '1fr'`, quitar `h-full` del wrapper |
| `src/components/security/map/RiskZonesMap.tsx` | Map div: `absolute inset-0` -> `w-full h-full` |
| `tsconfig.node.json` | Agregar `skipLibCheck: true` |

## Por que esta vez es definitiva

1. Replica el patron exacto de `IncidentesMap` que funciona correctamente en produccion
2. `gridTemplateRows: '1fr'` garantiza que la fila del grid se estire al espacio disponible
3. `w-full h-full` no depende de que el padre tenga un height computado explicito como `absolute inset-0`
4. El `zoom: 1` se mantiene para neutralizar el zoom global, pero ya no hay dependencia de posicionamiento absoluto para el canvas
