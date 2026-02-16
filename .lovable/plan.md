

# Fase 2 StarMap: 8 KPIs Proxy

## Resumen

Agregar los 8 KPIs parciales al hook `useStarMapKPIs` usando datos proxy de tablas existentes. Cada uno llevara el badge "proxy" ya soportado por la UI.

## Datos verificados en BD

| KPI | Proxy Logic | Datos disponibles |
|---|---|---|
| S1 Plan Rate | deals won con servicios planificados / total won | 78 won deals, 2268 servicios planificados |
| S4 Forecast Accuracy | `forecast_accuracy_history.mape_services` | Tabla existe pero vacia; usar fallback 18.5% |
| O3 No-Show Rate | asignados sin `hora_inicio_real` / total asignados | 848/1900 sin inicio (ultimos 90 dias) |
| O5 Coverage Index | custodios activos / demanda semanal | 108 activos / 214 demanda = 0.50 |
| O8 Rechazos | count de `custodio_rechazos` (90 dias) | 24 rechazos |
| C5 Close Quality | checklists con firma + items / total finalizados | Ya tenemos los datos en la query existente |
| F1 GM por servicio | (cobro_cliente - costo_custodio) / cobro_cliente | 33,846 con cobro, 9,031 con costo (historico) |
| F2 CPS | avg(costo_custodio) | avg $3,058 historico |

## Cambios tecnicos

### 1. `src/hooks/useStarMapKPIs.ts`

**Queries adicionales** (agregar al Promise.all existente):
- `servicios_custodia` con `cobro_cliente, costo_custodio` (ultimos 90 dias) para F1/F2
- `custodio_rechazos` count (ultimos 90 dias) para O8
- `forecast_accuracy_history` latest record para S4

**Calculos nuevos** (despues de las queries):
- **S1**: Proxy simplificado: servicios finalizados / total planificados no-cancelados (usa datos ya cargados)
- **S4**: mape_services del ultimo registro, o fallback 18.5%
- **O3**: (asignados - con hora_inicio_real) / asignados * 100
- **O5**: custodios activos / (demanda semanal normalizada)
- **O8**: count directo de rechazos
- **C5**: checklists con firma Y items_inspeccion / servicios finalizados
- **F1**: avg((cobro - costo) / cobro) * 100
- **F2**: avg(costo_custodio)

**Actualizar definiciones de pilares**: Cambiar los 8 KPIs de `status: 'no-data'` a usar los valores calculados, con `isProxy: true` y `missingFields` indicando que falta para el dato real.

### 2. Umbrales (targets y semaforos)

| KPI | Green | Yellow | Red | Inverted? |
|---|---|---|---|---|
| S1 Plan Rate | >= 80% | >= 60% | < 60% | No |
| S4 Forecast Accuracy (MAPE) | <= 15% | <= 25% | > 25% | Yes (lower better) |
| O3 No-Show Rate | <= 5% | <= 10% | > 10% | Yes (lower better) |
| O5 Coverage Index | >= 1.5 | >= 1.0 | < 1.0 | No |
| O8 Rechazos | <= 5 | <= 15 | > 15 | Yes (lower better) |
| C5 Close Quality | >= 95% | >= 80% | < 80% | No |
| F1 GM | >= 40% | >= 25% | < 25% | No |
| F2 CPS | <= 3000 | <= 4500 | > 4500 | Yes (lower better) |

### 3. Sin cambios en UI

Los componentes `PillarDetailPanel` y `DataHealthSummary` ya soportan el badge "proxy" y el listado de campos faltantes. La cobertura general subira de ~30% a ~60%.

## Impacto esperado

- Cobertura: de 10/30 KPIs medibles a 18/30 (60%)
- Pilares con mejora: GTM (1->2), Ops (5->8), C4 (1->2), Finanzas (2->4)
- Todos los nuevos KPIs mostraran badge "proxy" naranja

