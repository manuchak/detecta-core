

## Corregir timezone en RPC `get_historical_monthly_data`

### Causa raiz

La funcion `get_historical_monthly_data` usa `EXTRACT(MONTH FROM fecha_hora_cita)` que opera en UTC. Como los servicios nocturnos en CDMX (ej: 20:00 CST) se almacenan como la madrugada UTC del dia siguiente, ~97 registros en 2025 se atribuyen al mes incorrecto.

Ejemplo concreto: un servicio del 31 de enero a las 20:00 CDMX se guarda como 1 de febrero 02:00 UTC, y el RPC lo cuenta en febrero en vez de enero.

### Impacto medido (2025)

| Mes | Servicios UTC (actual) | Servicios CDMX (correcto) | Diferencia |
|-----|----------------------|--------------------------|------------|
| Ene | 1,038 | 1,039 | +1 |
| Feb | 858 | 871 | +13 |
| Mar | 795 | 794 | -1 |
| Abr | 741 | 730 | -11 |
| Jun | 784 | 794 | +10 |
| Jul | 955 | 950 | -5 |
| Nov | 954 | 965 | +11 |
| Dic | 870 | 856 | -14 |

### Solucion

**Migracion SQL** - Actualizar la funcion RPC para usar `AT TIME ZONE 'America/Mexico_City'`:

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
    COUNT(*) FILTER (WHERE estado IN ('finalizado', 'Finalizado', 'completado', 'Completado'))::integer as services_completed
  FROM servicios_custodia 
  WHERE fecha_hora_cita IS NOT NULL 
    AND fecha_hora_cita >= '2023-01-01'
    AND estado IS NOT NULL
    AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  GROUP BY 
    EXTRACT(YEAR FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City'), 
    EXTRACT(MONTH FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City')
  ORDER BY year, month;
END;
$function$;
```

No se requieren cambios en el frontend. La correccion es server-side y todos los hooks que consumen este RPC (dashboard ejecutivo, forecasts, auditoria) se benefician automaticamente.

### Archivos afectados

| Tipo | Archivo | Cambio |
|------|---------|--------|
| Migracion SQL | Nueva migracion | Actualizar RPC con timezone CDMX |

### Efecto

Una vez aplicada la migracion, al volver a correr la auditoria Excel vs Sistema, los meses rojos deberian alinearse con los datos del Excel (asumiendo que el Excel usa fechas en hora CDMX).

