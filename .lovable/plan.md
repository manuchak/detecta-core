
# Fix: Apify `apidojo/tweet-scraper` Input Schema

## Problema Confirmado

Segun la documentacion oficial del actor `apidojo/tweet-scraper`, el input actual es **incorrecto**. El codigo envia `startUrls` con URLs de busqueda de Twitter construidas manualmente, pero el actor espera campos separados:

| Campo actual (incorrecto) | Campo correcto (documentacion) |
|---|---|
| `startUrls: [{url: "https://twitter.com/search?q=..."}]` | `searchTerms: ["robo trailer", "bloqueo"]` |
| (no enviado) | `twitterHandles: ["monitorcarrete1", "GN_Carreteras"]` |
| (no enviado) | `sort: "Latest"` |
| (no enviado) | `tweetLanguage: "es"` |
| (no enviado) | `includeSearchTerms: true` |

El actor al recibir URLs de busqueda que ya no funcionan en Twitter/X, retorna `{"noResults": true}` o datos demo.

## Solucion

### Cambio en `supabase/functions/apify-data-fetcher/index.ts`

Refactorizar `apidojoSchema.buildInput` para usar los campos correctos segun la documentacion oficial:

```text
ANTES (incorrecto):
  startUrls: [
    {url: "https://twitter.com/search?q=robo+trailer..."},
    ...
  ]

DESPUES (correcto segun docs):
  searchTerms: ["robo trailer OR robo camion", "bloqueo carretera", ...],
  twitterHandles: ["monitorcarrete1", "jaliscorojo", "GN_Carreteras", ...],
  maxItems: 200,
  sort: "Latest",
  tweetLanguage: "es",
  includeSearchTerms: true
```

### Logica de separacion de queries

Las queries que contienen `from:usuario` se extraeran automaticamente al array `twitterHandles` (sin el prefijo `from:`). Las demas van a `searchTerms` como strings planos.

### Campos de la documentacion oficial utilizados

- **searchTerms** (array): Terminos de busqueda como strings
- **twitterHandles** (array): Handles de Twitter sin @
- **maxItems** (integer): Maximo de resultados (200)
- **sort** (string): "Latest" para tweets recientes
- **tweetLanguage** (string): "es" para espanol
- **includeSearchTerms** (boolean): true para saber que query genero cada tweet

### Sin cambios necesarios en el parser

El `parseItem` del `apidojoSchema` ya contempla los campos de salida correctos (`full_text`, `user.screen_name`, `created_at`, `favorite_count`, `retweet_count`). Solo necesita el fix del input.

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/apify-data-fetcher/index.ts` | Reemplazar `apidojoSchema.buildInput` (lineas 73-80) para usar `searchTerms` + `twitterHandles` en lugar de `startUrls`. Tambien limpiar `SEARCH_QUERIES` para separar handles de busquedas. |
