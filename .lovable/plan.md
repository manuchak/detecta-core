

# Plan: Mejoras al Sistema de Facturacion - Feedback del CFO

## Resumen del Feedback (9 puntos de Facturacion + 3 de Cuentas por Pagar)

El CFO (Emanuel Varela) identifico brechas criticas entre el sistema actual y las necesidades reales del equipo de finanzas. A continuacion se presenta el analisis de cada punto, su estado actual en el sistema, y el plan de accion.

---

## Analisis Punto por Punto

### PUNTO 1: Fecha de Servicio = Fecha del Dia Prestado
**Problema**: El servicio debe fecharse el dia que se presto, no dias posteriores, porque causa problemas al facturar.

**Estado actual**: La vista `vw_servicios_facturacion` usa `fecha_hora_cita` como fecha ancla. Sin embargo, no hay validacion que impida registrar servicios con fechas posteriores al dia real del servicio. En la creacion de servicios desde Planeacion, se permite cualquier fecha.

**Solucion**: Agregar validacion en el flujo de cierre de servicio para que la fecha de finalizacion sea coherente con la fecha de cita. Mostrar alertas en la tab "Por Facturar" cuando hay discrepancias de fechas.

---

### PUNTO 2: Cierre de Viajes Oportuno
**Problema**: Los viajes deben cerrarse a tiempo. Un cierre tardio hace que el servicio no se facture en la fecha correcta, causando alargamiento de dias de cobro.

**Estado actual**: No existe columna `fecha_cierre` en `servicios_custodia`. El estado cambia a "Finalizado" pero no se registra cuando se cerro formalmente. Tampoco hay alertas de servicios sin cerrar.

**Solucion**: 
- Agregar columna `fecha_cierre` a `servicios_custodia`
- Crear un indicador en el dashboard de Facturacion que muestre servicios finalizados sin cierre formal
- Agregar alerta de "servicios sin cerrar" con mas de X dias desde la fecha de cita

---

### PUNTO 3: Puntos de Inicio y Final Correctos (Rutas)
**Problema**: Los puntos de inicio (P.Inicio) y final se toman con datos erroneos. Antes en Excel se verificaban y corregian manualmente.

**Estado actual**: La vista muestra `origen` y `destino` de `servicios_custodia`, que viene del campo de texto libre. El sistema de `matriz_precios_rutas` tiene `origen_texto` y `destino_texto` estandarizados, pero no siempre coinciden con lo que se registra en ejecucion.

**Solucion**: 
- Agregar capacidad de edicion de origen/destino en el detalle del servicio de facturacion
- Mostrar comparativa entre ruta planeada vs ruta ejecutada
- Flag visual cuando origen/destino no coinciden con la matriz de precios

---

### PUNTO 4: Retroactivo de 1 Ano Minimo
**Problema**: Necesitan datos historicos de al menos 1 ano.

**Estado actual**: La base de datos tiene registros desde 2023-01-01 hasta 2026-02-08 (33,026 servicios finalizados). Sin embargo, el filtro de fechas en FacturacionHub solo muestra el mes actual por defecto y el limit del query es de 1,000 registros.

**Solucion**:
- Aumentar el limit del query de `vw_servicios_facturacion` (o paginar)
- Agregar filtros rapidos para periodos largos (3 meses, 6 meses, 1 ano)
- Asegurar que el dashboard pueda procesar periodos largos sin degradar rendimiento

---

### PUNTO 5: Timeline Operativo Completo + Detenciones + Estadias
**Problema**: En el dashboard de viajes falta el Timeline Operativo (Horario de Presentacion y Arribo). Falta ver detalle de detenciones para calcular estadias (saber que tipo de detencion para determinar que pagar al custodio y que cobrar al cliente).

**Estado actual**: El `ServicioDetalleDialog` ya muestra Timeline Operativo con: Fecha Cita, Presentacion, Inicio, Arribo, Fin, Duracion y Retraso. Sin embargo:
- NO existe tabla de detenciones
- NO existe registro de estadias
- Las casetas son un campo de texto libre
- No hay calculo de estadias automatico

**Solucion**:
- Crear tabla `detenciones_servicio` (servicio_id, tipo_detencion, hora_inicio, hora_fin, duracion, motivo, cobrable_cliente, pagable_custodio)
- Crear tabla `estadias_servicio` para registrar estadias con tipo y montos
- Agregar seccion de detenciones/estadias al detalle del servicio
- Incluir las estadias en el calculo de facturacion

---

### PUNTO 6: Horas Cortesia Diferenciadas por Cliente
**Problema**: Cada cliente tiene diferentes horas de cortesia. Si se automatiza, hay que tener el detalle por cliente.

**Estado actual**: No existe campo `horas_cortesia` en `pc_clientes` ni en `matriz_precios_rutas`. Este es un concepto completamente ausente del sistema.

**Solucion**:
- Agregar columna `horas_cortesia` (decimal) a `pc_clientes`
- Opcionalmente agregar `horas_cortesia` a `matriz_precios_rutas` para override por ruta
- Usar las horas de cortesia en el calculo de estadias: si la estadia es menor a las horas de cortesia del cliente, no se cobra

---

### PUNTO 7: Pernocta
**Problema**: Se debe registrar si el cliente paga o no la pernocta. Esto debe calcularse automaticamente y reflejarse en reportes de pago a custodios y facturacion a clientes.

**Estado actual**: No existe campo `pernocta` en ninguna tabla. No hay logica de calculo de pernocta.

**Solucion**:
- Agregar columna `pernocta_aplica` (boolean) y `pernocta_pagada_cliente` (boolean) a nivel de servicio o ruta
- Agregar `costo_pernocta` y `cobro_pernocta_cliente` a `pc_clientes` o `matriz_precios_rutas`
- Incluir pernocta en calculos financieros del servicio

---

### PUNTO 8: Evidencias (Estadias, Casetas, Hoteles)
**Problema**: Las evidencias de gastos (estadias, casetas, hoteles) deben estar correctamente cargadas.

**Estado actual**: El campo `casetas` en `servicios_custodia` es texto libre. No hay tabla para adjuntar evidencias de gastos por servicio. Existe `evidencias_instalacion` pero es para otro flujo.

**Solucion**:
- Crear tabla `evidencias_gastos_servicio` (servicio_id, tipo: 'caseta'|'estadia'|'hotel'|'otro', monto, archivo_url, descripcion, verificado)
- Agregar seccion de evidencias al detalle del servicio en facturacion
- Convertir `casetas` de texto a datos estructurados

---

### PUNTO 9: Tipos de Factura y Politica de Credito
**Problema**: 
- Hay dos tipos: Inmediatas y con Fecha de Corte
- Los dias de credito cuentan desde que se factura/carga al portal/emite OC, NO desde la finalizacion del servicio
- La mayoria se factura entre dia 2 y 15 post-finalizacion
- Clientes criticos (Casa Tradicion, Cantabria, Siegfried, Procesos Especializados, Olga) pueden tardar hasta 50 dias

**Estado actual**: 
- La tabla `facturas` no tiene campo `tipo_factura` (inmediata vs fecha de corte)
- No hay campo `orden_compra` 
- Los dias de credito en `pc_clientes` existen pero no distinguen el inicio del conteo
- No hay tracking de demora entre finalizacion y emision de factura

**Solucion**:
- Agregar `tipo_factura` ('inmediata', 'corte') a `facturas`
- Agregar `orden_compra` a `facturas`
- Agregar `dias_max_facturacion` a `pc_clientes` (maximo dias para emitir factura post-servicio)
- Calcular y mostrar "dias sin facturar" para servicios finalizados
- Crear alertas por cliente cuando se acerca el limite de facturacion

---

### CxP PUNTO 1: Gastos Extraordinarios
**Problema**: Donde van los gastos extraordinarios?

**Estado actual**: Existe tabla `gastos_externos` pero esta orientada a reclutamiento (tiene campos como `canal_reclutamiento`, `custodios_objetivo`). No hay vinculacion a servicios de custodia.

**Solucion**: Crear tabla o adaptar para vincular gastos extraordinarios a servicios especificos.

---

### CxP PUNTO 2: Incidencias de Facturacion
**Problema**: Idem a facturacion, donde se registran las incidencias?

**Estado actual**: No existe tabla de incidencias de facturacion.

**Solucion**: Crear tabla `incidencias_facturacion` para registrar discrepancias, ajustes, notas de credito, etc.

---

### CxP PUNTO 3: Pago de Armados
**Problema**: Como se gestionan los pagos a proveedores de armados?

**Estado actual**: Existe `proveedor` como campo texto en servicios. No hay modulo de cuentas por pagar a proveedores.

**Solucion**: Este es un modulo completo de Cuentas por Pagar que requiere planificacion separada.

---

## Priorizacion Propuesta

Dado el volumen de cambios, se propone implementar en fases:

### Fase 1 - Datos Maestros y Configuracion de Clientes (Impacto inmediato)
Cambios en base de datos y UI para habilitar la informacion que necesita finanzas.

| Cambio | Tipo | Tabla |
|--------|------|-------|
| Agregar `horas_cortesia` | ALTER TABLE | `pc_clientes` |
| Agregar `pernocta_tarifa`, `cobra_pernocta` | ALTER TABLE | `pc_clientes` |
| Agregar `dias_max_facturacion` | ALTER TABLE | `pc_clientes` |
| Agregar `tipo_facturacion` (inmediata/corte) | ALTER TABLE | `pc_clientes` |
| UI: Editar estos campos en GestionClientesTab | Modificar | `ClienteFormModal.tsx` |
| UI: Mostrar horas cortesia y config en tabla | Modificar | `GestionClientesTab.tsx` |

### Fase 2 - Mejoras a Servicios y Facturacion (Core billing)
Resolver los problemas de datos en servicios y mejorar el flujo de facturacion.

| Cambio | Tipo | Detalle |
|--------|------|---------|
| Agregar `tipo_factura`, `orden_compra` a facturas | ALTER TABLE | `facturas` |
| Ampliar query limit y agregar filtros de periodo largo | Modificar | `useServiciosFacturacion.ts` |
| Calcular "dias sin facturar" en servicios pendientes | Modificar | `ServiciosPorFacturarTab.tsx` |
| Mostrar alertas de cierre tardio | Nuevo componente | Dashboard |
| Edicion de origen/destino en detalle servicio | Modificar | `ServicioDetalleDialog.tsx` |
| Auto-llenar RFC/email desde `pc_clientes` en factura | Modificar | `GenerarFacturaModal.tsx` |

### Fase 3 - Detenciones, Estadias y Evidencias (Operativo-Financiero)
Crear las tablas y flujos nuevos para el registro de detenciones y evidencias.

| Cambio | Tipo | Detalle |
|--------|------|---------|
| Crear tabla `detenciones_servicio` | CREATE TABLE | Nueva |
| Crear tabla `evidencias_gastos_servicio` | CREATE TABLE | Nueva |
| UI: Registrar detenciones en detalle | Nuevo componente | En ServicioDetalleDialog |
| UI: Subir evidencias (casetas, hoteles) | Nuevo componente | En ServicioDetalleDialog |
| Calculo automatico de estadias vs horas cortesia | Logica | Hook nuevo |

### Fase 4 - CxP y Modulos Avanzados (Planificacion futura)
| Cambio | Tipo |
|--------|------|
| Incidencias de facturacion | Modulo nuevo |
| Gastos extraordinarios vinculados a servicios | Adaptacion |
| Cuentas por pagar a proveedores armados | Modulo nuevo |

---

## Recomendacion

Sugiero comenzar por **Fase 1** ya que son cambios de configuracion con impacto inmediato que permiten al equipo de finanzas empezar a registrar la informacion critica (horas cortesia por cliente, tipo de facturacion, pernocta). Esto desbloquea el trabajo manual mientras construimos las automatizaciones de Fase 2 y 3.

Si estas de acuerdo, puedo comenzar la implementacion de Fase 1 inmediatamente.

