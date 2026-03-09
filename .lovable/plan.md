

# Roadmap Financiero: Análisis de Head of Product

## Estado Actual del Sistema — Diagnóstico Honesto

Antes de proponer features, hay que reconocer que **la infraestructura de egresos (CxP OCA) está rota** y varias piezas clave están desconectadas.

### Datos duros del estado actual:

| Módulo | Estado | Data real |
|--------|--------|-----------|
| Reglas cortesía `pc_clientes` | **54 clientes configurados** (local/foráneo) | Listo para consumir |
| Eventos de ruta | **4,062 registros** (234 llegada_destino, 223 liberación) | Base para estadías |
| Detenciones | **0 registros** | Sin alimentar |
| Reglas estadías (`reglas_estadias_cliente`) | **0 activas** | Redundante con `pc_clientes` |
| CxP Cortes semanales | **0 generados** | Hook roto (ver abajo) |
| CxP Proveedores | **0 generados** | Funcional pero sin data |
| Facturas emitidas | **0** | Sin uso |
| Pagos registrados | **0** | Sin uso |

### Bugs Críticos en CxP OCA (Cortes Semanales)

El hook `useCreateCxPCorte` tiene **3 errores que impiden generar cualquier corte**:

1. **Columna inexistente**: Usa `custodio_asignado` pero la tabla tiene `id_custodio`
2. **Columna inexistente**: Usa `fecha_servicio` pero la tabla tiene `fecha_hora_cita`  
3. **Estado incorrecto**: Filtra `estado = 'completado'` pero el sistema usa `'Finalizado'`

Resultado: el query retorna 0 servicios siempre, generando cortes vacíos.

### Redundancia en Modelo de Cortesía

Existen **dos fuentes de verdad** para horas de cortesía:
- `pc_clientes.horas_cortesia` / `horas_cortesia_local` / `horas_cortesia_foraneo` (54 clientes configurados)
- `reglas_estadias_cliente` (tabla dedicada, 0 registros, soporta reglas por ruta/tipo)

El hook `usePreFacturaInteligente` consulta `reglas_estadias_cliente` primero y fallback a `pc_clientes.horas_cortesia`, pero **ignora `horas_cortesia_local/foraneo`** que es donde está la data real.

---

## Roadmap Priorizado — Orden de Implementación

```text
FASE 0: ARREGLAR LO ROTO (Pre-requisito)
│
├─ Fix CxP OCA query (columnas + estado)
├─ Unificar fuente de cortesía (pc_clientes.local/foraneo como SoT)
└─ Fix usePreFacturaInteligente para usar horas_cortesia_local/foraneo + local_foraneo del servicio
│
FASE 1: CÁLCULO AUTOMÁTICO DE ESTADÍAS (Cobros)
│
├─ Motor de cálculo: eventos_ruta (llegada→liberación) × regla cortesía cliente × local/foráneo
├─ Enriquecer pre-factura con desglose automático
└─ Vista de revisión para validar estadías antes de facturar
│
FASE 2: PANEL DE PAGO A CUSTODIOS Y ARMADOS INTERNOS (Pagos)
│
├─ Selector de operativo (autocomplete desde candidatos_custodios liberados)
├─ Auto-cálculo de servicios (query corregido) + estadías pagables + casetas + hoteles
├─ Workflow: Borrador → Revisión Ops → Aprobado Finanzas → Dispersado → Pagado
└─ Desglose expandible inline (ya existe UI, falta data)
│
FASE 3: CONTROL DE PAGOS A PROVEEDORES EXTERNOS (Pagos)
│
├─ Enriquecer CxP PE con detalle de asignaciones reales
├─ Conciliación: factura proveedor vs monto calculado (delta alert)
└─ Workflow aprobación con evidencia adjunta
│
FASE 4: FACTURACIÓN INTELIGENTE (Cobros)
│
├─ Generación de factura con conceptos auto-consolidados (custodia + estadía + casetas + extras)
├─ Respeto de reglas por cliente (formato descripción, portal, evidencia requerida)
└─ Vinculación factura → servicios para tracking CxC
│
FASE 5: OVERVIEW FINANCIERO REAL (Inteligencia)
│
├─ P&L con datos reales de facturas y cortes (no solo servicios_custodia)
├─ Aging CxC desde facturas emitidas
└─ Cash flow projection (CxC aging vs CxP pipeline)
```

---

## Detalle Técnico por Fase

### FASE 0: Arreglar lo roto (URGENTE — sin esto nada funciona)

**Cambio 1: Fix `useCreateCxPCorte`**
```typescript
// ANTES (roto):
.eq('custodio_asignado', data.operativo_id)
.eq('estado', 'completado')
.gte('fecha_servicio', data.semana_inicio)

// DESPUÉS (correcto):
.eq('id_custodio', data.operativo_id)
.eq('estado', 'Finalizado')
.gte('fecha_hora_cita', `${data.semana_inicio}T00:00:00`)
.lte('fecha_hora_cita', `${data.semana_fin}T23:59:59`)
```

**Cambio 2: Fix `usePreFacturaInteligente` — usar cortesía local/foráneo**
```typescript
// Resolver horas de cortesía según local_foraneo del servicio
const horasCortesia = svc.local_foraneo === 'Foráneo' 
  ? (clienteFiscal?.horas_cortesia_foraneo ?? clienteFiscal?.horas_cortesia ?? 0)
  : (clienteFiscal?.horas_cortesia_local ?? clienteFiscal?.horas_cortesia ?? 0);
```

Agregar `horas_cortesia_local` y `horas_cortesia_foraneo` al tipo `ClienteFiscal` (ya están en la tabla).

**Cambio 3: Fix `GenerarCorteDialog`** — reemplazar input de texto libre por selector de custodios/armados reales desde la base de datos.

**Archivos**: 
- `useCxPCortesSemanales.ts` — fix query
- `usePreFacturaInteligente.ts` — fix cortesía local/foráneo  
- `useClientesFiscales.ts` — ya incluye los campos, solo verificar tipo
- `GenerarCorteDialog.tsx` — selector de operativos

### FASE 1: Motor de Estadías Automático

**Fuentes de verdad para el cálculo:**
- `servicio_eventos_ruta`: `llegada_destino` → `liberacion_custodio` = tiempo en destino
- `pc_clientes`: `horas_cortesia_local` / `horas_cortesia_foraneo` = cortesía
- `servicios_custodia.local_foraneo` = determina qué regla aplicar

**Lógica central** (ya parcialmente en `usePreFacturaInteligente`, necesita refinamiento):
```
estadía_bruta = timestamp(liberacion_custodio) - timestamp(llegada_destino)
cortesía = pc_clientes.horas_cortesia_{local|foraneo}
excedente = max(0, estadía_bruta - cortesía)
cobro_estadía = excedente × tarifa_hora (por definir fuente)
```

**Problema abierto**: No hay `tarifa_hora_excedente` en `pc_clientes`. Existe en `reglas_estadias_cliente` pero tiene 0 registros. Opciones:
- A) Agregar columna `tarifa_hora_estadia` a `pc_clientes`  
- B) Usar `reglas_estadias_cliente` como SoT y migrar data de cortesía ahí

**Recomendación**: Opción A (agregar a `pc_clientes`) porque ya tiene 54 clientes configurados y el maestro de facturación ya se importó ahí. La tabla `reglas_estadias_cliente` sería para override por ruta/tipo.

### FASE 2: Panel CxP Custodios/Armados

Depende de Fase 0. El flujo ya existe en UI pero el query no trae data. Con el fix:
- Auto-populate servicios del custodio en la semana
- Incluir estadías pagables (`detenciones_servicio.pagable_custodio`)
- Incluir casetas, hoteles, apoyos extraordinarios aprobados
- Generar PDF/resumen de dispersión

### FASE 3: CxP Proveedores

El flujo ya existe y el query es funcional. Mejoras:
- Conciliación contra factura del proveedor (upload + comparación)
- Alertas de desviación (monto calculado vs factura recibida)

### FASE 4-5: Facturación + Overview

Dependen de que las fases anteriores generen data real (facturas, cortes pagados) para alimentar el P&L y el aging.

---

## Interconexiones Críticas

```text
servicios_custodia (SoT operativa)
    │
    ├──→ vw_servicios_facturacion (vista consolidada)
    │       ├──→ usePreFacturaInteligente (cobros)
    │       └──→ useServiciosPorFacturar (pendientes)
    │
    ├──→ servicio_eventos_ruta (tiempos reales)
    │       └──→ Cálculo estadías (llegada→liberación)
    │
    ├──→ pc_clientes (reglas comerciales)
    │       ├──→ horas_cortesia_local/foraneo (cortesía)
    │       ├──→ tarifa_sin_arma/con_arma (referencia)
    │       └──→ dias_credito, dia_corte (CxC)
    │
    ├──→ cxp_cortes_semanales (pagos a custodios)
    │       └──→ id_custodio + fecha_hora_cita + 'Finalizado'
    │
    ├──→ asignacion_armados (pagos a armados)
    │       ├──→ tipo='interno' → CxP OCA
    │       └──→ tipo='proveedor' → CxP PE
    │
    └──→ facturas + factura_partidas (cobros)
            └──→ pagos (CxC tracking)
```

---

## Propuesta de Ejecución Inmediata

Recomiendo implementar **solo Fase 0** en este ciclo: son 3-4 archivos, correcciones quirúrgicas, y desbloquean todo el pipeline financiero. Sin estos fixes, las fases posteriores construirían sobre queries que retornan 0 resultados.

Archivos a modificar:
1. `src/pages/Facturacion/hooks/useCxPCortesSemanales.ts` — fix 3 errores de query
2. `src/pages/Facturacion/hooks/usePreFacturaInteligente.ts` — fix cortesía local/foráneo
3. `src/pages/Facturacion/hooks/useClientesFiscales.ts` — verificar tipos incluyan campos nuevos
4. `src/pages/Facturacion/components/CxPOperativo/CortesSemanales/GenerarCorteDialog.tsx` — selector operativos

