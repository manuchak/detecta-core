
# Maximizar espacio del mapa y asegurar capas visibles

## Problema actual
1. El mapa ocupa solo ~60% del espacio disponible verticalmente -- hay mucho espacio desperdiciado debajo
2. La compensacion de zoom usa `zoom: 1/0.7` con `width/height: 70%` que puede causar problemas de renderizado
3. Las capas (segmentos, POIs, dead zones, safe points) pueden no dibujarse correctamente

## Cambios propuestos

### 1. `SecurityPage.tsx` - Maximizar altura del tab
- Cambiar `h-[calc(100vh-200px)]` a `h-[calc(100vh-160px)]` para dar mas espacio vertical al contenido

### 2. `RouteRiskIntelligence.tsx` - Reorganizar layout
- Reducir el header a una sola linea compacta (inline con las capas)
- Cambiar la altura del grid de `h-[calc(100vh-320px)]` a `h-[calc(100vh-240px)]` para aprovechar el espacio que se libera
- Integrar los controles de capas **dentro** del mapa (como overlay) en vez de en columna separada, asi el mapa ocupa mas ancho
- Cambiar grid de 3 columnas `[240px_1fr_280px]` a 2 columnas `[1fr_280px]` -- capas van como overlay sobre el mapa

### 3. `RiskZonesMap.tsx` - Fix zoom y asegurar capas
- Reemplazar el enfoque de `zoom: 1/0.7` por `transform: scale(1.4286)` con `transform-origin: top left` y dimensiones `width: 142.86%; height: 142.86%` contenido en un wrapper con `overflow: hidden`. Esto es mas compatible que la propiedad CSS `zoom`
- Agregar multiples llamadas a `map.resize()` (en load + despues de timeout) para asegurar que Mapbox calcule bien el canvas
- Mover la leyenda fuera del contenedor con transform para que no se escale

### 4. `RiskZonesHeader.tsx` - Compactar
- Hacer los cards mas compactos (padding reducido) para que ocupen menos espacio vertical

## Detalle tecnico

### Layout final (RouteRiskIntelligence)
```
[Header KPIs - 1 linea compacta]
[                                    ]
[ Mapa (con capas overlay) | Lista  ]
[                                    ]
```

### Compensacion de zoom (RiskZonesMap)
```tsx
<div className="relative w-full h-full overflow-hidden">
  <div
    ref={mapContainer}
    className="absolute top-0 left-0 rounded-lg"
    style={{
      transform: 'scale(1.4286)',
      transformOrigin: 'top left',
      width: '70%',
      height: '70%',
    }}
  />
  {/* Legend overlay - fuera del transform */}
  <div className="absolute bottom-3 left-3 ...">...</div>
</div>
```

### Capas como overlay sobre el mapa
En `RouteRiskIntelligence.tsx`, mover `RiskZonesMapLayers` siempre como overlay en la esquina superior izquierda del mapa (posicion absoluta), eliminando la columna izquierda del grid.

## Archivos a modificar
1. `src/pages/Security/SecurityPage.tsx` - Mas altura al tab
2. `src/components/security/routes/RouteRiskIntelligence.tsx` - Grid de 2 columnas, capas como overlay
3. `src/components/security/map/RiskZonesMap.tsx` - Fix zoom con transform, resize multiple
4. `src/components/security/map/RiskZonesHeader.tsx` - Compactar padding
