
# Vista de Mapa Interactivo de Zonas de Riesgo (estilo Hermes)

## Objetivo
Crear una vista de mapa interactivo similar a la de Hermes, con capas de corredores, segmentos coloreados por riesgo, POIs, puntos seguros, zonas sin cobertura celular, y un panel lateral con los tramos de mayor riesgo.

## Arquitectura

El proyecto ya tiene todos los datos necesarios:
- `highwayCorridors.ts`: 26 corredores con waypoints `[lng, lat]`
- `highwaySegments.ts`: ~65 segmentos granulares (~30km c/u) con nivel de riesgo
- `highwaySegments.ts > HIGHWAY_POIS`: Puntos de interes (blackspots, casetas, entronques, zonas seguras, industriales)
- `cellularCoverage.ts`: Zonas sin cobertura celular con poligonos
- Tabla `safe_points` en Supabase con 18 registros
- Mapbox ya integrado via edge function `mapbox-token`

Lo que falta es el **componente de mapa** y la **reestructuracion del tab "Rutas y Zonas"**.

## Componentes a crear

### 1. `src/components/security/map/RiskZonesMap.tsx` (Componente principal)
Mapa Mapbox a pantalla completa con:
- **Lineas de segmentos** coloreadas por riesgo (rojo=extremo, naranja=alto, amarillo=medio, verde=bajo)
- **Marcadores de POIs** con iconos por tipo (punto negro, caseta, entronque, industrial)
- **Circulos de puntos seguros** (verdes) desde la tabla `safe_points`
- **Poligonos de zonas sin cobertura** (gris semitransparente)
- **Leyenda** en esquina inferior izquierda (Nivel de Riesgo por Tramo + multiplicadores)
- **Panel de capas** (toggles) en esquina superior derecha
- Click en segmento abre popup con detalles + recomendaciones ISO 28000

### 2. `src/components/security/map/RiskZonesMapLayers.tsx` (Control de capas)
Panel de toggles similar a Hermes:
- Tramos (on/off)
- POIs (on/off)
- Puntos Seguros (on/off)
- Zonas sin senal (on/off)
- Etiquetas (on/off)

### 3. `src/components/security/map/HighRiskSegmentsList.tsx` (Panel lateral derecho)
Lista scrollable de tramos ordenados por riesgo:
- Filtros: Todos | Extremo | Alto | Medio | Bajo (con contadores)
- Cada item muestra: nombre, badge de riesgo, km range, eventos/mes, horario critico
- Click en item centra el mapa en ese segmento

### 4. `src/components/security/map/RiskZonesHeader.tsx` (Header con KPIs)
Barra superior con estadisticas rapidas:
- X zonas H3 monitoreadas
- X tramos
- X extremo / X alto
- X.XXx multiplicador promedio

### 5. Reestructurar `RouteRiskIntelligence.tsx`
Reemplazar el layout actual (tablas) por el layout de 3 columnas:
- **Izquierda** (~25%): Leyenda + estadisticas de puntos seguros + zonas sin cobertura
- **Centro** (~50%): Mapa interactivo
- **Derecha** (~25%): Lista de tramos de mayor riesgo

## Detalle Tecnico

### Renderizado de segmentos en Mapbox
```typescript
// Por cada segmento, agregar una linea GeoJSON coloreada
map.addSource(`segment-${segment.id}`, {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: segment.waypoints
    }
  }
});
map.addLayer({
  id: `segment-line-${segment.id}`,
  type: 'line',
  source: `segment-${segment.id}`,
  paint: {
    'line-color': RISK_LEVEL_COLORS[segment.riskLevel],
    'line-width': 4,
    'line-opacity': 0.85
  }
});
```

### Puntos seguros desde Supabase
Reutilizar el hook `useSafePoints` existente para obtener coordenadas y plotearlas como circulos verdes en el mapa.

### Zonas sin cobertura
Renderizar los poligonos de `CELLULAR_DEAD_ZONES` como fills semitransparentes grises.

### Interactividad
- Hover en segmento: resaltar y mostrar nombre
- Click en segmento: popup con detalles completos (nombre, km, riesgo, eventos/mes, horario critico, recomendaciones)
- Click en item del panel derecho: `map.flyTo()` al centro del segmento

## Archivos a modificar
1. **Crear** `src/components/security/map/RiskZonesMap.tsx`
2. **Crear** `src/components/security/map/RiskZonesMapLayers.tsx`
3. **Crear** `src/components/security/map/HighRiskSegmentsList.tsx`
4. **Crear** `src/components/security/map/RiskZonesHeader.tsx`
5. **Modificar** `src/components/security/routes/RouteRiskIntelligence.tsx` - Nuevo layout con mapa + paneles

## Sin dependencias nuevas
- Mapbox GL JS ya esta instalado (`mapbox-gl ^3.12.0`)
- Token Mapbox ya configurado via edge function
- Todos los datos de corredores/segmentos/POIs ya existen en archivos locales
- Puntos seguros ya en Supabase
