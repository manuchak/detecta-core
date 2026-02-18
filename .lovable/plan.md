

# Fix: Mapa visible, controles compactos, maximo protagonismo al mapa

## Problema

1. **Mapa no se renderiza**: El `zoom: 1/0.7` en `SecurityPage` cambia las dimensiones del layout box, pero el mapa con `position: absolute; inset: 0` calcula su canvas sobre el contenedor padre que ya esta escalado. Mapbox necesita un `resize()` despues de que el zoom se aplique, pero el timing no funciona correctamente.

2. **Capas y leyenda demasiado grandes**: El panel "Capas" y la leyenda "Nivel de Riesgo" estan a escala normal (porque el zoom ya se neutralizo), ocupando espacio critico sobre el mapa.

## Solucion

### 1. `RiskZonesMap.tsx` - Forzar resize con ResizeObserver + compactar leyenda

**Fix del mapa**: Agregar un `ResizeObserver` en el contenedor del mapa para que cada vez que el contenedor cambie de tamano (incluyendo cuando el zoom se aplica), Mapbox recalcule su canvas. Tambien agregar resizes escalonados (100ms, 500ms, 1000ms) despues del load.

**Leyenda compacta**: Reducir padding, font-size y tamano de indicadores. Usar `text-[9px]` y `p-1.5` en vez de `p-3`.

### 2. `RiskZonesMapLayers.tsx` - Escala reducida

Reducir el panel de capas: `text-[9px]`, `p-2`, iconos `h-2.5 w-2.5`, switches `scale-[0.6]`, y `gap-1` entre items. El panel pasa de ~200px de ancho a ~140px.

### 3. `RouteRiskIntelligence.tsx` - Mover capas a esquina superior derecha

Mover las capas de `top-3 left-12` a `top-2 right-2` para no chocar con los controles de navegacion de Mapbox (que estan en top-left).

### 4. `SecurityPage.tsx` - Agregar resize trigger

Sin cambios estructurales. El `zoom: 1/0.7` se mantiene.

## Detalle tecnico

### ResizeObserver para Mapbox (RiskZonesMap.tsx)

```typescript
// Despues de crear el mapa, observar cambios de tamano
useEffect(() => {
  if (!mapContainer.current || !map.current) return;
  const observer = new ResizeObserver(() => {
    map.current?.resize();
  });
  observer.observe(mapContainer.current);
  return () => observer.disconnect();
}, [mapReady]);
```

Ademas, en el evento `load`:
```typescript
m.on('load', () => {
  map.current = m;
  setMapReady(true);
  setLoading(false);
  m.resize();
  setTimeout(() => m.resize(), 100);
  setTimeout(() => m.resize(), 500);
  setTimeout(() => m.resize(), 1000);
});
```

### Leyenda compacta (RiskZonesMap.tsx)

```tsx
<div className="absolute bottom-2 left-2 bg-background/90 border rounded p-1.5 text-[9px] space-y-0.5 backdrop-blur-sm z-[5]">
  <div className="font-semibold text-foreground text-[9px]">Nivel de Riesgo</div>
  {levels.map(level => (
    <div className="flex items-center gap-1">
      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground capitalize">{level}</span>
    </div>
  ))}
</div>
```

### Capas compactas (RiskZonesMapLayers.tsx)

```tsx
<div className="bg-background/90 border rounded p-2 backdrop-blur-sm space-y-1">
  <div className="flex items-center gap-1 text-[9px] font-semibold">
    <Layers className="h-2.5 w-2.5" />
    Capas
  </div>
  {items.map(({ key, label, icon: Icon }) => (
    <div className="flex items-center justify-between gap-2">
      <Label className="flex items-center gap-1 text-[9px]">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </Label>
      <Switch checked={layers[key]} onCheckedChange={...} className="scale-[0.6]" />
    </div>
  ))}
</div>
```

### Posicion de overlay (RouteRiskIntelligence.tsx)

```tsx
<div className="absolute top-2 right-2 z-10">
  <RiskZonesMapLayers ... />
</div>
```

## Archivos a modificar

1. `src/components/security/map/RiskZonesMap.tsx` -- ResizeObserver + resize escalonado + leyenda compacta
2. `src/components/security/map/RiskZonesMapLayers.tsx` -- Escala reducida de todo el panel
3. `src/components/security/routes/RouteRiskIntelligence.tsx` -- Mover overlay a top-right

