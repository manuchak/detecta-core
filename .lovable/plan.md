

# Fix: Mapa no se renderiza por conflicto de zoom y alturas

## Diagnostico

El problema raiz es como CSS `zoom` interactua con unidades `vh`:

1. `html { zoom: 0.7 }` -- el viewport visual se escala al 70%
2. `SecurityPage` tiene `zoom: 1/0.7` (1.4286) para compensar
3. Dentro de ese contexto, `100vh` sigue siendo el viewport height original, pero al multiplicarse por el zoom compuesto (0.7 * 1.4286 = 1.0), las alturas `calc(100vh - Xpx)` terminan desbordando o calculando mal
4. El contenedor del mapa queda con dimensiones incorrectas, y Mapbox renderiza un canvas de 0px o fuera del area visible

**Evidencia**: Los tiles de Mapbox SI se cargan (network requests exitosos con status 200), pero el canvas no se muestra porque su contenedor no tiene dimensiones correctas.

## Solucion

Reemplazar todas las alturas basadas en `100vh` dentro del modulo de seguridad por `100dvh` compensado con las CSS custom properties que ya existen en `index.css` (`--zoom-compensation: 1.4286`). Pero mas importante: **usar altura relativa al contenedor padre** en vez de `vh` absoluto.

### Enfoque: Flexbox con `flex-1` en vez de `calc(100vh - X)`

En vez de calcular alturas absolutas con `vh`, usar un layout flex vertical donde:
- El tab content ocupa `h-full` / `flex-1`
- `RouteRiskIntelligence` usa `flex-1` para llenar el espacio disponible
- El grid del mapa usa `flex-1 min-h-0` (critico para que flex children con overflow funcionen)
- El contenedor del mapa hereda la altura del grid naturalmente

Esto elimina la dependencia de `100vh` dentro del zoom compensado.

## Cambios por archivo

### 1. `src/pages/Security/SecurityPage.tsx`

- Cambiar el contenedor principal de `space-y-3` a `flex flex-col h-screen`
- El `zoom: 1/0.7` se mantiene pero con `h-screen` explicito
- El `TabsContent` de routes usa `flex-1 min-h-0` en vez de `h-[calc(100vh-120px)]`
- Todos los demas `TabsContent` se mantienen igual

### 2. `src/components/security/routes/RouteRiskIntelligence.tsx`

- Cambiar de `space-y-1 h-full` a `flex flex-col h-full`
- El grid pasa de `h-[calc(100vh-130px)]` a `flex-1 min-h-0`
- `min-h-0` es critico: sin esto, flex items no pueden ser menores que su contenido intrinseco

### 3. `src/components/security/map/RiskZonesMap.tsx`

- Sin cambios estructurales al JSX (ya usa `relative w-full h-full` + `absolute inset-0`)
- Agregar un `useEffect` con `requestAnimationFrame` + `resize()` ademas del ResizeObserver existente, para cubrir el caso donde el mapa se inicializa antes de que el layout flex termine de calcular
- Agregar un `setTimeout` extra de 2000ms para el caso del zoom compound

### 4. `src/components/security/map/RiskZonesMapLayers.tsx`

- Sin cambios (ya esta compactado)

## Detalle tecnico

### SecurityPage.tsx - Layout flex vertical

```tsx
<div style={{ zoom: 1 / 0.7 }} className="flex flex-col h-screen overflow-hidden">
  {/* Header - tamano fijo */}
  <div className="shrink-0">
    <h1>...</h1>
    <p>...</p>
  </div>

  {/* Tabs - crece para llenar */}
  <Tabs className="flex-1 flex flex-col min-h-0">
    <TabsList className="shrink-0 ...">...</TabsList>
    
    <TabsContent value="routes" className="flex-1 min-h-0 mt-3">
      <RouteRiskIntelligence />
    </TabsContent>
  </Tabs>
</div>
```

### RouteRiskIntelligence.tsx - Flex sin vh

```tsx
<div className="flex flex-col h-full">
  <RiskZonesHeader />  {/* shrink-0 implicitamente */}
  
  <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3 flex-1 min-h-0 mt-1">
    <div className="relative rounded-lg overflow-hidden border bg-muted/10">
      <RiskZonesMap ... />
      <div className="absolute top-2 right-2 z-10">
        <RiskZonesMapLayers ... />
      </div>
    </div>
    <div className="border rounded-lg p-3 bg-background overflow-hidden">
      <HighRiskSegmentsList ... />
    </div>
  </div>
</div>
```

### RiskZonesMap.tsx - Resize robusto

```typescript
// Ademas del ResizeObserver existente, agregar:
useEffect(() => {
  if (!mapReady || !map.current) return;
  // requestAnimationFrame para esperar al layout
  const raf = requestAnimationFrame(() => {
    map.current?.resize();
  });
  // Timeout largo para zoom compound
  const t = setTimeout(() => map.current?.resize(), 2000);
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(t);
  };
}, [mapReady]);
```

## Por que esto funciona

- `h-screen` en el wrapper con `zoom: 1/0.7` le da al contenedor exactamente la altura del viewport (el browser calcula `100vh` correctamente para el elemento raiz)
- `flex-1 min-h-0` hace que cada nivel del arbol flex se ajuste al espacio disponible sin desbordarse
- El mapa hereda la altura real del grid cell via `h-full` + `absolute inset-0`
- No hay ninguna referencia a `100vh` dentro de componentes hijos, eliminando el conflicto de zoom

## Archivos a modificar

1. `src/pages/Security/SecurityPage.tsx` -- Layout flex vertical con h-screen
2. `src/components/security/routes/RouteRiskIntelligence.tsx` -- Flex con min-h-0
3. `src/components/security/map/RiskZonesMap.tsx` -- Resize con requestAnimationFrame

