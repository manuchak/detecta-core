

# Checklist de Pruebas Pre-Deploy

Basado en el análisis del código, hay **un bug crítico activo** y múltiples áreas que necesitan validación. Genero el checklist como documento Markdown descargable.

## Bug Crítico Detectado: ScenarioSimulator

El `ScenarioSimulator.tsx` usa columnas que **no existen** en la tabla `whatsapp_messages`:
- `direction` → no existe (la tabla usa `is_from_bot` + `sender_type`)
- `phone_number` → no existe (la tabla usa `sender_phone` o `chat_id`)
- `message_body` → no existe (la tabla usa `message_text`)
- `status` → no existe (la tabla usa `delivery_status`)
- `kapso_message_id` → no existe (la tabla usa `message_id`)

Esto explica el error rojo en el screenshot: *"Could not find the 'direction' column of 'whatsapp_messages' in the schema cache"*

## Plan de Entrega

1. **Crear documento de checklist** en `/mnt/documents/` con todas las pruebas organizadas por módulo
2. **Corregir el ScenarioSimulator** — mapear columnas al schema real de `whatsapp_messages`

### Módulos a cubrir en el checklist:

| Módulo | Área de Prueba |
|---|---|
| **Gastos Extraordinarios** | Flujo Ops→Finanzas completo (pendiente→aprobado→autorizado→pagado) |
| **Gastos Extraordinarios** | Rechazo por Finanzas (rechazado_finanzas con motivo obligatorio) |
| **Gastos Extraordinarios** | Histórico filtrado por modo (ops vs finanzas) |
| **Vencimiento Inteligente** | Cálculo con dia_corte + dia_pago configurados |
| **Vencimiento Inteligente** | Fallback a dias_credito cuando no hay ciclo fiscal |
| **Vencimiento Inteligente** | Override manual en GenerarFacturaModal |
| **Vencimiento Inteligente** | Explicación visual en ClienteFormModal tab Crédito |
| **ScenarioSimulator** | Fix de columnas y ejecución de los 3 escenarios E2E |
| **Comunicaciones** | Mensajes por canal (planeacion, c4, cliente) |
| **Control de Acceso** | finanzas_admin tiene acceso completo a Egresos |
| **Control de Acceso** | finanzas (limitado) no puede aprobar/autorizar |

### Archivos a modificar
- **Fix**: `src/components/monitoring/comm/ScenarioSimulator.tsx` — corregir mapeo de columnas
- **Crear**: `/mnt/documents/QA_CHECKLIST_PREDEPLOY.md` — checklist completo

