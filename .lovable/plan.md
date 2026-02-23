

# Plan: Optimizar Firecrawl + Panel de Progreso Visual en Tiempo Real

## Problema

Cuando el usuario hace clic en "Buscar en Web", el boton solo cambia a "Buscando..." y no hay forma de saber si el sistema esta trabajando o se quedo colgado. La edge function tarda ~3 minutos y el timeout HTTP causa un error falso.

## Solucion

### Parte 1: Panel de Progreso Visual (UI)

Agregar un panel colapsable debajo de los botones que muestra el progreso en tiempo real:

```text
+--------------------------------------------------+
| Actualizar Incidentes RRSS                       |
| [Fetch Dataset] [Nueva Apify] [Buscar en Web]   |
|                                                  |
| --- Panel de Progreso (visible durante busqueda) |
| [============================     ] 75%          |
|                                                  |
| Paso 1/4: Buscando "robo trailer"...        OK  |
| Paso 2/4: Buscando "bloqueo carretera"...    OK  |
| Paso 3/4: Buscando "asalto transportista"... ... |
| Paso 4/4: Pendiente                              |
|                                                  |
| Resultados parciales:                            |
|   Encontrados: 24 | Insertados: 18 | Dupl: 6    |
|                                                  |
| Elapsed: 12s                                     |
+--------------------------------------------------+
```

Componentes:
- Barra de progreso (`Progress`) que avanza por cada query completada
- Lista de pasos con iconos de estado (spinner, check verde, X rojo)
- Contador de resultados parciales en tiempo real
- Cronometro mostrando tiempo transcurrido

### Parte 2: Edge Function con Streaming (respuesta progresiva)

Modificar `firecrawl-incident-search/index.ts` para usar **streaming HTTP** (chunked response). En lugar de esperar a que todo termine y enviar un JSON final, enviar actualizaciones linea por linea:

```text
{"step":1,"query":"robo trailer","status":"searching"}
{"step":1,"query":"robo trailer","status":"done","found":8,"inserted":6,"dupes":2}
{"step":2,"query":"bloqueo carretera","status":"searching"}
...
{"done":true,"stats":{"total":31,"insertados":22,"duplicados":8,"errores":1}}
```

Esto elimina el problema de timeout porque la conexion se mantiene activa con datos fluyendo.

### Parte 3: Batch Operations + Fire-and-Forget AI

Dentro de cada paso de la edge function:
- Dedup en batch: un solo query `.in('url_publicacion', [urls])` en lugar de N queries
- Insert en batch: un solo `.insert([...registros])`
- AI fire-and-forget: `supabase.functions.invoke('procesar-incidente-rrss', {...}).catch(console.error)` sin `await`

## Detalle Tecnico

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/firecrawl-incident-search/index.ts` | Streaming response + batch ops + fire-and-forget AI |
| `src/lib/api/firecrawl.ts` | Leer streaming response y parsear eventos progresivos |
| `src/components/incidentes/TriggerApifyFetch.tsx` | Panel de progreso con barra, pasos, stats parciales y cronometro |

### `supabase/functions/firecrawl-incident-search/index.ts`

Cambios principales:
1. Usar `ReadableStream` para enviar respuesta chunked
2. Por cada query de busqueda, emitir un evento JSON antes y despues
3. Batch dedup: `supabase.from('incidentes_rrss').select('url_publicacion').in('url_publicacion', urls)`
4. Batch insert: `supabase.from('incidentes_rrss').insert(registros).select('id')`
5. Fire-and-forget AI: invocar sin await, con `.catch()` silencioso

### `src/lib/api/firecrawl.ts`

Cambios principales:
1. Usar `fetch()` directo en lugar de `supabase.functions.invoke()` para poder leer el stream
2. Parsear respuesta linea por linea con `reader.read()` del `ReadableStream`
3. Exponer un callback `onProgress(event)` para que el componente UI actualice su estado

Interfaz:
```typescript
type ProgressEvent = {
  step: number;
  total_steps: number;
  query: string;
  status: 'searching' | 'inserting' | 'done' | 'error';
  found?: number;
  inserted?: number;
  dupes?: number;
  errors?: number;
};

searchIncidentsWithProgress(
  timeFilter: string,
  onProgress: (event: ProgressEvent) => void
): Promise<FinalStats>
```

### `src/components/incidentes/TriggerApifyFetch.tsx`

Cambios principales:
1. Nuevo estado `searchProgress` con array de pasos y stats acumuladas
2. Nuevo estado `elapsedSeconds` con un `setInterval` que cuenta el tiempo
3. Componente `Progress` de shadcn para barra visual
4. Lista de pasos con iconos: `Loader2` (animado) para en progreso, `CheckCircle2` para completado, `XCircle` para error
5. Seccion de stats parciales que se actualiza con cada evento del stream
6. Al terminar, invalidar queries de react-query para refrescar la tabla de incidentes

