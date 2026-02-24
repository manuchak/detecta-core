

# Migrar Edge Function a TypeScript XDK oficial de X.com

## Por que migrar

Nuestra Edge Function `twitter-incident-search` tiene ~80 lineas de codigo manual para OAuth 1.0a (nonce, HMAC-SHA1, firma). El SDK oficial `@xdevplatform/xdk` v0.4.0 reemplaza todo eso con 4 lineas y agrega paginacion automatica, rate limit handling, y tipos completos.

## Comparacion

```text
HOY (manual)                          CON XDK
─────────────────────────────         ─────────────────────────────
percentEncode()                       (eliminado)
generateNonce()                       (eliminado)
hmacSha1()                            (eliminado)
buildOAuthHeader() (~40 lineas)       new OAuth1({apiKey, apiSecret, accessToken, accessTokenSecret})
fetch manual + query string           client.posts.searchRecent({query, ...})
parseo manual de response             Tipos automaticos (data, includes, meta)
rate limit via headers                paginator.rateLimited
sin paginacion                        for await (const tweet of paginator)
```

## Cambios

### 1. Actualizar Edge Function

**Archivo: `supabase/functions/twitter-incident-search/index.ts`**

- Eliminar las funciones manuales: `percentEncode`, `generateNonce`, `hmacSha1`, `buildOAuthHeader` (~80 lineas)
- Importar `Client`, `OAuth1` desde `@xdevplatform/xdk` via esm.sh
- Crear cliente con OAuth 1.0a:

```text
const oauth1 = new OAuth1({
  apiKey: consumerKey,
  apiSecret: consumerSecret,
  accessToken,
  accessTokenSecret
});
const client = new Client({ oauth1 });
```

- Reemplazar `fetch` manual por `client.posts.searchRecent()`:

```text
const response = await client.posts.searchRecent(query, {
  maxResults: 25,
  tweetfields: ['created_at', 'public_metrics', 'geo', 'entities', 'author_id'],
  userfields: ['username', 'name'],
  expansions: ['author_id', 'attachments.media_keys'],
  mediafields: ['url', 'preview_image_url', 'type'],
});
```

- Mantener toda la logica de negocio intacta: queries dinamicos desde BD, deduplicacion, insert en `incidentes_rrss`, invocacion de `procesar-incidente-rrss`, registro en `twitter_api_usage`
- Agregar manejo de rate limit usando try/catch del SDK en lugar de parseo manual de headers

### 2. Compatibilidad con Deno

El XDK usa pure JavaScript crypto (no depende de Node.js crypto nativo), por lo que funciona en Deno via esm.sh:

```text
import { Client, OAuth1 } from "https://esm.sh/@xdevplatform/xdk@0.4.0";
```

No se requieren cambios en `package.json` del proyecto principal ya que el SDK solo se usa en la Edge Function.

## Archivos a modificar

| Archivo | Accion |
|---|---|
| `supabase/functions/twitter-incident-search/index.ts` | Refactorizar: eliminar OAuth manual, usar XDK |

## Lo que NO cambia

- Queries dinamicos desde `twitter_monitored_accounts`
- Deduplicacion contra `incidentes_rrss`
- Pipeline de clasificacion AI (`procesar-incidente-rrss`)
- Registro de uso en `twitter_api_usage`
- UI de gestion en Settings
- Ningun archivo frontend

## Beneficio futuro

El XDK soporta **Filtered Stream** (`client.stream.postsSample()`), lo que en el futuro permitiria monitoreo en tiempo real sin polling, reduciendo llamadas a la API y costos.

