

# Mapa de Casos de Uso: Gestión de Cuentas por Cobrar (AR Management)

## Hallazgo Clave

Los campos `dia_corte` y `dia_pago` existen en `pc_clientes` y se muestran en el formulario de cliente, pero **no se usan en ningún cálculo**. La `fecha_vencimiento` de facturas se captura manualmente. Esto significa que el sistema no refleja la realidad operativa del stakeholder.

---

## Contexto del Stakeholder (Osvaldo)

El problema real: un cliente con "7 días de crédito" facturado el lunes debería pagar el lunes siguiente. Pero si su corte de finanzas es viernes, realmente paga hasta el viernes siguiente (11 días reales). El sistema debe calcular el **vencimiento real** basado en `dia_corte` + `dia_pago`, no solo `dias_credito`.

---

## Mapa de Casos de Uso (basado en mejores prácticas AR)

### UC1: Cálculo Inteligente de Fecha de Vencimiento
**Problema**: `fecha_vencimiento` se pone manualmente; no considera el ciclo fiscal del cliente.
**Solución**: Función utilitaria `calcularFechaVencimientoReal(fechaEmision, cliente)` que:
1. Toma `fecha_emision` y busca el siguiente `dia_corte` del cliente
2. A partir de ese corte, suma hasta el `dia_pago`
3. Si no hay `dia_corte`/`dia_pago`, usa fallback `fecha_emision + dias_credito`

```text
Ejemplo: Factura emitida Lunes 10/Mar, cliente con dia_corte=15, dia_pago=30
→ Siguiente corte: 15/Mar
→ Fecha pago real: 30/Mar (día de pago)
→ El sistema muestra: "Vence 30/Mar (20 días reales)"
```

**Archivo**: Nuevo `src/utils/calcularVencimiento.ts`
**Impacto**: Se usa en `useGenerarFactura.ts` para auto-calcular `fechaVencimiento` al crear factura.

### UC2: Visibilidad del Vencimiento Real vs Nominal
**Problema**: El usuario no sabe si el vencimiento mostrado es el real según el ciclo del cliente.
**Solución**: En la UI de facturación (al generar factura), mostrar:
- Fecha de vencimiento calculada automáticamente (editable por override)
- Tooltip: "Basado en corte día 15, pago día 30 del cliente"
- Badge con días reales de crédito vs días nominales

### UC3: Segmentación de Clientes por Riesgo (ya parcialmente existe)
**Status**: Ya existe `useClienteCreditoAnalisis` con score crediticio. Falta integrar `dia_corte`/`dia_pago` en la lógica de aging para que los buckets de vencimiento consideren el vencimiento real.

### UC4: Agenda de Cobranza Proactiva (pre-vencimiento)
**Status**: Ya existe `AgendaCobranzaPanel` con vencimientos del día y semana.
**Mejora**: Agregar recordatorios pre-vencimiento configurables (ej: 3 días antes del vencimiento, enviar alerta). Esto ya es un patrón estándar en AR: "Send reminder before due date."

### UC5: Escalamiento Automático de Cobranza
**Status**: Ya existe `CobranzaWorkflowTab` con etapas configurables.
**Mejora**: Vincular las etapas de escalamiento al vencimiento real (no nominal), para que el sistema escale correctamente.

### UC6: Promesas de Pago con Seguimiento
**Status**: Ya existe `PromesasPagoPanel` y `PromesaPagoModal`.
**Status**: Funcional, no requiere cambios.

### UC7: Estado de Cuenta Automatizado
**Status**: Ya existe `EstadoCuentaModal`.
**Mejora menor**: Incluir en el estado de cuenta el detalle del ciclo fiscal del cliente (día corte, día pago) para transparencia.

---

## Plan de Implementación (Priorizado)

### Fase 1: Cálculo de Vencimiento Real (Impacto Alto)
1. **Crear `src/utils/calcularVencimiento.ts`** — función pura que dado `fechaEmision`, `diaCorte`, `diaPago`, `diasCredito` retorna `fechaVencimientoReal` y `diasReales`
2. **Modificar UI de generación de factura** — auto-calcular y mostrar la fecha de vencimiento real al seleccionar cliente, con opción de override manual
3. **Agregar tooltip/info en el tab Crédito** del form de cliente explicando cómo se calcula el vencimiento real con sus datos

### Fase 2: Ajuste del Aging al Vencimiento Real
4. **Modificar `useAgendaCobranza`** — usar la función de cálculo real para determinar cuándo realmente vence cada factura (si la factura ya tiene fecha_vencimiento fija, respetarla)

### Archivos a crear/modificar
1. **Crear** `src/utils/calcularVencimiento.ts` — lógica de corte + pago
2. **Modificar** componente de generación de factura (donde se captura `fechaVencimiento`) — auto-fill inteligente
3. **Modificar** tab "Crédito" en `ClienteFormModal.tsx` — agregar explicación visual del ciclo de pago real
4. **Modificar** `useAgendaCobranza.ts` — opcional, para alertas basadas en vencimiento real

