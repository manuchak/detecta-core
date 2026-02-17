

## Correcciones: Limpieza de datos + Ajuste de RPC

### Hallazgos del analisis

Las discrepancias tienen dos causas raiz:

**1. Ene/Feb 2025 - Registros duplicados en BD (sistema muestra MAS que Excel):**
- Enero: 426 registros con `tipo_servicio='Punto a B'` y `'Repartos'` que NO existen en el Excel
- Febrero: 399 registros similares
- Total a eliminar: **825 registros**

**2. Mar-Dic 2025 - RPC excluye cancelados (sistema muestra MENOS que Excel):**
- El Excel del usuario incluye TODOS los registros (incluyendo cancelados)
- El RPC actual filtra `NOT IN ('cancelado')`, excluyendo ~30-50 registros por mes

### Proyeccion de resultados despues de ambas acciones

| Mes | Excel | Sistema Actual | Sistema Corregido | Diferencia Residual |
|-----|-------|---------------|-------------------|---------------------|
| Ene 2025 | 626 | 1,039 | 627 | +0.2% (OK) |
| Feb 2025 | 478 | 871 | 486 | +1.7% (Alerta menor) |
| Mar 2025 | 834 | 794 | 835 | +0.1% (OK) |
| Abr 2025 | 769 | 730 | 775 | +0.8% (OK) |
| May 2025 | 795 | 786 | 807 | +1.5% (Alerta menor) |
| Jun 2025 | 815 | 794 | 826 | +1.3% (Alerta menor) |
| Jul 2025 | 984 | 950 | 979 | -0.5% (OK) |
| Ago 2025 | 976 | 935 | 977 | +0.1% (OK) |
| Sep 2025 | 1,066 | 1,028 | 1,070 | +0.4% (OK) |
| Oct 2025 | 1,385 | 1,238 | 1,290 | -6.9% (95 registros faltan en BD) |
| Nov 2025 | 1,004 | 965 | 1,014 | +1.0% (OK) |
| Dic 2025 | 910 | 856 | 894 | -1.8% (Alerta menor) |

De 12 meses en rojo/amarillo, pasamos a **10 en verde/amarillo** y solo **Oct** queda en rojo (95 registros que existen en Excel pero no en la BD - requeriria importacion manual).

### Accion 1: Limpieza de datos duplicados

**SQL para ejecutar manualmente** en Supabase SQL Editor:

```sql
-- Eliminar 825 registros duplicados de Ene/Feb 2025
-- Estos registros con tipo_servicio NO existen en el Excel del usuario
DELETE FROM servicios_custodia 
WHERE fecha_hora_cita IS NOT NULL 
  AND EXTRACT(YEAR FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = 2025
  AND EXTRACT(MONTH FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City') IN (1, 2)
  AND tipo_servicio IS NOT NULL 
  AND TRIM(tipo_servicio) != '';
```

Este SQL debe ejecutarse en el **SQL Editor de Supabase** (no puede ejecutarse desde la app por permisos).

### Accion 2: Migracion SQL - Actualizar RPC

**Archivo:** Nueva migracion SQL

Cambios en `get_historical_monthly_data`:
- **Eliminar** filtros `AND estado IS NOT NULL` y `AND LOWER(TRIM(...)) NOT IN ('cancelado'...)`
- **Mantener** timezone CDMX (`AT TIME ZONE 'America/Mexico_City'`)
- **Mantener** `services_completed` como conteo separado de finalizados (para dashboards que lo necesiten)

```sql
CREATE OR REPLACE FUNCTION public.get_historical_monthly_data()
 RETURNS TABLE(year integer, month integer, services integer, gmv numeric, services_completed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(YEAR FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::integer as year,
    EXTRACT(MONTH FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::integer as month,
    COUNT(*)::integer as services,
    COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0) as gmv,
    COUNT(*) FILTER (
      WHERE LOWER(TRIM(COALESCE(estado, ''))) IN ('finalizado', 'completado')
    )::integer as services_completed
  FROM servicios_custodia 
  WHERE fecha_hora_cita IS NOT NULL 
    AND fecha_hora_cita >= '2023-01-01'
  GROUP BY 
    EXTRACT(YEAR FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City'), 
    EXTRACT(MONTH FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City')
  ORDER BY year, month;
END;
$function$;
```

### Nota sobre Octubre 2025

Octubre tiene 95 registros en el Excel que no existen en la base de datos. Esto NO se puede resolver con cambios en el query - requiere importar esos registros faltantes. Si deseas resolverlo, necesitaria el Excel para identificar cuales registros faltan e importarlos.

### Archivos afectados

| Tipo | Archivo | Cambio |
|------|---------|--------|
| Manual | Supabase SQL Editor | Ejecutar DELETE de 825 registros duplicados |
| Migracion | Nueva migracion SQL | Actualizar RPC sin filtro de cancelados |

