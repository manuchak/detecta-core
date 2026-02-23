

# Plan: Automatizacion cada 3 horas + Mejoras de Inteligencia BI/Criminologia

## Validacion actual del sistema

**SI, el scraping ya se almacena como fichas de eventos.** La tabla `incidentes_rrss` funciona como un registro estructurado con 30+ campos por incidente: tipo, severidad, ubicacion, coordenadas, keywords, grupo delictivo, tipo de carga, monto de perdida, etc. La funcion `procesar-incidente-rrss` enriquece cada registro con AI (clasificacion, geocoding, resumen). La deduplicacion por URL ya esta implementada.

---

## Parte 1: CRON automatico cada 3 horas

Crear un job `pg_cron` que invoque la edge function `firecrawl-incident-search` cada 3 horas automaticamente.

**Implementacion:**
- Ejecutar un SQL via el insert tool (no migracion) que registre un `cron.schedule` llamando a `net.http_post` contra la edge function cada 3 horas
- El schedule sera `0 */3 * * *` (minuto 0 de cada 3 horas)
- La deduplicacion por URL ya existente evita insertar noticias repetidas

---

## Parte 2: Tabla de frecuencia y patrones (Vista materializada)

Crear una vista SQL `vista_frecuencia_incidentes` que consolide:
- Conteo por tipo de incidente, por semana/mes
- Conteo por estado/municipio
- Tendencia temporal (semana actual vs anterior)
- Severidad promedio por zona

Esto permite consultar patrones sin recalcular cada vez.

**Migracion SQL:**
```sql
CREATE OR REPLACE VIEW vista_frecuencia_incidentes AS
SELECT
  date_trunc('week', fecha_publicacion) AS semana,
  tipo_incidente,
  severidad,
  estado,
  carretera,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE severidad IN ('alta','critica')) AS criticos,
  AVG(confianza_clasificacion) AS confianza_promedio
FROM incidentes_rrss
WHERE procesado = true
GROUP BY 1, 2, 3, 4, 5;
```

---

## Parte 3: Mejoras propuestas basadas en BI y Criminologia Ambiental

Dado que el negocio es **custodia y transporte de carga**, estas mejoras aplican directamente:

### 3a. Hotspot temporal (Near-Repeat Theory)
Agregar campos `hora_incidente` y `dia_semana` extraidos por AI para identificar ventanas horarias de riesgo. La teoria de near-repeat en criminologia ambiental dice que un evento predice eventos similares cercanos en tiempo y espacio.

**Cambio:** Agregar columnas `hora_estimada` (INTEGER 0-23) y `dia_semana_estimado` (INTEGER 0-6) a la tabla, y que el AI las extraiga del texto.

### 3b. Queries de busqueda ampliados
Los 4 queries actuales son limitados. Agregar queries especificos para:
- `"robo combustible" OR "ordeña diesel" Mexico`
- `"extorsion transportista" OR "cobro piso" carretera Mexico`
- `"inseguridad autopista" OR "zona peligrosa" transporte Mexico`

### 3c. Score de riesgo por corredor
Crear una funcion RPC que calcule un score de riesgo por carretera basado en frecuencia, severidad y recencia de incidentes, aprovechando el sistema de scoring H3 ya existente en el modulo de seguridad.

### 3d. Alertas automaticas por umbral
Crear un trigger que detecte cuando una zona/carretera supera N incidentes criticos en 7 dias y genere una alerta en `alertas_sistema_nacional`.

---

## Detalle tecnico

### Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| SQL (insert tool) | Crear cron job `pg_cron` cada 3 horas |
| SQL (migracion) | Vista `vista_frecuencia_incidentes` + columnas hora/dia + trigger de alertas |
| `supabase/functions/firecrawl-incident-search/index.ts` | Agregar 3 queries de busqueda adicionales |
| `supabase/functions/procesar-incidente-rrss/index.ts` | Extraer hora_estimada y dia_semana del texto via AI |
| `src/hooks/useIncidentesRRSS.ts` | Nuevo hook `useIncidentesFrecuencia` para la vista |
| `src/components/incidentes/IncidentesStats.tsx` | Agregar mini-chart de tendencia semanal y breakdown por corredor |

### Secuencia de implementacion

1. Migracion DB: vista + columnas + trigger alertas
2. Cron job (insert tool)
3. Queries ampliados en edge function
4. AI extraccion hora/dia en procesar-incidente
5. Hook + UI de frecuencia/tendencia

