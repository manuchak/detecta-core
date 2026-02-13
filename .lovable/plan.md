

## Aditamento: Tableros Customer-Centric y Funnel de Fidelidad

Este plan NO sustituye el plan aprobado previamente (SLAs, wizard, timeline, alertas de riesgo). Es una capa adicional que transforma el modulo CS de un sistema reactivo de quejas a una plataforma proactiva de fidelizacion y retencion, basada en la filosofia del Customer Loyalty Ladder.

---

### Filosofia Customer-Centric: El Loyalty Ladder

El marco teorico que guia esta implementacion es el **Customer Loyalty Ladder** (Prospect - Customer - Client - Advocate), adaptado al contexto de servicios de custodia B2B:

```text
EMBAJADOR    -- Refiere activamente nuevos clientes, co-crea mejoras
PROMOTOR     -- CSAT consistente >=4.5, NPS positivo, acepta testimoniales
LEAL         -- Recurrencia >6 meses, sin quejas abiertas, touchpoints regulares  
ACTIVO       -- Usa el servicio, relacion transaccional basica
EN RIESGO    -- Quejas abiertas, CSAT bajo, servicios decrecientes
NUEVO        -- Primer mes de servicios, requiere onboarding
```

Cada cliente recibe un badge automatico basado en datos operativos reales. El objetivo del equipo CS es mover clientes hacia arriba en el ladder, no solo resolver quejas.

### Datos Reales Disponibles

La base de datos ya tiene informacion rica para alimentar este sistema sin input manual:

- **78 clientes activos** en `pc_clientes`
- **Historial de servicios** en `servicios_custodia` (top: COMARKET $29M GMV, ASTRA ZENECA 3,939 servicios)
- **GMV por cliente** calculable desde `cobro_cliente`
- **Tendencia de volumen** (servicios mes actual vs. anterior)
- **Quejas y CSAT** desde `cs_quejas`
- **Touchpoints** desde `cs_touchpoints`
- **CAPAs** desde `cs_capa`

---

### Componente 1: Loyalty Funnel Visual (CSLoyaltyFunnel)

Un funnel horizontal inspirado en el `useEnhancedConversionFunnel` existente, pero para fidelidad:

```text
+-------+--------+-------+----------+-----------+
| NUEVO | ACTIVO | LEAL  | PROMOTOR | EMBAJADOR |
|  12   |   38   |  20   |    6     |     2     |
+-------+--------+-------+----------+-----------+
  15%      49%     26%       8%          3%
```

**Reglas de clasificacion (calculadas automaticamente):**

| Etapa | Criterios |
|---|---|
| Nuevo | Primer servicio hace menos de 60 dias |
| Activo | Tiene servicios en los ultimos 60 dias, no cumple criterios superiores |
| Leal | Servicios recurrentes >6 meses, 0 quejas abiertas, contacto en ultimos 30 dias |
| Promotor | Todo lo de Leal + CSAT promedio >=4.5 + 0 CAPAs pendientes |
| Embajador | Todo lo de Promotor + flag manual `es_embajador` (referidos verificados, testimonial, caso de exito) |

El funnel muestra barras proporcionales con colores del sistema de badges, click en cada etapa filtra la lista de clientes.

### Componente 2: Badges de Fidelidad (CSLoyaltyBadge)

Badges visuales que aparecen junto al nombre del cliente en toda la plataforma:

| Badge | Icono | Color | Significado |
|---|---|---|---|
| Nuevo | Sparkles | Azul | Recien incorporado, necesita atencion de onboarding |
| Activo | Activity | Gris | Relacion transaccional, hay oportunidad de profundizar |
| Leal | Shield | Verde | Cliente estable y satisfecho |
| Promotor | Star | Dorado | Alta satisfaccion, potencial para referir |
| Embajador | Crown | Morado | Refiere, co-crea, caso de exito |
| En Riesgo | AlertTriangle | Rojo | Requiere intervencion inmediata |

Se integra en: `CSClientesList`, `CSQuejaDetail`, `CSDashboard`, y potencialmente en el Dashboard Ejecutivo (`TopClientsMTD`).

### Componente 3: Dashboard de Retencion (CSRetentionDashboard)

Un tablero estilo ejecutivo (similar al `ExecutiveKPIsBar`) con metricas customer-centric:

**Fila 1 - KPIs Hero (6 cards estilo Looker):**

| KPI | Calculo | Fuente |
|---|---|---|
| Net Retention Rate | (GMV mes actual de clientes existentes / GMV mismo mes anterior) x 100 | `servicios_custodia` |
| Churn Rate | Clientes sin servicios en 60+ dias / Total clientes activos | `servicios_custodia` + `pc_clientes` |
| CSAT Promedio | Promedio de `calificacion_cierre` del mes | `cs_quejas` |
| Health Score Global | Promedio ponderado de health scores individuales | Calculado |
| Dias Promedio Sin Contacto | Promedio de dias desde ultimo touchpoint por cliente | `cs_touchpoints` |
| % Clientes Leales+ | (Leal + Promotor + Embajador) / Total | Calculado del funnel |

**Fila 2 - Visualizaciones (grid 2 columnas):**

- **Izquierda: Distribucion del Loyalty Ladder** (donut chart con los 6 segmentos)
- **Derecha: Tendencia de Retencion** (area chart 6 meses: clientes activos, nuevos, churned)

**Fila 3 - Tablas operativas (grid 2 columnas):**

- **Izquierda: Clientes Top por GMV** (reutiliza patron de `TopClientsMTD` pero con badge de fidelidad y tendencia)
- **Derecha: Clientes que Requieren Atencion** (en riesgo, sin contacto >30d, CSAT <3, con CAPAs abiertas)

### Componente 4: Perfil de Cliente Enriquecido (CSClienteProfile mejorado)

Cuando se hace click en un cliente de la lista, se abre un perfil completo:

```text
+----------------------------------------------------------+
| [Badge Leal] ASTRA ZENECA               Health: 82/100   |
|----------------------------------------------------------|
| Lifetime: 3,939 servicios | GMV: $23.4M | Desde: Ene 2023|
|----------------------------------------------------------|
| [Servicios]  [Quejas]  [Touchpoints]  [CAPA]  [Notas]   |
|----------------------------------------------------------|
| Tendencia GMV (sparkline 12 meses)                       |
| Historial de touchpoints (timeline)                      |
| Quejas abiertas (lista compacta)                         |
+----------------------------------------------------------+
```

Datos calculados desde `servicios_custodia` cruzando `nombre_cliente` con `pc_clientes.nombre_comercial`.

### Componente 5: Playbooks de Accion por Etapa

En el Dashboard, incluir una seccion "Siguiente Mejor Accion" que sugiere acciones basadas en la etapa del cliente:

| Etapa | Accion Sugerida |
|---|---|
| Nuevo | "Programar llamada de onboarding — verificar que el servicio cumplio expectativas" |
| Activo | "Agendar QBR (Quarterly Business Review) — explorar oportunidades de expansion" |
| En Riesgo | "Contactar en 24h — identificar causa de insatisfaccion y crear plan de recuperacion" |
| Leal | "Enviar encuesta NPS — evaluar potencial de referido" |
| Promotor | "Invitar a programa de referidos — solicitar testimonial o caso de exito" |

Estos playbooks se muestran como cards con boton de "Ejecutar" que crea un touchpoint pre-llenado.

---

### Nuevo Campo en Base de Datos

Se necesita agregar un campo a `pc_clientes`:

| Columna | Tipo | Descripcion |
|---|---|---|
| es_embajador | boolean DEFAULT false | Flag manual para clientes que refieren activamente |
| notas_fidelidad | text | Notas libres sobre la relacion (testimonial, caso de exito, etc.) |
| fecha_primer_servicio | date | Cache del primer servicio (calculado una vez) |

Alternativamente, se puede calcular `es_embajador` desde un touchpoint tipo "referido_confirmado", evitando modificar `pc_clientes`.

---

### Arquitectura Tecnica

**Archivos a crear:**

| Archivo | Proposito |
|---|---|
| `src/hooks/useCSLoyaltyFunnel.ts` | Calcula la clasificacion de cada cliente en el Loyalty Ladder cruzando datos de `pc_clientes`, `servicios_custodia`, `cs_quejas`, `cs_touchpoints` |
| `src/hooks/useCSRetentionMetrics.ts` | Calcula Net Retention Rate, Churn Rate, y tendencias de retencion |
| `src/hooks/useCSClienteProfile.ts` | Agrega datos de un cliente especifico: GMV lifetime, servicios, tendencia |
| `src/pages/CustomerSuccess/components/CSLoyaltyFunnel.tsx` | Visualizacion del funnel horizontal con barras proporcionales |
| `src/pages/CustomerSuccess/components/CSLoyaltyBadge.tsx` | Componente badge reutilizable |
| `src/pages/CustomerSuccess/components/CSRetentionDashboard.tsx` | Tablero de retencion estilo ejecutivo |
| `src/pages/CustomerSuccess/components/CSClienteProfileModal.tsx` | Modal con perfil enriquecido del cliente |
| `src/pages/CustomerSuccess/components/CSPlaybooks.tsx` | Sugerencias de accion por etapa |
| `src/pages/CustomerSuccess/components/CSClientesAtRisk.tsx` | Tabla de clientes que requieren atencion inmediata |

**Archivos a modificar:**

| Archivo | Cambio |
|---|---|
| `CustomerSuccessPage.tsx` | Agregar tab "Retencion" entre Dashboard y Quejas |
| `CSDashboard.tsx` | Integrar el Loyalty Funnel como hero visual + playbooks |
| `CSClientesList.tsx` | Agregar badge de fidelidad a cada fila + click abre perfil modal |
| `useCSHealthScores.ts` | Integrar datos de servicios en el calculo del health score |

**Migracion SQL:**

| Cambio | Detalle |
|---|---|
| `ALTER TABLE pc_clientes ADD COLUMN es_embajador boolean DEFAULT false` | Flag para embajadores confirmados |
| `ALTER TABLE pc_clientes ADD COLUMN notas_fidelidad text` | Notas de relacion |
| Actualizar RLS de `pc_clientes` | Permitir a `customer_success` actualizar `es_embajador` y `notas_fidelidad` |

### Estructura Final de Tabs

```text
[Dashboard]  [Retencion]  [Quejas]  [Clientes]  [CAPA]  [Mejora Continua]
```

- **Dashboard**: KPIs de quejas + Loyalty Funnel + Playbooks (vista operativa diaria)
- **Retencion** (NUEVO): Metricas de retencion, churn, NRR, clientes top, clientes en riesgo (vista estrategica mensual)
- **Quejas**: Sin cambios
- **Clientes**: Ahora con badges de fidelidad + click abre perfil enriquecido
- **CAPA**: Sin cambios
- **Mejora Continua**: Sin cambios

### Orden de Implementacion

1. **Hook `useCSLoyaltyFunnel`** — logica central de clasificacion (sin UI aun)
2. **`CSLoyaltyBadge`** — componente visual reutilizable
3. **`CSLoyaltyFunnel`** — visualizacion del funnel en Dashboard
4. **Migracion SQL** — campos `es_embajador` y `notas_fidelidad`
5. **`useCSRetentionMetrics` + `CSRetentionDashboard`** — tab de Retencion completo
6. **`useCSClienteProfile` + `CSClienteProfileModal`** — perfil enriquecido
7. **`CSPlaybooks`** — acciones sugeridas por etapa
8. **Integracion** — badges en CSClientesList, Dashboard, y CustomerSuccessPage

