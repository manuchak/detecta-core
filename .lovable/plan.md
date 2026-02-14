

## Plan de Mejoras del Modulo Customer Success

### Contexto Actual

El modulo tiene una arquitectura solida (15 componentes, 8 hooks, 4 tablas CS) pero la adopcion es practicamente nula: **80 clientes activos, 6 quejas sin asignar, 0 touchpoints, 0 CAPAs, 0 health scores**. El plan se divide en 3 fases priorizadas por impacto operativo.

---

### FASE 1: Fundamentos de Gestion (Semana 1-2)
*Objetivo: Hacer el modulo usable para el dia a dia del equipo CS*

#### 1.1 Asignacion de CSM (Book of Business)

Agregar campo `csm_asignado` (uuid, FK a profiles) en `pc_clientes`. Esto habilita:
- Filtro "Mi Cartera" en CSCartera para que cada CSM vea solo sus clientes
- KPIs por CSM en Panorama (quejas de mis clientes, dias sin contacto promedio)
- Columna "CSM" visible en la tabla de Cartera

**Cambios:**
- Migracion SQL: agregar columna `csm_asignado` a `pc_clientes`
- `useCSCartera.ts`: agregar filtro por CSM logueado
- `CSCartera.tsx`: agregar toggle "Mi cartera / Todos" y columna CSM
- `CSPanorama.tsx`: KPIs filtrados por CSM cuando aplique

#### 1.2 Busqueda y Ordenamiento en Cartera

La tabla actual no tiene busqueda, sort ni paginacion.

**Cambios:**
- `CSCartera.tsx`: Agregar input de busqueda por nombre/razon social
- Agregar sort clickeable en columnas (ultimo servicio, GMV, quejas, CSAT, dias sin contacto)
- Paginacion client-side (25 por pagina) dado que son ~80 clientes

#### 1.3 Touchpoint Rapido desde Cartera

Hoy para registrar un touchpoint se necesita ir al perfil del cliente. Agregar boton de "Registrar contacto" directo desde la fila de cartera.

**Cambios:**
- `CSCartera.tsx`: Agregar boton de accion rapida con dialog inline
- Reutilizar `useCreateCSTouchpoint` existente
- Preseleccionar `cliente_id` automaticamente

---

### FASE 2: Proactividad y Alertas (Semana 2-3)
*Objetivo: Cambiar de reactivo a proactivo*

#### 2.1 Health Score Snapshots Mensuales

Los health scores se calculan en runtime pero no se persisten, impidiendo analisis de tendencias. Crear un edge function que corra mensualmente (o manualmente) para guardar snapshots.

**Cambios:**
- Edge function `cs-health-snapshot`: Calcula y persiste health scores mensuales en `cs_health_scores` para todos los clientes activos
- Boton "Generar Snapshot" en Panorama para ejecucion manual
- Grafica de tendencia de health score en el perfil del cliente (`CSClienteProfileModal.tsx`)

#### 2.2 Alertas Proactivas en Panorama

Agregar un sistema de alertas automaticas que aparezcan en la seccion "Atencion Urgente":

- **SLA en riesgo**: Quejas que han consumido >75% de su SLA sin respuesta
- **Inactividad prolongada**: Clientes sin contacto >45 dias (warning) o >60 dias (critico)
- **Caida de GMV**: Clientes cuyo GMV cayo >30% mes a mes
- **CAPA vencida**: CAPAs con fecha de implementacion pasada

**Cambios:**
- Nuevo hook `useCSAlerts.ts` que consolida alertas de multiples fuentes
- Componente `CSAlertsFeed.tsx` que muestra alertas priorizadas con accion sugerida
- Integrar en `CSPanorama.tsx` reemplazando/complementando la lista de urgentes actual

#### 2.3 Widget de Touchpoints Pendientes

Mostrar en Panorama cuantos clientes no han sido contactados en los ultimos 30 dias, con acceso directo a registrar touchpoint.

**Cambios:**
- Agregar KPI "Sin contacto 30d+" en el hero de Panorama
- Link directo a Cartera filtrada por `sin_servicio`

---

### FASE 3: Escalabilidad y Reportes (Semana 3-4)
*Objetivo: Herramientas de gestion y auditoria*

#### 3.1 Drag & Drop en CAPA Kanban

El kanban actual solo tiene boton "Avanzar". Implementar drag & drop real.

**Cambios:**
- `CSCAPAKanban.tsx`: Integrar `@dnd-kit/core` y `@dnd-kit/sortable` (ya instalados) para arrastrar CAPAs entre columnas
- Mantener el boton "Avanzar" como alternativa

#### 3.2 Exportacion de Reportes ISO

Agregar boton de exportacion a Excel/PDF para auditorias ISO:
- Reporte de quejas con SLA compliance
- Reporte de CAPAs con eficacia
- Reporte de touchpoints por periodo

**Cambios:**
- Nuevo componente `CSExportButton.tsx` con menu de opciones de exportacion
- Utilizar `xlsx` (ya instalado) para Excel y `jspdf` para PDF
- Integrar en la barra superior del tab Operativo

#### 3.3 NPS Periodico (Estructura Base)

Crear la tabla y UI para campanas de NPS independientes de quejas:
- Tabla `cs_nps_campaigns` con campos: periodo, cliente_id, score (0-10), comentario, canal
- Vista de resultados con distribucion Promotores/Pasivos/Detractores
- Integracion del NPS score en el calculo de loyalty stage

**Cambios:**
- Migracion SQL: tabla `cs_nps_campaigns`
- Hook `useCSNPS.ts`
- Componente `CSNPSSurvey.tsx` en tab Operativo
- Actualizar `useCSLoyaltyFunnel.ts` para considerar NPS en la clasificacion

---

### Resumen Tecnico de Archivos

| Fase | Archivo | Accion |
|------|---------|--------|
| 1.1 | Nueva migracion SQL | Agregar `csm_asignado` a `pc_clientes` |
| 1.1 | `useCSCartera.ts` | Filtro por CSM |
| 1.1 | `CSCartera.tsx` | Toggle mi cartera, columna CSM |
| 1.1 | `CSPanorama.tsx` | KPIs filtrados por CSM |
| 1.2 | `CSCartera.tsx` | Busqueda, sort, paginacion |
| 1.3 | `CSCartera.tsx` | Boton touchpoint rapido |
| 2.1 | `supabase/functions/cs-health-snapshot/` | Edge function nuevo |
| 2.1 | `CSClienteProfileModal.tsx` | Grafica tendencia health |
| 2.1 | `CSPanorama.tsx` | Boton generar snapshot |
| 2.2 | `src/hooks/useCSAlerts.ts` | Hook nuevo de alertas |
| 2.2 | `CSAlertsFeed.tsx` | Componente nuevo |
| 2.2 | `CSPanorama.tsx` | Integrar alertas |
| 2.3 | `CSPanorama.tsx` | KPI sin contacto 30d |
| 3.1 | `CSCAPAKanban.tsx` | Drag & drop con dnd-kit |
| 3.2 | `CSExportButton.tsx` | Componente nuevo |
| 3.3 | Nueva migracion SQL | Tabla `cs_nps_campaigns` |
| 3.3 | `useCSNPS.ts` | Hook nuevo |
| 3.3 | `CSNPSSurvey.tsx` | Componente nuevo |
| 3.3 | `useCSLoyaltyFunnel.ts` | Integrar NPS |

### Dependencias entre fases

- Fase 1 es independiente y se puede implementar inmediatamente
- Fase 2.1 (Health Snapshots) depende de que existan datos en la tabla (se puede ejecutar manualmente)
- Fase 3.3 (NPS) modifica la logica de loyalty, requiere pruebas con datos existentes
- Todo lo demas es paralelizable

