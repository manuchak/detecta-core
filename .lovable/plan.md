

# Investigacion: Trayectos No Mapeados en el Modulo de Seguridad

## Resumen Ejecutivo

El sistema actualmente tiene **24 corredores** en `highwayCorridors.ts` y **65 segmentos** en `highwaySegments.ts`. Sin embargo, la investigacion revela **tres niveles de brecha critica** que comprometen la capacidad de gestion de riesgos ISO 28000:

1. **15 corredores sin segmentos granulares** (~6,400 km sin analisis de riesgo por tramo)
2. **8+ corredores completamente ausentes** que aparecen en la matriz de precios operativa
3. **Datos de riesgo desactualizados** vs. inteligencia 2025-2026 (AMIS, CANACAR, AMESIS)

---

## Hallazgo 1: Corredores Existentes SIN Segmentos de Riesgo

Estos 15 corredores aparecen en el mapa como lineas pero NO tienen segmentos granulares (~30km). Esto significa que el sistema no puede calcular riesgo por tramo, ni generar recomendaciones ISO 28000 especificas, ni alimentar el pricing de custodia.

| Corredor | Km | Nivel | Prioridad | Justificacion |
|---|---|---|---|---|
| edomex-industrial | 85 | EXTREMO | P0 | Zona #1 de robos en Mexico (EdoMex 23% nacional). Sin segmentos = punto ciego critico |
| mexico-texcoco | 45 | EXTREMO | P0 | Corredor oriente ZMVM, 7 ev/hex. Rutas activas en matriz |
| guadalajara-lagos | 190 | ALTO | P1 | Conexion Jalisco-Bajio, corredor automotriz |
| tamaulipas-frontera | 320 | ALTO | P1 | Corredor fronterizo, rutas a Reynosa/Matamoros en matriz |
| mazatlan-durango-torreon | 520 | ALTO | P1 | "Espinazo del Diablo", zona de narcotrafico |
| queretaro-ciudad-juarez | 1,200 | ALTO | P1 | Eje norte completo, maquiladoras IMMEX |
| mexico-veracruz | 400 | MEDIO | P2 | Corredor al Golfo, tramos criticos en Cordoba |
| guadalajara-colima | 300 | MEDIO | P2 | Conexion a Manzanillo, puerto clave |
| monterrey-saltillo | 85 | MEDIO | P2 | Cluster automotriz Ramos Arizpe |
| laredo-monterrey | 230 | MEDIO | P2 | Principal cruce comercial Mexico-EEUU |
| veracruz-monterrey | 780 | MEDIO | P2 | Conecta puertos del Golfo cruzando SLP |
| puebla-oaxaca | 340 | MEDIO | P2 | Corredor sur, zona serrana |
| mexico-nogales | 1,800 | MEDIO | P3 | Corredor oeste a frontera Arizona |
| merida-cancun | 310 | BAJO | P3 | Corredor turistico, bajo riesgo |
| tijuana-ensenada | 100 | BAJO | P3 | Baja California, bajo riesgo |

**Total: ~6,405 km sin analisis granular de riesgo**

---

## Hallazgo 2: Corredores Completamente Ausentes

Estos corredores NO existen ni en `highwayCorridors.ts` ni en `highwaySegments.ts`, pero aparecen en la matriz de precios (`matriz_precios_rutas`) como rutas activas con servicios de custodia.

| Corredor Faltante | Km Est. | Nivel Est. | Justificacion |
|---|---|---|---|
| **CDMX-Cuernavaca-Acapulco (95D/Autopista del Sol)** | 380 | ALTO | Multiples rutas en matriz (Acapulco-CDMX). Bloqueos frecuentes (nota de hoy en nmas.com.mx). Guerrero = zona roja |
| **Cordoba-Orizaba-Puebla (150D tramo sur)** | 190 | ALTO | AMESIS reporta 19% de incidentes nacionales en este corredor. Segundo mas peligroso de Mexico |
| **CDMX-Pachuca (85D)** | 95 | MEDIO | Alto trafico, conexion con Arco Norte. Rutas a Tizayuca/Pachuca en matriz |
| **Torreon-Monterrey (40D)** | 300 | ALTO | Corredor industrial La Laguna-MTY. Zona de conflicto entre carteles |
| **Chihuahua-Cd. Juarez (45 tramo norte)** | 370 | ALTO | Corredor maquiladora IMMEX. Rutas activas en matriz |
| **Villahermosa-Coatzacoalcos (180)** | 250 | MEDIO | Corredor petroquimico. Rutas a Villahermosa en matriz |
| **Tepic-Mazatlan (15D)** | 290 | MEDIO | Costa Pacifico norte, conecta con corredor Nogales |
| **CDMX-Cuernavaca-Cuautla (115D/95D)** | 120 | MEDIO | Corredor sur ZMVM. Multiples rutas en matriz |

**Total: ~1,995 km sin cobertura alguna**

---

## Hallazgo 3: Inteligencia de Riesgo Actualizada 2025-2026

Datos de AMIS, CANACAR, AMESIS y SSPC que deben enriquecer los segmentos:

- **16,000+ atracos en 2025**, perdidas > $7,000 MDP
- **68% con violencia** (AMIS/ANTP)
- **71% usa jammers** para inhibir GPS (AMESIS) -- critico para recomendaciones de comunicacion satelital
- **Mexico-Queretaro**: 22% de incidentes nacionales (actualmente mapeado como "alto", deberia reevaluarse)
- **Cordoba-Puebla**: 19% de incidentes nacionales (NO MAPEADO)
- **Horarios criticos**: 19:00-00:00 y 04:00-06:00 (consistente con datos actuales)
- **Productos mas robados**: Abarrotes 37%, Alimentos 15%, Combustibles 12%, Electronicos
- **EdoMex 23%, Puebla 22%, Guanajuato 10%** de incidencia por estado

---

## Plan de Implementacion

### Fase 1 (P0) — Corredores criticos sin segmentos (~2-3 dias)

Agregar segmentos granulares a los 2 corredores EXTREMO ya existentes y al corredor Cordoba-Puebla (nuevo):

**Archivos a modificar:**

1. **`src/lib/security/highwaySegments.ts`**:
   - Agregar ~4 segmentos para `edomex-industrial` (Tlalnepantla-Naucalpan-Ecatepec-Tultitlan)
   - Agregar ~3 segmentos para `mexico-texcoco` (CDMX Oriente-Los Reyes-Texcoco)
   - Agregar ~5 segmentos para nuevo corredor `cordoba-puebla`

2. **`src/lib/security/highwayCorridors.ts`**:
   - Agregar corredor `cordoba-puebla` (150D tramo sur)
   - Agregar corredor `cdmx-cuernavaca` (95D Autopista del Sol)
   - Agregar corredor `cdmx-pachuca` (85D)

3. **`supabase/functions/seed-risk-zones/index.ts`**:
   - Agregar nuevos corredores al seed para generar hexagonos H3

Cada segmento incluira:
- Waypoints reales de la carretera ([lng, lat])
- Nivel de riesgo calibrado con datos AMIS 2025
- Eventos mensuales promedio
- Horarios criticos actualizados (19:00-00:00, 04:00-06:00)
- Tipo de incidente comun
- Recomendaciones ISO 28000 (incluyendo anti-jammer para zonas con 71% de uso)

### Fase 2 (P1) — Corredores de alto riesgo (~3-4 dias)

Agregar segmentos a 4 corredores ALTO existentes + 3 nuevos:

- `guadalajara-lagos`: 5 segmentos
- `tamaulipas-frontera`: 8 segmentos
- `mazatlan-durango-torreon`: 6 segmentos (Espinazo del Diablo como EXTREMO)
- `queretaro-ciudad-juarez`: 10 segmentos (1,200km)
- Nuevo: `torreon-monterrey` (40D): 5 segmentos
- Nuevo: `cdmx-acapulco` (95D): 6 segmentos
- Nuevo: `chihuahua-cd-juarez`: 5 segmentos

### Fase 3 (P2) — Cobertura nacional completa (~3-4 dias)

- Segmentos para los 6 corredores MEDIO restantes
- Nuevos: Villahermosa-Coatzacoalcos, Tepic-Mazatlan, CDMX-Cuautla
- POIs adicionales (puntos negros, gasolineras, bases GN) para corredores nuevos

### Datos por Segmento (estructura)

Cada segmento nuevo seguira el patron existente en `highwaySegments.ts`:

```text
{
  id: 'edomex-ind-1',
  corridorId: 'edomex-industrial',
  name: 'Tlalnepantla - Naucalpan Industrial',
  kmStart: 0,
  kmEnd: 25,
  riskLevel: 'extremo',
  avgMonthlyEvents: 10,
  criticalHours: '19:00-00:00',
  commonIncidentType: 'Robo con violencia / Uso de jammer',
  recommendations: [
    'Comunicacion satelital OBLIGATORIA (71% uso de jammers)',
    'Restriccion horaria: Evitar 19:00-06:00',
    'Convoy minimo 2 unidades para carga >$2M',
    'Check-in cada 10 min'
  ],
  waypoints: [[-99.2200, 19.5300], [-99.1700, 19.5700]],
}
```

### Enriquecimiento de Recomendaciones ISO 28000

Actualizar `src/lib/security/securityRecommendations.ts` con:
- Protocolo anti-jammer para zonas con uso >50% de inhibidores
- Alerta de horarios criticos actualizada (19:00-00:00 + 04:00-06:00)
- Recomendaciones especificas por tipo de carga (abarrotes, electronicos, combustibles)
- Referencia a lineas de emergencia actualizadas (088 GN, 074 SESNSP)

---

## Impacto Esperado

| Metrica | Actual | Post-implementacion |
|---|---|---|
| Corredores con segmentos | 14 | 30+ |
| Km con analisis granular | ~4,248 | ~12,600+ |
| Cobertura de rutas activas | ~60% | ~95% |
| Segmentos totales | 65 | ~130+ |
| POIs | ~50 | ~85+ |

Esto permitira al equipo de planeacion y al Head de Seguridad tomar decisiones informadas sobre custodia, pricing y restricciones horarias para TODAS las rutas operativas, no solo las del centro del pais.

