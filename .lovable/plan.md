

# Auditoría de Integridad de Datos — Módulo de Facturación

## Resumen Ejecutivo

El módulo de facturación tiene **infraestructura de código funcional** pero **0 datos generados** en todas las tablas transaccionales. Hay **3 bugs críticos** que impiden que el sistema opere, y **$18.1M MXN en servicios sin facturar**.

---

## Estado de Datos por Tabla

| Tabla | Registros | Estado |
|-------|-----------|--------|
| `facturas` | **0** | Sin uso |
| `factura_partidas` | **0** | Sin uso |
| `pagos` | **0** | Sin uso |
| `cxp_cortes_semanales` | **0** | Sin uso |
| `cxp_cortes_detalle` | **0** | Sin uso |
| `cxp_proveedores_armados` | **0** | Sin uso |
| `cxp_detalle_servicios` | **0** | Sin uso |
| `detenciones_servicio` | **0** | Sin alimentar |
| `gastos_extraordinarios_servicio` | **0** | Sin alimentar |
| `solicitudes_apoyo_extraordinario` | **0** | Sin alimentar |
| `servicio_eventos_ruta` | **4,070** | Parcialmente alimentada |
| `pc_clientes` | **107 activos** | Operativa, con gaps |
| `servicios_custodia` (Finalizados, 90d) | **2,302** / $18.1M | SoT operativa OK |

---

## Bugs Críticos Detectados

### BUG 1: `useFinanceOverview` consulta columna inexistente (SEVERIDAD: ALTA)

**Archivo**: `useFinanceOverview.ts`, líneas 63-71
**Problema**: Filtra por `.gte('fecha_servicio', mtdStart)` pero la columna `fecha_servicio` **NO EXISTE** en `servicios_custodia`. La columna correcta es `fecha_hora_cita`.

**Impacto**: El dashboard financiero (P&L MTD) retorna **$0 en todos los KPIs** porque Supabase ignora silenciosamente filtros con columnas inexistentes o retorna error. Los datos de red muestran que otras queries al mismo endpoint SÍ usan `fecha_hora_cita` correctamente, confirmando la inconsistencia.

**Datos reales**: Marzo 2026 tiene $2.4M en ingresos y $1.07M en costos que el overview NO muestra.

### BUG 2: CxP Cortes — tarifa de estadía hardcodeada a $50/hr (SEVERIDAD: MEDIA)

**Archivo**: `useCxPCortesSemanales.ts`, línea 180
```typescript
const monto = Math.round(hrs * 50 * 100) / 100; // ← hardcoded $50/hr
```

**Problema**: La tarifa por hora de estadía pagable al custodio está hardcodeada en $50. No consulta ninguna tabla de configuración (ni `esquema_pago_custodios`, ni `pc_clientes`). Como `detenciones_servicio` tiene 0 registros, este bug no genera errores visibles pero producirá cálculos incorrectos cuando se alimente data.

### BUG 3: Clientes no matcheados entre `servicios_custodia` y `pc_clientes` (SEVERIDAD: ALTA)

**Problema**: **20+ clientes activos** con servicios en los últimos 60 días no tienen match en `pc_clientes` (lookup por `LOWER(nombre)`). Los más críticos:

| Cliente | Servicios (60d) | Impacto |
|---------|-----------------|---------|
| MONTE ROSAS | 106 | Sin reglas cortesía/facturación |
| ANDREA | 97 | Sin reglas cortesía/facturación |
| ENVIALO | 52 | Sin reglas cortesía/facturación |
| PRODUCTOS PENNSYLVANIA | 46 | Sin reglas cortesía/facturación |
| YOKOHAMA | 34 | Sin reglas cortesía/facturación |
| YOUNG GUNS | 31 | Sin reglas cortesía/facturación |
| CANTABRIA | 30 | Sin reglas cortesía/facturación |

**Impacto**: `usePreFacturaInteligente` busca el cliente por `nombre.toLowerCase()` — si no hay match, se aplica cortesía 0, tarifa 0, y las pre-facturas salen sin estadías. Estos 20+ clientes representan **~600+ servicios** que generarían facturas incompletas.

---

## Gaps de Calidad en `pc_clientes`

De 107 clientes activos:
- **91/107** (85%) tienen RFC
- **95/107** (89%) tienen razón social
- **54/107** (50%) tienen cortesía local/foráneo configurada
- **0/107** (0%) tienen `tarifa_hora_estadia` — recién se creó la columna pero nadie la pobló
- **2/107** (2%) usan el campo legacy `horas_cortesia` — el resto usa `horas_cortesia_local/foraneo`

**Conclusión**: La columna `tarifa_hora_estadia` es crítica para el cálculo de estadías pero está vacía en el 100% de los clientes. Sin este dato, todas las estadías se calculan con tarifa $0.

---

## Tabla de Eventos de Ruta (Base para Estadías)

- **234 llegadas** a destino
- **224 liberaciones** de custodio
- **16 pernoctas**
- Cobertura: solo **~10%** de los 2,302 servicios finalizados tienen eventos de ruta

**Impacto**: El motor de estadías (`useEstadiasCalculadas`, `usePreFacturaInteligente`) solo puede calcular estadías para ~200 servicios. El 90% restante no tiene datos de tiempos en destino.

---

## Tablas Vacías que Bloquean Features

| Tabla | Usada por | Consecuencia |
|-------|-----------|-------------|
| `detenciones_servicio` | CxP cortes, pre-factura | 0 estadías en cortes, 0 en facturas |
| `gastos_extraordinarios_servicio` | CxP cortes, CxP proveedores, pre-factura | 0 extras en todo |
| `solicitudes_apoyo_extraordinario` | CxP cortes | 0 apoyos en cortes |

Estas tablas son alimentadas operativamente. Hasta que no se genere data real, los workflows financieros generarán documentos vacíos.

---

## Plan de Corrección (3 cambios de código)

### Fix 1: `useFinanceOverview.ts` — columna `fecha_servicio` → `fecha_hora_cita`
- Líneas 63-71: Reemplazar todas las referencias a `fecha_servicio` por `fecha_hora_cita`
- Esto desbloqueará el P&L MTD mostrando los $2.4M reales de marzo

### Fix 2: `useCxPCortesSemanales.ts` — tarifa estadía configurable
- Línea 180: Reemplazar `50` hardcodeado por lookup a esquema de pago o al menos un valor configurable por constante exportable

### Fix 3: Crear script de reconciliación `nombre_cliente` ↔ `pc_clientes`
- Agregar los 20+ clientes faltantes a `pc_clientes` (INSERT) o generar un mapeo de alias
- Esto es un INSERT de datos, no un cambio de esquema

Estos 3 fixes son quirúrgicos (sin cambios de UI) y desbloquean la integridad del flujo completo de facturación.

