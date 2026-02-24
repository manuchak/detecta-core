

# Automatizar la alimentación del feed de inteligencia vía Twitter/X API

## Problema actual

La Edge Function `twitter-incident-search` existe y funciona correctamente: busca tweets, los inserta en `incidentes_rrss`, y dispara `procesar-incidente-rrss` para clasificación AI. Sin embargo, **no hay nada que la ejecute automáticamente**. Solo se puede invocar manualmente desde Configuracion > Twitter/X.

## Solución

### 1. Crear pg_cron job para ejecución automática cada 3 horas

**Migración SQL:**

```text
SELECT cron.schedule(
  'twitter-incident-search-auto',
  '0 */3 * * *',   -- Cada 3 horas
  $$
  SELECT net.http_post(
    url := 'https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/twitter-incident-search',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"max_results": 25}'::jsonb
  );
  $$
);
```

Esto ejecutará la búsqueda automáticamente a las 0:00, 3:00, 6:00, 9:00, 12:00, 15:00, 18:00 y 21:00 UTC cada día.

### 2. Agregar botón "Actualizar desde X" en la página de Incidentes RRSS

**Archivo: página o componente principal de `/incidentes-rrss`**

- Agregar un botón con icono de Twitter/X junto a los controles existentes
- Al hacer clic, invoca `twitter-incident-search` directamente
- Muestra toast con resultados (tweets nuevos insertados)
- Reutiliza el hook `useRunTwitterSearch` que ya existe en `useTwitterConfig.ts`

### 3. Indicador de última ejecución

Mostrar en la página de incidentes cuándo fue la última búsqueda exitosa, consultando el registro más reciente de `twitter_api_usage`.

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| Migración SQL | pg_cron schedule cada 3 horas |
| Componente de la página `/incidentes-rrss` | Agregar botón "Actualizar desde X" y timestamp de última ejecución |

## Resultado esperado

- El feed se alimenta automáticamente cada 3 horas sin intervención manual
- Desde la página de incidentes se puede forzar una actualización inmediata
- Se ve claramente cuándo fue la última vez que se consultó la API
