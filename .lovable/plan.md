

# Auditoría Profunda de Segmentos y Rutas — Análisis Fishbone

## Análisis Fishbone (Ishikawa): ¿Por qué los segmentos tienen distancias irreales?

```text
                              DISTANCIAS MAPBOX IRREALES
                                        │
    ┌───────────────┬───────────────┬────┴────┬───────────────┬───────────────┐
    │               │               │         │               │               │
 WAYPOINTS      MAPBOX API      DATOS       PROCESO       ARQUITECTURA
 INCORRECTOS    BEHAVIOR       ESTÁTICOS    DE ENRICH     FALTANTE
    │               │               │         │               │
    ├─ Coordenadas  ├─ "driving"   ├─ kmEnd- ├─ Solo 2      ├─ Sin loop de
    │  fuera de     │  profile      │  kmStart│  waypoints    │  validación
    │  carretera    │  no busca     │  no     │  por segmento │  post-enrich
    │               │  carretera    │  incluye│  (línea       │
    ├─ Pocos        │  de camión    │  curvas │  recta)       ├─ Sin audit
    │  waypoints    │               │  reales │               │  automático
    │  (2-3 por     ├─ Alley bias  │         ├─ enrich-      │  (ratio check)
    │  segmento     │  default=0    ├─ No     │  segment no   │
    │  de 200+km)   │  permite      │  refleja│  valida       ├─ Geometrías
    │               │  atajos       │  desvíos│  resultado    │  cacheadas
    ├─ Waypoints    │               │  por    │  vs esperado  │  24h sin
    │  que saltan   ├─ No usa      │  bypasses│               │  refresh
    │  entre        │  max_width/   │         ├─ Batch sin    │
    │  corredores   │  max_weight   │         │  priorización │
    │               │               │         │  (200 a la    │
    ├─ "Macrolib    │               │         │  vez)         │
    │  GDL" coords  │               │         │               │
    │  INCORRECTAS  │               │         │               │
    └───────────────┘               │         │               │
                                    └─────────┘               │
                                                              └───────────────┘
```

## Causa Raíz #1: COORDENADAS DEL MACROLIBRAMIENTO GDL SON INCORRECTAS

El Macrolibramiento de Guadalajara (GUA-10D) es una autopista de cuota que rodea la ZMG por el **SUR y ORIENTE**, pasando por:
- **Acatlán de Juárez** (sur) → **Tlajomulco** (sureste) → **El Salto** → **Zapotlanejo** (este)

**Coordenadas reales del trazo** (Google Maps/OSM verificado):
| Punto | Real (lng, lat) | En código (lng, lat) | Error |
|---|---|---|---|
| Acatlán de Juárez (inicio sur) | **-103.59, 20.04** | -103.58, 20.05 | ~1km ✓ OK |
| Tlajomulco de Zúñiga (sur) | **-103.44, 20.47** | -103.30, 20.10 | **~42km ERROR** |
| Zapotlanejo (salida este) | **-103.07, 20.63** | -103.06, 20.37 | **~29km ERROR** |

**El punto etiquetado como "Macrolibramiento Sur (Tlajomulco)" [-103.30, 20.10] está 42km al sur de la posición real del Macrolibramiento.** Esto está al nivel de Jocotepec/Chapala, no de Tlajomulco. Mapbox construye una ruta que baja al lago, cruza por carreteras secundarias, y vuelve — inflando la distancia de 90km a 255km.

El punto "Zapotlanejo Sur" [-103.06, 20.37] está ~29km al sur de la posición real [-103.07, 20.63], ubicándolo en zona rural entre Tonalá y Tlaquepaque, no en la salida este del Macrolibramiento.

**Segmentos afectados directamente:**
- `mza-cdmx-3` "Macrolibramiento GDL Sur - La Barca": Mapbox 255km vs esperado 90km (**2.8x**)
- `mza-tam-2` "Colima - Macrolibramiento GDL": Mapbox 293km vs esperado 100km (**2.9x**)
- `mza-tam-2b` "Macrolibramiento GDL - Entronque Norte": Mapbox 142km vs esperado 40km (**3.6x**)
- `nog-1` "GDL - Tequila - Magdalena": Mapbox 172km vs esperado 120km (**1.4x**)
- `gdl-tep-1` "GDL - Tequila": Mapbox ~166km vs esperado 60km (**2.8x**)
- `gdl-lag-1` "GDL - Zapotlanejo": Mapbox ~62km vs esperado 35km (**1.8x**)

## Causa Raíz #2: WAYPOINTS INSUFICIENTES PARA SEGMENTOS LARGOS

Muchos segmentos de 100-250km solo tienen 2 waypoints (origen y destino). Mapbox interpreta "punto A → punto B" y busca la ruta más corta por carretera, que puede ir por cualquier camino. Sin waypoints intermedios que fuercen la ruta por la carretera correcta, Mapbox puede elegir una ruta alternativa más larga o por carreteras incorrectas.

**Segmentos con solo 2 waypoints y distancia >150km:**
| ID | Nombre | kmRange | Waypoints | Mapbox km | Ratio |
|---|---|---|---|---|---|
| `mza-tam-6` | SLP - Ciudad Valles | 170km | 2 | 322.6 | **1.9x** |
| `mza-tam-7` | Ciudad Valles - Tampico | 150km | 2 | 185 | 1.2x |
| `altiplano-1` | Ags - Zacatecas | 130km | 2 | 116.7 | 0.9x OK |
| `bajio-5` | León - Ags | 150km | 2 | 128.2 | 0.9x OK |
| `vhsa-can-5` | Campeche - Mérida | 180km | 2 | 172.7 | OK |

El impacto es aleatorio: a veces Mapbox acierta, a veces no. Depende de si hay una ruta directa obvia o si hay bifurcaciones.

## Causa Raíz #3: SEGMENTOS QUE CRUZAN REGIONES ENTERAS CON WAYPOINTS INCORRECTOS

| ID | Nombre | Mapbox km | Esperado km | Ratio | Problema específico |
|---|---|---|---|---|---|
| `qro-jua-6` | Río Grande - Jiménez | 512.8 | 160 | **3.2x** | 4 waypoints cubren ~600km de desierto, Mapbox desvía por Torreón |
| `costera-3` | LC - Manzanillo | 448.4 | 250 | **1.8x** | 4 waypoints, la Costera 200 tiene muchas curvas que inflan distancia |
| `qro-jua-10` | Chihuahua - Cd. Juárez | 429.2 | 150 | **2.9x** | 4 waypoints, desvío por sierra |
| `nog-6` | Los Mochis - Guaymas | 397.5 | 220 | **1.8x** | 4 waypoints, ruta por la costa OK pero larga |
| `altiplano-3` | Fresnillo - SLP | 382.3 | 90 | **4.2x** | Waypoints van Fresnillo→Ojocaliente→Villa de Arriaga→SLP, un triángulo enorme |
| `vhsa-can-1` | Villahermosa - Cd. del Carmen | 374.4 | 180 | **2.1x** | 3 waypoints, ruta costera con desvíos |
| `pue-oax-2` | Izúcar - Huajuapan | 345.7 | 110 | **3.1x** | Waypoint intermedio [-97.80, 18.88] está en Tehuacán, no en la ruta directa |
| `lc-cdmx-2` | Tierra Caliente | 284.9 | 60 | **4.7x** | 5 waypoints pero el trazo sube y baja por sierra — Mapbox desvía |
| `mty-sal-2` | Ramos Arizpe - Santa Catarina | 276.2 | 35 | **7.9x** | 3 waypoints pero coordenadas incorrectas hacen que Mapbox rodee la sierra |

## Causa Raíz #4: ALTIPLANO-3 — WAYPOINTS FORMAN UN TRIÁNGULO

El segmento `altiplano-3` (Fresnillo - SLP) tiene waypoints:
```
[-102.87, 23.17]  → Fresnillo
[-102.27, 22.41]  → Ojocaliente (sur-este)  
[-101.38, 22.16]  → Villa de Arriaga (más al sur-este)
[-100.98, 22.15]  → SLP
```
Esto forma un triángulo invertido que baja ~100km al sur antes de ir al este. La ruta real por la Hwy 49 va Fresnillo → sur por autopista directa a SLP (~130km). Los waypoints intermedios fuerzan un desvío por Ojocaliente y Villa de Arriaga que no es la ruta de carga principal.

## Causa Raíz #5: MTY-SAL-2 — COORDENADAS COMPLETAMENTE ERRÓNEAS

El segmento `mty-sal-2` (Ramos Arizpe - Santa Catarina, 35km) muestra 276.2km en Mapbox.

Waypoints: `[-100.95, 25.54] → [-100.62, 25.52] → [-100.45, 25.58]`

El problema: estas coordenadas están correctas geográficamente, pero la carretera 40D entre Saltillo y Monterrey pasa por la **Cuesta de los Muertos** (sierra). Con solo 3 waypoints, Mapbox puede enrutar por un camino diferente. La distancia real es ~85km para el segmento completo (25-60km = 35km para este tramo), pero Mapbox reporta 276km — sugiriendo que el router encuentra una ruta indirecta.

## Inventario completo de segmentos con ratio >1.5x

| # | ID | Nombre | Esperado km | Mapbox km | Ratio | Causa raíz |
|---|---|---|---|---|---|---|
| 1 | `qro-jua-6` | Río Grande - Jiménez | 160 | 512.8 | **3.2x** | Pocos waypoints, desierto |
| 2 | `costera-3` | LC - Manzanillo | 250 | 448.4 | **1.8x** | Costa con curvas, pocos WP |
| 3 | `qro-jua-10` | Chihuahua - Cd. Juárez | 150 | 429.2 | **2.9x** | Pocos WP, sierra |
| 4 | `nog-6` | Los Mochis - Guaymas | 220 | 397.5 | **1.8x** | Largo, 4 WP |
| 5 | `altiplano-3` | Fresnillo - SLP | 90 | 382.3 | **4.2x** | Triángulo de WP |
| 6 | `vhsa-can-1` | Villahermosa - Carmen | 180 | 374.4 | **2.1x** | Ruta costera |
| 7 | `pue-oax-2` | Izúcar - Huajuapan | 110 | 345.7 | **3.1x** | WP intermedio fuera de ruta |
| 8 | `costera-1` | Acapulco - Zihuatanejo | 240 | 326.4 | **1.4x** | OK-ish (costera) |
| 9 | `mza-tam-6` | SLP - Cd. Valles | 170 | 322.6 | **1.9x** | Solo 2 WP |
| 10 | `vhsa-can-6` | Mérida - Cancún | 220 | 320.5 | **1.5x** | 3 WP, ruta larga |
| 11 | `mza-tam-2` | Colima - Macro GDL | 100 | 293.3 | **2.9x** | **Macrolib coords mal** |
| 12 | `lc-cdmx-2` | Tierra Caliente | 60 | 284.9 | **4.7x** | WP sierra incorrectos |
| 13 | `tux-oax-6` | Tehuantepec - Oaxaca | 150 | 281.8 | **1.9x** | Sierra, pocos WP |
| 14 | `mty-mat-2` | Montemorelos - San Fernando | 110 | 276.2 | **2.5x** | WP incorrectos |
| 15 | `mty-sal-2` | Ramos Arizpe - Sta. Catarina | 35 | 276.2 | **7.9x** | Coords erróneas |
| 16 | `tep-maz-3` | Escuinapa - Mazatlán | 100 | 273.8 | **2.7x** | 3 WP |
| 17 | `tux-oax-4` | Tuxtla - Juchitán | 230 | 264.1 | **1.1x** | OK |
| 18 | `mza-cdmx-3` | Macro GDL Sur - La Barca | 90 | 255.3 | **2.8x** | **Macrolib coords mal** |
| 19 | `slp-mat-6` | La Ventura - Saltillo | 80 | 247.5 | **3.1x** | 4 WP, desierto |
| 20 | `qro-jua-1` | Querétaro - SLP | 200 | 244.5 | **1.2x** | OK |
| 21 | `maz-dur-2` | Concordia - Espinazo | 70 | 214.6 | **3.1x** | Sierra, pocos WP |
| 22 | `mza-cdmx-2` | Colima - Acatlán | 110 | 203.9 | **1.9x** | Sierra con curvas |
| 23 | `gdl-tep-3` | Barrancas - Compostela | 50 | 179.4 | **3.6x** | Sierra Nayarit |

## Plan de corrección

### Paso 1: Corregir coordenadas del Macrolibramiento GDL (6 segmentos)

Actualizar los 3 waypoints del Macrolibramiento en todos los segmentos que lo usan:

| Punto | Actual | Correcto |
|---|---|---|
| Acatlán (sur) | [-103.58, 20.05] | [-103.59, 20.04] (OK) |
| Tlajomulco (sureste) | [-103.30, 20.10] | **[-103.44, 20.47]** |
| El Salto (este) | — | **[-103.24, 20.52]** (nuevo) |
| Zapotlanejo (salida este) | [-103.06, 20.37] | **[-103.07, 20.63]** |

Afecta: `mza-cdmx-3`, `mza-tam-2`, `mza-tam-2b`, `gdl-lag-1`, `gdl-tep-1`, `nog-1`

### Paso 2: Agregar waypoints intermedios a segmentos largos (15+ segmentos)

Para cada segmento >100km con ratio >1.5x, agregar 2-5 waypoints intermedios usando coordenadas verificadas de la carretera real.

### Paso 3: Corregir coordenadas específicas erróneas

- `mty-sal-2`: Las coords generan una ruta de 276km para un tramo de 35km. Verificar y corregir.
- `altiplano-3`: Eliminar waypoints de Ojocaliente/Villa de Arriaga, usar ruta directa Hwy 49.
- `lc-cdmx-2`: Los 5 waypoints en Tierra Caliente generan 285km vs 60km esperados — el trazo sube/baja por la sierra.
- `pue-oax-2`: Waypoint [-97.80, 18.88] (Tehuacán) no está en la ruta Izúcar-Huajuapan.
- `slp-mat-6`: 4 waypoints para 80km generan 247km — coords forman desvío.

### Paso 4: Re-enriquecer via SegmentAuditor

Después de corregir los waypoints en código, usar el panel de Auditoría para batch re-enrich con `enrich-segment-geometries`.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Corregir ~23 segmentos: coordenadas Macrolib GDL + waypoints intermedios + coords erróneas |

Este es un cambio masivo (~200 líneas). Propongo dividirlo en bloques:
1. **Macrolibramiento GDL** (6 segmentos, ~30 líneas)
2. **Corredor Qro-Cd. Juárez** (segmentos 6, 10: agregar WP)
3. **Altiplano-3, lc-cdmx-2, pue-oax-2, mty-sal-2, slp-mat-6** (5 segmentos críticos)
4. **Segmentos costeros/serranos** (costera-3, tep-maz-3, gdl-tep-3, maz-dur-2, etc.)

Después de cada bloque, re-enrich via SegmentAuditor y validar ratios.

