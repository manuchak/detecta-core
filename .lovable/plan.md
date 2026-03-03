

# Evaluacion como Director de Logistica Nacional

## Diagnostico honesto del mapa actual

### Lo que SI funciona
- **167 segmentos con geometria real** ya almacenada en BD (road-snapped via Mapbox). Las rutas SI siguen carreteras reales, no son lineas rectas. Si en el preview se ven rectas, es un problema de carga del hook, no de datos.
- **36 corredores** cubriendo el centro, bajio, occidente, noroeste, sureste y peninsula
- **~90 POIs** operativos (blackspots, casetas, bases GN, gasolineras, zonas industriales)
- **Clasificacion de riesgo** calibrada con datos AMIS/CANACAR 2024-2025

### Lo que NO sirve para un director de logistica real

**1. No distingo si es carretera de cuota o libre**
El dato mas critico para logistica de carga esta ausente. Un transportista NUNCA toma la libre en el Altiplano Potosino si puede usar la 57D. La póliza de seguro, el tiempo de tránsito, y el nivel de riesgo cambian radicalmente entre cuota y libre. Hoy el modelo no tiene esta distincion.

**2. Faltan cruces fronterizos operativos**
Para una empresa de distribución nacional con importaciones:
- **Reynosa/McAllen** — principal cruce de carga del noreste (falta)
- **Matamoros/Brownsville** — segundo cruce del Golfo (falta)
- **Piedras Negras/Eagle Pass** — corredor automotriz (falta)
- **Colombo/Laredo** — ya cubierto via MTY-Nuevo Laredo, pero el nombre del cruce no se menciona

**3. Corredores internos faltantes**
- **Querétaro - San Luis Potosí directo (57D)** — la espina dorsal CDMX-MTY pasa por aquí y no está como corredor independiente
- **Tuxtla Gutiérrez** — capital de Chiapas, destino frecuente de distribución
- **León - Aguascalientes directo (45D)** — corredor automotriz principal del Bajío
- **Puebla - Veracruz directo (150D)** — alternativa a ir por Córdoba

**4. No hay informacion de restricciones operativas**
- Peso máximo por eje / altura de puentes
- Restricciones de horario para doble remolque
- Prohibiciones de materiales peligrosos en ciertos tramos
- Zonas con restriccion por derecho de vía

**5. Los datos de geometría SÍ existen pero algunos son incorrectos**
El segmento `lc-cdmx-2` (Tierra Caliente, supuesto 60km) tiene 17,633 coordenadas y 610km — Mapbox lo ruteo mal. Hay al menos 7 segmentos con geometrias distorsionadas que hacen que el mapa se vea raro en esas zonas.

## Plan de mejora

### A. Agregar campo `routeType` y `highwayDesignation` a cada segmento

Agregar dos propiedades a la interfaz `HighwaySegment`:
```
routeType: 'cuota' | 'libre' | 'mixta'
highwayDesignation: string  // e.g., '57D', '15', '45D/45'
```

Clasificar los 167 segmentos existentes. Visualmente en el mapa: cuota = linea solida, libre = linea punteada.

### B. Agregar 4 corredores fronterizos faltantes

| Corredor | Segmentos | Km |
|---|---|---|
| MTY - Reynosa (40/2) | 4 | ~220km |
| MTY - Matamoros (2) | 4 | ~300km |
| Saltillo - Piedras Negras (57) | 4 | ~440km |
| Tuxtla Gutiérrez - Oaxaca (190) | 4 | ~600km |

~16 segmentos nuevos con ~8 POIs.

### C. Corregir geometrias distorsionadas

Identificar los ~7 segmentos con geometrias anomalas (distance_km >> kmEnd-kmStart) y re-procesarlos con la edge function usando waypoints mas precisos.

### D. Visualizacion cuota vs libre en el mapa

En `RiskZonesMap.tsx`, agregar `line-dasharray` condicional:
- Cuota: linea solida (actual)
- Libre: linea punteada `[4, 3]`
- Mixta: puntos alternados `[8, 4]`

Agregar un item al legend overlay para explicar la simbologia.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Agregar `routeType`, `highwayDesignation` a interfaz; clasificar 167 segmentos; agregar ~16 segmentos nuevos y ~8 POIs |
| `src/components/security/map/RiskZonesMap.tsx` | Estilo visual cuota vs libre (dasharray); leyenda actualizada |
| Edge function `enrich-segment-geometries` | Re-procesar ~7 segmentos con geometria anomala |

