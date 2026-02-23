

# Plan: Filtro AI de Calidad + Inteligencia Criminologica Avanzada

## Problema actual

El scraping actual inserta TODO lo que Firecrawl devuelve sin validar relevancia. Muchos resultados pueden ser noticias tangenciales, articulos de opinion, o contenido no relacionado con criminalidad vial. Ademas, el analisis AI actual extrae datos basicos pero no identifica patrones criminologicos avanzados como modus operandi, firma criminal, o patron geografico-temporal.

---

## Parte 1: Filtro AI de relevancia pre-insercion (Gate de Calidad)

Antes de insertar en la base de datos, pasar cada resultado por un filtro AI rapido que determine si el contenido es realmente un incidente relevante para inteligencia criminal de transporte de carga.

**Archivo:** `supabase/functions/firecrawl-incident-search/index.ts`

**Logica:**
- Despues de obtener resultados de Firecrawl y antes del batch insert, enviar los textos en lotes al AI Gateway
- El AI asigna un `relevancia_score` (0-100) y un booleano `es_incidente_real`
- Solo se insertan registros con `es_incidente_real = true` y `relevancia_score >= 40`
- Criterios de descarte: articulos de opinion, noticias repetitivas sin datos nuevos, contenido publicitario, noticias de otros paises, incidentes no relacionados con transporte

**Tool call al AI:**
```
Funcion: "filtrar_relevancia_incidente"
Parametros:
  - es_incidente_real (boolean): Es un incidente criminal real que afecta transporte de carga en Mexico?
  - relevancia_score (0-100): Que tan relevante es para inteligencia de seguridad en transporte
  - motivo_descarte (string): Si se descarta, por que
```

- Se procesan en batch de hasta 5 textos por llamada AI para eficiencia
- Se agrega el campo `relevancia_score` al registro insertado para trazabilidad

---

## Parte 2: Analisis criminologico avanzado en procesamiento AI

Enriquecer el prompt del AI en `procesar-incidente-rrss` para extraer inteligencia criminologica de nivel profesional.

**Archivo:** `supabase/functions/procesar-incidente-rrss/index.ts`

**Nuevos campos a extraer via tool calling:**

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `modus_operandi` | string | Descripcion del metodo usado (ej: "interception en carretera con vehiculos bloqueadores") |
| `firma_criminal` | string | Patron distintivo que sugiere un grupo especifico (ej: "uso de drones para vigilancia previa") |
| `nivel_organizacion` | enum | `oportunista`, `celula_local`, `crimen_organizado`, `no_determinado` |
| `vector_ataque` | string | Como se ejecuto (emboscada, checkpoint falso, infiltracion, etc.) |
| `objetivo_especifico` | string | Que buscaban (carga especifica, unidad, operador, combustible) |
| `indicadores_premeditacion` | array[string] | Senales de planeacion previa (vigilancia, informante, horario especifico) |
| `zona_tipo` | enum | `urbana`, `periurbana`, `rural`, `carretera_abierta`, `punto_critico` |
| `contexto_ambiental` | string | Condiciones que facilitaron el evento (oscuridad, zona despoblada, tramo sin vigilancia) |

**Cambios al system prompt:**
Agregar instrucciones de criminologia ambiental:
- Teoria de Actividades Rutinarias: identificar convergencia de delincuente motivado + objetivo adecuado + ausencia de guardian capaz
- Patron espacial: clasificar si es zona de actividad, zona de busqueda, o corredor de escape
- Near-repeat: vincular con incidentes previos similares en zona/tiempo

---

## Parte 3: Migracion de base de datos

Agregar columnas para los nuevos campos criminologicos en `incidentes_rrss`:

```sql
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS relevancia_score INTEGER;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS modus_operandi TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS firma_criminal TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS nivel_organizacion TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS vector_ataque TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS objetivo_especifico TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS indicadores_premeditacion TEXT[];
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS zona_tipo TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS contexto_ambiental TEXT;
```

---

## Parte 4: Subir limite de resultados y agregar fuentes especializadas

**Archivo:** `supabase/functions/firecrawl-incident-search/index.ts`

- Cambiar `limit` default de 20 a 50
- Agregar queries de fuentes especializadas:
  - `site:t21.com.mx robo OR asalto OR bloqueo OR inseguridad`
  - `site:tyt.com.mx OR site:canacar.com.mx robo carga inseguridad`
  - `site:elfinanciero.com.mx robo transporte carga carretera Mexico`
  - `"secretariado ejecutivo" robo transporte OR "incidencia delictiva" carretera`
  - `"alerta vial" OR "cierre carretero" OR "peligro carretera" transporte carga Mexico`
- Actualizar `detectRedSocial` para reconocer fuentes especializadas como tipo `transporte` o `logistica`

---

## Parte 5: Visualizacion de inteligencia criminologica en UI

**Archivo:** `src/components/incidentes/IncidentesStats.tsx`

- Agregar card de "Modus Operandi mas frecuentes" con conteo
- Agregar card de "Nivel de Organizacion Criminal" (pie/donut chart)
- Mostrar indicadores de premeditacion mas comunes

**Archivo:** `src/hooks/useIncidentesRRSS.ts`

- Agregar query para estadisticas de modus operandi y nivel de organizacion

---

## Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| SQL (migracion) | 9 columnas nuevas en `incidentes_rrss` |
| `supabase/functions/firecrawl-incident-search/index.ts` | Filtro AI pre-insert + limit 50 + queries especializadas + deteccion fuentes |
| `supabase/functions/procesar-incidente-rrss/index.ts` | Prompt criminologico avanzado + 8 campos nuevos en tool call + update |
| `src/hooks/useIncidentesRRSS.ts` | Stats de modus operandi y organizacion |
| `src/components/incidentes/IncidentesStats.tsx` | Cards de inteligencia criminologica |

## Flujo resultante

```text
Firecrawl Search (50 results/query x 12 queries)
        |
   AI Relevance Filter (descarta irrelevantes)
        |
   Dedup por URL (descarta repetidos)
        |
   INSERT en incidentes_rrss
        |
   AI Criminologico (modus operandi, firma, organizacion)
        |
   Dashboard con inteligencia accionable
```

