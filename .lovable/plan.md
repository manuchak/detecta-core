

# Mejorar Labels de Tramos Carreteros en el Mapa

## Estado actual

La capa `segments-labels` ya existe (lineas 172-187 de RiskZonesMap.tsx) pero tiene styling basico:
- `text-size: 10` fijo (muy pequeno a zoom bajo, no escala)
- `symbol-placement: 'line-center'` (solo un label por linea, al centro)
- Halo negro de 1px (poco contraste en mapa oscuro)
- `text-allow-overlap: false` (correcto, evita colision)
- Desactivada por defecto (`labels: false` en el estado inicial)

El toggle "Etiquetas" ya existe en el panel de capas.

## Mejoras propuestas

### Archivo: `src/components/security/map/RiskZonesMap.tsx`

**1. Labels con zoom interpolado y mejor legibilidad**

Reemplazar la capa `segments-labels` actual con una version mejorada:

```tsx
m.addLayer({
  id: 'segments-labels',
  type: 'symbol',
  source: 'segments',
  layout: {
    'symbol-placement': 'line',           // A lo largo de la linea (no solo centro)
    'text-field': ['get', 'name'],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      5, 8,     // Zoom nacional: 8px
      7, 10,    // Zoom regional: 10px
      9, 12,    // Zoom estatal: 12px
      12, 14,   // Zoom local: 14px
    ],
    'text-allow-overlap': false,
    'text-ignore-placement': false,
    'text-anchor': 'center',
    'text-offset': [0, -1],               // Separar del trazo
    'text-max-angle': 30,                 // Limitar curvatura del texto
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'symbol-spacing': 250,                // Repetir cada 250px para tramos largos
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': 'rgba(0, 0, 0, 0.85)',
    'text-halo-width': 2,                 // Halo mas grueso para contraste
    'text-halo-blur': 1,
  },
});
```

**2. Activar labels por defecto**

Cambiar el estado inicial en `RouteRiskIntelligence.tsx`:

```tsx
const [layers, setLayers] = useState<LayerVisibility>({
  segments: true,
  pois: true,
  safePoints: true,
  deadZones: true,
  labels: true,  // Cambiar de false a true
});
```

## Cambios clave vs actual

| Propiedad | Antes | Despues |
|---|---|---|
| `symbol-placement` | `line-center` (1 label) | `line` (repetido a lo largo) |
| `text-size` | `10` fijo | Interpolacion 8-14px segun zoom |
| `text-halo-width` | `1` | `2` con blur |
| `text-offset` | ninguno | `[0, -1]` (separado del trazo) |
| `text-font` | default | DIN Pro Medium (Mapbox nativo) |
| `symbol-spacing` | default | `250` (repetir en tramos largos) |
| `text-max-angle` | ninguno | `30` (texto mas recto) |
| Labels activos por defecto | No | Si |

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/security/map/RiskZonesMap.tsx` | Mejorar styling de capa `segments-labels` |
| `src/components/security/routes/RouteRiskIntelligence.tsx` | Cambiar `labels: false` a `labels: true` |

