
# Plan de Corrección: Pipeline Apify + Errores de Base de Datos

He realizado un diagnóstico exhaustivo tras el intento fallido de ejecución (error 404). El problema es que el secreto `APIFY_DEFAULT_ACTOR_ID` actualmente contiene el **Token de API** en lugar del **ID del Actor**.

## 1. Corrección de Configuración (Secrets)

El primer paso es asegurar que las credenciales estén en el lugar correcto.
- **APIFY_DEFAULT_ACTOR_ID**: Se debe actualizar a `apidojo/tweet-scraper` (como confirmaste).
- **APIFY_API_KEY**: Se verificará que contenga el token `apify_api_vBPN...`.

## 2. Corrección de Error RPC (SQL)

He detectado un error técnico en la función `calcular_score_corredor` que está bloqueando la carga de algunos indicadores en el dashboard.
- **Problema**: Discrepancia de tipos entre `character varying` (columna de la tabla) y `text` (definición de la función).
- **Solución**: Actualizaré el retorno de la función para que coincida exactamente con los tipos de la tabla `incidentes_rrss`.

## 3. Pruebas y Validación

Una vez aplicados los cambios:
- **Ejecutar Fetch**: Realizaré un `force_run` de la función de Apify para confirmar que ya puede extraer tweets de `@monitorcarrete1` y otras fuentes.
- **Validar Tablero**: Verificaré que el incidente crítico de hoy en la **México-Puebla** (Córdoba-Puebla) se refleje correctamente como estatus **ROJO / EVITAR** en el panel de corredores.

## Detalle Técnico de los Cambios

### SQL (RPC)
```sql
CREATE OR REPLACE FUNCTION calcular_score_corredor(p_carretera text DEFAULT NULL)
RETURNS TABLE (
  carretera character varying, -- Cambio de text a varchar
  total_incidentes bigint,
  incidentes_7d bigint,
  incidentes_30d bigint,
  criticos_30d bigint,
  score_riesgo numeric
) AS $$
-- ... (lógica existente con casts explícitos si es necesario)
$$ LANGUAGE plpgsql;
```

### Edge Function (Apify)
La lógica de la función ya está preparada para manejar el ID `apidojo/tweet-scraper` y convertirlo internamente al formato `apidojo~tweet-scraper` que requiere la API de Apify. Solo falta el valor correcto del secreto.

---

¿Procedo con la actualización de los secretos y la corrección de la base de datos?
