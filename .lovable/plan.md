
# Plan: Mejora UX/UI del CRM Hub - Vision Cross-Functional

## Resumen Ejecutivo

Transformar el CRM Hub de una herramienta operacional de seguimiento a un **centro de inteligencia comercial** que conecte el embudo de ventas con la capacidad operativa (Supply) y la distribución geográfica de demanda. El objetivo es que cualquier stakeholder (CEO, Head of Sales, Head of Operations, Head of Product) pueda tomar decisiones informadas sin necesidad de cruzar datos manualmente.

---

## Diagnostico Actual

### Fortalezas
- Integración funcional con Pipedrive (webhook + sync)
- Kanban de pipeline operativo
- Lógica de client-matching con servicios_custodia

### Debilidades Criticas

| Problema | Impacto |
|----------|---------|
| Planitud Visual | Todos los deals lucen iguales; un deal de $500K no se distingue de uno de $0 |
| Sin Contexto Temporal | No hay indicadores de deals "estancados" que superen el tiempo promedio en etapa |
| Desconexion Geografica | No se puede ver donde se concentra la demanda comercial vs. donde hay supply |
| Metricas sin Benchmark | Pipeline total sin comparacion vs. mes anterior o metas |
| Sin Flujo Visual | No se entiende como fluyen los leads desde origen hasta cierre |

---

## Arquitectura de Mejoras

```text
+------------------------------------------------------------------+
|                        CRM HUB MEJORADO                          |
+------------------------------------------------------------------+
|                                                                  |
|  CAPA 1: PIPELINE INTELIGENTE (Kanban Mejorado)                  |
|  ├─ Jerarquia visual por valor del deal                          |
|  ├─ Badges de "Stalled" para deals estancados                    |
|  ├─ Indicador de match confidence prominente                     |
|  └─ Quick actions (ver detalle, editar, cambiar etapa)           |
|                                                                  |
|  CAPA 2: METRICAS CON CONTEXTO                                   |
|  ├─ Tendencias vs. mes anterior (flechas verde/rojo)             |
|  ├─ Progreso vs. meta mensual (barra de progreso)                |
|  ├─ Sales Velocity Score                                         |
|  └─ Conversion Rate por etapa                                    |
|                                                                  |
|  CAPA 3: SANKEY CHART - FLUJO DE CONVERSION                      |
|  ├─ Lead Source → Zona Geografica → Stage → Outcome              |
|  ├─ Identificar donde se pierden deals                           |
|  └─ Detectar zonas con alta/baja conversion                      |
|                                                                  |
|  CAPA 4: PIPELINE MAP (Vista Geografica)                         |
|  ├─ Deals en negociacion por zona                                |
|  ├─ Supply disponible por zona (custodios activos)               |
|  └─ Gap Analysis: Demanda comercial vs. Capacidad operativa      |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Fase 1: Quick Wins - Pipeline Kanban Mejorado

### 1.1 Jerarquia Visual por Valor

**Problema**: Un deal de $500K luce igual que uno de $5K.

**Solucion**: Aplicar estilos diferenciados segun rangos de valor.

```text
Rango de Valor          │ Estilo Visual
────────────────────────┼───────────────────────────────────────
$0 - $50K               │ Borde izquierdo gris, texto normal
$50K - $200K            │ Borde izquierdo azul, titulo semibold
$200K - $500K           │ Borde izquierdo primary, fondo sutil
$500K+                  │ Borde dorado, badge "High Value"
```

### 1.2 Indicador de Deals Estancados

**Logica**: Calcular tiempo promedio en cada etapa. Si un deal supera 1.5x el promedio, mostrar badge "Stalled".

```text
┌─────────────────────────────────────┐
│  Contrato de Servicio ABC           │
│  ⚠️ Stalled (15 dias en etapa)      │  ← Badge rojo
│  Organizacion XYZ                   │
│  $150,000                    open   │
│  hace 15 dias          @vendedor    │
│  ● Match verificado                 │
└─────────────────────────────────────┘
```

### 1.3 Summary Cards con Contexto

**Antes**:
```text
Total Deals Abiertos: 47
Valor Total Pipeline: $2,340,000
```

**Despues**:
```text
Total Deals Abiertos: 47         ↑ +8 vs mes anterior
Valor Total Pipeline: $2.34M     ↓ -12% vs mes anterior
                                 72% de meta mensual ($3.2M)
```

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/CRMHub/components/PipelineKanban.tsx` | Agregar jerarquia visual, badges stalled, metricas contextuales |
| `src/hooks/useCrmDeals.ts` | Agregar calculo de tiempo promedio por etapa |
| `src/types/crm.ts` | Agregar campos para stalled detection |

---

## Fase 2: Metricas Ejecutivas Mejoradas

### 2.1 Nuevas Metric Cards

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  METRICAS CLAVE                                                         │
├────────────────┬────────────────┬────────────────┬─────────────────────┤
│  Pipeline      │  Forecast      │  Win Rate      │  Sales Velocity     │
│  $2.34M        │  $1.12M        │  34.2%         │  $45K/dia           │
│  ↑ +8% vs LM   │  ↓ -5% vs LM   │  ↑ +2.1pp      │  ≈ promedio         │
│  72% de meta   │  Prob. 48%     │  12/35 cerrados│  Avg 18 dias ciclo  │
└────────────────┴────────────────┴────────────────┴─────────────────────┘
```

### 2.2 Sales Velocity Formula

```text
Sales Velocity = (Deals Abiertos × Ticket Promedio × Win Rate) / Ciclo Promedio

Ejemplo:
(47 deals × $49.8K × 34.2%) / 18 dias = $44.5K/dia de capacidad de cierre
```

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/CRMHub/components/RevenueForecast.tsx` | Agregar tendencias, velocity, progreso vs meta |
| `src/hooks/useCrmForecast.ts` | Calcular metricas comparativas y velocity |

---

## Fase 3: Sankey Chart - Flujo de Conversion

### 3.1 Justificacion del Sankey

El Sankey es ideal para este caso porque:
1. Muestra flujos **no lineales** (un lead puede saltar etapas o perderse en cualquier punto)
2. Revela **cuellos de botella** visualmente (lineas que se adelgazan = perdida)
3. Conecta **multiples dimensiones** (origen → zona → etapa → resultado)

### 3.2 Estructura de Datos

```text
Nodos:
├─ FUENTES (izquierda)
│   ├─ Pipedrive (inbound)
│   ├─ Referido
│   └─ Outbound
├─ ZONAS (centro-izquierda)
│   ├─ Centro
│   ├─ Bajio
│   ├─ Norte
│   ├─ Occidente
│   └─ Otras
├─ ETAPAS (centro-derecha)
│   ├─ Contacto Inicial
│   ├─ Propuesta
│   ├─ Negociacion
│   └─ Cierre
└─ RESULTADO (derecha)
    ├─ Won
    └─ Lost

Links:
[Fuente] ──valor──► [Zona] ──valor──► [Etapa] ──valor──► [Resultado]
```

### 3.3 Visualizacion Esperada

```text
           ┌──────────────────────────────────────────────────────────┐
           │              FLUJO DE CONVERSION POR ZONA                │
           │                                                          │
           │   Pipedrive ═══════╗        Contacto ═══════╗           │
           │                    ╠═══ Centro ═══╣         ╠══ Won ════│
           │   Referido ════════╣              ╠═══ Propuesta ═╗     │
           │                    ╠═══ Bajio ════╣         ╠═════╬═════│
           │   Outbound ════════╝              ╠═══ Negociacion ╣    │
           │                    ╔═══ Norte ════╝         ╠══ Lost ═══│
           │                    ╚═══ Occidente ══════════╝           │
           └──────────────────────────────────────────────────────────┘
```

### 3.4 Insights que Revela

- **Zona con mejor conversion**: "Bajio convierte 45% vs 28% nacional"
- **Fuente mas efectiva**: "Referidos tienen 2x conversion vs Pipedrive"
- **Etapa critica**: "60% de perdidas ocurren entre Propuesta y Negociacion"

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/CRMHub/components/ConversionSankeyChart.tsx` | Componente Sankey usando Recharts |
| `src/hooks/useCrmConversionFlow.ts` | Hook para calcular nodos y links del Sankey |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/CRMHub/CRMHub.tsx` | Agregar nueva tab "Flujo" |
| `src/types/crm.ts` | Agregar tipos para SankeyNode y SankeyLink |

---

## Fase 4: Pipeline Map - Vision Geografica

### 4.1 Reutilizacion de Componentes Existentes

El proyecto ya tiene:
- `DemandBubbleMap.tsx` - Burbujas de demanda operativa
- `FlowMap.tsx` - Flujos origen-destino
- `geografico.ts` - Diccionario de ciudades con coordenadas

### 4.2 Nueva Vista: Pipeline por Zona

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  PIPELINE MAP                                          [Toggle: Supply] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        ┌──────┐                                         │
│                        │ MTY  │ $450K (5 deals)                         │
│                        │ ●●●  │ Supply: 12 custodios                    │
│                        └──────┘ Gap: OK                                 │
│                                                                         │
│   ┌──────┐                                    ┌──────┐                  │
│   │ GDL  │ $280K                              │ CDMX │ $1.2M (18 deals) │
│   │ ●●   │ 3 deals                            │ ●●●● │ Supply: 45       │
│   └──────┘                                    └──────┘ Gap: -8 units    │
│                                                                         │
│                        ┌──────┐                                         │
│                        │ QRO  │ $180K                                   │
│                        │ ●    │ 2 deals                                 │
│                        └──────┘                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Leyenda:
● = $100K en pipeline
Color Verde = Supply suficiente
Color Rojo = Gap de capacidad
```

### 4.3 Logica de Geocodificacion de Deals

```text
1. Obtener organization_name de cada deal
2. Normalizar texto (quitar acentos, lowercase)
3. Buscar coincidencias en CIUDADES_PRINCIPALES
4. Si no hay match, usar ubicacion de matched_client (servicios_custodia)
5. Agrupar deals por zona (ZONAS_A_CIUDADES)
```

### 4.4 Calculo de Gap Supply vs Demanda

```text
Para cada zona:
  demanda_proyectada = sum(deal.value × stage.probability) / ticket_promedio_servicio
  supply_actual = count(instaladores WHERE zona_preferida = zona AND estatus = 'activo')
  gap = supply_actual - demanda_proyectada

Si gap < 0:
  Mostrar alerta: "Se necesitan {abs(gap)} custodios adicionales en {zona}"
```

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/CRMHub/components/PipelineMap.tsx` | Mapa de deals por zona con Mapbox |
| `src/hooks/useCrmGeoDistribution.ts` | Hook para geocodificar y agrupar deals |
| `src/hooks/useCrmSupplyGap.ts` | Hook para calcular gap supply vs demanda |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/CRMHub/CRMHub.tsx` | Agregar tab "Mapa" |
| `src/utils/geografico.ts` | Agregar funcion extraerZonaDeDeal |

---

## Fase 5: Mejoras de Activity Feed

### 5.1 Agrupacion por Tipo de Evento

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ACTIVIDAD RECIENTE                                     [Filtrar ▼]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CERRADOS ESTA SEMANA                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ 🏆 Contrato ABC Logistica       $320,000    Won    hace 2 dias    │ │
│  │ ❌ Propuesta XYZ Corp           $85,000     Lost   hace 3 dias    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  NUEVOS ESTA SEMANA                                                     │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ ➕ Lead Empresa DEF             $150,000    Open   hace 1 dia     │ │
│  │ ➕ Oportunidad GHI              $200,000    Open   hace 4 dias    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  STALLED (requieren atencion)                                           │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Propuesta JKL Industries     $420,000    25 dias sin cambio    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/CRMHub/components/ActivityFeed.tsx` | Agregar agrupacion semantica y filtros |

---

## Resumen Tecnico de Implementacion

### Nuevos Archivos a Crear (6)

| Archivo | Proposito |
|---------|-----------|
| `src/pages/CRMHub/components/ConversionSankeyChart.tsx` | Diagrama Sankey de flujo de conversion |
| `src/pages/CRMHub/components/PipelineMap.tsx` | Mapa geografico de deals |
| `src/hooks/useCrmConversionFlow.ts` | Logica para calcular nodos/links del Sankey |
| `src/hooks/useCrmGeoDistribution.ts` | Geocodificacion y agrupacion de deals |
| `src/hooks/useCrmSupplyGap.ts` | Calculo de gap supply vs demanda |
| `src/hooks/useCrmTrends.ts` | Comparativas vs mes anterior |

### Archivos a Modificar (7)

| Archivo | Cambios Principales |
|---------|---------------------|
| `src/pages/CRMHub/CRMHub.tsx` | Agregar tabs "Flujo" y "Mapa" |
| `src/pages/CRMHub/components/PipelineKanban.tsx` | Jerarquia visual, badges stalled |
| `src/pages/CRMHub/components/RevenueForecast.tsx` | Tendencias y velocity |
| `src/pages/CRMHub/components/ActivityFeed.tsx` | Agrupacion semantica |
| `src/hooks/useCrmForecast.ts` | Metricas comparativas |
| `src/types/crm.ts` | Nuevos tipos para Sankey y Geo |
| `src/utils/geografico.ts` | Funcion extraerZonaDeDeal |

---

## Consideraciones de Diseño

### Consistencia con el Design System Existente

El proyecto utiliza un sistema de diseno minimalista en escala de grises con acentos sutiles:

- **Tipografia**: Apple-style (SF Pro / -apple-system)
- **Colores**: Grayscale base con chart-colors vibrantes para datos
- **Cards**: `apple-card` con bordes sutiles y sombras suaves
- **Animaciones**: Transiciones de 200-300ms con easing cubico

### Paleta de Colores para Nuevos Elementos

| Uso | Color | Clase Tailwind |
|-----|-------|----------------|
| High Value Deal | Dorado sutil | `border-l-amber-500` |
| Stalled Badge | Rojo suave | `bg-destructive/10 text-destructive` |
| Win Trend Up | Verde | `text-green-600` |
| Loss Trend Down | Rojo | `text-red-600` |
| Sankey Links | Chart colors | `hsl(var(--chart-1..5))` |

---

## Orden de Implementacion Recomendado

```text
Semana 1: Fase 1 (Quick Wins)
├─ Jerarquia visual en DealCard
├─ Badges de Stalled
└─ Metricas con contexto

Semana 2: Fase 2 (Metricas Ejecutivas)
├─ useCrmTrends hook
├─ Sales Velocity calculation
└─ Progress bars vs meta

Semana 3: Fase 3 (Sankey Chart)
├─ useCrmConversionFlow hook
├─ ConversionSankeyChart component
└─ Nueva tab "Flujo"

Semana 4: Fase 4 (Pipeline Map)
├─ useCrmGeoDistribution hook
├─ PipelineMap component (reutilizar DemandBubbleMap)
├─ useCrmSupplyGap hook
└─ Nueva tab "Mapa"

Semana 5: Fase 5 (Activity Feed)
└─ Agrupacion semantica y filtros
```

---

## Resultado Final Esperado

Un CRM Hub que responda las siguientes preguntas para cada stakeholder:

| Stakeholder | Pregunta | Donde Encuentra la Respuesta |
|-------------|----------|------------------------------|
| CEO | ¿Vamos a cumplir la meta mensual? | Metric Card: Progress vs Meta |
| Head of Sales | ¿Que deals estan estancados? | Kanban: Badges Stalled |
| Head of Ops | ¿Donde necesito contratar mas? | Pipeline Map: Gap Analysis |
| Head of Product | ¿Que fuente de leads convierte mejor? | Sankey: Flujo por Fuente |
