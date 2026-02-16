

# StarMap Dashboard Ejecutivo: Analisis de Viabilidad por KPI

## Resumen

El documento define 30 KPIs organizados en 6 pilares + 1 North Star (SCNV). Tras analizar exhaustivamente las tablas del sistema actual, el resultado es:

- **Calculables hoy (con datos existentes):** 14 KPIs
- **Parcialmente calculables (datos incompletos o proxy):** 8 KPIs
- **No calculables (sin datos en el sistema):** 8 KPIs

---

## North Star: SCNV (Servicios Completados Netos Validados)

| Requisito del documento | Dato disponible | Estado |
|---|---|---|
| Estado final = COMPLETED | `servicios_custodia.estado` + `servicios_planificados.estado_planeacion` | PARCIAL - no hay estado canonico unificado "COMPLETED" vs "finalizado"/"Finalizado" |
| SLA minimo OK | No existe campo `sla_ok` ni tabla de SLAs por tipo | NO |
| Evidencia completa OK | `checklist_servicio` tiene items + firma, pero no hay flag `evidencia_ok` computado | PARCIAL |
| Cierre administrativo OK | No existe campo `cierre_ok` ni validacion formal | NO |
| Sin incidente critico atribuible | No existe tabla de incidentes con taxonomia cerrada ni flag `critico_atribuible` | NO |

**Veredicto SCNV: NO calculable como lo define el documento.** Se puede construir una version "proxy" contando servicios finalizados con checklist completo y firma, pero no cumple la definicion formal.

---

## PILAR 1 -- GTM / Growth (12 KPIs)

| KPI | Nombre | Calculable? | Fuente actual | Brecha |
|---|---|---|---|---|
| M1 | Solicitudes Operables (#) | NO | `crm_deals` tiene deals de Pipedrive pero no hay concepto "solicitud operable" con checklist de campos minimos | No existe status OPERABLE ni validacion de campos |
| M2 | SQL a Operable Rate (%) | NO | No hay etapa SQL ni OPERABLE en `crm_deals` | Sin taxonomia de funnel pre-deal |
| M3 | Fit Rate (%) | NO | No hay tabla de cobertura ni reglas serviceable | Sin datos de capacidad vs demanda por zona |
| M4 | Costo por Solicitud Operable ($) | PARCIAL | `gastos_externos` tiene gastos de marketing con `canal_reclutamiento` | Pero se refiere a reclutamiento de custodios, no a costo por solicitud comercial |
| M5 | Lead Response Time (min) | NO | No hay `lead_created_ts` ni `first_contact_ts` | CRM no registra timestamps de primer contacto |
| S1 | Plan Rate (%) | PARCIAL | `crm_deals.status` (won/lost/open) + `servicios_planificados` | Se puede aproximar: deals won que tienen servicios planificados |
| S2 | Quote Turnaround Time (h) | NO | No hay `quote_sent_ts` ni `operable_ts` | CRM no tiene timestamps de cotizacion |
| S3 | Win Rate (%) | SI | `crm_deals.status` won vs total quoted | Calculable con `crm_deals` agrupando por status |
| S4 | Forecast Accuracy (%) | PARCIAL | `forecast_accuracy_history` + `forecast_config` existen | Tabla existe pero necesita validar si tiene datos poblados |
| S5 | Deals fuera de politica (#) | NO | No hay `approval_id`, `risk_score`, ni reglas de margen | Sin infraestructura de politica de pricing |
| S6 | Risk-Adjusted GM (%) | NO | No hay `Exposure_Index` ni `costo_riesgo` | Sin modelo de riesgo financiero |
| S7 | Solicitudes completas (%) | NO | No hay validacion de campos obligatorios en solicitudes | Sin checklist de completitud |

**Pilar 1: 1 calculable, 2 parciales, 9 no calculables.** El CRM (Pipedrive sync) tiene datos basicos de deals pero carece de timestamps granulares y taxonomia de funnel.

---

## PILAR 2 -- Tech y Producto (4 KPIs)

| KPI | Nombre | Calculable? | Fuente actual | Brecha |
|---|---|---|---|---|
| TP1 | E2E Traceability Rate (%) | PARCIAL | Se puede verificar si un `id_servicio` existe en ambas tablas + checklist + factura | No hay join key a CRM deal_id ni flag formal |
| TP2 | Timestamp Completeness (%) | PARCIAL | `servicios_planificados` tiene: created_at, fecha_asignacion, fecha_confirmacion, hora_inicio_real, hora_fin_real | Faltan: operable_ts, quote_sent_ts, won_ts, closed_ok_ts |
| TP7 | Evidence Capture Pass Rate (%) | SI | `checklist_servicio` con firma + items + fotos | Calculable: checklists completos vs servicios finalizados |
| TP9 | Critical Integration Reliability (%) | NO | No hay logs de integracion ni reconciliacion | Sin infraestructura de monitoreo de integraciones |

**Pilar 2: 1 calculable, 2 parciales, 1 no calculable.**

---

## PILAR 3 -- Ops / Planeacion + Supply (8 KPIs)

| KPI | Nombre | Calculable? | Fuente actual | Brecha |
|---|---|---|---|---|
| O1 | Fill Rate E2E (%) | SI | `servicios_planificados` con `custodio_asignado` not null + `armado_asignado` si `requiere_armado` | Calculable: asignados completos / planificados |
| O2 | Confirm Rate (%) | SI | `estado_confirmacion_custodio` en `servicios_planificados` | Confirmados / Asignados |
| O3 | No-Show Rate (%) | PARCIAL | `hora_presentacion` en `servicios_custodia` (si null = no-show?) | No hay flag explicito de no-show |
| O4 | Time to Assign (min) | SI | `fecha_asignacion - created_at` en `servicios_planificados` | Calculable directamente |
| O5 | Coverage Index (ratio) | PARCIAL | `custodios_operativos` (activos/disponibles) vs `servicios_planificados` (demanda) | Se puede aproximar por zona pero no hay tabla formal de capacidad neta |
| O6 | Activacion de base (#/semana) | SI | `custodios_operativos.created_at` o `custodio_liberacion` | Nuevos activos por semana |
| O7 | Document Compliance (%) | SI | `documentos_custodio` con fechas de vigencia | Ya existe logica en perfiles operativos |
| O8 | Rechazos por falta de capacidad (#) | PARCIAL | `custodio_rechazos` existe | Pero no diferencia razon "falta capacidad" vs otras |

**Pilar 3: 5 calculables, 3 parciales. El pilar mas fuerte del sistema.**

---

## PILAR 4 -- Ops / C4 + Operacion (6 KPIs)

| KPI | Nombre | Calculable? | Fuente actual | Brecha |
|---|---|---|---|---|
| C1 | Check-in Compliance (%) | SI | `checklist_servicio` completados vs servicios totales | Calculable |
| C2 | Time to Acknowledge (min) | NO | No hay tabla de alertas con `ack_ts` | Sin sistema de alertas C4 en Supabase |
| C3 | Time to Validate (min) | NO | No hay `validate_ts` | Sin workflow de validacion |
| C4 | Time to Escalate (min) | NO | No hay `escalate_ts` | Sin workflow de escalamiento |
| C5 | Close Quality Rate (%) | PARCIAL | Se puede inferir de checklists con firma + items completos | No hay campo `cierre_ok` formal |
| C6 | Rework Rate (%) | NO | No hay concepto de "retrabajo" registrado | Sin datos |

**Pilar 4: 1 calculable, 1 parcial, 4 no calculables.** El sistema C4/monitoreo no esta instrumentado en Supabase.

---

## PILAR 5 -- Seguridad / Riesgo (4 KPIs)

| KPI | Nombre | Calculable? | Fuente actual | Brecha |
|---|---|---|---|---|
| R1 | Incident Rate x1,000 | NO | `incidentes_rrss` existe pero es para redes sociales, no incidentes operativos | Sin tabla de incidentes de seguridad |
| R2 | Critical Attributable Rate (%) | NO | Sin taxonomia de incidentes | Sin datos |
| R3 | Exposure Score (puntos) | NO | `analisis_riesgo` existe pero es por servicio individual, no scoring de exposicion | Sin modelo de exposicion |
| R4 | Control Effectiveness (%) | NO | Sin datos de mitigantes ni controles | Sin datos |

**Pilar 5: 0 calculables.** Este pilar requiere infraestructura completamente nueva.

---

## PILAR 6 -- Finanzas + CS (5 KPIs)

| KPI | Nombre | Calculable? | Fuente actual | Brecha |
|---|---|---|---|---|
| F1 | GM por servicio ($ y %) | PARCIAL | `cobro_cliente` (ingreso) y `costo_custodio` en `servicios_custodia` | Falta costo de armado, casetas reales, overhead |
| F2 | CPS - Costo por servicio ($) | PARCIAL | `costo_custodio` + `casetas` disponibles | Incompleto: falta overhead, armado externo, gadgets |
| F3 | Leakage ($) | NO | No hay concepto de "fuga" registrado | Sin datos de descuentos, ajustes, servicios no facturados |
| F4 | Retencion / NRR / Churn | SI | `cs_health_scores`, `cs_quejas`, servicios por cliente historico | El modulo CS ya calcula esto |
| F5 | DSO (Days Sales Outstanding) | SI | `facturas.fecha_emision` + `fecha_pago` | Calculable con datos de facturacion |

**Pilar 6: 2 calculables, 2 parciales, 1 no calculable.**

---

## Resumen Consolidado

```text
                          CALC.  PARCIAL  NO CALC.  TOTAL
North Star (SCNV)           0       1        0        1
Pilar 1 - GTM              1       2        9       12
Pilar 2 - Tech/Producto    1       2        1        4
Pilar 3 - Ops/Supply       5       3        0        8
Pilar 4 - C4/Operacion     1       1        4        6
Pilar 5 - Seguridad        0       0        4        4
Pilar 6 - Finanzas+CS      2       2        1        5
                          ---     ---      ---      ---
TOTAL                      10       11       19       40*
```

(*incluye SCNV como KPI separado + los sub-criterios de TP)

**De los 30 KPIs del documento:** ~14 son calculables o parcialmente calculables con datos reales, ~16 no tienen datos.

---

## Propuesta: Que construir hoy

### Fase 1 - Dashboard StarMap con datos reales (lo que SI tenemos)

Construir un nuevo modulo `/starmap` dentro del dashboard ejecutivo con:

1. **Visualizacion de estrella de 5 puntas** (SVG interactivo) con la North Star al centro
2. **Score por pilar** basado en los KPIs que SI podemos calcular
3. **Semaforo verde/amarillo/rojo** por KPI usando los umbrales del documento
4. **Indicador de cobertura** por pilar (cuantos KPIs se pueden medir vs total)

KPIs a instrumentar inmediatamente:

| Pilar | KPIs instrumentables | Datos |
|---|---|---|
| GTM | S3 (Win Rate) | crm_deals |
| Tech | TP7 (Evidence Pass Rate) | checklist_servicio |
| Ops/Supply | O1, O2, O4, O6, O7 (Fill, Confirm, Assign Time, Activacion, Docs) | servicios_planificados + custodios |
| C4 | C1 (Check-in Compliance) | checklist_servicio |
| Finanzas | F4 (Retencion), F5 (DSO) | cs_health_scores + facturas |

### Fase 2 - KPIs parciales con proxy

Agregar los 8 KPIs parciales con indicador visual de "dato aproximado" y nota de que campos faltan para completarlos.

### Fase 3 - Roadmap de instrumentacion

Panel de "Data Health" que muestre que KPIs faltan y que tablas/campos se necesitan crear para habilitarlos.

---

## Cambios tecnicos

1. **Nueva ruta:** `/starmap` accesible desde el dashboard ejecutivo
2. **Nuevo hook:** `useStarMapKPIs` que ejecuta las queries para los ~14 KPIs calculables
3. **Componentes nuevos:**
   - `StarMapVisualization` - SVG de estrella de 5 puntas interactiva
   - `PillarDetailPanel` - Panel expandible por pilar con KPIs y semaforos
   - `KPICoverageIndicator` - Indicador de cuantos KPIs se pueden medir por pilar
   - `DataHealthRoadmap` - Tabla de KPIs faltantes con requisitos de datos
4. **Integracion:** Link desde `ExecutiveDashboard` al StarMap

No se requieren migraciones de base de datos para Fase 1; se usa exclusivamente datos existentes.

