

# Mejoras UI para el mapa de Rutas y Zonas de Riesgo

## Estado actual (confirmado por screenshot)

- El mapa Mapbox renderiza tiles correctamente (fondo oscuro visible)
- Los controles de capas funcionan (panel superior derecho)
- La lista de tramos funciona con filtros y scroll (panel derecho)
- Los tramos carreteros se renderizan como lineas GeoJSON pero son **dificiles de ver** a zoom 5 (lineas de 4px sobre mapa de todo Mexico)
- El header de estadisticas funciona
- La leyenda aparece en la esquina inferior izquierda del mapa

## Problemas identificados

1. **Tramos poco visibles**: Las lineas de 4px son muy delgadas a nivel nacional, especialmente con opacidad 0.85 sobre el tema oscuro
2. **Espacio desaprovechado**: El panel derecho de 260px es fijo incluso en pantallas grandes
3. **Sin feedback visual al seleccionar tramo desde la lista**: El mapa hace flyTo pero no resalta el tramo seleccionado visualmente
4. **Error de build gl-matrix**: Persiste en el typecheck aunque `skipLibCheck: true` esta en todos los tsconfig (esto es un issue del build system de Lovable, no bloquea el runtime)

## Mejoras propuestas

### 1. Tramos mas visibles y con mejor contraste

**Archivo: `src/components/security/map/RiskZonesMap.tsx`**

- Aumentar `line-width` de 4 a 5 (base) y de 6 a 8 (hover)
- Aumentar `line-opacity` de 0.85 a 0.95
- Agregar un efecto de "glow" con una capa duplicada debajo (linea mas gruesa y difusa del mismo color) para que los tramos resalten contra el fondo oscuro
- Agregar una capa de "highlight" para el tramo seleccionado (linea pulsante o de mayor grosor con borde blanco)

```tsx
// Capa de glow (debajo de la linea principal)
m.addLayer({
  id: 'segments-glow',
  type: 'line',
  source: 'segments',
  paint: {
    'line-color': ['get', 'color'],
    'line-width': 12,
    'line-opacity': 0.25,
    'line-blur': 6,
  },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
});

// Linea principal mas gruesa
paint: {
  'line-color': ['get', 'color'],
  'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 8, 5],
  'line-opacity': 0.95,
}
```

### 2. Resaltar tramo seleccionado en el mapa

**Archivo: `src/components/security/map/RiskZonesMap.tsx`**

Cuando `selectedSegmentId` cambia, ademas del `flyTo`, aplicar un filtro visual al tramo:
- Agregar una capa `segments-selected` con borde blanco grueso que solo muestra el tramo activo
- Usar un filtro GeoJSON `['==', ['get', 'id'], selectedSegmentId]`

```tsx
// Capa de seleccion (borde blanco + linea del color)
m.addLayer({
  id: 'segments-selected-outline',
  type: 'line',
  source: 'segments',
  filter: ['==', ['get', 'id'], ''],
  paint: {
    'line-color': '#ffffff',
    'line-width': 10,
    'line-opacity': 0.6,
  },
});
```

Y en el efecto de `selectedSegmentId`:
```tsx
if (m.getLayer('segments-selected-outline')) {
  m.setFilter('segments-selected-outline', selectedSegmentId 
    ? ['==', ['get', 'id'], selectedSegmentId] 
    : ['==', ['get', 'id'], '']);
}
```

### 3. Panel lateral colapsable para maximizar mapa

**Archivo: `src/components/security/routes/RouteRiskIntelligence.tsx`**

- Agregar un boton toggle para colapsar/expandir el panel de tramos
- Cuando esta colapsado, el mapa ocupa el 100% del ancho
- El boton se posiciona como overlay en la esquina superior derecha del mapa (debajo de los controles de capas)

```tsx
const [panelOpen, setPanelOpen] = useState(true);

// Grid cambia de 1fr_260px a 1fr cuando esta colapsado
<div className={`grid grid-cols-1 ${panelOpen ? 'md:grid-cols-[1fr_260px]' : ''} ...`}>
  ...
  {panelOpen && (
    <div className="border rounded-lg p-3 bg-background overflow-hidden">
      <HighRiskSegmentsList ... />
    </div>
  )}
</div>

// Boton toggle como overlay
<button onClick={() => setPanelOpen(!panelOpen)} 
  className="absolute top-2 left-12 z-10 ...">
  {panelOpen ? <PanelRightClose /> : <PanelRightOpen />}
</button>
```

### 4. Visibility de capas glow/selected sincronizada con toggle de layers

**Archivo: `src/components/security/map/RiskZonesMap.tsx`**

Las nuevas capas (`segments-glow`, `segments-selected-outline`) deben respetar el toggle de la capa `segments`:

```tsx
set('segments-glow', layers.segments);
set('segments-selected-outline', layers.segments);
```

## Archivos a modificar

| Archivo | Cambios |
|---|---|
| `src/components/security/map/RiskZonesMap.tsx` | Capa glow, lineas mas gruesas, capa de seleccion, sync con layer toggles |
| `src/components/security/routes/RouteRiskIntelligence.tsx` | Panel lateral colapsable con boton toggle |

## Resultado esperado

- Tramos carreteros claramente visibles con efecto glow que resalta contra el fondo oscuro
- Al hacer click en un tramo de la lista, se resalta visualmente en el mapa con borde blanco
- Panel lateral colapsable para maximizar el area del mapa cuando se necesita vision completa
- Todas las mejoras respetan los toggles de capas existentes
