
# Fishbone Analysis: Inconsistencia GMV MoM ($5.3M) vs GMV MTD ($5.12M)

## Evidencia del Problema

| Indicador | Valor | Fuente |
|-----------|-------|--------|
| Tarjeta GMV MTD | **$5.12M** | `useUnifiedMTDMetrics` -> `gmvMTDService.ts` |
| Tooltip GMV MoM (Feb 2026) | **$5.3M** | `useExecutiveMultiYearData` -> RPC `get_historical_monthly_data` |
| **Delta** | **$180K (~3.5%)** | Dos caminos de calculo distintos |

---

## Diagrama Fishbone (Causa-Raiz)

```text
                                    GMV MoM != GMV MTD
                                          |
        ┌─────────────┬──────────────┬────┴────┬──────────────┐
        |             |              |         |              |
   FILTRO ESTADO  RANGO FECHA   COBRO CALC  FUENTE DATOS  TIMEZONE
        |             |              |         |              |
        |             |              |         |              |
  RPC: SIN filtro  RPC: mes      RPC: CASE   RPC: server  RPC: AT TIME
  de cancelados    completo      WHEN >0     (SQL agg)    ZONE CDMX
        |             |              |         |              |
  MTD: NOT eq      MTD: dia 1    MTD: parse  MTD: client  MTD: UTC
  'Cancelado'      a HOY         Float(all)  (paginated)  (date-fns)
```

---

## Detalle de las 4 Causas Raiz

### Causa 1: Filtro de Estado (ALTO IMPACTO)

```text
RPC get_historical_monthly_data:
  WHERE fecha_hora_cita IS NOT NULL    <-- NO filtra cancelados
  
gmvMTDService.ts:
  .not('estado', 'eq', 'Cancelado')   <-- SI excluye cancelados
```

**Impacto**: La RPC INCLUYE servicios cancelados con cobro > 0 en el GMV del MoM. Estos mismos servicios son EXCLUIDOS por la tarjeta MTD. Cada servicio cancelado con cobro positivo infla el $5.3M del MoM.

### Causa 2: Rango de Fechas (MEDIO IMPACTO)

```text
RPC get_historical_monthly_data:
  GROUP BY EXTRACT(MONTH FROM fecha_hora_cita)  <-- MES COMPLETO (Feb 1-28)
  
gmvMTDService.ts (getCurrentMTDRange):
  start: '2026-02-01'
  end:   '2026-02-24'  <-- SOLO HASTA HOY
```

**Impacto**: Si existen servicios programados del 25 al 28 de febrero con cobro asignado, la RPC los incluye en el $5.3M pero la tarjeta MTD los excluye del $5.12M. Sin embargo, al ser servicios futuros, es posible que no tengan cobro asignado aun, lo que reduce este impacto.

### Causa 3: Calculo de Cobro (MEDIO IMPACTO)

```text
RPC (linea 13):
  SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END)
  --> Solo suma cobros POSITIVOS, ignora negativos y ceros
  
gmvMTDService.ts (parseCobroCanonical):
  parseFloat(String(cobro || 0)) || 0
  --> Suma TODOS los cobros, incluyendo negativos
```

**Impacto**: Si hay servicios con cobro_cliente negativo (ajustes, notas de credito), la tarjeta MTD los RESTA del total (bajando el $5.12M), mientras que la RPC los ignora (manteniendo el $5.3M mas alto). Este es probablemente el factor que explica parte de los $180K de diferencia.

### Causa 4: Timezone (BAJO IMPACTO)

```text
RPC:
  EXTRACT(MONTH FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City')
  --> Atribucion de mes usando CDMX (UTC-6)
  
gmvMTDService.ts:
  .gte('fecha_hora_cita', '2026-02-01')
  .lte('fecha_hora_cita', '2026-02-24')
  --> Comparacion directa contra timestamp UTC
```

**Impacto**: Servicios entre las 00:00 y 05:59 UTC del 1 de febrero (que en CDMX son 31 de enero) serian incluidos por la tarjeta MTD pero excluidos por la RPC del MoM, y viceversa para el cambio de mes. Impacto estimado: 1-5 servicios.

---

## Plan de Remediacion

### Opcion A (Recomendada): Alinear la RPC al estandar canonico

Modificar `get_historical_monthly_data` para:

1. **Agregar filtro de cancelados**: `AND LOWER(TRIM(COALESCE(estado, ''))) != 'cancelado'`
2. **Mantener** `CASE WHEN cobro_cliente > 0` en la RPC (esto es correcto para GMV; no deberiamos sumar cobros negativos)
3. **Alinear** `gmvMTDService.ts` para usar la misma logica: solo sumar cobro > 0

### Opcion B: Hacer que el MoM use el servicio unificado

Modificar `GmvMoMChart.tsx` para que el punto de febrero (mes actual) use el valor del hook `useUnifiedMTDMetrics` en vez del dato de la RPC. Esto crea una dependencia cruzada pero garantiza que el numero coincida.

### Implementacion recomendada (Opcion A)

**Archivo 1: Nueva migracion SQL**

Actualizar la RPC para excluir cancelados:

```sql
CREATE OR REPLACE FUNCTION public.get_historical_monthly_data()
  -- misma firma --
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(YEAR FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::integer,
    EXTRACT(MONTH FROM fecha_hora_cita AT TIME ZONE 'America/Mexico_City')::integer,
    COUNT(*)::integer,
    COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(estado, ''))) IN ('finalizado', 'completado'))::integer
  FROM servicios_custodia 
  WHERE fecha_hora_cita IS NOT NULL 
    AND fecha_hora_cita >= '2023-01-01'
    AND LOWER(TRIM(COALESCE(estado, ''))) != 'cancelado'   -- NUEVO: excluir cancelados
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;
```

**Archivo 2: `src/services/gmvMTDService.ts`**

Alinear `parseCobroCanonical` para solo sumar cobros positivos (consistente con la RPC):

```typescript
export const parseCobroCanonical = (cobro: unknown): number => {
  const val = parseFloat(String(cobro || 0)) || 0;
  return val > 0 ? val : 0;  // Solo positivos, igual que la RPC
};
```

**Archivo 3: `src/utils/mtdDateUtils.ts`**

Agregar conversion timezone CDMX al rango MTD para alinear con la RPC:

```typescript
import { formatInTimeZone } from 'date-fns-tz';

export function getCurrentMTDRange(now: Date = new Date()): MTDRange {
  const cdmxNow = formatInTimeZone(now, 'America/Mexico_City', 'yyyy-MM-dd');
  const cdmxYear = parseInt(cdmxNow.substring(0, 4));
  const cdmxMonth = parseInt(cdmxNow.substring(5, 7));
  return {
    start: `${cdmxYear}-${String(cdmxMonth).padStart(2, '0')}-01`,
    end: cdmxNow
  };
}
```

### Resultado esperado

Despues de estos 3 cambios:
- La RPC y el servicio unificado usaran el mismo filtro de estado (excluir cancelados)
- Ambos sumaran solo cobros positivos (CASE WHEN > 0)
- Ambos usaran timezone CDMX para atribucion de mes
- La unica diferencia sera que el MoM muestra mes completo y MTD muestra hasta hoy, lo cual es correcto semanticamente (MoM es tendencia historica, MTD es acumulado al dia)
