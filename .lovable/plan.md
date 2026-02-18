

# Fix: Mapa al 100%, capas visibles y aprovechamiento de espacio

## Problemas identificados

1. **Mapa no llena su contenedor**: El `transform: scale(1.4286)` con `width/height: 70%` no compensa correctamente el `zoom: 0.7` global -- Mapbox calcula mal el canvas porque `transform` no cambia el layout box, solo lo escala visualmente.
2. **Capas no se dibujan**: Los tramos, POIs, zonas sin cobertura y puntos seguros se agregan correctamente al mapa, pero el canvas mal calculado puede hacer que no sean visibles o que se rendericen fuera del area visible.
3. **Espacio desperdiciado debajo del mapa**: La altura del contenedor puede optimizarse mas.

## Solucion

### Enfoque de zoom: Usar CSS `zoom` en vez de `transform`

La propiedad CSS `zoom` (soportada en Chrome/Edge/Safari) SI cambia el layout box, a diferencia de `transform: scale()` que solo escala visualmente. Esto permite que Mapbox calcule el canvas correctamente.

Para Firefox (que no soporta `zoom`), usar `-moz-transform: scale()` como fallback.

---

## Cambios por archivo

### 1. `src/components/security/map/RiskZonesMap.tsx`

**Problema principal**: `transform: scale(1.4286)` no cambia el layout -- Mapbox ve un canvas de 70% del tamano real.

**Solucion**: Volver a usar `zoom: 1/0.7` PERO con `width` y `height` al `calc(100% / 1.4286)` (que es 70%), y agregar un wrapper con `overflow: hidden` que contenga el mapa. Ademas, usar `position: absolute` e `inset: 0` en el wrapper para que ocupe todo el espacio disponible.

Estructura final del JSX:
```
<div class="relative w-full h-full"> <!-- outer container -->
  {loading && spinner}
  <div class="absolute inset-0 overflow-hidden"> <!-- clip wrapper -->
    <div ref={mapContainer}
         style={{ zoom: 1.4286, width: '70%', height: '70%' }}
    /> <!-- mapbox canvas, compensated -->
  </div>
  {legend overlay}
</div>
```

Tambien agregar `map.resize()` con timeouts escalonados (0, 200, 800ms) despues del `load` para asegurar que el canvas se recalcule.

### 2. `src/components/security/routes/RouteRiskIntelligence.tsx`

- Cambiar la altura del grid de `h-[calc(100vh-240px)]` a `h-[calc(100vh-200px)]` para usar mas espacio vertical.
- Reducir `space-y-2` a `space-y-1` para apretar mas el layout.

### 3. `src/pages/Security/SecurityPage.tsx`

- Cambiar `h-[calc(100vh-160px)]` a `h-[calc(100vh-140px)]` para maximizar espacio.

### 4. `src/components/security/map/RiskZonesHeader.tsx`

- Cambiar de grid `grid-cols-3` a `flex flex-wrap` inline para que ocupe una sola linea horizontal y ahorre espacio vertical.

---

## Detalle tecnico

### Compensacion de zoom (RiskZonesMap.tsx)

```tsx
// Wrapper exterior - llena todo el espacio
<div className="relative w-full h-full">
  {loading && (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )}
  
  {/* Clip wrapper - contiene el mapa escalado */}
  <div className="absolute inset-0 overflow-hidden">
    <div
      ref={mapContainer}
      style={{
        zoom: 1.4286,
        width: '70%',
        height: '70%',
      }}
    />
  </div>
  
  {/* Legend - fuera del zoom, posicion absoluta */}
  {mapReady && (
    <div className="absolute bottom-3 left-3 ...">
      ...legend...
    </div>
  )}
</div>
```

### Resize escalonado

```typescript
m.on('load', () => {
  map.current = m;
  setMapReady(true);
  setLoading(false);
  m.resize();
  setTimeout(() => m.resize(), 200);
  setTimeout(() => m.resize(), 800);
});
```

### Layout vertical optimizado

```
SecurityPage TabContent: h-[calc(100vh-140px)]
  RouteRiskIntelligence: space-y-1
    Header: flex inline (1 linea)
    Grid: h-[calc(100vh-200px)]
      Map | SegmentList(260px)
```

## Archivos a modificar

1. `src/components/security/map/RiskZonesMap.tsx` -- Fix zoom con CSS zoom + clip wrapper + resize escalonado
2. `src/components/security/routes/RouteRiskIntelligence.tsx` -- Aumentar altura del grid
3. `src/pages/Security/SecurityPage.tsx` -- Aumentar altura del tab content
4. `src/components/security/map/RiskZonesHeader.tsx` -- Layout inline para ahorrar espacio vertical

