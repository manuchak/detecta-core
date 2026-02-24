

# Auditoría de Consistencia: GMV MTD

## Resumen Ejecutivo

Se identificaron **7 fuentes independientes** que calculan GMV MTD en el sistema, con **5 inconsistencias criticas** que producen cifras diferentes para el mismo indicador. Esto significa que el numero que aparece en la tarjeta superior del Dashboard Ejecutivo puede diferir del que muestra el Plan 2026, del que usa el panel Financiero, y del que reporta el donut de clientes.

---

## Hallazgos del Analisis Forense

### Mapa de fuentes de GMV MTD

| # | Componente | Hook / Fuente | Inconsistencias detectadas |
|---|-----------|---------------|---------------------------|
| 1 | **ExecutiveKPIsBar** (tarjeta superior "GMV MTD") | Query directa con `fetchAllPaginated` | Filtro: `not estado eq Cancelado`. Incluye cobro_cliente=0 y negativos. Sin filtro `cobro_cliente > 0`. Sin paginacion para prev month. |
| 2 | **OperationalOverview** (HeroBar "GMV MTD") | `useOperationalMetrics` | Filtro: solo `completado/finalizado`. **Excluye** servicios en proceso, pendientes, etc. La mas restrictiva. |
| 3 | **FinancialSummaryPanel** (Finanzas MTD) | `useFinancialMetrics` | Filtro: `not estado eq Cancelado`. Sin paginacion (limite 1000 rows). Sin `cobro_cliente > 0`. |
| 4 | **StrategicPlanTracker** (Plan 2026 "GMV MTD") | `useStrategicPlanTracking` -> `useDailyActualServices` | Filtro: `neq estado Cancelado` + `gt cobro_cliente 0`. **La unica que excluye cobros en cero.** |
| 5 | **GmvClientDonut** (donut "GMV por Cliente MTD") | `useExecutiveMultiYearData` | Filtro: `not estado eq Cancelado`. Usa `fetchAllPaginated`. Sin `cobro_cliente > 0`. |
| 6 | **TopClientsMTD** (tabla clientes) | `useTopClientsMTD` | Filtro: `not estado eq cancelado` (minusculas!). Sin paginacion. Posible case-sensitivity bug. |
| 7 | **useCSRetentionMetrics** (CS module) | Query directa | Sin filtro de estado. Incluye cancelados en GMV. |

### 5 Inconsistencias Criticas

#### 1. Criterio de exclusion de estado (ALTO IMPACTO)

```text
Hook                        Filtro de estado
─────────────────────────── ──────────────────────────────────
ExecutiveKPIsBar            not estado eq 'Cancelado'
useFinancialMetrics         not estado eq 'Cancelado'
useExecutiveMultiYearData   not estado eq 'Cancelado'
useDailyActualServices      neq estado 'Cancelado'
useTopClientsMTD            not estado eq 'cancelado'  <-- MINUSCULA
useOperationalMetrics       estado = 'completado' OR 'finalizado'  <-- MAS RESTRICTIVO
useCSRetentionMetrics       SIN FILTRO  <-- INCLUYE CANCELADOS
```

**Impacto**: `useOperationalMetrics` reporta GMV solo de servicios finalizados, mientras que las demas incluyen servicios en curso/pendientes. Si hay servicios con estado "En Proceso" con cobro_cliente asignado, el GMV difiere entre tarjetas. Ademas, `useTopClientsMTD` usa 'cancelado' en minusculas, lo que puede no coincidir si la BD almacena 'Cancelado' con mayuscula.

#### 2. Filtro de cobro_cliente > 0 (MEDIO IMPACTO)

```text
Hook                        Filtro cobro > 0
─────────────────────────── ──────────────────
useDailyActualServices      SI (.gt('cobro_cliente', 0))
ExecutiveKPIsBar            NO
useFinancialMetrics         NO
useExecutiveMultiYearData   NO
useTopClientsMTD            NO
useOperationalMetrics       NO
```

**Impacto**: Solo el Plan 2026 excluye servicios sin cobro. Los demas incluyen registros con cobro_cliente = 0 o NULL en el conteo de servicios (aunque no suman al GMV monetario, si inflan el denominador del AOV).

#### 3. Paginacion / Limite de 1000 rows (ALTO IMPACTO)

```text
Hook                        Usa fetchAllPaginated
─────────────────────────── ──────────────────────
ExecutiveKPIsBar            SI (current + prev)
useExecutiveMultiYearData   SI
useFinancialMetrics         NO  <-- TRUNCADO a 1000 rows
useTopClientsMTD            NO  <-- TRUNCADO a 1000 rows
useDailyActualServices      NO  <-- TRUNCADO a 1000 rows
useOperationalMetrics       SI (parcial)
```

**Impacto**: Con >643 servicios MTD (como muestra el screenshot), los hooks sin paginacion **estan truncando datos**. El GMV del panel Financiero y de Top Clientes probablemente reporta menos del total real.

#### 4. Rango de fechas MTD (BAJO IMPACTO)

```text
Hook                        Rango
─────────────────────────── ──────────────────────────────────
ExecutiveKPIsBar            getCurrentMTDRange (dia 1 a hoy)
useFinancialMetrics         getCurrentMTDRange (dia 1 a hoy)
useTopClientsMTD            getCurrentMTDRange (dia 1 a hoy)
useExecutiveMultiYearData   Mes completo (dia 1 al ultimo dia)
useDailyActualServices      Mes completo (dia 1 al ultimo dia)
useOperationalMetrics       Filtra por dia <= currentDay
```

**Impacto**: El donut de clientes y Plan 2026 toman el mes completo (podrian incluir servicios futuros programados), mientras que las tarjetas KPI cortan en "hoy".

#### 5. Conversion de tipos cobro_cliente (BAJO IMPACTO)

```text
Hook                        Conversion
─────────────────────────── ──────────────────────────────
ExecutiveKPIsBar            parseFloat(String(s.cobro_cliente || 0))
useFinancialMetrics         parseFloat(String(s.cobro_cliente || 0))
useTopClientsMTD            parseFloat(String(s.cobro_cliente || 0))
useExecutiveMultiYearData   parseFloat(String(s.cobro_cliente || 0))
useDailyActualServices      service.cobro_cliente || 0 (sin parseFloat)
useOperationalMetrics       s.cobro_cliente || 0 (sin parseFloat)
```

**Impacto**: Si cobro_cliente viene como string de la BD, los hooks sin parseFloat podrian concatenar en vez de sumar. Riesgo bajo si Supabase retorna numeros, pero inconsistente.

---

## Plan de Remediacion

### Fase 1: Crear un servicio centralizado de GMV (Single Source of Truth)

Crear `src/services/gmvMTDService.ts` con:

- Una funcion `fetchGMVMTD()` que encapsule:
  - **Fuente**: `servicios_custodia` via `fetchAllPaginated` (obligatorio)
  - **Filtro de estado**: `not estado eq 'Cancelado'` (con mayuscula exacta)
  - **Filtro de cobro**: Incluir todos (sin `gt cobro_cliente 0`) para consistencia con el conteo de servicios. Documentar que servicios con cobro=0 se cuentan como servicio pero no suman a GMV monetario
  - **Rango**: Parametrizable (MTD o mes completo), default = MTD (dia 1 a hoy)
  - **Conversion**: `parseFloat(String(s.cobro_cliente || 0))` estandar
  - **Timezone**: Opcion de usar CDMX para atribucion diaria

- Un hook `useGMVMTD()` que consuma el servicio con React Query y cache unificado

### Fase 2: Crear hook unificado `useUnifiedMTDMetrics`

Crear `src/hooks/useUnifiedMTDMetrics.ts`:

- Exponer: `{ gmvMTD, gmvPrevMTD, gmvVariacion, serviciosMTD, serviciosPrevMTD, aovMTD, clientesMTD, totalGMVByClient }`
- Query key: `['unified-mtd-metrics']`
- Una sola query paginada para current + prev month
- Documentar criterios en JSDoc

### Fase 3: Migrar consumidores (7 archivos)

| Archivo | Accion |
|---------|--------|
| `ExecutiveKPIsBar.tsx` | Reemplazar query interna por `useUnifiedMTDMetrics` |
| `OperationalOverview.tsx` | Usar GMV de `useUnifiedMTDMetrics` en vez de `useOperationalMetrics.totalGMV` (que solo toma finalizados) |
| `FinancialSummaryPanel.tsx` | `useFinancialMetrics` usara `fetchAllPaginated` + criterios unificados |
| `StrategicPlanTracker.tsx` | `useDailyActualServices` alineara filtros (remover `gt cobro_cliente 0` para conteo) |
| `GmvClientDonut.tsx` | Ya usa `useExecutiveMultiYearData` que se alineara |
| `TopClientsMTD.tsx` / `useTopClientsMTD.ts` | Migrar a `useUnifiedMTDMetrics.totalGMVByClient` |
| `useCSRetentionMetrics.ts` | Agregar filtro de estado cancelado |

### Fase 4: Agregar audit trail

- Log en consola con etiqueta `[GMV-AUDIT]` que muestre: fuente, filtros aplicados, total rows, GMV calculado
- Esto permitira verificar en produccion que todas las tarjetas reportan el mismo numero

---

## Detalle tecnico de la implementacion

### `src/services/gmvMTDService.ts` (nuevo)

Funciones:
- `fetchMTDServices(range: MTDRange)`: Query paginada con filtros estandar
- `calculateGMV(services)`: Reduce con parseFloat estandar
- `aggregateByClient(services)`: Agrupacion para donut y tabla

### `src/hooks/useUnifiedMTDMetrics.ts` (nuevo)

- Usa `getCurrentMTDRange` y `getPreviousMTDRange` del util existente
- Dos queries paginadas en paralelo (current + prev)
- Retorna metricas pre-calculadas
- Query key unica para cache compartido entre componentes

### Modificaciones a hooks existentes

- `useFinancialMetrics.ts`: Agregar `fetchAllPaginated`, mantener logica de costos pero usar GMV del servicio unificado
- `useDailyActualServices.ts`: Remover `gt cobro_cliente 0` para alinear conteo de servicios; el GMV se suma solo de los que tienen cobro > 0 naturalmente
- `useTopClientsMTD.ts`: Reescribir para consumir del hook unificado o aplicar los mismos filtros + paginacion
- `useOperationalMetrics.ts`: El GMV MTD comparativo usara la misma logica de exclusion (solo cancelados) en vez de solo finalizados

### Resultado esperado

Todas las tarjetas, paneles y graficos que muestren "GMV MTD" reportaran exactamente el mismo numero porque:
1. Misma query (misma tabla, mismos filtros, misma paginacion)
2. Misma conversion de tipos
3. Mismo rango de fechas
4. Mismo cache (React Query key compartida)

