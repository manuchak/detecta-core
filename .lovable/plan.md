

# Plan: Cambiar a Actor de Twitter Confiable

## Diagnostico Final

El actor `apidojo/tweet-scraper` retorna `{"noResults": true}` para TODAS las busquedas, a pesar de que nuestro codigo envia el input correcto. Esto se confirma en los logs de la Edge Function:

- Input enviado: `searchTerms` + `twitterHandles` (formato correcto segun documentacion)
- Output recibido: `Keys: ["noResults"]` -- el actor no logra conectarse a Twitter/X
- Todas las ejecuciones: exactamente 10 items vacios en 2-3 segundos = datos placeholder
- Tu saldo de Apify esta disponible ($4.20 restantes), no es un problema de creditos

## Solucion Propuesta

Cambiar al actor **`web.harvester/twitter-scraper`** que tiene mejor calificacion (4.9 vs 4.4), 7.1K usuarios activos, y es mantenido activamente. Tambien agregar soporte para probar rapidamente multiples actores.

### Cambios en `supabase/functions/apify-data-fetcher/index.ts`

1. **Agregar schema para `web.harvester/twitter-scraper`**: Nuevo schema con su formato de input/output especifico
2. **Cambiar el fallback default**: De `quacker/twitter-scraper` (deprecated) a `web.harvester/twitter-scraper`
3. **Mejorar `getActorSchema`**: Agregar deteccion del nuevo actor
4. **Agregar `customMapFunction`** al schema de apidojo como respaldo (la documentacion oficial lo incluye)

### Actualizacion del Secret

- Actualizar `APIFY_DEFAULT_ACTOR_ID` de `apidojo/tweet-scraper` a `web.harvester/twitter-scraper`

### Validacion

- Desplegar la Edge Function actualizada
- Ejecutar con `force_run: true` usando el nuevo actor
- Verificar que los items retornados contengan tweets reales (no `noResults`)

## Detalle Tecnico

```text
ANTES:
  Actor: apidojo/tweet-scraper
  Resultado: {"noResults": true} x 10 items (datos vacios)

DESPUES:
  Actor: web.harvester/twitter-scraper (4.9 rating, mantenido activamente)
  Schema de input adaptado a su documentacion
  Fallback: apidojo/tweet-scraper como respaldo secundario
```

### Nuevo schema (web.harvester):

El actor `web.harvester/twitter-scraper` usa un input diferente que se investigara de su documentacion al momento de implementar. Se agregara como nuevo schema en el registro de actores.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/apify-data-fetcher/index.ts` | Agregar schema `webHarvesterSchema`, actualizar `getActorSchema`, cambiar fallback default |
| Secret `APIFY_DEFAULT_ACTOR_ID` | Actualizar a `web.harvester/twitter-scraper` |

