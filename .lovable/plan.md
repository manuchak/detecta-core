

# Fix: Ruta no aparece en el mapa del PDF

## Problema
La línea de ruta no se dibuja porque `encodeURIComponent()` en línea 574 convierte las comas de las coordenadas en `%2C`, rompiendo el formato que Mapbox espera.

## Solución
En `src/components/monitoring/tiempos/ServiceDetailPDF.tsx`, línea 574:

**Antes:**
```typescript
const pathStr = `path-4+3b82f6-0.8(${encodeURIComponent(pathCoords)})`;
```

**Después:**
```typescript
const pathStr = `path-4+3b82f6-0.8(${pathCoords})`;
```

Las coordenadas dentro de los paréntesis no deben ser URL-encoded — Mapbox Static API espera el formato raw `lng,lat,lng,lat,...`.

### Archivo a editar
- `src/components/monitoring/tiempos/ServiceDetailPDF.tsx` — línea 574, quitar `encodeURIComponent`

