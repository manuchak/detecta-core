
# Corregir montos visibles para custodios: usar `costo_custodio` en lugar de `cobro_cliente`

## Problema

En el portal de custodios, los montos financieros se obtienen de la columna `cobro_cliente` (lo que se le cobra al cliente final). Los custodios deben ver unicamente el `costo_custodio` (lo que se les paga a ellos).

## Cambios identificados

Hay **2 archivos** que necesitan correccion:

### 1. `src/hooks/useCustodianServices.ts`

- **Interface `CustodianService`**: Reemplazar `cobro_cliente` por `costo_custodio` (ambas opcionales, tipo `number`)
- **Query a `servicios_custodia`**: Cambiar el campo seleccionado de `cobro_cliente` a `costo_custodio`
- **Mapeo de `servicios_planificados`**: Ya tiene `cobro_cliente: undefined`, cambiar a `costo_custodio: undefined`
- **Calculo de `ingresos_totales`**: Cambiar `s.cobro_cliente` por `s.costo_custodio`

### 2. `src/pages/custodian/CustodianDashboard.tsx`

- **Linea 204-206**: Cambiar la referencia de `service.cobro_cliente` a `service.costo_custodio` y el label de "Cobro" a "Pago"

## Detalle tecnico

| Archivo | Linea(s) | Cambio |
|---|---|---|
| `useCustodianServices.ts` | 15 | `cobro_cliente?: number` -> `costo_custodio?: number` |
| `useCustodianServices.ts` | 85 | Select: `cobro_cliente` -> `costo_custodio` |
| `useCustodianServices.ts` | 128 | Mapping: `cobro_cliente: undefined` -> `costo_custodio: undefined` |
| `useCustodianServices.ts` | 164 | Stats: `s.cobro_cliente` -> `s.costo_custodio` |
| `CustodianDashboard.tsx` | 204-206 | Display: `cobro_cliente` -> `costo_custodio`, label "Cobro" -> "Pago" |

## Sin impacto en

- Las vistas administrativas (Facturacion, Dashboard ejecutivo, etc.) siguen usando `cobro_cliente` como siempre
- No hay cambios de base de datos, ambas columnas ya existen en `servicios_custodia`
- La tarjeta de "Ingresos Totales" en el dashboard del custodio ya esta oculta (comentada en linea 117)
