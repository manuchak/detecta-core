

# Actualizar control de versiones: de v1.3.0 a v2.0.0

## El problema: 4 meses sin versionamiento

La ultima version registrada es **1.3.0** (22 de octubre 2025). Hoy es **27 de febrero 2026** -- han pasado **4 meses** sin registrar cambios. En ese tiempo, el sistema crecio de forma masiva. Registrar solo 3 cambios seria una subestimacion enorme.

## Lo que realmente cambio

Tras analizar la estructura completa del proyecto, identifico al menos **8 areas mayores** de desarrollo desde v1.3.0:

### Area 1: LMS completo (Learning Management System)
- Sistema de cursos con wizard de creacion multi-paso
- Generacion de contenido con IA (flashcards, quizzes, texto enriquecido)
- Visor de contenido (video, texto, SCORM, embeds, interactivos)
- Sistema de quizzes con multiples tipos de pregunta
- Certificados con generacion PDF y verificacion publica
- Gamificacion (badges, puntos)
- Reportes de adopcion, rendimiento, progreso
- Inscripciones masivas
- Prompt personalizado para IA (AIPromptPopover)
- Boton manual de completado en texto enriquecido

### Area 2: Facturacion Hub completo
- Dashboard de facturacion con KPIs
- Consulta y detalle de servicios
- Generacion de facturas
- Cuentas por cobrar con aging, cobranza, estados de cuenta
- Cuentas por pagar a proveedores
- Workflow de cobranza (etapas, promesas de pago, acciones)
- Gastos extraordinarios
- Gestion de clientes (credito, detalle)
- Reportes financieros (cash flow, DSO, collection efficiency)
- Incidencias de facturacion

### Area 3: Customer Success
- Dashboard panoramico de salud de clientes
- Sistema NPS con campanas y encuestas
- CSAT surveys
- Voice of Customer (VoC) con analisis IA
- Quejas (CRUD, detalle, seguimiento)
- Cartera de clientes con health scores
- CAPA Kanban (acciones correctivas)
- Touchpoints tracking
- Loyalty funnel
- Playbooks operativos
- Retencion dashboard
- Staff performance
- Asignacion masiva de CSMs

### Area 4: SIERCP (Sistema de Evaluacion de Riesgo)
- Entrevista estructurada con formulario guiado
- Dashboard de resultados con radar, gauge, semaforo
- Generacion de reporte imprimible/PDF
- Integracion con IA para analisis
- Panel de validacion y decision
- Persistencia y normalizacion de datos

### Area 5: Reclutamiento expandido
- Evaluaciones psicometricas con panel SIERCP
- Toxicologia (tab completo con formulario y badge)
- Referencias (formulario, validacion, progreso, edicion/eliminacion)
- Contratos (generacion, firma, preview, upload, progreso)
- Documentos (upload, preview, progreso)
- Estudio socioeconomico
- Entrevistas con analisis IA
- Analisis de riesgo del candidato

### Area 6: Monitoreo expandido
- Modo TV para pantallas de sala de monitoreo
- Dashboard de adopcion digital
- Checklists de monitoreo con auditoria
- Panel de incidentes en tiempo real
- Detalle de servicios activos con mapa

### Area 7: WMS expandido
- Catalogo GPS con investigacion
- Compras y ordenes de compra
- Recepciones de mercancia
- Desechos (wizard)
- Devoluciones a proveedor (wizard)
- Stock con edicion
- RMA (devoluciones/garantias)
- Proveedores
- Configuracion
- Audit log

### Area 8: Legal
- Templates de contratos con editor
- Historial de versiones de templates
- Catalogo de variables
- Compliance checklist

## Propuesta de versionamiento

Dado el volumen de cambios, propongo crear **multiples versiones** para reflejar la historia real, no una sola version gigante:

| Version | Nombre | Tipo | Cambios |
|---------|--------|------|---------|
| 1.3.0 | Import Wizard Enhancement | patch | (existente, cambiar status a released) |
| 1.4.0 | LMS Platform | minor | ~10 cambios del modulo LMS |
| 1.5.0 | Facturacion Hub | minor | ~8 cambios del hub de facturacion |
| 1.6.0 | Customer Success | minor | ~7 cambios de CS |
| 1.7.0 | SIERCP & Evaluaciones | minor | ~6 cambios de evaluacion |
| 1.8.0 | Recruitment Pipeline | minor | ~6 cambios de reclutamiento |
| 1.9.0 | Monitoring & Operations | minor | ~5 cambios de monitoreo |
| 2.0.0 | Platform Maturity | major | WMS, Legal, AI prompts, UX fixes |

## Implementacion tecnica

### Paso 1: Actualizar v1.3.0
- Cambiar status de `testing` a `released`

### Paso 2: Crear 7 nuevas versiones
- Insertar cada version en `system_versions` con fechas escalonadas (nov 2025 - feb 2026)

### Paso 3: Insertar cambios por version
- Cada version tendra entre 5-10 registros en `system_changes` con:
  - `change_type`: feature, enhancement, bugfix, security
  - `module`: nombre del area
  - `impact_level`: low, medium, high, critical
  - `title` y `description` descriptivos
  - `affected_components`: array de componentes clave
  - `technical_details`: detalles de implementacion

### Archivos a modificar
- **0 archivos de codigo**: todo se inserta via SQL en la base de datos
- Se usaran migrations/queries directas a las tablas `system_versions` y `system_changes`

### Estimacion
- ~7 inserts en `system_versions`
- ~50 inserts en `system_changes`
- Release notes descriptivos para cada version

