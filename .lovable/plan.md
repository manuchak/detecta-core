

# Analisis Fishbone: Por que el mapa no se renderiza

## Diagrama Causa-Raiz

```text
                                    MAPA NO SE RENDERIZA
                                           |
        +------------------+---------------+---------------+------------------+
        |                  |               |               |                  |
   CSS ZOOM           LAYOUT          MAPBOX GL       ARQUITECTURA      EVIDENCIA
   CONFLICT           CHAIN           INTERNALS       DEL PROYECTO      CONTRARIA
        |                  |               |               |                  |
  zoom:1/0.7 en      TabsContent     Canvas calcula   Otros mapas       Los tiles SI
  SecurityPage        no propaga      pixeles con      funcionan SIN     se cargan
        |             flex height      el zoom del     zoom:1/0.7        (200 OK)
  Mapbox "ve" un         |            contenedor           |                  |
  canvas 1.43x       Grid rows           |            Usan variables     El canvas
  mas grande          son "auto"     devicePixelRatio  --vh-full para     se inicializa
  de lo real             |            se distorsiona    alturas             (mapReady=true)
        |             Map container       |                |                  |
  Tiles se              sin height     Tiles se render   CustodianZone    Legend y Capas
  renderizan en          explicita     fuera del area   BubbleMap usa     son visibles
  coordenadas                          visible          calc(var(--vh-    (confirma mount)
  incorrectas                                           full) - 280px)
```

## Causa Raiz Confirmada

**CSS `zoom: 1.4286` aplicado al contenedor padre del mapa corrompe los calculos internos de Mapbox GL.**

Mapbox GL JS usa `canvas.getBoundingClientRect()` y `window.devicePixelRatio` para calcular:
- El tamano del canvas WebGL
- La posicion de los tiles
- La proyeccion de coordenadas a pixeles

Cuando un contenedor padre tiene `zoom: 1.4286`, `getBoundingClientRect()` reporta dimensiones escaladas (1.43x mas grandes), pero el canvas fisico NO cambia. Resultado: Mapbox renderiza tiles en coordenadas incorrectas, fuera del area visible, o con un canvas de proporciones equivocadas.

**Prueba definitiva**: Los otros 2 mapas Mapbox del proyecto (CustodianZoneBubbleMap, ArmedZoneBubbleMap) funcionan correctamente porque **NO usan zoom:1/0.7** — usan las CSS variables compensadas (`--vh-full`, `--content-height-with-tabs`).

## Solucion

Eliminar `zoom: 1/0.7` de SecurityPage y adoptar el mismo patron que usa el resto de la app: CSS variables compensadas para alturas.

### Cambios por archivo

### 1. `SecurityPage.tsx`

- **Quitar** `style={{ zoom: 1 / 0.7 }}`
- Usar `h-[var(--content-height-full)]` para la altura total (ya compensa zoom 0.7)
- Mantener flex layout pero sin zoom

```tsx
return (
  <div className="flex flex-col h-[var(--content-height-full)] overflow-hidden">
    <div className="shrink-0 px-0 pt-0 pb-1">
      <h1 className="text-xl font-bold ...">Modulo de Seguridad</h1>
      <p className="text-xs ...">...</p>
    </div>

    <Tabs className="flex-1 flex flex-col min-h-0">
      <TabsList className="shrink-0 ...">...</TabsList>
      <TabsContent value="routes" className="flex-1 min-h-0 mt-3">
        <RouteRiskIntelligence />
      </TabsContent>
      {/* otros tabs sin cambio */}
    </Tabs>
  </div>
);
```

### 2. `RouteRiskIntelligence.tsx`

Sin cambios significativos. El layout flex actual (`flex flex-col h-full` + `flex-1 min-h-0` en el grid) funciona correctamente cuando el padre tiene una altura real definida por las CSS variables.

### 3. `RiskZonesMap.tsx`

- **Quitar** el useEffect extra de `requestAnimationFrame` + `setTimeout 2000ms` (ya no necesario sin zoom)
- Mantener el ResizeObserver (buena practica general)
- El mapa opera en contexto nativo de zoom 0.7 como los demas mapas del proyecto

## Por que esto funciona

- El mapa opera en el mismo contexto CSS que los mapas que SI funcionan
- `getBoundingClientRect()` reporta dimensiones reales (zoom 0.7 es global, Mapbox lo maneja correctamente porque es uniforme)
- Las CSS variables `--vh-full` ya compensan el zoom 0.7 para las alturas
- Zero hacks, patron consistente con el resto del proyecto

## Archivos a modificar

1. `src/pages/Security/SecurityPage.tsx` — Quitar zoom, usar CSS variables
2. `src/components/security/map/RiskZonesMap.tsx` — Quitar resize hacks innecesarios

