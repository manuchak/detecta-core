

# Configurar API Directa de X.com para Feed de Inteligencia

## Contexto

Actualmente el pipeline de inteligencia usa:
- **Apify** (scraper_one, quacker, etc.) -- frecuentemente bloqueado por X, resultados inconsistentes
- **Firecrawl** -- solo captura noticias web que citan Twitter, no tweets directos

Con credenciales directas de la API de X.com, se elimina la dependencia de scrapers y se obtienen datos confiables en tiempo real.

## Plan

### 1. Agregar los 4 Secrets de Twitter/X

Se solicitaran las credenciales una por una usando el sistema de secrets de Supabase:
- `TWITTER_CONSUMER_KEY` (API Key)
- `TWITTER_CONSUMER_SECRET` (API Key Secret)
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`

### 2. Nueva Edge Function: `twitter-incident-search`

Endpoint: `api.x.com/2` (Twitter API v2)

**Funcionalidad:**
- Usa OAuth 1.0a (firma HMAC-SHA1) para autenticarse con la API de X
- Busca tweets recientes usando el endpoint `GET /2/tweets/search/recent`
- Queries optimizadas para seguridad en transporte:
  - `robo trailer OR robo carga -is:retweet lang:es`
  - `bloqueo carretera OR narcobloqueo -is:retweet lang:es`
  - `asalto transportista OR secuestro operador -is:retweet lang:es`
  - `from:GN_Carreteras OR from:monitorcarrete1 OR from:jaliscorojo`
- Parametros: `tweet.fields=created_at,public_metrics,geo,entities` y `user.fields=username,name`
- Deduplicacion contra `incidentes_rrss.url_publicacion` existentes
- Inserta en `incidentes_rrss` con el mismo schema que usa apify-data-fetcher
- Dispara `procesar-incidente-rrss` para clasificacion AI asincrona (pipeline existente)

**Estructura de la firma OAuth 1.0a:**
- Genera nonce, timestamp, y firma HMAC-SHA1 en Deno usando `crypto.subtle`
- NO incluye parametros del body en la firma (solo query params para GET)
- Header: `Authorization: OAuth oauth_consumer_key="...", oauth_token="...", ...`

### 3. Registrar en config.toml

```toml
[functions.twitter-incident-search]
verify_jwt = false
```

### 4. Integracion con Pipeline Existente

La funcion reutiliza exactamente el mismo flujo post-insercion:
1. Inserta tweet en `incidentes_rrss` (red_social = 'twitter', procesado = false)
2. Llama a `procesar-incidente-rrss` para clasificacion AI
3. Los datos aparecen automaticamente en:
   - ThreatIntelFeed (modulo seguridad)
   - TVAlertTicker (monitoreo TV)
   - IncidentesMap (mapa de incidentes)

No se requieren cambios en frontend -- los hooks existentes (`useIncidentesRRSS`, `useThreatIntelligence`) ya consumen de `incidentes_rrss`.

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| Secrets (4) | TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET |
| `supabase/functions/twitter-incident-search/index.ts` | NUEVO: Edge function con OAuth 1.0a y busqueda v2 |
| `supabase/config.toml` | Agregar entrada verify_jwt = false |

## Limitaciones de la API (Basic tier)

- **10,000 tweets/mes** en lectura (Basic $200/mo) o **1,500,000** (Pro)
- `search/recent` solo busca tweets de los ultimos **7 dias**
- Rate limit: 450 requests / 15 min (app-level)
- La funcion implementara control de rate limit y paginacion con `next_token`

