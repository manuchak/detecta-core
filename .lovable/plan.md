

# Corregir rutas de carga: libramientos y macrolibramientos en todas las ciudades

## El problema real

Tienes razon. Un tractocamion que viene de Manzanillo **nunca entra a Guadalajara** — toma el **Macrolibramiento Sur (GUA-10D, 111km)** desde Acatlan de Juarez hasta Zapotlanejo. Actualmente los waypoints del segmento `mza-tam-2` pasan por `[-103.3000, 20.2800]` y `[-103.2600, 20.5200]`, que son coordenadas del periferico urbano, no del macrolibramiento que pasa por el sur (~20.1-20.3 lat).

Este error se repite en **todas las ciudades principales** del sistema. Los corredores pasan "por el centro" de cada ciudad como si fueran autos particulares, no carga pesada.

## Ciudades afectadas y libramientos reales

Investigacion de infraestructura carretera actual para transporte de carga:

```text
Ciudad              Libramiento real                  Estado actual en sistema
─────────────────────────────────────────────────────────────────────────────
Guadalajara         Macrolibramiento Sur (GUA-10D)    Pasa por periferico urbano
                    111km, cuota, Acatlan-Zapotlanejo
Queretaro           Macrolibramiento Qro (Centenario) Pasa por centro urbano
                    86km, cuota, Palmillas-Apaseo
CDMX/ZMVM           Arco Norte + CEM                  Ya existe como corredor
                    (unico que esta bien modelado)     separado ✓
Celaya              Libramiento Sur + Nororiente       Corredor Bajio pasa por
                    30km, cuota                        centro
Leon                Libramiento Leon (45D bypass)      Corredor Bajio pasa por
                    ~25km                              centro  
Puebla              Periferico Ecologico + Arco Norte  Corredor Cordoba-Puebla
                    conexion sur                       termina en centro urbano
Morelia             Libramiento Sur                    Corredor LC-CDMX pasa
                    4.3km, tuneles+viaducto            por centro
SLP                 Libramiento SLP (periférico)       Corredor SLP-Hub ya usa
                    ~30km                              periferico parcial
Aguascalientes      Libramiento Poniente               Corredor Altiplano pasa
                    ~20km, cuota                       por centro
Saltillo            Libramiento Saltillo (periférico)  Corredor 40D pasa por
                    ~25km                              centro urbano
Monterrey           Anillo Periferico / Lib. Colombia  Corredor MTY-NL pasa
                    ~40km                              por centro
Chihuahua           Libramiento Chihuahua              Corredor Qro-Juarez pasa
                    ~35km                              por centro
Torreon             Periferico Raul Lopez Sanchez      Corredor Maz-Dur-Tor
                    ~30km                              termina en centro
Tuxtla Gutierrez    Libramiento Norte/Sur              Corredor Tuxtla-Oaxaca
                    modernizado                        pasa por centro
Tepic               Libramiento Tepic                  Corredor GDL-Tepic
                    ~15km                              termina en centro
Oaxaca              Libramiento Oaxaca                 Corredor Puebla-Oaxaca
                    ~20km                              termina en centro
Toluca              Libramiento Toluca                 Corredor Mex-Toluca
                    ~15km                              termina en centro
```

## Plan de implementacion

### A. Corregir waypoints de segmentos existentes (~25 segmentos)

Para cada ciudad afectada, reemplazar las coordenadas urbanas por las del libramiento real. Ejemplo concreto para Guadalajara:

**Antes** (periferico urbano):
```
mza-tam-2: [-103.3000, 20.2800], [-103.2600, 20.5200]  ← centro GDL
```

**Despues** (macrolibramiento sur):
```
mza-tam-2: [-103.5800, 20.1500], [-103.3500, 20.2000],  ← Acatlan
           [-103.1500, 20.3200]                          ← Zapotlanejo sur
```

Se corregiran los waypoints de los siguientes segmentos por ciudad:

| Ciudad | Segmentos a corregir | Libramiento |
|---|---|---|
| Guadalajara | `mza-tam-2`, `mza-tam-2b`, `nog-1`, `gdl-lag-1`, `gdl-tep-1` + corredor `guadalajara-colima` waypoints | Macrolibramiento GUA-10D |
| Queretaro | `cdmx-qro-4` (si existe), corredor `mexico-queretaro` waypoint final | Macrolib. Centenario |
| Celaya/Leon | Segmentos `bajio-industrial` | Lib. Celaya + Lib. Leon |
| Morelia | Segmentos `lazaro-cardenas-cdmx` que pasan por Morelia | Lib. Sur Morelia |
| Puebla | `cor-pue-4` y corredor waypoints | Periferico Ecologico |
| Monterrey | Segmentos corredor `laredo-monterrey`, `torreon-monterrey` | Anillo Periferico MTY |
| Saltillo | Segmentos `slp-mat-7`, `monterrey-saltillo` | Lib. Saltillo |
| Chihuahua | `qro-jua-8`, `qro-jua-9` | Lib. Chihuahua |
| Torreon | Segmentos `mazatlan-durango-torreon` | Periferico Lopez Sanchez |
| Aguascalientes | `qro-jua-2`, `qro-jua-3` | Lib. Poniente Ags |
| Tepic | `gdl-tep-4` | Lib. Tepic |
| Toluca | Corredor `mexico-toluca` waypoint final | Lib. Toluca |

### B. Actualizar corridors (highwayCorridors.ts)

Los waypoints de los corredores tambien pasan por centros urbanos. Corregir ~12 corredores para que sus waypoints sigan los libramientos.

### C. Re-enriquecer geometrias

Despues de corregir waypoints, invocar `enrich-segment-geometries` para los ~25 segmentos modificados. Esto hara que Mapbox trace la ruta real por el libramiento.

### D. Agregar POIs de libramientos

Agregar ~10 POIs tipo `referencia` para los entronques de libramientos mas importantes (donde el operador decide si entra a ciudad o sigue de paso).

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Corregir waypoints de ~25 segmentos para usar libramientos; agregar ~10 POIs de entronques |
| `src/lib/security/highwayCorridors.ts` | Corregir waypoints de ~12 corredores |
| Edge function `enrich-segment-geometries` | Invocar para re-procesar segmentos corregidos |

