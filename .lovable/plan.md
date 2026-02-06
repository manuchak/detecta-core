
# Diseño Completo de Templates de WhatsApp para Detecta

## Resumen Ejecutivo

Este documento presenta el diseño detallado de **32 templates de WhatsApp** organizados en 10 categorías funcionales, basados en un análisis exhaustivo de los flujos de comunicación existentes en Detecta.

---

## 1. Templates de Servicios y Planeación (7 templates)

### 1.1 `servicio_asignado`
**Categoría Meta:** UTILITY  
**Trigger:** Asignación de servicio desde `PendingAssignmentModal.tsx`

```text
Header: 🛡️ SERVICIO ASIGNADO

Body:
Hola {{1}},

Tienes un nuevo servicio asignado:

📅 {{2}}
⏰ {{3}}
👤 Cliente: {{4}}
📍 Origen: {{5}}
➡️ Destino: {{6}}

Confirma tu disponibilidad.

Footer: Detecta - Sistema de Custodios

Buttons:
[✅ Confirmar] [❌ No disponible]
```

**Variables:**
1. `custodio_nombre` - Nombre del custodio
2. `fecha` - Fecha del servicio (ej: "15 de febrero")
3. `hora` - Hora de cita (ej: "09:00")
4. `cliente` - Nombre del cliente
5. `origen` - Dirección de origen
6. `destino` - Dirección de destino

---

### 1.2 `servicio_reasignado`
**Categoría Meta:** UTILITY  
**Trigger:** Reasignación desde `ReassignmentModal.tsx`

```text
Header: 🔄 SERVICIO REASIGNADO

Body:
Hola {{1}},

Se te ha reasignado el servicio {{2}}:

📅 {{3}} a las {{4}}
👤 Cliente: {{5}}
📍 {{6}} → {{7}}

⚠️ Este servicio requiere atención inmediata.

Buttons:
[✅ Confirmar] [📞 Necesito ayuda]
```

---

### 1.3 `recordatorio_servicio_60min`
**Categoría Meta:** UTILITY  
**Trigger:** Cron job 60 minutos antes del servicio

```text
Header: ⏰ RECORDATORIO - 1 HORA

Body:
{{1}}, tu servicio inicia en 1 hora:

👤 Cliente: {{2}}
📍 Origen: {{3}}
⏰ Hora cita: {{4}}

✅ Recuerda completar el checklist pre-servicio.

Buttons:
[📋 Abrir Checklist] [🆘 Tengo un problema]
```

---

### 1.4 `recordatorio_servicio_30min`
**Categoría Meta:** UTILITY  
**Trigger:** Cron job 30 minutos antes

```text
Header: ⚠️ ALERTA - 30 MINUTOS

Body:
{{1}}, tu servicio inicia en 30 minutos:

📍 {{2}}
⏰ {{3}}

🚗 Confirma que estás en camino.

Buttons:
[🚗 En camino] [⚠️ Tengo retraso]
```

---

### 1.5 `servicio_cancelado`
**Categoría Meta:** UTILITY  
**Trigger:** Cancelación de servicio

```text
Header: ❌ SERVICIO CANCELADO

Body:
{{1}}, el siguiente servicio ha sido cancelado:

📋 Folio: {{2}}
👤 Cliente: {{3}}
📅 Fecha: {{4}}

Motivo: {{5}}

Tu disponibilidad ha sido actualizada automáticamente.
```

---

### 1.6 `confirmacion_posicionamiento`
**Categoría Meta:** UTILITY  
**Trigger:** Check-in exitoso del custodio

```text
Header: ✅ POSICIÓN CONFIRMADA

Body:
{{1}}, tu posición ha sido registrada:

📍 Ubicación: {{2}}
⏰ Hora: {{3}}
📋 Servicio: {{4}}

El cliente ha sido notificado de tu llegada.
```

---

### 1.7 `servicio_completado`
**Categoría Meta:** UTILITY  
**Trigger:** Finalización de servicio

```text
Header: 🎉 SERVICIO COMPLETADO

Body:
{{1}}, ¡excelente trabajo!

El servicio {{2}} ha sido completado exitosamente.

⭐ Recuerda calificar tu experiencia en la app.

Puntos ganados: +{{3}} 🏆
```

---

## 2. Templates de Checklist y GPS (5 templates)

### 2.1 `alerta_checklist_pendiente`
**Categoría Meta:** UTILITY  
**Trigger:** `ChecklistAlertPanel.tsx` - Checklist no completado a 60 min

```text
Header: ⚠️ CHECKLIST PENDIENTE

Body:
{{1}}, tienes un checklist sin completar:

📋 Servicio: {{2}}
👤 Cliente: {{3}}
⏰ Hora cita: {{4}}

Completa el checklist desde la app Detecta antes de iniciar.

Buttons:
[📋 Completar ahora] [❓ Tengo un problema]
```

---

### 2.2 `alerta_gps_fuera_rango`
**Categoría Meta:** UTILITY  
**Trigger:** Validación GPS > 500m del origen

```text
Header: 📍 ALERTA GPS

Body:
{{1}}, detectamos que tu ubicación está lejos del punto de origen:

📋 Servicio: {{2}}
📍 Distancia: {{3}} metros

Si hay un cambio de ubicación, notifica a monitoreo.

Buttons:
[📞 Llamar a Monitoreo] [✅ Todo en orden]
```

---

### 2.3 `alerta_gps_sin_datos`
**Categoría Meta:** UTILITY  
**Trigger:** Fotos sin metadata GPS

```text
Header: ⚠️ GPS NO DETECTADO

Body:
{{1}}, las fotos del checklist no tienen ubicación GPS:

📋 Servicio: {{2}}

Verifica que tu teléfono tenga el GPS activado y vuelve a tomar las fotos.

Buttons:
[📷 Retomar fotos] [📞 Soporte técnico]
```

---

### 2.4 `alerta_item_critico`
**Categoría Meta:** UTILITY  
**Trigger:** Fallo en item crítico (frenos, llantas)

```text
Header: 🚨 ALERTA DE SEGURIDAD

Body:
{{1}}, se detectó un problema crítico en la inspección:

⚠️ {{2}}
📋 Servicio: {{3}}

Por seguridad, NO inicies el servicio hasta resolver este tema.

Buttons:
[📞 Contactar Supervisor] [✅ Problema resuelto]
```

---

### 2.5 `checklist_aprobado`
**Categoría Meta:** UTILITY  
**Trigger:** Checklist completado sin alertas

```text
Header: ✅ CHECKLIST APROBADO

Body:
{{1}}, tu checklist pre-servicio está completo:

📋 Servicio: {{2}}
⏰ Hora cita: {{3}}
📍 Origen: {{4}}

Estás listo para iniciar. ¡Buen servicio!
```

---

## 3. Templates de Tickets de Soporte (5 templates)

### 3.1 `ticket_creado`
**Categoría Meta:** UTILITY  
**Trigger:** Creación automática de ticket desde WhatsApp

```text
Header: 🎫 TICKET CREADO

Body:
Hola {{1}},

Hemos recibido tu solicitud:

📋 Ticket: {{2}}
📂 Categoría: {{3}}
⏰ Tiempo de respuesta: {{4}}

Un agente te contactará pronto. Puedes responder a este chat para agregar información.
```

---

### 3.2 `ticket_asignado`
**Categoría Meta:** UTILITY  
**Trigger:** Asignación de agente al ticket

```text
Header: 👤 AGENTE ASIGNADO

Body:
{{1}}, tu ticket {{2}} ha sido asignado:

👤 Agente: {{3}}
📂 Departamento: {{4}}

El agente revisará tu caso y te contactará pronto.
```

---

### 3.3 `ticket_actualizado`
**Categoría Meta:** UTILITY  
**Trigger:** Respuesta de agente

```text
Header: 📝 ACTUALIZACIÓN DE TICKET

Body:
{{1}}, hay novedades en tu ticket {{2}}:

Estado: {{3}}
Mensaje: {{4}}

Puedes responder a este mensaje para continuar la conversación.
```

---

### 3.4 `ticket_resuelto`
**Categoría Meta:** UTILITY  
**Trigger:** Ticket marcado como resuelto

```text
Header: ✅ TICKET RESUELTO

Body:
{{1}}, tu ticket {{2}} ha sido resuelto:

Solución: {{3}}

¿Te fue útil esta atención?

Buttons:
[👍 Sí, gracias] [👎 No resolvió] [📞 Reabrir ticket]
```

---

### 3.5 `ticket_encuesta_csat`
**Categoría Meta:** UTILITY  
**Trigger:** Post-resolución (24h después)

```text
Header: ⭐ TU OPINIÓN IMPORTA

Body:
{{1}}, ¿cómo calificarías la atención de tu ticket {{2}}?

Tu retroalimentación nos ayuda a mejorar.

Buttons:
[😊 Excelente] [😐 Regular] [😞 Deficiente]
```

---

## 4. Templates de Onboarding de Custodios (4 templates)

### 4.1 `custodio_invitacion`
**Categoría Meta:** UTILITY  
**Trigger:** `InvitationActionsDropdown.tsx`, `LiberacionSuccessModal.tsx`

```text
Header: 🛡️ BIENVENIDO A DETECTA

Body:
¡Hola {{1}}! 🎉

Ya eres parte del equipo de custodios de Detecta.

Para activar tu cuenta, usa este link:
{{2}}

⚠️ Este link es personal y expira en 7 días.

Footer: Equipo Detecta
```

---

### 4.2 `onboarding_documentos_pendientes`
**Categoría Meta:** UTILITY  
**Trigger:** `CustodianOnboarding.tsx` - Documentos faltantes

```text
Header: 📄 DOCUMENTOS PENDIENTES

Body:
{{1}}, para completar tu registro necesitas subir:

{{2}}

Ingresa a tu portal para subir los documentos:
{{3}}

⏰ Tienes {{4}} días para completar este paso.

Buttons:
[📤 Subir documentos] [❓ Necesito ayuda]
```

---

### 4.3 `onboarding_documento_vencido`
**Categoría Meta:** UTILITY  
**Trigger:** Documento próximo a vencer

```text
Header: ⚠️ DOCUMENTO POR VENCER

Body:
{{1}}, tu {{2}} vence el {{3}}.

Para seguir operando, actualiza tu documento antes de la fecha de vencimiento.

Buttons:
[📤 Actualizar documento] [📞 Soporte]
```

---

### 4.4 `onboarding_completado`
**Categoría Meta:** UTILITY  
**Trigger:** Onboarding finalizado exitosamente

```text
Header: 🎉 REGISTRO COMPLETADO

Body:
¡Felicidades {{1}}!

Tu registro como custodio está completo. Ya puedes recibir asignaciones de servicio.

Descarga la app Detecta:
📱 Android: {{2}}
🍎 iOS: {{3}}

¡Bienvenido al equipo! 🛡️
```

---

## 5. Templates de Evaluaciones SIERCP (3 templates)

### 5.1 `siercp_invitacion`
**Categoría Meta:** UTILITY  
**Trigger:** `SendSIERCPDialog.tsx`

```text
Header: 🧠 EVALUACIÓN PSICOMÉTRICA

Body:
Hola {{1}},

Te invitamos a completar tu evaluación SIERCP:

🔗 {{2}}

⏰ El enlace es válido por {{3}} horas.

Esta evaluación es requerida para continuar con tu proceso de selección.

Buttons:
[📝 Iniciar evaluación] [❓ Tengo dudas]
```

---

### 5.2 `siercp_recordatorio`
**Categoría Meta:** UTILITY  
**Trigger:** 24h después de envío sin completar

```text
Header: ⏰ RECORDATORIO SIERCP

Body:
{{1}}, tu evaluación SIERCP está pendiente:

🔗 {{2}}

⚠️ El enlace expira en {{3}} horas.

Completa la evaluación para avanzar en tu proceso.

Buttons:
[📝 Completar ahora]
```

---

### 5.3 `siercp_completada`
**Categoría Meta:** UTILITY  
**Trigger:** Evaluación finalizada

```text
Header: ✅ EVALUACIÓN COMPLETADA

Body:
{{1}}, has completado tu evaluación SIERCP.

Nuestro equipo revisará los resultados y te contactaremos pronto.

Gracias por tu participación.
```

---

## 6. Templates de LMS y Capacitación (4 templates)

### 6.1 `lms_curso_asignado`
**Categoría Meta:** UTILITY  
**Trigger:** Inscripción masiva o individual

```text
Header: 📚 NUEVO CURSO ASIGNADO

Body:
{{1}}, tienes un nuevo curso asignado:

📖 {{2}}
⏰ Duración: {{3}}
📅 Fecha límite: {{4}}

Accede desde tu portal de capacitación.

Buttons:
[📚 Ir al curso] [📅 Recordarme después]
```

---

### 6.2 `lms_curso_recordatorio`
**Categoría Meta:** UTILITY  
**Trigger:** Curso pendiente con fecha límite próxima

```text
Header: ⏰ CURSO PENDIENTE

Body:
{{1}}, tu curso "{{2}}" vence en {{3}} días.

Progreso actual: {{4}}%

Completa el curso para evitar penalizaciones.

Buttons:
[📚 Continuar curso]
```

---

### 6.3 `lms_quiz_disponible`
**Categoría Meta:** UTILITY  
**Trigger:** Quiz desbloqueado

```text
Header: 📝 QUIZ DISPONIBLE

Body:
{{1}}, ya puedes tomar el quiz del módulo "{{2}}":

⏱️ Tiempo: {{3}} minutos
📊 Intentos: {{4}}/3

Debes aprobar con mínimo 80%.

Buttons:
[📝 Iniciar quiz]
```

---

### 6.4 `lms_certificado_emitido`
**Categoría Meta:** UTILITY  
**Trigger:** Curso completado con certificado

```text
Header: 🏆 CERTIFICADO EMITIDO

Body:
¡Felicidades {{1}}! 🎉

Has completado el curso "{{2}}" y tu certificado está listo.

📜 Código: {{3}}
🔗 Descargar: {{4}}

+{{5}} puntos de gamificación 🏅
```

---

## 7. Templates de Adquisición de Leads (3 templates)

### 7.1 `lead_bienvenida`
**Categoría Meta:** MARKETING  
**Trigger:** Nuevo lead registrado

```text
Header: 🛡️ ÚNETE A DETECTA

Body:
¡Hola {{1}}!

Gracias por tu interés en ser custodio de Detecta.

✅ Ingresos competitivos
✅ Horarios flexibles
✅ Capacitación continua
✅ Seguro y prestaciones

¿Listo para dar el siguiente paso?

Buttons:
[📝 Completar registro] [📞 Más información]
```

---

### 7.2 `lead_seguimiento`
**Categoría Meta:** MARKETING  
**Trigger:** Lead sin completar registro (48h)

```text
Header: 🤝 TE ESTAMOS ESPERANDO

Body:
{{1}}, notamos que iniciaste tu proceso con Detecta pero no lo completaste.

¿Tienes alguna duda? Estamos aquí para ayudarte.

Zonas con alta demanda: {{2}}

Buttons:
[📝 Continuar registro] [📞 Hablar con reclutador]
```

---

### 7.3 `lead_armados_campana`
**Categoría Meta:** MARKETING  
**Trigger:** Campaña de adquisición de armados

```text
Header: 🎯 OPORTUNIDAD ARMADOS

Body:
{{1}}, estamos buscando personal armado certificado para nuestra red de seguridad.

Requisitos:
✅ Licencia de portación vigente
✅ Experiencia comprobable
✅ Disponibilidad inmediata

Beneficios exclusivos para armados certificados.

Buttons:
[📝 Aplicar ahora] [📞 Más información]
```

---

## 8. Templates de Supply y Operaciones (3 templates)

### 8.1 `supply_entrevista_programada`
**Categoría Meta:** UTILITY  
**Trigger:** Entrevista agendada

```text
Header: 📅 ENTREVISTA PROGRAMADA

Body:
{{1}}, tu entrevista ha sido agendada:

📅 Fecha: {{2}}
⏰ Hora: {{3}}
📍 Modalidad: {{4}}
👤 Entrevistador: {{5}}

{{6}}

Buttons:
[✅ Confirmar asistencia] [🔄 Reagendar]
```

---

### 8.2 `supply_documentacion_solicitada`
**Categoría Meta:** UTILITY  
**Trigger:** Solicitud de documentos adicionales

```text
Header: 📄 DOCUMENTOS REQUERIDOS

Body:
{{1}}, para avanzar en tu proceso necesitamos:

{{2}}

Envía los documentos respondiendo a este mensaje o súbelos en el portal.

⏰ Tienes {{3}} días para enviarlos.

Buttons:
[📤 Subir documentos] [❓ Tengo dudas]
```

---

### 8.3 `supply_aprobacion_final`
**Categoría Meta:** UTILITY  
**Trigger:** Candidato aprobado

```text
Header: 🎉 ¡APROBADO!

Body:
¡Felicidades {{1}}!

Has sido aprobado para unirte al equipo de Detecta como {{2}}.

Próximos pasos:
1️⃣ Completar onboarding digital
2️⃣ Firmar contrato
3️⃣ Recibir capacitación inicial

Te contactaremos para coordinar tu inicio.

Buttons:
[📝 Iniciar onboarding]
```

---

## Resumen de Templates por Categoría

| Categoría | Cantidad | Tipo Meta |
|-----------|----------|-----------|
| Servicios y Planeación | 7 | UTILITY |
| Checklist y GPS | 5 | UTILITY |
| Tickets de Soporte | 5 | UTILITY |
| Onboarding Custodios | 4 | UTILITY |
| Evaluaciones SIERCP | 3 | UTILITY |
| LMS y Capacitación | 4 | UTILITY |
| Adquisición de Leads | 3 | MARKETING |
| Supply y Operaciones | 3 | UTILITY |
| **TOTAL** | **34** | |

---

## Detalles Técnicos

### Estructura de Variables

Cada template usa variables numeradas `{{1}}` a `{{n}}` según los requisitos de Meta. Las variables comunes son:

| Variable | Uso Típico |
|----------|-----------|
| `{{1}}` | Nombre del destinatario |
| `{{2}}` | Identificador principal (servicio, ticket, curso) |
| `{{3}}` | Fecha o tiempo |
| `{{4}}` | Información secundaria |
| `{{5}}-{{n}}` | Contexto adicional |

### IDs de Botones Interactivos

Los botones de respuesta rápida usan prefijos estandarizados:

```typescript
const BUTTON_PREFIXES = {
  CONFIRM_SERVICE: 'CONFIRM_SERVICE_',
  REJECT_SERVICE: 'REJECT_SERVICE_',
  NEED_HELP: 'NEED_HELP_',
  CHECKLIST_DONE: 'CHECKLIST_DONE_',
  CHECKLIST_HELP: 'CHECKLIST_HELP_',
  TICKET_REOPEN: 'TICKET_REOPEN_',
  LMS_START: 'LMS_START_',
  LEAD_REGISTER: 'LEAD_REGISTER_',
  CSAT_POSITIVE: 'CSAT_POSITIVE_',
  CSAT_NEGATIVE: 'CSAT_NEGATIVE_'
}
```

### Categorías Meta

- **UTILITY**: Templates transaccionales (notificaciones, confirmaciones, alertas)
- **MARKETING**: Templates promocionales (requieren opt-in del usuario)

---

## Componentes a Actualizar

Los siguientes componentes deberán integrarse con el hook `useKapsoWhatsApp`:

1. `PendingAssignmentModal.tsx` → `servicio_asignado`
2. `ReassignmentModal.tsx` → `servicio_reasignado`
3. `ChecklistAlertPanel.tsx` → `alerta_checklist_pendiente`
4. `ChecklistDetailModal.tsx` → Recordatorios GPS
5. `InvitationActionsDropdown.tsx` → `custodio_invitacion`
6. `LiberacionSuccessModal.tsx` → `custodio_invitacion`
7. `SendSIERCPDialog.tsx` → `siercp_invitacion`
8. `BulkInvitationWizard.tsx` → Envío masivo
9. `TicketsList.tsx` → Templates de tickets
10. `LMSDashboard.tsx` → Recordatorios de cursos

---

## Proceso de Aprobación en Meta

1. Crear templates en Meta Business Suite
2. Esperar aprobación (24-48h típico)
3. Configurar nombres en `DETECTA_TEMPLATE_NAMES`
4. Probar desde Settings → WhatsApp Kapso
5. Integrar en componentes

---

## Próximos Pasos

1. Aprobar este diseño de templates
2. Crear templates en dashboard de Meta/Kapso
3. Actualizar `src/types/kapso.ts` con todos los nombres
4. Extender `useKapsoWhatsApp` con helpers específicos
5. Migrar cada componente a usar Kapso API
