

# Auditoría Proveedores Externos y P&L Gadgets — Análisis y Plan

## Diagnóstico del Estado Actual

### Lo que existe hoy

**Proveedores de Armados (CUSAEM, SEICSA):**
- Tabla `proveedores_armados` con 3 proveedores registrados (CUSAEM activo, SEICSA activo, Seguridad Integral inactivo)
- Tabla `asignacion_armados` registra cada asignación con `proveedor_armado_id`, `tarifa_acordada`, `estado_asignacion`
- Tabla `cxp_proveedores_armados` + `cxp_detalle_servicios` permiten generar estados de cuenta por periodo
- **Problema**: solo hay 4 asignaciones registradas (3 pendientes, 1 cancelada) — nunca se ha completado el ciclo real
- **No existe** conciliación contra la relación del proveedor
- **No existe** soporte para carga de archivos Excel/PDF del proveedor

**Gadgets (Candados/GPS):**
- Tabla `pc_clientes_gadgets` define los precios que Detecta **cobra a cada cliente** (9 registros activos: GPS $599-$2,500, Candado Sintel $2,500, Candado Rhino $2,500)
- `servicios_custodia` tiene campos `gadget` (serial) y `tipo_gadget` — 25 servicios con candados asignados
- Flag `cobra_gadgets` por cliente controla si se factura
- **No existe** tabla de inventario de candados (cuántos hay, de quién son, estado)
- **No existe** registro de cuánto paga Detecta al proveedor de candados (renta mensual por unidad)
- **No existe** P&L: ingreso por gadgets vs costo de renta

### Fuentes de Verdad Identificadas

| Dato | Fuente | Estado |
|------|--------|--------|
| Servicios completados con armado externo | `asignacion_armados` (tipo_asignacion='proveedor', estado='completado') | Existe pero sin datos reales |
| Tarifa acordada por servicio | `asignacion_armados.tarifa_acordada` | Existe |
| Lo que cobra el proveedor | Relación Excel/PDF del proveedor | No se captura |
| Lo que Detecta cobra por gadgets | `pc_clientes_gadgets.precio` + `servicios_custodia.gadget` | Parcial |
| Lo que Detecta paga por candados | No existe | Faltante |
| Inventario de candados | No existe en DB | Faltante |

---

## Arquitectura Propuesta

### Módulo 1: Inventario de Gadgets y Costo de Renta

Nueva tabla `inventario_gadgets`:
```text
id | serial (SITEL-00068, SAMA-TP133...) | tipo (candado_sintel, candado_rhino, trabapatin, gps)
proveedor_nombre | es_propio (bool) | renta_mensual (0 si propio)
estado (activo, baja, reparacion) | fecha_alta | fecha_baja
```

Nueva tabla `rentas_gadgets_mensuales`:
```text
id | mes (2026-03) | total_unidades | renta_por_unidad | monto_total
proveedor | factura_proveedor | estado (pendiente, pagado) | fecha_pago
```

**Efecto**: Permite calcular "cuánto pago por gadgets al mes" como egreso fijo.

### Módulo 2: Conciliación de Proveedores de Armados

Flujo propuesto:
```text
┌──────────────────────────────────────────────────────────┐
│  1. Generar corte (periodo + proveedor)                  │
│     → Sistema extrae asignaciones completadas            │
│     → Resultado: "Nuestra versión" (lo que debemos pagar)│
├──────────────────────────────────────────────────────────┤
│  2. Subir relación del proveedor (Excel/CSV)             │
│     → Parser extrae filas: fecha, nombre, ruta, monto    │
│     → Se mapean columnas con asistente                   │
├──────────────────────────────────────────────────────────┤
│  3. Conciliación automática                              │
│     → Match por fecha + nombre armado + ruta/destino     │
│     → Clasifica:                                         │
│        ✅ Coincide (ambos, montos iguales)               │
│        ⚠️ Diferencia de monto                           │
│        ❌ Solo en relación proveedor (no tenemos)        │
│        ❌ Solo en Detecta (proveedor no lo reporta)      │
├──────────────────────────────────────────────────────────┤
│  4. Finanzas resuelve discrepancias                      │
│     → Acepta/rechaza línea a línea                       │
│     → Ajusta monto final del corte                       │
├──────────────────────────────────────────────────────────┤
│  5. Aprobación y pago                                    │
│     → Estado: borrador → conciliado → aprobado → pagado  │
└──────────────────────────────────────────────────────────┘
```

Nueva tabla `conciliacion_proveedor_armados`:
```text
id | cxp_id (FK → cxp_proveedores_armados)
archivo_url | archivo_nombre | columnas_mapeo (JSON)
total_filas_proveedor | total_filas_detecta
coincidencias | discrepancias_monto | solo_proveedor | solo_detecta
estado (pendiente, conciliado, ajustado)
created_at | created_by
```

Nueva tabla `conciliacion_detalle`:
```text
id | conciliacion_id
asignacion_id (nullable) | fila_proveedor (JSON)
resultado (coincide, discrepancia_monto, solo_proveedor, solo_detecta)
monto_detecta | monto_proveedor | diferencia
resolucion (pendiente, aceptado, rechazado, ajustado)
monto_final | notas_finanzas
```

### Módulo 3: Cortes Flexibles (Semanal/Mensual por proveedor)

Reutilizar `cxp_proveedores_armados` existente pero agregar:
- Campo `frecuencia_pago` en `proveedores_armados` (semanal | mensual)
- El flujo de "Generar Estado de Cuenta" ya existe — se enriquece con la conciliación

### Módulo 4: P&L Gadgets Dashboard

Panel en la pestaña Egresos → PE que muestre:
```text
┌────────────────────────────────────────────┐
│  P&L Gadgets — Marzo 2026                 │
├──────────────┬─────────────────────────────┤
│ INGRESOS     │ EGRESOS                     │
│ Cobrado a    │ Renta candados: $X,XXX      │
│ clientes:    │ (XX unidades × $XXX)        │
│ $XX,XXX      │                             │
│ (XX serv.)   │ GPS propios: $0             │
│              │ (XX unidades, sin renta)    │
├──────────────┴─────────────────────────────┤
│ MARGEN: $X,XXX (XX%)                      │
└────────────────────────────────────────────┘
```

Fuentes:
- **Ingresos**: `servicios_custodia` con `tipo_gadget` != null, cruzado con `pc_clientes_gadgets.precio`
- **Egresos**: `rentas_gadgets_mensuales` + `inventario_gadgets` (solo los rentados)

---

## Dependencias y Orden de Implementación

```text
Fase 1 (Base de datos)
  ├── inventario_gadgets
  ├── rentas_gadgets_mensuales
  ├── conciliacion_proveedor_armados
  ├── conciliacion_detalle
  └── ALTER proveedores_armados ADD frecuencia_pago

Fase 2 (Inventario Gadgets + Renta)
  ├── UI para gestionar inventario de candados
  ├── Registro mensual de renta
  └── P&L Gadgets panel

Fase 3 (Conciliación Proveedores)
  ├── Upload + parser Excel/CSV
  ├── Mapeo de columnas asistido
  ├── Motor de conciliación (match fuzzy)
  ├── UI de resolución de discrepancias
  └── Integración con flujo de aprobación existente

Fase 4 (Cortes Flexibles)
  └── Adaptar generación de cortes a semanal/mensual por proveedor
```

### Riesgo Técnico Principal
La conciliación por "Fecha + Nombre + Ruta" requiere matching fuzzy (el proveedor puede escribir "Gdl-CDMX" y nosotros "Guadalajara → Ciudad de México"). Propongo un scoring de confianza con umbral configurable y revisión manual para los que no matcheen.

---

## Resumen Ejecutivo

| Capacidad | Hoy | Después |
|-----------|-----|---------|
| Ver servicios por proveedor | Parcial (sin datos reales) | Completo con detalle |
| Subir relación del proveedor | No | Excel/CSV con parser |
| Conciliación automática | No | Match fuzzy + resolución |
| Auditoría servicio a servicio | No | Vista detallada con estatus |
| Inventario de candados | No | Tabla con seriales y estado |
| Costo de renta gadgets | No | Registro mensual |
| P&L gadgets (ingreso vs costo) | No | Dashboard con margen |
| Cortes semanales/mensuales | Solo borrador manual | Generación + conciliación |

Propongo implementar en el orden Fase 1 → 2 → 3 → 4 para construir sobre bases sólidas. Fase 1+2 se pueden hacer en una iteración, Fase 3 es la más compleja por el parser y matching.

