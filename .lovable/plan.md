
# Mapeo de Corredores del Norponiente de Mexico

## Diagnostico

El norponiente (Jalisco costa, Nayarit, Sinaloa, Durango sierra, Sonora, Baja California) es la region con el **mayor deficit de inteligencia** en el sistema. De los ~4,200km de rutas activas en esta zona, solo ~660km tienen segmentos granulares (Tepic-Mazatlan y parte de Chihuahua). Esto significa que el **84% del norponiente esta ciego** para la gestion de riesgos.

### Corredores existentes SIN segmentos (punto ciego total)

| Corredor | Km | Nivel | Estado actual |
|---|---|---|---|
| `mexico-nogales` (15D) | 1,800 | Medio | 0 segmentos. Corredor mas largo del sistema = linea en el mapa sin datos |
| `mazatlan-durango-torreon` | 520 | Alto | 0 segmentos. Incluye Espinazo del Diablo (zona EXTREMA) |
| `guadalajara-lagos` | 190 | Alto | 0 segmentos. Corredor automotriz Jalisco-Bajio |

### Corredores completamente ausentes

| Corredor Faltante | Km | Nivel | Justificacion |
|---|---|---|---|
| **Guadalajara-Tepic (15D)** | 220 | Medio | Conexion faltante GDL-Costa Pacifico. Sin este corredor, Tepic-Mazatlan queda aislado |
| **Culiacan-Los Mochis-Guaymas (15D Sinaloa)** | 600 | Alto | Sinaloa = zona de operacion de carteles. Robos a transporte en zona agricola/pesquera. Acceso a puertos de Topolobampo y Guaymas |
| **Hermosillo-Nogales (15D Norte)** | 280 | Medio | Cruce fronterizo con Arizona. Maquiladoras. Comercio IMMEX |

## Plan de Implementacion

### Fase A: Segmentos para `mazatlan-durango-torreon` (520km, ALTO - P0 critico)

Este corredor cruza la **Sierra Madre Occidental** por la autopista Mazatlan-Durango (la "Espinazo del Diablo"), considerada una de las mas peligrosas de Mexico por topografia y narcotrafico.

**6 segmentos:**

| ID | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| maz-dur-1 | Mazatlan - Concordia | 0-50 | Medio | Zona costera, salida urbana |
| maz-dur-2 | Concordia - Espinazo del Diablo | 50-120 | Extremo | Sierra Madre, tuneles, puentes. Emboscadas. Sin cobertura celular. Zona de narcotrafico |
| maz-dur-3 | Espinazo - El Salto | 120-180 | Alto | Zona serrana con presencia de grupos armados |
| maz-dur-4 | El Salto - Durango | 180-260 | Medio | Bajada al altiplano, mejora infraestructura |
| maz-dur-5 | Durango - Nombre de Dios | 260-370 | Medio | Transicion al desierto |
| maz-dur-6 | Nombre de Dios - Torreon | 370-520 | Alto | Zona La Laguna, conflicto entre carteles |

Segmento clave: `maz-dur-2` (Espinazo del Diablo) sera EXTREMO con comunicacion satelital obligatoria, restriccion horaria 18:00-06:00, y zona muerta de cobertura celular (~70km).

### Fase B: Segmentos para `mexico-nogales` (1,800km - segmentacion por tramos)

El corredor Mexico-Nogales es el mas largo y atraviesa 7 estados. Lo segmentare en ~12 tramos:

| ID | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| nog-1 | GDL - Tequila - Magdalena | 0-120 | Medio | Salida GDL hacia costa. Zona tequilera |
| nog-2 | Magdalena - Tepic | 120-220 | Medio | Sierra, curvas. Conexion con 15D Tepic |
| nog-3 | Tepic - Acaponeta | 220-320 | Medio | Ya cubierto parcialmente por tepic-mazatlan |
| nog-4 | Mazatlan - Culiacan | 320-540 | Alto | Sinaloa norte. Zona cartel. Robos agricola |
| nog-5 | Culiacan - Los Mochis | 540-740 | Alto | Corredor agricola Sinaloa. Actividad delictiva |
| nog-6 | Los Mochis - Guaymas | 740-960 | Medio | Zona agricola Sonora, Rio Yaqui |
| nog-7 | Guaymas - Hermosillo | 960-1090 | Bajo | Zona industrial, autopista moderna |
| nog-8 | Hermosillo - Magdalena Sonora | 1090-1300 | Medio | Desierto Sonora. Baja cobertura |
| nog-9 | Magdalena - Santa Ana | 1300-1400 | Bajo | Zona relativamente segura |
| nog-10 | Santa Ana - Nogales | 1400-1550 | Medio | Aproximacion frontera. Trafico de drogas |

*Nota: Los km son aproximados sobre la ruta real de la 15D, ajustando waypoints al trazado carretero.*

### Fase C: Segmentos para `guadalajara-lagos` (190km)

| ID | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| gdl-lag-1 | GDL - Zapotlanejo | 0-35 | Medio | Salida metropolitana |
| gdl-lag-2 | Zapotlanejo - Tepatitlan | 35-80 | Alto | Zona de robos en Altos de Jalisco |
| gdl-lag-3 | Tepatitlan - San Juan de los Lagos | 80-140 | Medio | Zona semi-rural |
| gdl-lag-4 | San Juan - Lagos de Moreno | 140-190 | Alto | Entrada al Bajio, convergencia con 45D |

### Fase D: Nuevo corredor `guadalajara-tepic` (220km)

Este corredor es la pieza que falta para conectar el eje Pacifico (GDL hasta Nogales).

| ID | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| gdl-tep-1 | GDL - Tequila | 0-60 | Bajo | Autopista moderna, zona turistica |
| gdl-tep-2 | Tequila - Plan de Barrancas | 60-120 | Medio | Inicio Barranca de Oblatos, curvas |
| gdl-tep-3 | Barrancas - Compostela | 120-170 | Medio | Sierra serrana, baja cobertura |
| gdl-tep-4 | Compostela - Tepic | 170-220 | Bajo | Bajada al valle de Tepic |

### Fase E: Nuevo corredor `culiacan-guaymas` (600km, ALTO)

Corredor Sinaloa-Sonora por la 15D, zona de alto riesgo por presencia de carteles y robos a transporte agricola.

| ID | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| cul-guay-1 | Culiacan - Guamuchil | 0-80 | Alto | Sinaloa central. Zona cartel |
| cul-guay-2 | Guamuchil - Los Mochis | 80-200 | Alto | Zona agricola, robos organizados |
| cul-guay-3 | Los Mochis - Topolobampo | 200-230 | Medio | Acceso a puerto. Zona controlada |
| cul-guay-4 | Los Mochis - Navojoa | 230-380 | Medio | Zona agricola Sonora sur |
| cul-guay-5 | Navojoa - Cd. Obregon | 380-440 | Bajo | Valle del Yaqui, zona agricola segura |
| cul-guay-6 | Cd. Obregon - Guaymas | 440-600 | Bajo | Autopista moderna, zona industrial |

### Fase F: Nuevo corredor `hermosillo-nogales` (280km)

| ID | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| her-nog-1 | Hermosillo - Magdalena | 0-130 | Medio | Desierto Sonora, baja cobertura |
| her-nog-2 | Magdalena - Santa Ana | 130-200 | Bajo | Zona relativamente segura |
| her-nog-3 | Santa Ana - Nogales | 200-280 | Medio | Aproximacion fronteriza, trafico |

### POIs criticos a agregar

| POI | Tipo | Ubicacion | Justificacion |
|---|---|---|---|
| Espinazo del Diablo | Blackspot | Mazatlan-Durango | Zona extrema serrana, tuneles, sin cobertura |
| El Salto (Durango) | Blackspot | Sierra Durango | Emboscadas documentadas |
| Culiacan Periurbano | Blackspot | Sinaloa | Zona de operacion cartel |
| Los Mochis Acceso Sur | Blackspot | Sinaloa norte | Robos a transporte agricola |
| Puerto Guaymas | Safe area | Sonora | Zona portuaria controlada |
| API Topolobampo | Safe area | Sinaloa norte | Terminal portuaria |
| Puesto GN Mazatlan Norte | Safe area | Sinaloa | Presencia GN permanente |
| Caseta Concordia | Tollbooth | Mazatlan-Durango | Ultimo punto antes de la sierra |
| Puesto GN Hermosillo Sur | Safe area | Sonora | Presencia permanente |

### Actualizacion de cobertura celular

Agregar zonas muertas en `cellularCoverage.ts`:
- **Espinazo del Diablo**: ~70km sin cobertura (km 50-120 del corredor Mazatlan-Durango)
- **Desierto de Sonora**: Tramos intermitentes Hermosillo-Magdalena (~40km con cobertura debil)
- **Sierra Nayarit**: Tramo Barrancas GDL-Tepic (~30km cobertura limitada)

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwayCorridors.ts` | Agregar 3 nuevos corredores (guadalajara-tepic, culiacan-guaymas, hermosillo-nogales) |
| `src/lib/security/highwaySegments.ts` | Agregar ~35 segmentos nuevos + reasignar mexico-nogales a tramos reales + agregar segmentos para guadalajara-lagos y mazatlan-durango-torreon + ~9 POIs |
| `src/lib/security/cellularCoverage.ts` | Agregar 3 zonas muertas (Espinazo, Sonora, Nayarit) |

## Impacto

| Metrica | Actual Norponiente | Post-implementacion |
|---|---|---|
| Corredores con segmentos | 3 de 6 | 9 de 9 |
| Km con analisis granular | ~660 | ~4,120+ |
| Cobertura norponiente | ~16% | ~98% |
| Segmentos nuevos | 0 | ~35 |
| POIs nuevos | 0 | ~9 |

Esto cerrara la brecha del norponiente y permitira ofrecer inteligencia de riesgo para rutas hacia puertos del Pacifico (Mazatlan, Topolobampo, Guaymas), cruces fronterizos (Nogales), y corredores industriales de Sinaloa/Sonora.
