

# Plan: Integrar Firecrawl Search como Fuente de Incidentes RRSS

## Contexto

El sistema ya tiene un pipeline funcional con Apify (`apify-data-fetcher`) que busca tweets sobre incidentes de transporte. Firecrawl tiene un conector nativo en Lovable con capacidad de **Search** que puede buscar en toda la web (Google-indexed), incluyendo posts de X.com, noticias, Facebook y otros medios. Esto amplía la cobertura mas alla de solo Twitter.

## Ventajas de Firecrawl vs Apify Solo

| Aspecto | Apify (actual) | Firecrawl Search |
|---------|---------------|-----------------|
| Setup | Requiere API key externa | Conector nativo Lovable |
| Cobertura | Solo Twitter/X | Web completa (noticias, RRSS indexadas, foros) |
| Filtro temporal | Limitado | `tbs` parameter (hora, dia, semana, mes) |
| Contenido | Tweets crudos | Markdown limpio + metadata |
| Costo | Apify credits | Firecrawl credits |

La estrategia es usar **ambos en paralelo**: Apify para tweets directos de X.com y Firecrawl para el resto de la web.

## Cambios

### 1. Conectar Firecrawl

Antes de implementar, se debe activar el conector de Firecrawl desde Project Settings > Connectors. Esto hara disponible `FIRECRAWL_API_KEY` como variable de entorno en las edge functions.

### 2. Crear Edge Function `firecrawl-incident-search`

Nueva edge function que:
1. Ejecuta multiples busquedas con queries especificos de transporte de carga en Mexico
2. Parsea los resultados y extrae datos relevantes
3. Inserta en `incidentes_rrss` (misma tabla que Apify) evitando duplicados por URL
4. Invoca `procesar-incidente-rrss` para clasificacion AI (mismo flujo existente)

Queries de busqueda:
- `"robo trailer" OR "robo carga" Mexico` (filtro: ultima semana)
- `"bloqueo carretera" OR "bloqueo autopista" Mexico`
- `"asalto transportista" OR "secuestro operador" Mexico`
- `"accidente trailer" OR "volcadura" carretera Mexico`

Parametros de Firecrawl Search:
- `lang: "es"`, `country: "MX"`
- `tbs: "qdr:d"` (ultimo dia) o `"qdr:w"` (ultima semana)
- `scrapeOptions: { formats: ["markdown"] }` para obtener contenido completo
- `limit: 20` por query

### 3. Actualizar UI - Agregar boton Firecrawl en `TriggerApifyFetch.tsx`

Agregar un tercer boton "Buscar en Web (Firecrawl)" junto a los botones existentes de Apify. Este boton invoca la nueva edge function.

### 4. Detectar red social desde URL de resultados

La funcion `detectRedSocial` existente ya maneja Twitter, Facebook, Instagram y TikTok. Los resultados de Firecrawl Search tambien pueden incluir sitios de noticias, asi que se agrega deteccion para fuentes como:
- Portales de noticias: `"noticias"`
- Blogs/foros: `"web"`
- Gobierno: `"gobierno"`

## Detalle Tecnico

### Edge Function `firecrawl-incident-search/index.ts`

```text
1. Leer FIRECRAWL_API_KEY del entorno
2. Para cada query de busqueda:
   a. POST a https://api.firecrawl.dev/v1/search
   b. Para cada resultado:
      - Verificar que URL no exista en incidentes_rrss (dedup)
      - Insertar en incidentes_rrss con red_social detectada
      - Invocar procesar-incidente-rrss para AI
3. Retornar stats (insertados, duplicados, errores)
```

### Flujo completo

```text
[Boton "Buscar en Web"] 
    --> firecrawl-incident-search (edge function)
        --> Firecrawl Search API (multiples queries)
            --> Resultados web (noticias, RRSS, foros)
                --> INSERT incidentes_rrss (dedup por URL)
                    --> procesar-incidente-rrss (AI: clasificar + geocodificar)
                        --> Mapa de calor actualizado
```

### Mapeo de campos Firecrawl a incidentes_rrss

| Campo Firecrawl | Campo incidentes_rrss |
|-----------------|----------------------|
| `result.url` | `url_publicacion` |
| `result.title` | (parte de texto_original) |
| `result.markdown` | `texto_original` |
| `result.description` | (fallback si no hay markdown) |
| Detectado de URL | `red_social` |
| `"firecrawl"` | `apify_actor_id` (reutilizado como source_id) |

## Archivos

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/firecrawl-incident-search/index.ts` | **Nuevo** - Edge function de busqueda |
| `src/lib/api/firecrawl.ts` | **Nuevo** - Cliente API frontend |
| `src/components/incidentes/TriggerApifyFetch.tsx` | Agregar boton "Buscar en Web (Firecrawl)" |

## Prerequisito

Conectar Firecrawl desde Project Settings > Connectors antes de implementar.

