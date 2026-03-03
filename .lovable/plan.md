

# Fix: SegmentAuditor "Fix ERROR" no reduce errores

## Diagnóstico

El botón "Fix ERROR" re-enriquece los segmentos enviando los MISMOS waypoints a Mapbox → Mapbox devuelve las MISMAS distancias → el ratio sigue siendo >2x → sigue mostrando ERROR.

**La causa raíz NO es la geometría Mapbox. Es que `expectedKm = kmEnd - kmStart` es un rango de kilometraje de corredor, NO la distancia real de carretera.**

Ejemplos concretos del network log (POST-enrichment):
| Segmento | kmEnd-kmStart | Mapbox post-fix | Ratio | Problema real |
|---|---|---|---|---|
| `qro-jua-6` | 160km | 826km | **5.2x** | Segmento cubre 826km reales de Hwy 45 en desierto. El rango 620-780 del corredor es incorrecto |
| `gdl-tep-3` | 50km | 245km | **4.9x** | Sierra Nayarit tiene 245km reales de carretera. 50km es imposible |
| `lc-cdmx-2` | 60km | 285km | **4.7x** | Tierra Caliente: 5 waypoints cubren 285km de sierra. 60km es imposible |
| `mty-sal-2` | 35km | 146km | **4.2x** | Cuesta de los Muertos: 146km es más realista que 35km |
| `altiplano-3` | 90km | 316km | **3.5x** | Fresnillo-SLP por Hwy 49 son ~316km reales |
| `costera-3` | 250km | 530km | **2.1x** | Costa 200 tiene muchas curvas: 530km es realista |

**Conclusión**: La geometría Mapbox post-corrección es CORRECTA para la mayoría. El error está en los rangos `kmStart/kmEnd` que no reflejan la distancia real.

## Plan (Doble Clasificación)

### 1. Agregar campo `expectedRoadKm` a `HighwaySegment` (opcional)

Para los ~25 segmentos problemáticos, agregar un campo que refleje la distancia real esperada de carretera. Cuando existe, el auditor lo usa en lugar de `kmEnd - kmStart`.

```typescript
export interface HighwaySegment {
  // ... existing fields
  expectedRoadKm?: number; // Distancia real de carretera (override kmEnd-kmStart)
}
```

### 2. Actualizar SegmentAuditor con doble clasificación

| Status | Criterio | Color | Significado |
|---|---|---|---|
| `GEO_ERROR` | Mapbox vs `expectedRoadKm` ratio >2x | Rojo | La geometría Mapbox está mal (waypoints incorrectos) |
| `DATA_ERROR` | `kmEnd-kmStart` vs `expectedRoadKm` ratio >2x | Naranja | El rango km del corredor no refleja la distancia real |
| `WARN` | Cualquier ratio 1.5-2x | Amarillo | Revisar |
| `OK` | Ambos ratios <1.5x | Verde | Todo bien |

- Agregar columna "Dist. Real" que muestra `expectedRoadKm` cuando existe
- El botón "Fix ERROR" solo se activa para `GEO_ERROR` (problemas de waypoints)
- Los `DATA_ERROR` se marcan como "Rango km incorrecto" y no se re-enriquecen

### 3. Calibrar `expectedRoadKm` para los 25 segmentos ERROR

Usar las distancias Mapbox post-enrichment (que ahora son correctas) como referencia para establecer `expectedRoadKm`. Esto convierte los falsos `ERROR` en `OK` o `DATA_ERROR`.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Agregar `expectedRoadKm` a interface + a los ~25 segmentos problemáticos |
| `src/components/security/routebuilder/SegmentAuditor.tsx` | Doble clasificación, columna "Dist. Real", botón Fix solo para GEO_ERROR |

