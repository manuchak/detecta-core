

# Fases 1-3: Implementación Secuencial

Con la Fase 0 completa (queries corregidos, cortesía local/foráneo unificada, selector de operativos real), el sistema tiene cimientos funcionales. Propongo implementar las fases 1 y 2 juntas — son interdependientes y representan el loop completo cobro↔pago.

---

## Fase 1: Motor de Estadías Automático

**Problema actual**: `usePreFacturaInteligente` ya calcula estadías desde `servicio_eventos_ruta`, pero `tarifaHoraExcedente` siempre es 0 (viene de `reglas_estadias_cliente` que tiene 0 registros, y `pc_clientes` no tiene ese campo).

**Cambios**:

### 1a. Migración SQL — Agregar `tarifa_hora_estadia` a `pc_clientes`
- Nueva columna `tarifa_hora_estadia NUMERIC DEFAULT 0` en `pc_clientes`
- Esto permite que los 54 clientes ya configurados tengan tarifa sin necesidad de crear reglas en la tabla vacía `reglas_estadias_cliente`

### 1b. Actualizar `ClienteFiscal` type + query
- En `useClientesFiscales.ts`: agregar `tarifa_hora_estadia: number | null` al interface
- Asegurar que el select incluye este campo (ya usa `select('*')` así que es automático)

### 1c. Actualizar `usePreFacturaInteligente` — usar tarifa de `pc_clientes`
- Línea 119: cambiar fallback de `tarifaHoraExcedente` para usar `clienteFiscal?.tarifa_hora_estadia ?? 0` cuando no hay regla específica

### 1d. Panel de Revisión de Estadías — Enriquecer `EstadiasPanel.tsx`
- Actualmente solo muestra reglas vacías. Agregar una vista que muestre los **servicios con estadía calculada** (servicios finalizados del último mes donde el delta llegada→liberación > cortesía)
- Query: `servicio_eventos_ruta` con join a `servicios_custodia` para traer cliente, ruta, local/foráneo
- Tabla con columnas: Folio, Cliente, Ruta, L/F, Tiempo en destino, Cortesía, Excedente, Tarifa, Cobro estimado
- Badge de estado: "Pendiente facturar" / "Facturado" (cruzando con `factura_partidas`)

**Archivos**: migración SQL, `useClientesFiscales.ts`, `usePreFacturaInteligente.ts`, `EstadiasPanel.tsx`, nuevo hook `useEstadiasCalculadas.ts`

---

## Fase 2: Panel CxP Custodios — Funcional con Data Real

**Estado actual**: `GenerarCorteDialog` y `useCreateCxPCorte` están corregidos (Fase 0). El flujo genera cortes pero falta:
- Incluir estadías pagables al custodio en el cálculo del corte
- Preview de servicios encontrados antes de confirmar generación

**Cambios**:

### 2a. Preview en `GenerarCorteDialog` — mostrar servicios antes de generar
- Al seleccionar operativo + semana, hacer query preview (mismo query que `useCreateCxPCorte` pero sin insertar)
- Mostrar tabla resumen: X servicios, $Y base, $Z casetas, $W hoteles, $V apoyos
- Botón "Generar" solo habilitado si hay servicios

### 2b. Incluir estadías pagables en corte
- En `useCreateCxPCorte`: después de obtener servicios, consultar `detenciones_servicio` con `pagable_custodio = true` para esos `servicio_id`s
- Agregar líneas de detalle tipo `'estadia'` al corte
- Actualizar `monto_estadias` en el header del corte

### 2c. Mejorar `CxPOperativoTab` — KPI de estadías
- Agregar KPI card: "Estadías" con suma de `monto_estadias` de cortes pendientes

**Archivos**: `GenerarCorteDialog.tsx`, `useCxPCortesSemanales.ts`, `CxPOperativoTab.tsx`

---

## Fase 3: CxP Proveedores — Cálculo automático al generar

**Estado actual**: `CxPProveedoresTab` tiene UI completa pero `useCreateCxP` no auto-calcula servicios del proveedor.

**Cambios**:

### 3a. Enriquecer `useCreateCxP` con auto-cálculo
- Al crear estado de cuenta de proveedor: consultar `asignacion_armados` donde `tipo_asignacion = 'proveedor'` AND `proveedor_id = X` en el periodo
- Sumar tarifas acordadas como `monto_servicios`
- Consultar `gastos_extraordinarios_servicio` asociados como extras

### 3b. Agregar campo de conciliación — `factura_proveedor` + `monto_factura_proveedor`
- En la tabla existente ya hay `factura_proveedor` (texto). Agregar input editable en la fila para capturar número de factura
- Agregar badge de alerta si `monto_factura_proveedor ≠ monto_total` (delta > 5%)

**Archivos**: `useCxPProveedores.ts`, `CxPProveedoresTab.tsx`

---

## Resumen de Archivos

| Fase | Archivo | Tipo |
|------|---------|------|
| 1 | Nueva migración SQL | Create |
| 1 | `useClientesFiscales.ts` | Edit (1 línea al type) |
| 1 | `usePreFacturaInteligente.ts` | Edit (1 línea fallback tarifa) |
| 1 | `useEstadiasCalculadas.ts` | Create (hook nuevo) |
| 1 | `EstadiasPanel.tsx` | Rewrite (vista funcional) |
| 2 | `GenerarCorteDialog.tsx` | Edit (agregar preview) |
| 2 | `useCxPCortesSemanales.ts` | Edit (agregar estadías al cálculo) |
| 2 | `CxPOperativoTab.tsx` | Edit (KPI estadías) |
| 3 | `useCxPProveedores.ts` | Edit (auto-cálculo) |
| 3 | `CxPProveedoresTab.tsx` | Edit (conciliación) |

Total: 10 archivos, 2 nuevos + 8 edits. Las 3 fases son implementables en un solo ciclo porque comparten infraestructura (mismo hook de clientes fiscales, misma tabla de servicios).

