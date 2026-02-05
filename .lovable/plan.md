
# Plan: Alimentar Sistema de Facturación con Servicios Finalizados

## Diagnóstico Actual

### Estado del Sistema de Facturación

| Componente | Estado | Impacto |
|------------|--------|---------|
| Servicios finalizados | **22,306** (desde 2024) | $100M+ por facturar |
| Facturas creadas | **0** | Tabla vacía |
| Sistema CxC | ✓ Funcional | Depende de tabla `facturas` |
| Vista Aging | ✓ Funcional | Muestra $0 porque no hay facturas |

### Estructura de Datos Existente

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                    FUENTE DE DATOS (existente)                            │
│  servicios_custodia + servicios_planificados → vw_servicios_facturacion   │
│  22,306 servicios "Finalizado" listos para facturar                       │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼ BRECHA: No existe flujo
┌───────────────────────────────────────────────────────────────────────────┐
│                    DESTINO (vacío)                                        │
│  facturas (0 registros) + factura_partidas (0 registros)                  │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼ Ya funciona
┌───────────────────────────────────────────────────────────────────────────┐
│                    COBRANZA (operativo pero sin datos)                    │
│  vw_aging_cuentas_cobrar → CuentasPorCobrarTab → Workflow Cobranza        │
└───────────────────────────────────────────────────────────────────────────┘
```

### Top 10 Clientes por Facturar

| Cliente | Servicios | Monto |
|---------|-----------|-------|
| ASTRA ZENECA | 2,862 | $17.9M |
| COMARKET | 2,615 | $17.8M |
| SIEGFRIED RHEIN | 1,474 | $7.6M |
| TYASA | 1,707 | $6.7M |
| DXN MEXICO | 232 | $5.1M |
| MONTE ROSAS | 492 | $4.3M |
| WIELAND METAL | 256 | $3.9M |
| MONTE ROSA SPORTS | 417 | $3.9M |
| LOGER | 247 | $3.7M |
| YOKOHAMA | 211 | $2.8M |

---

## Solución Propuesta

### Fase 1: Módulo de Pre-Facturación (MVP)

**Objetivo**: Crear facturas desde servicios finalizados para alimentar el sistema de cobranza.

#### 1.1 Nueva Vista: "Servicios por Facturar"

**Ubicación**: Tab "Facturación" en FacturacionHub (reemplazar FacturasComingSoon)

**Funcionalidades**:
- Tabla de servicios finalizados agrupados por cliente
- Filtros: período, cliente, estado de facturación
- Selección múltiple de servicios
- Botón "Generar Pre-Factura"

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ SERVICIOS POR FACTURAR                                    [Exportar]   │
├─────────────────────────────────────────────────────────────────────────┤
│ Filtros: [Período ▼] [Cliente ▼] [Sin facturar ✓]        Total: $100M │
├─────────────────────────────────────────────────────────────────────────┤
│ □ Cliente              │ Servicios │ Monto      │ Último    │ Acciones │
├────────────────────────┼───────────┼────────────┼───────────┼──────────┤
│ ☑ ASTRA ZENECA         │    2,862  │ $17.9M     │ 30/01/25  │ [Facturar]│
│ ☑ COMARKET             │    2,615  │ $17.8M     │ 30/01/25  │ [Facturar]│
│ □ SIEGFRIED RHEIN      │    1,474  │ $7.6M      │ 29/01/25  │ [Facturar]│
└─────────────────────────────────────────────────────────────────────────┘
│                    [Generar Facturas Seleccionadas (5)]                │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 1.2 Modal de Generación de Factura

**Flujo**:
1. Usuario selecciona cliente o servicios específicos
2. Sistema muestra resumen con datos fiscales del cliente
3. Usuario confirma y el sistema crea:
   - 1 registro en `facturas`
   - N registros en `factura_partidas` (uno por servicio)

**Datos a capturar**:
- Datos del cliente (pre-llenados desde pc_clientes)
- Fecha de emisión (default: hoy)
- Fecha de vencimiento (calculada: emisión + días_credito del cliente)
- Número de factura (auto-generado o manual)
- Subtotal, IVA, Total (calculados)

#### 1.3 Tracking de Estado de Facturación

**Nuevo campo en servicios**: Agregar columna `factura_id` a `servicios_custodia` o usar la tabla intermedia `factura_partidas` que ya existe.

**Estados de servicio**:
- `sin_facturar`: Servicio finalizado, no vinculado a factura
- `facturado`: Servicio incluido en una factura
- `parcialmente_pagado`: Factura con pagos parciales
- `cobrado`: Factura 100% pagada

---

### Fase 2: Vista de Facturas Emitidas

#### 2.1 Lista de Facturas

**Reemplaza**: FacturasComingSoon.tsx

**Columnas**:
| # Factura | Cliente | Fecha | Vencimiento | Total | Pagado | Saldo | Estado | Acciones |

**Acciones por factura**:
- Ver detalle (partidas/servicios)
- Descargar PDF
- Registrar pago
- Cancelar

#### 2.2 Detalle de Factura

**Drawer con**:
- Encabezado fiscal (cliente, RFC, dirección)
- Lista de partidas (servicios incluidos)
- Timeline de pagos
- Estado de cobranza

---

### Fase 3: Integración con Sistema Fiscal (Futuro)

**Nota**: Esta fase requiere integración con PAC para timbrado CFDI.

- Generación de XML CFDI 4.0
- Timbrado automático
- Complementos de pago
- Notas de crédito

---

## Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `src/pages/Facturacion/components/Facturas/ServiciosPorFacturarTab.tsx` | Vista principal de servicios sin facturar |
| `src/pages/Facturacion/components/Facturas/GenerarFacturaModal.tsx` | Modal para crear factura desde servicios |
| `src/pages/Facturacion/components/Facturas/FacturasListTab.tsx` | Lista de facturas emitidas |
| `src/pages/Facturacion/components/Facturas/FacturaDetalleDrawer.tsx` | Detalle de factura con partidas |
| `src/pages/Facturacion/hooks/useServiciosPorFacturar.ts` | Hook para servicios sin facturar |
| `src/pages/Facturacion/hooks/useGenerarFactura.ts` | Hook para crear factura + partidas |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Facturacion/FacturacionHub.tsx` | Reemplazar FacturasComingSoon por nuevo módulo |
| `src/pages/Facturacion/components/Facturas/index.ts` | Exportar nuevos componentes |

---

## Modelo de Datos (Existente - Sin Cambios)

### Tabla `facturas` (ya existe)
```sql
-- Ya tiene la estructura correcta:
id, numero_factura, cliente_id, cliente_nombre, cliente_rfc,
subtotal, iva, total, fecha_emision, fecha_vencimiento, estado...
```

### Tabla `factura_partidas` (ya existe)
```sql
-- Vincula servicios con facturas:
id, factura_id, servicio_id, id_servicio, descripcion,
fecha_servicio, ruta, cantidad, precio_unitario, importe...
```

### Vista `vw_aging_cuentas_cobrar` (ya existe)
```sql
-- Ya calcula aging desde facturas:
SELECT cliente_id, saldo_pendiente, vigente, vencido_1_30...
FROM facturas LEFT JOIN pagos...
```

---

## Flujo de Usuario Final

```text
1. Usuario entra a Facturación → Tab "Facturas"
                    │
                    ▼
2. Ve servicios finalizados agrupados por cliente
                    │
                    ▼
3. Selecciona cliente(s) → Click "Generar Factura"
                    │
                    ▼
4. Modal muestra resumen + datos fiscales
   [Confirma] →    │
                    ▼
5. Sistema crea factura + partidas
                    │
                    ▼
6. Factura aparece en CxC automáticamente
                    │
                    ▼
7. Workflow de cobranza puede dar seguimiento
```

---

## Beneficios Inmediatos

| Métrica | Antes | Después |
|---------|-------|---------|
| Facturas en sistema | 0 | ~500+ por generar |
| CxC visible | $0 | $100M+ |
| Aging por cliente | Vacío | Datos reales |
| Cobranza automatizable | No | Sí |

---

## Consideraciones Técnicas

1. **No requiere cambios en base de datos**: Las tablas `facturas` y `factura_partidas` ya existen con la estructura correcta.

2. **Compatibilidad con CFDI futuro**: El número de factura será "pre-factura" hasta que se integre el timbrado. El campo `uuid_sat` quedará NULL por ahora.

3. **Reversibilidad**: Las facturas pueden cancelarse, lo que libera los servicios para re-facturación.

4. **Performance**: Los queries usarán la vista `vw_servicios_facturacion` existente, que ya está optimizada.

---

## Orden de Implementación Sugerido

1. **Hook `useServiciosPorFacturar`** - Query de servicios finalizados sin facturar
2. **`ServiciosPorFacturarTab`** - Vista de servicios agrupados por cliente
3. **`GenerarFacturaModal`** - Modal para crear factura
4. **Hook `useGenerarFactura`** - Lógica de inserción en facturas + partidas
5. **Integración en `FacturacionHub`** - Reemplazar Coming Soon
6. **`FacturasListTab`** - Vista de facturas emitidas
7. **`FacturaDetalleDrawer`** - Detalle con partidas
