

# Diagnostico y Plan de Correccion: Pipeline Apify + Dashboard de Corredores

## Problema Principal: Apify no esta trayendo datos

### Causa Raiz

El secret `APIFY_DEFAULT_ACTOR_ID` esta configurado como una URL completa:
```
https://api.apify.com/v2/acts?token=apify_api_vBPNtpkEsm...
```

Esto deberia ser un Actor ID como `apidojo~tweet-scraper` o `quacker/twitter-scraper`.

El codigo detecta que es una URL y usa el fallback `apidojo~tweet-scraper`, pero este actor retorna `{"noResults": true}` porque el input schema que enviamos (`search`, `maxTweets`, `language`, `country`) no coincide con lo que ese actor espera.

**Resultado**: 0 tweets insertados. Toda la data del dia viene de Firecrawl (noticias web).

### Solucion en 3 pasos

**Paso 1: Corregir el secret APIFY_DEFAULT_ACTOR_ID**

Cambiar el valor del secret a un Actor ID valido. La recomendacion es usar `quacker/twitter-scraper` (actor popular y estable para Twitter) o `apidojo/tweet-scraper` en formato correcto.

**Paso 2: Adaptar el input del actor al schema correcto**

El actor `apidojo~tweet-scraper` espera un input diferente al que enviamos. Necesitamos investigar el schema del actor que el usuario tiene configurado y adaptar el body del request.

Cambios en `supabase/functions/apify-data-fetcher/index.ts`:
- Detectar el actor que se esta usando y adaptar el input body segun su schema
- Para `quacker/twitter-scraper` el input seria diferente (usa `searchTerms` en lugar de `search`)
- Para `apidojo~tweet-scraper` el input usa `startUrls` o `searchTerms`
- Agregar un mapeo de schemas por actor conocido

**Paso 3: Adaptar el parsing de resultados**

Cada actor retorna datos con estructura diferente. Necesitamos un mapper flexible que identifique los campos correctos segun el actor.

---

## Problema Secundario: Error en RPC `calcular_score_corredor`

El RPC retorna `character varying` pero el codigo espera `text`. Este error afecta el hook `useCorredoresRiesgo` pero no bloquea el dashboard principal (CorridorStatusPanel usa logica local, no la RPC).

**Solucion**: Este error es preexistente y no afecta la funcionalidad del tablero de corredores actual. Se puede corregir en un sprint separado.

---

## Estado del Dashboard de Corredores

El `CorridorStatusPanel` y `OperationalRecommendations` funcionan correctamente con la data disponible. Con los 2 incidentes de hoy (asalto critico en Cordoba-Puebla y proposicion legislativa), el panel deberia mostrar:

- **Mexico-Puebla (150D)**: EVITAR o PRECAUCION (el incidente de Cordoba-Puebla tiene coordenadas 19.04, -98.20 que caen dentro del bounding box de este corredor)
- **Resto de corredores**: OPERAR NORMAL (sin incidentes recientes)

La data de hoy valida que el cruce incidente-corredor por coordenadas funciona, pero para tener un tablero realmente util se necesita el volumen de datos que Apify deberia traer de Twitter.

---

## Detalle Tecnico

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/apify-data-fetcher/index.ts` | Refactorizar el input body para adaptarse al schema real del actor. Agregar mapeo de inputs por tipo de actor (apidojo, quacker, etc.). Mejorar el parsing de resultados con mappers por actor. |

### Accion manual requerida

El usuario debe corregir el secret `APIFY_DEFAULT_ACTOR_ID` para que contenga solo el ID del actor (ej: `quacker/twitter-scraper`) y NO una URL completa con token.

### Flujo corregido

```text
1. Edge Function lee APIFY_DEFAULT_ACTOR_ID → "quacker/twitter-scraper"
2. Detecta tipo de actor → selecciona schema de input correcto
3. Envia queries por cuenta:
   - from:monitorcarrete1 bloqueo OR cierre
   - from:jaliscorojo narcobloqueo
   - from:GN_Carreteras alerta
4. Actor retorna tweets con URLs y texto
5. Se insertan en incidentes_rrss → procesamiento AI
6. CorridorStatusPanel cruza con HIGHWAY_CORRIDORS → semaforo actualizado
```

