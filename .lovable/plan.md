
# Fix: Mapa de Zonas de Riesgo no visible + Ajustes vs Hermes

## Problema Principal
El mapa Mapbox no se muestra en el tab "Rutas y Zonas". La vista actual solo renderiza el header con KPIs y la lista de tramos a ancho completo. El layout de 3 columnas con el mapa central no funciona.

**Causa raiz**: El contenedor del mapa depende de `calc(100vh - 280px)` para su altura, pero dentro de un `TabsContent` que no tiene altura explicita, el div del mapa colapsa a 0px de alto. Adicionalmente, el grid `lg:grid-cols-[1fr_2fr_1fr]` requiere breakpoint `lg` (1024px) y el area de contenido dentro del sidebar puede no alcanzarlo.

## Diferencias Core vs Hermes

| Elemento | Hermes (referencia) | Core (actual) |
|---|---|---|
| Mapa interactivo | Centro prominente, tema oscuro, lineas coloreadas por riesgo | No visible (height 0) |
| Layout | Mapa ocupa ~60% del ancho con panel lateral | Solo lista de tramos visible |
| Capas | Panel de toggles funcional sobre el mapa | Componente existe pero no se ve |
| Leyenda | Integrada en esquina del mapa | Componente existe pero mapa no renderiza |
| Segmentos | Panel derecho con filtros y scroll | Funciona pero ocupa todo el ancho |

## Solucion

### 1. Corregir altura del contenedor del mapa
En `RouteRiskIntelligence.tsx`:
- Cambiar el grid container de `style={{ height: 'calc(100vh - 280px)' }}` a una clase con altura fija y responsive
- Asegurar que el contenedor del mapa tenga `min-height` explicito
- Usar `md:grid-cols-[1fr_2fr_1fr]` en lugar de `lg:` para activarse antes

### 2. Ajustar el mapa para ocupar su contenedor
En `RiskZonesMap.tsx`:
- Asegurar que el `mapContainer` div tenga `style={{ minHeight: '400px' }}` como fallback
- Verificar que `h-full` se propague correctamente

### 3. Ajustar SecurityPage para dar altura al TabsContent
En `SecurityPage.tsx`:
- Agregar clases de altura al `TabsContent` del tab "routes" para que el contenido del mapa tenga un contexto de altura definido

### 4. Panel de capas visible en mobile
- Cambiar `hidden lg:block` a `hidden md:block` para el panel izquierdo
- Asegurar que el overlay mobile funcione correctamente

## Detalle Tecnico

### `RouteRiskIntelligence.tsx`
```typescript
// Antes:
<div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-3" 
     style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
  <div className="hidden lg:block">

// Despues:
<div className="grid grid-cols-1 md:grid-cols-[240px_1fr_280px] gap-3 h-[calc(100vh-320px)] min-h-[500px]">
  <div className="hidden md:block">
```

### `RiskZonesMap.tsx`
```typescript
// Asegurar min-height en el contenedor del mapa
<div ref={mapContainer} className="w-full h-full min-h-[400px] rounded-lg" />
```

### `SecurityPage.tsx`
```typescript
// Dar contexto de altura al tab de rutas
<TabsContent value="routes" className="mt-4 h-[calc(100vh-200px)]">
```

## Archivos a modificar
1. `src/components/security/routes/RouteRiskIntelligence.tsx` - Fix grid layout y alturas
2. `src/components/security/map/RiskZonesMap.tsx` - Min-height en contenedor del mapa
3. `src/pages/Security/SecurityPage.tsx` - Altura en TabsContent de rutas
