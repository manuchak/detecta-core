

# Fase 3: Roadmap de Instrumentacion Avanzado

## Objetivo

Transformar el panel "Roadmap de Instrumentacion" actual (lista plana de campos faltantes) en un centro de decision ejecutivo que priorice que instrumentar primero segun impacto de negocio vs esfuerzo tecnico.

## Estado actual

El `DataHealthSummary` ya muestra:
- Cobertura general (%) y conteo de KPIs por semaforo
- Barras de cobertura por pilar
- Lista plana de campos faltantes (campo + KPI + pilar)

Lo que falta:
- No hay priorizacion ni agrupacion por esfuerzo
- No se indica el impacto de negocio de cada KPI faltante
- No hay estimacion de que se necesita (campo nuevo vs tabla nueva vs integracion externa)
- No hay vista de "proximos pasos" accionables
- Los KPIs proxy no se distinguen de los no-data en el roadmap

---

## Cambios propuestos

### 1. Nuevo componente: `InstrumentationRoadmap`

Reemplaza la tarjeta derecha del `DataHealthSummary` con un panel mas rico que agrupa los 12 KPIs sin datos + 8 proxy en tres categorias de esfuerzo:

```text
+----------------------------------------------+
| Roadmap de Instrumentacion                    |
|----------------------------------------------|
| [Tab: Quick Wins] [Nuevas Tablas] [Externo]  |
|                                               |
| -- QUICK WINS (campos en tablas existentes) --|
| O3 No-Show Rate          proxy -> real        |
|   Agregar: flag no_show en servicios_plan.    |
|   Impacto: Pilar Ops +12% cobertura          |
|   Esfuerzo: 1 migracion SQL                  |
|                                               |
| C5 Close Quality          proxy -> real       |
|   Agregar: campo cierre_ok en checklist       |
|   Impacto: Pilar C4 +17% cobertura           |
|                                               |
| -- NUEVAS TABLAS / MODULOS -------------------|
| R1-R4 Seguridad (4 KPIs)                     |
|   Crear: tabla incidentes_operativos          |
|   Impacto: Pilar Riesgo de 0% a 100%         |
|   Esfuerzo: Tabla + UI de captura            |
|                                               |
| -- INTEGRACIONES EXTERNAS --------------------|
| M5 Lead Response Time                         |
|   Requiere: timestamps desde Pipedrive       |
|   Impacto: Pilar GTM +12%                    |
+----------------------------------------------+
```

### 2. Metadata enriquecida en cada KPI

Agregar al tipo `StarMapKPI` dos campos opcionales nuevos:

- `instrumentationCategory`: `'quick-win' | 'new-table' | 'external'`  
- `businessImpact`: texto corto describiendo el impacto (ej: "Pilar Ops: 75% -> 88%")

Estos se definen estaticamente en el hook junto a los `missingFields` existentes.

### 3. Clasificacion de los 20 KPIs pendientes

| Categoria | KPIs | Que se necesita |
|---|---|---|
| **Quick Wins** (agregar campo a tabla existente) | O3 (no_show flag), O5 (capacidad_zona), O8 (razon_rechazo), C5 (cierre_ok), F1 (costo_armado, overhead), F2 (overhead), S1 (deal_id join) | 1 migracion SQL cada uno |
| **Nuevas tablas/modulos** | R1-R4 (incidentes_operativos), C2-C4 (alertas_c4 con timestamps), C6 (retrabajo), M1-M2 (solicitudes_operables), F3 (leakage/ajustes) | Tabla + logica + UI |
| **Integraciones externas** | M5 (timestamps Pipedrive), S2 (quote_sent_ts), TP9 (logs integracion), TP1 (join CRM-servicio), TP2 (timestamps completos) | Cambios en webhook/sync |

### 4. Indicador de "Proxy -> Real"

Para los 8 KPIs proxy, mostrar un badge especial "proxy -> real" con el campo especifico que convertiria el dato proxy en dato real. Esto da visibilidad de que ya tenemos algo pero se puede mejorar.

### 5. Score de prioridad

Cada KPI faltante recibe un score de prioridad calculado:
- **Impacto**: cuantos puntos porcentuales sube la cobertura del pilar (+peso del pilar)
- **Esfuerzo**: quick-win=1, new-table=3, external=5
- **Prioridad** = Impacto / Esfuerzo

Esto permite ordenar automaticamente el roadmap por ROI de instrumentacion.

---

## Detalle tecnico

### Archivos a modificar

1. **`src/hooks/useStarMapKPIs.ts`**
   - Agregar `instrumentationCategory` y `businessImpact` al tipo `StarMapKPI`
   - Poblar estos campos en las definiciones de los 20 KPIs pendientes/proxy

2. **`src/components/starmap/InstrumentationRoadmap.tsx`** (nuevo)
   - Componente con 3 tabs (Quick Wins / Nuevas Tablas / Externo)
   - Cada item muestra: KPI id, nombre, campos requeridos, impacto estimado, badge proxy/no-data
   - Barra de progreso por categoria
   - Score de prioridad ordenable

3. **`src/components/starmap/DataHealthSummary.tsx`**
   - Reemplazar la tarjeta derecha "Roadmap de Instrumentacion" por el nuevo `InstrumentationRoadmap`
   - Mantener la tarjeta izquierda de cobertura sin cambios

### Sin cambios en BD

Todo es metadata estatica definida en el hook. No requiere migraciones.

