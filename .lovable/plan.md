

# Plan: Módulo de Rutas Inteligentes con Agente AI para Informes ISO 28000

## Estado actual

- **Mapa**: Las líneas son rectas punto-a-punto (2-3 waypoints por segmento), no siguen carreteras reales. El mapa se reinicializa con Mapbox cada vez que se abre el tab.
- **Puntos seguros**: Solo hay **17 activos** en BD (8 oro, 6 plata, 2 bronce, 1 precaución). Se necesitan ~200 para evaluar rutas.
- **Zoom global**: La página opera bajo zoom 0.7, distorsionando el mapa. Existe un patrón `LMSZoomReset` que ya resuelve esto.
- **Informe PDF existente**: `RouteAnalysisReport.tsx` genera un PDF básico con DRF y tablas, pero no incluye ETA, horarios sugeridos, puntos de parada, ni zonas sin señal.
- **LOVABLE_API_KEY** y **MAPBOX_ACCESS_TOKEN** ya están configurados.

## Plan de implementación

### A. Seed de 200+ puntos seguros en BD

Insertar ~200 puntos seguros distribuidos en los 18 corredores principales, con datos realistas:
- Gasolineras de cadena (Pemex, BP) cada ~50-80km
- Bases GN/militar en puntos estratégicos
- Oxxo/7-Eleven en zonas urbanas intermedias
- Casetas de peaje como puntos seguros naturales
- Cada punto con sus 12 criterios de scoring evaluados y `certification_level` calculado

Usar el **insert tool** (no migración) para insertar los datos.

### B. Zoom reset para la página de Seguridad

Aplicar el patrón `LMSZoomReset` al tab "Rutas y Zonas" en `SecurityPage.tsx`. El mapa renderiza a zoom 1.0, eliminando la distorsión del canvas de Mapbox.

### C. Geometría cacheada — eliminar llamados frecuentes a Mapbox

**Edge function `enrich-segment-geometries`**:
- Recibe un array de segmentos con waypoints simples
- Llama Mapbox Directions API (`driving` profile) una sola vez por segmento
- Devuelve las geometrías detalladas (50-100 coords por tramo)
- Se ejecuta manualmente (no en cada carga de página)

**Tabla `segment_geometries`**:
- `segment_id` (PK), `coordinates` (jsonb), `distance_km`, `duration_minutes`, `enriched_at`
- El mapa lee de esta tabla; si no hay geometría, usa los waypoints simples como fallback

**Resultado**: El mapa carga geometrías pre-calculadas desde Supabase, no llama Mapbox Directions en cada apertura.

### D. Agente AI para Informe de Ruta ISO 28000

**Edge function `route-intelligence-report`**:
- Input: `{ origen, destino }`
- Proceso:
  1. Geocodifica origen/destino con Mapbox Geocoding API
  2. Obtiene ruta real con Mapbox Directions API (geometría + ETA + distancia)
  3. Consulta en BD: puntos seguros dentro de 5km de la ruta, zonas sin cobertura, segmentos de riesgo que cruza
  4. Llama Lovable AI (gemini-3-flash-preview) con un system prompt ISO 28000 que incluye:
     - Rol: "Eres un analista de seguridad logística certificado ISO 28000"
     - Tool calling para structured output con schema definido
  5. El agente genera: hora sugerida de salida, puntos de parada recomendados (con nombre, km, certificación), alertas de zonas sin señal, recomendaciones de escolta, protocolo nocturno

**Schema de respuesta del agente (tool calling)**:
```
{
  horaSalidaSugerida: string,
  justificacionHorario: string,
  etaEstimado: string,
  paradasRecomendadas: [{ nombre, km, certificacion, tiempoParada, razon }],
  zonasSinSenal: [{ nombre, kmInicio, kmFin, duracionMinutos, protocolo }],
  nivelRiesgoGeneral: string,
  recomendacionesISO28000: string[],
  protocoloNocturno: string,
  requiereEscolta: boolean,
  briefingOperativo: string
}
```

### E. UI de generación de informe en el tab de Rutas

Actualizar el diálogo existente en `RouteRiskIntelligence.tsx`:
- Inputs: Origen, Destino (los que ya existen)
- Al hacer click en "Generar": llama la edge function, muestra spinner
- Con la respuesta del agente + datos de BD, genera el PDF enriquecido

### F. PDF enriquecido — `RouteAnalysisReport.tsx`

Ampliar el reporte existente con nuevas secciones:
- **Datos de Ruta**: ETA, distancia, hora sugerida de salida con justificación
- **Paradas Recomendadas**: Tabla con puntos seguros reales sobre la ruta (nombre, km, nivel, tiempo sugerido)
- **Zonas sin Cobertura**: Tabla con tramos sin señal, duración estimada, protocolo recomendado
- **Briefing Operativo**: Resumen narrativo generado por AI para el Head de Seguridad
- **Protocolo Nocturno**: Sección dedicada si la ruta implica tránsito nocturno

### Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `supabase` (insert tool) | Seed ~200 puntos seguros con scoring |
| `supabase/migrations/` | Tabla `segment_geometries` |
| `supabase/functions/enrich-segment-geometries/index.ts` | Edge function para cachear geometrías |
| `supabase/functions/route-intelligence-report/index.ts` | Agente AI ISO 28000 |
| `src/hooks/security/useSegmentGeometries.ts` | Hook para cargar geometrías cacheadas |
| `src/components/security/map/RiskZonesMap.tsx` | Preferir geometría detallada, fallback a waypoints |
| `src/pages/Security/SecurityPage.tsx` | Zoom reset para tab de rutas |
| `src/hooks/security/useRouteAnalysisData.ts` | Integrar datos del agente AI |
| `src/components/security/routes/RouteRiskIntelligence.tsx` | UI del diálogo mejorado |
| `src/components/security/reports/RouteAnalysisReport.tsx` | PDF con paradas, ETA, zonas sin señal, briefing |
| `supabase/config.toml` | Registrar nuevas edge functions |

