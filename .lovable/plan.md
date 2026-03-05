

# Rediseno UI/UX del Modulo de Facturacion — Filosofia Lean + Apple

## Diagnostico actual

Tras revisar los 10+ componentes del modulo, identifico estos problemas estructurales:

### Problemas de arquitectura de informacion

1. **10 pestanas de primer nivel** — sobrecarga cognitiva brutal. Un stakeholder de CxP no necesita ver "Servicios", "Clientes", "Incidencias" y "Ayuda" al mismo nivel que sus herramientas de trabajo diario. Viola el principio de progressive disclosure.

2. **Dashboard generico y desconectado** — El `FacturacionDashboard` actual solo muestra ingresos/costos/margen de servicios finalizados. No incluye CxP OCA (estadias, casetas, hoteles, apoyos), CxP PE, aging de CxC, ni flujo de caja proyectado. El "tren ejecutivo" no puede ver el performance financiero real porque falta la mitad del P&L.

3. **Hero KPIs sin contexto temporal** — Los 8 KPIs del HeroBar no tienen comparativa (vs periodo anterior, vs meta). Son numeros absolutos sin direccionalidad. Un CFO no puede saber si "$2.3M de ingresos" es bueno o malo sin referencia.

4. **Fragmentacion de reportes financieros** — DSO, Cash Flow, Eficiencia de cobranza estan enterrados dentro de CxC > Reportes Financieros (3 clicks de profundidad). Deberian alimentar el dashboard principal.

5. **Sub-tabs repetitivas en CxP OCA** — Casetas y Hoteles son tablas casi identicas (folio, cliente, monto, estado). No justifican sub-tabs separadas. Son vistas filtradas de un mismo concepto: "gastos operativos por reembolsar".

6. **Gastos Extra como tab separada** — Se solapa conceptualmente con CxP OCA (Apoyos Extraordinarios, Hoteles, Casetas). Deberia consolidarse.

7. **Formularios piden UUID crudo** — `EstadiasPanel` pide "ID del Cliente (UUID)" en texto libre. Un usuario de finanzas no sabe que es un UUID. Debe ser un select con nombre del cliente.

### Problemas de UI

- KPIs usan `text-lg` cuando deberian ser hero numbers (`text-3xl`+) para scanability ejecutiva
- No hay semaforos de urgencia en CxP OCA (cuanto hay pendiente de pagar esta semana?)
- Las tablas no tienen busqueda inline ni paginacion
- No hay visualizacion del pipeline de pagos (cuanto en borrador, cuanto en revision, cuanto aprobado)

---

## Propuesta: Rediseno "Finance Command Center"

### Principio 1: Reducir pestanas de 10 a 5

```text
ACTUAL (10 tabs):
Dashboard | Servicios | CxC | Clientes | Facturas | Incidencias | Gastos Extra | CxP OCA | CxP PE | Ayuda

PROPUESTO (5 tabs):
Overview | Ingresos (CxC) | Egresos (CxP) | Operaciones | Config
```

| Tab propuesta | Contenido consolidado |
|---|---|
| **Overview** | Dashboard financiero ejecutivo con P&L en tiempo real |
| **Ingresos** | Facturas (por facturar + emitidas) + Aging CxC + Workflow Cobranza + Reportes |
| **Egresos** | CxP OCA + CxP PE + Gastos Extraordinarios (consolidado) |
| **Operaciones** | Servicios consulta + Incidencias (herramientas de trabajo diario) |
| **Config** | Clientes + Reglas Estadias + Ayuda/Manual |

### Principio 2: Overview como "Finance Command Center"

El dashboard debe responder 3 preguntas ejecutivas en <5 segundos:

1. **"Como vamos?"** — P&L real-time: Ingresos MTD vs CxP MTD = Margen Operativo
2. **"Que me preocupa?"** — Alertas: Aging vencido >60d, CxP sin aprobar, servicios sin facturar >15d
3. **"Que viene?"** — Pipeline: Cash flow proyectado, cortes semanales pendientes de dispersion

```text
+-------------------------------------------------------+
| OVERVIEW — Finance Command Center                      |
+-------------------------------------------------------+
| [Hero Banner: P&L MTD]                                 |
| Ingresos $X.XM | CxP $X.XM | Margen $X.XM (XX%)      |
| vs prev: +X% | vs meta: X% cumplimiento               |
+-------------------------------------------------------+
| [3 Attention Cards]                                    |
| Vencido >60d    | Sin facturar    | CxP por dispersar  |
| $XXXk (X fact)  | XX servicios    | $XXXk (X cortes)   |
+-------------------------------------------------------+
| [2-col grid]                                           |
| Cash Flow 30d (area chart)  | Pipeline CxP (funnel)   |
| Eficiencia Cobranza (bars)  | Top 5 Clientes (bars)   |
+-------------------------------------------------------+
```

### Principio 3: Tab Egresos — Consolidar CxP inteligentemente

En vez de 2 sub-modulos separados (OCA + PE) con 5 sub-tabs cada uno, usar un layout maestro-detalle:

```text
+-------------------------------------------------------+
| EGRESOS                                                |
+-------------------------------------------------------+
| [KPI Bar: Por pagar | Aprobado | Dispersado | Pagado] |
+-------------------------------------------------------+
| [Segment: OCA (internos) | PE (externos)]              |
+-------------------------------------------------------+
| [OCA seleccionado]                                     |
| Pipeline visual: borrador(X) → ops(X) → fin(X) → $    |
| Tabla de cortes semanales con expansion inline         |
| (expandir row muestra desglose: servicios, estadias,   |
|  casetas, hoteles, apoyos — sin navegar a otra pagina) |
+-------------------------------------------------------+
```

Casetas, Hoteles, Estadias y Apoyos se eliminan como sub-tabs separadas y se convierten en **lineas de detalle expandibles** dentro del corte semanal. El workflow de Apoyos Extraordinarios se mantiene como accion contextual (boton "Nuevo Apoyo" que abre modal).

### Principio 4: Semaforos y urgencia

Cada KPI debe tener:
- **Color semantico** (verde/ambar/rojo) basado en umbrales configurables
- **Comparativa temporal** (vs semana anterior, vs mes anterior)
- **Spark trend** — mini grafico de 4 semanas inline

### Principio 5: Formularios humanos

- Reemplazar campos UUID por selects con autocomplete de nombre de cliente
- Semana del corte: calendario visual que resalta lun-dom, no inputs de fecha libres
- Montos con formato currency inline al escribir

---

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `FacturacionHub.tsx` | Reducir de 10 a 5 tabs, nuevo layout |
| `FacturacionDashboard.tsx` | Reescribir como Finance Command Center con P&L, alertas, pipeline |
| `FacturacionHeroBar.tsx` | Redisenar con comparativas temporales y spark trends |
| Nuevo: `FinanceOverview.tsx` | Componente principal del Overview con P&L banner + attention cards |
| Nuevo: `PLBanner.tsx` | Banner hero con Ingresos/Egresos/Margen MTD |
| Nuevo: `AttentionCards.tsx` | 3 cards de urgencia (aging, sin facturar, CxP) |
| Nuevo: `CxPPipelineChart.tsx` | Funnel/horizontal bar del pipeline de pagos |
| `CxPOperativoTab.tsx` | Eliminar sub-tabs, consolidar en tabla expandible con desglose inline |
| Nuevo: `EgresosTab.tsx` | Tab unificada OCA + PE con segment control |
| Nuevo: `IngresosTab.tsx` | Tab que agrupa Facturas + CxC + Reportes Financieros |
| Nuevo: `OperacionesTab.tsx` | Tab con Servicios + Incidencias |
| Nuevo: `ConfigTab.tsx` | Tab con Clientes + Reglas Estadias + Manual |
| `CortesPanel.tsx` | Agregar expansion inline con desglose de servicios/estadias/casetas/hoteles |
| `EstadiasPanel.tsx` | Reemplazar UUID input por select de clientes |
| `GenerarCorteDialog.tsx` | Agregar calendario visual lun-dom |
| Nuevo hook: `useFinanceOverview.ts` | Consolida P&L MTD, alertas, pipeline CxP — single query |

Total: ~16 archivos, ~10 nuevos, ~6 modificados.

