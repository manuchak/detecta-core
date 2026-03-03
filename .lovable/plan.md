

# Fix: POI popups, geometría de rutas, y corredores faltantes

## Problemas identificados

### 1. POIs sin popup al hacer click
El mapa solo tiene event handler de click en `segments-line`. No hay listeners en `pois-circle` ni `safe-points-circle`, por lo que al hacer click en un POI o punto seguro no pasa nada.

### 2. Rutas siguen siendo líneas rectas
La tabla `segment_geometries` y la edge function `enrich-segment-geometries` ya existen, pero **nunca se ejecutó** la función para poblar las geometrías. El mapa lee de la tabla (vacía) y cae al fallback de waypoints simples → líneas rectas.

**Acción**: Invocar la edge function para procesar los 142+ segmentos existentes. Esto se hace una sola vez.

### 3. Corredores faltantes — cobertura nacional incompleta
Corredores actuales: 30 (México-Puebla hasta Hermosillo-Nogales). Faltan destinos operativos clave:

| Corredor faltante | Distancia | Relevancia |
|---|---|---|
| Nogales - Tijuana (2D) | ~680km | Frontera noroeste, maquiladoras |
| La Paz - Los Cabos (1/19) | ~180km | Turismo, logística peninsular |
| Puebla - Oaxaca (131D/135D) | ~340km | Sierra Mixteca, zona sin señal |
| Villahermosa - Cancún (186/307) | ~900km | Sureste, Cd. del Carmen, Campeche |
| Coatzacoalcos - Salina Cruz (185) | ~300km | Corredor Transístmico |
| Mérida - Cancún (180D) | ~310km | Península de Yucatán |

## Plan de implementación

### A. Agregar popups a POIs y puntos seguros
En `RiskZonesMap.tsx`, agregar event handlers de click para:
- **`pois-circle`**: Mostrar popup con nombre, tipo, descripción, y nivel de riesgo
- **`safe-points-circle`**: Mostrar popup con nombre, tipo, certificación

### B. Ejecutar enriquecimiento de geometrías
Invocar `enrich-segment-geometries` con los segmentos existentes para poblar `segment_geometries`. Esto convierte las líneas rectas en trazados sobre carretera real.

### C. Agregar 6 corredores faltantes
Expandir `highwaySegments.ts` con ~35 segmentos nuevos y ~20 POIs para los corredores faltantes, cubriendo Tijuana, Los Cabos, Oaxaca, Cancún, Ciudad del Carmen y el Transístmico.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/security/map/RiskZonesMap.tsx` | Agregar click handlers para POIs y safe points con popups |
| `src/lib/security/highwaySegments.ts` | Agregar ~35 segmentos y ~20 POIs para 6 corredores nuevos |
| Edge function `enrich-segment-geometries` | Invocar para poblar geometrías de todos los segmentos |

