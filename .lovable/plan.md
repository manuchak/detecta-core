

# Fix: Wizard de Importacion - Bug de Timezone CDMX

## Problema raiz

Cuando el CSV contiene una fecha como `2025-02-09 08:30`, la funcion `parseRobustDate()` en `dateUtils.ts` hace:

```text
new Date(2025, 1, 9, 8, 30)  -->  interpreta como hora LOCAL del navegador
.toISOString()                -->  convierte a UTC
```

Esto produce resultados diferentes segun la zona horaria del navegador del usuario. Si el navegador esta en UTC (ej: servidor, VPN, o configuracion de sistema), `08:30` local = `08:30 UTC`, y al convertir a CDMX se vuelve `02:30 CDMX` del mismo dia o incluso del dia anterior.

**El dato del CSV siempre representa hora CDMX** (es dato operativo de Mexico), pero el parser no lo sabe y depende del navegador.

Los 17 servicios "perdidos" del 9 de febrero quedaron atribuidos al 8 de febrero porque sus horas CDMX, al ser interpretadas como UTC, cayeron en el dia anterior al convertir de vuelta a CDMX para el dashboard.

## Solucion

### Paso 1: Crear funcion `parseRobustDateCDMX` en `dateUtils.ts`

Nueva funcion que hace exactamente lo mismo que `parseRobustDate`, pero en lugar de usar `new Date()` (que depende del navegador), construye el ISO string con offset CDMX explicito (`-06:00`):

- Input: `"2025-02-09 08:30"` (hora CDMX del CSV)
- Output: `"2025-02-09T08:30:00-06:00"` (con offset explicito)
- Supabase interpreta esto correctamente como `2025-02-09T14:30:00Z` en UTC

La funcion maneja los mismos formatos que `parseRobustDate` (YYYY-MM-DD HH:MM, DD/MM/YYYY, Excel serial numbers, etc.) pero siempre asume que la hora es CDMX.

Para fechas sin hora (ej: `"2025-02-09"`), genera `"2025-02-09T12:00:00-06:00"` (mediodia CDMX) para evitar cambios de dia en cualquier conversion.

### Paso 2: Usar `parseRobustDateCDMX` en `custodianServicesImportService.ts`

Reemplazar las llamadas a `parseRobustDate` para los campos de timestamp operativo:

| Campo | Cambio |
|-------|--------|
| `fecha_hora_cita` | parseRobustDate --> parseRobustDateCDMX |
| `hora_presentacion` | parseRobustDate --> parseRobustDateCDMX |
| `hora_arribo` | parseRobustDate --> parseRobustDateCDMX |
| `hora_inicio_custodia` | parseRobustDate --> parseRobustDateCDMX |
| `hora_finalizacion` | parseRobustDate --> parseRobustDateCDMX |
| `created_at` | Mantiene parseRobustDate (es timestamp tecnico, no operativo) |
| `fecha_contratacion` | parseRobustDate --> parseRobustDateCDMX |

Esto aplica tanto en `buildUpdateData` como en `buildInsertData`.

### Paso 3: Corregir los 32 registros existentes del 9 de febrero

Proveer un query SQL de correccion para ejecutar manualmente en Supabase. Este query identifica los registros afectados y ajusta el offset de 6 horas en `fecha_hora_cita` y los demas campos de timestamp.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/utils/dateUtils.ts` | Agregar `parseRobustDateCDMX()` que construye timestamps con offset `-06:00` |
| `src/services/custodianServicesImportService.ts` | Usar `parseRobustDateCDMX` para campos operativos en `buildUpdateData` y `buildInsertData` |

## Lo que NO se toca

- `parseRobustDate` original (se mantiene para otros usos no-CDMX)
- Dashboard, hooks de BI, ni logica de visualizacion
- RLS policies ni funciones RPC
- Wizard UI (pasos, mapeo de columnas, validacion visual)

## Query de correccion para registros existentes

Despues de aprobar el plan, se proporcionara el query exacto para corregir los 32 registros del 9 de febrero directamente en la base de datos.

