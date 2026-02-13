

## Modulo Customer Success - Gestion de Quejas con ISO 9001

### Vision

Un modulo completo de Customer Success que reemplaza el Excel actual, con seguimiento estructurado de quejas, acciones correctivas (CAPA), touchpoints proactivos, y metricas de retencion. Compatible con ISO 9001:2015 (clausulas 8.2.1, 9.1.2, 10.2).

### Arquitectura de Datos

Se crean 4 tablas nuevas:

**1. `cs_quejas` - Registro central de quejas/NCRs**

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | Identificador |
| numero_queja | text | Folio auto-generado (QJ-2026-0001) |
| cliente_id | uuid FK -> pc_clientes | Cliente afectado |
| servicio_id | text | Servicio relacionado (opcional) |
| tipo | enum | calidad_servicio, facturacion, cobertura, seguridad, consignas, otro |
| severidad | enum | baja, media, alta, critica |
| canal_entrada | enum | whatsapp, telefono, email, ejecutivo, seguimiento_proactivo |
| descripcion | text | Detalle de la queja |
| evidencia_urls | text[] | Fotos/documentos adjuntos |
| estado | enum | abierta, en_investigacion, accion_correctiva, seguimiento, cerrada, reabierta |
| asignado_a | uuid | Responsable CS |
| ejecutivo_cuenta | uuid | Ejecutivo de ventas de la cuenta |
| causa_raiz | text | Analisis de causa raiz (ISO 10.2) |
| accion_correctiva | text | Accion correctiva implementada |
| accion_preventiva | text | Accion preventiva para evitar recurrencia |
| fecha_compromiso | timestamptz | Fecha comprometida de resolucion |
| fecha_resolucion | timestamptz | Fecha real de cierre |
| calificacion_cierre | int | CSAT del cliente al cerrar (1-5) |
| requiere_capa | boolean | Si amerita proceso CAPA formal |
| capa_id | uuid FK | Referencia a CAPA si aplica |
| sla_respuesta_horas | int | SLA de primera respuesta |
| sla_resolucion_horas | int | SLA de resolucion |
| primera_respuesta_at | timestamptz | Timestamp primera respuesta |
| created_at / updated_at | timestamptz | Auditoria |
| created_by | uuid | Quien registro |

**2. `cs_touchpoints` - Historial de interacciones**

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| queja_id | uuid FK -> cs_quejas | Queja relacionada (nullable para touchpoints proactivos) |
| cliente_id | uuid FK -> pc_clientes | Cliente |
| tipo | enum | llamada_seguimiento, email, whatsapp, reunion, visita, nota_interna |
| direccion | enum | entrante, saliente |
| resumen | text | Resumen de la interaccion |
| contacto_nombre | text | Con quien se hablo |
| duracion_minutos | int | Duracion (para llamadas) |
| siguiente_accion | text | Compromiso de siguiente paso |
| fecha_siguiente_accion | timestamptz | Cuando |
| created_by | uuid | Quien registro |
| created_at | timestamptz | |

**3. `cs_capa` - Acciones Correctivas y Preventivas (ISO 10.2)**

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| numero_capa | text | Folio (CAPA-2026-0001) |
| queja_id | uuid FK | Queja origen |
| cliente_id | uuid FK | Cliente |
| tipo | enum | correctiva, preventiva |
| descripcion_no_conformidad | text | NCR formal |
| analisis_causa_raiz | text | 5 Whys / Ishikawa |
| accion_inmediata | text | Contencion |
| accion_correctiva | text | Correccion definitiva |
| accion_preventiva | text | Prevencion futura |
| responsable_id | uuid | Quien ejecuta |
| fecha_implementacion | date | Target |
| fecha_verificacion | date | Fecha de verificacion de eficacia |
| eficacia_verificada | boolean | El CAPA fue efectivo? |
| estado | enum | abierto, en_proceso, implementado, verificado, cerrado |
| created_at / updated_at | timestamptz | |

**4. `cs_health_scores` - Salud de cuenta (mensual)**

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| cliente_id | uuid FK | |
| periodo | date | Primer dia del mes |
| score | int (0-100) | Health score calculado |
| quejas_abiertas | int | Snapshot |
| quejas_cerradas_mes | int | |
| csat_promedio | numeric | |
| servicios_mes | int | Volumen |
| touchpoints_mes | int | Contactos realizados |
| riesgo_churn | enum | bajo, medio, alto, critico |
| notas | text | |
| created_at | timestamptz | |

### Nuevo Rol: `customer_success`

Se agrega al enum de roles con acceso a:
- Lectura de `pc_clientes`, `servicios_custodia`, `checklist_servicio`
- CRUD completo en `cs_quejas`, `cs_touchpoints`, `cs_capa`, `cs_health_scores`
- Lectura de tickets existentes para correlacionar

### Estructura del Modulo (Frontend)

Ruta: `/customer-success`

```text
+------------------------------------------------------------------+
| CUSTOMER SUCCESS                                          [+ Queja]|
|------------------------------------------------------------------|
| [Dashboard]  [Quejas]  [Clientes]  [CAPA]  [Mejora Continua]    |
|------------------------------------------------------------------|
```

**Tab 1 - Dashboard:**
- Hero: CSAT promedio del mes + tendencia
- KPIs: Quejas abiertas, Tiempo medio resolucion, SLA compliance %, Clientes en riesgo
- Grafico: Quejas por tipo (donut) + Tendencia mensual (area)
- Alertas: Quejas vencidas de SLA, CAPAs pendientes de verificacion, Clientes sin touchpoint >30 dias

**Tab 2 - Quejas:**
- Tabla con filtros por estado, tipo, severidad, cliente, asignado
- Al hacer clic: Vista detalle con timeline de touchpoints, causa raiz, acciones, CSAT
- Formulario de nueva queja con selector de cliente, tipo, canal, severidad

**Tab 3 - Clientes:**
- Lista de 78 clientes activos con health score semaforo
- Al hacer clic: Perfil del cliente con historial de quejas, touchpoints, CAPAs, tendencia de CSAT
- Indicador de "dias sin contacto" para priorizar seguimiento proactivo

**Tab 4 - CAPA:**
- Kanban: Abierto -> En Proceso -> Implementado -> Verificado -> Cerrado
- Cada tarjeta muestra NCR, cliente, responsable, fecha target
- Alerta para CAPAs sin verificacion de eficacia >30 dias

**Tab 5 - Mejora Continua:**
- Pareto de quejas por causa raiz (top 10)
- Tendencia de quejas recurrentes vs. nuevas
- Indicadores ISO 9001: % quejas cerradas en SLA, tasa de recurrencia, eficacia de CAPAs
- Exportar reporte para auditorias ISO

### Compatibilidad ISO 9001:2015

| Clausula | Implementacion |
|---|---|
| 8.2.1 Comunicacion con el cliente | Touchpoints registrados con canal, direccion y seguimiento |
| 9.1.2 Satisfaccion del cliente | CSAT por queja + health score mensual por cuenta |
| 10.2 No conformidad y accion correctiva | Sistema CAPA con causa raiz, acciones correctivas/preventivas y verificacion de eficacia |
| 10.3 Mejora continua | Pareto de causas, tendencias, tasa de recurrencia |

### Navegacion

Se agrega "Customer Success" al GlobalNav con icono `HeartHandshake`, accesible para roles: `admin`, `owner`, `customer_success`, `ejecutivo_ventas`, `coordinador_operaciones`.

### Archivos a crear

| Archivo | Contenido |
|---|---|
| `supabase/migrations/...` | 4 tablas + enums + RLS + trigger folio auto |
| `src/pages/CustomerSuccess/CustomerSuccessPage.tsx` | Pagina principal con tabs |
| `src/pages/CustomerSuccess/components/CSDashboard.tsx` | Dashboard con KPIs y alertas |
| `src/pages/CustomerSuccess/components/CSQuejasList.tsx` | Tabla de quejas con filtros |
| `src/pages/CustomerSuccess/components/CSQuejaDetail.tsx` | Detalle de queja con timeline |
| `src/pages/CustomerSuccess/components/CSQuejaForm.tsx` | Formulario nueva queja |
| `src/pages/CustomerSuccess/components/CSClientesList.tsx` | Lista clientes con health score |
| `src/pages/CustomerSuccess/components/CSClienteProfile.tsx` | Perfil del cliente |
| `src/pages/CustomerSuccess/components/CSCAPAKanban.tsx` | Kanban de CAPAs |
| `src/pages/CustomerSuccess/components/CSMejoraContinua.tsx` | Reportes ISO y Pareto |
| `src/hooks/useCSQuejas.ts` | Hook CRUD quejas |
| `src/hooks/useCSCapa.ts` | Hook CRUD CAPAs |
| `src/hooks/useCSTouchpoints.ts` | Hook touchpoints |
| `src/hooks/useCSHealthScores.ts` | Hook health scores |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/navigation/GlobalNav.tsx` | Agregar modulo Customer Success |
| `src/config/roleHomeConfig.ts` | Agregar tipo `customer_success` al UserRole |
| `src/App.tsx` | Agregar ruta `/customer-success` |
| `src/constants/accessControl.ts` | Agregar rol al routing |

### Orden de implementacion

Dado el tamano del modulo, se implementara en fases dentro de este mismo PR:

1. **Migracion SQL**: Crear tablas, enums, RLS, funciones de folio
2. **Hooks de datos**: 4 hooks para CRUD
3. **Pagina principal + Dashboard**: Estructura de tabs + KPIs
4. **Quejas**: Lista + Detalle + Formulario
5. **Clientes + Health Score**: Vista de cuentas
6. **CAPA + Mejora Continua**: Kanban + reportes ISO
7. **Navegacion**: GlobalNav + routing

