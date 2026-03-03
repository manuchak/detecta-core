

# Plan: Corregir waypoints y calibrar los 8 segmentos GEO_ERROR

## Diagnóstico por segmento

Analicé los waypoints actuales contra la geografía real. Los problemas son:

| Segmento | Corredor km | Mapbox km | Problema |
|---|---|---|---|
| `tep-maz-3` | 100 | 345 | Primer WP [-105.6, 22.3] demasiado al sur de Escuinapa real (~22.65) |
| `vhsa-can-1` | 180 | 446 | Ruta Mapbox toma desvíos; faltan WP intermedios en Hwy 180 costera |
| `tor-mty-2` | 90 | 219 | Solo 2 WP para 90km; falta WP intermedio en 40D por Paila |
| `cdmx-aca-2` | 35 | 82 | Solo 2 WP; ruta toma curvas de montaña. Agregar WP en autopista cuota |
| `cor-pue-2` | 35 | 75 | WPs razonables; sierra muy curva. Agregar WP en 150D directo |
| `maz-dur-2` | 70 | 148 | Sierra con túneles, 148km es realista. Solo calibrar |
| `cdmx-pac-3` | 40 | 83 | Último WP [-98.73, 20.101] demasiado al norte de Pachuca (20.07) |
| `edomex-ind-2` | 23 | 46 | Ruta en V (sur→norte); waypoints deberían ser más lineales |

## Cambios

### 1. Corregir waypoints en `highwaySegments.ts` (6 segmentos)

- **tep-maz-3**: Corregir primer WP a Escuinapa real [-105.73, 22.65], agregar WPs en costera 15D
- **vhsa-can-1**: Agregar WPs intermedios en Hwy 180 costera (Frontera, Paraíso, Comalcalco bypass)
- **tor-mty-2**: Agregar WP intermedio en Paila [-102.85, 25.35] sobre 40D
- **cdmx-aca-2**: Agregar WP intermedio en caseta La Pera [-99.23, 19.08] sobre autopista cuota
- **cdmx-pac-3**: Corregir último WP a Pachuca real [-98.73, 20.07]
- **edomex-ind-2**: Reordenar WPs para ruta lineal por zona industrial

### 2. Agregar `expectedRoadKm` para los 8 segmentos

Para los 2 segmentos donde la distancia es realista pero el rango km del corredor no coincide (`maz-dur-2`, `cor-pue-2`), agregar calibración en `EXPECTED_ROAD_KM`.

Para los 6 restantes, agregar `expectedRoadKm` con la distancia real esperada post-corrección (se actualizará tras re-enriquecer).

### Archivo a modificar
| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Corregir waypoints de 6 segmentos + agregar 8 entradas a `EXPECTED_ROAD_KM` |

