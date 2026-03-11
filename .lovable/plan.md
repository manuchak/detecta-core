

# Debug Completo: Módulo de Comunicación WhatsApp

## Hallazgos Críticos (7 bugs que impiden el funcionamiento)

### Bug 1: Nombres de campo incorrectos en las llamadas a Edge Functions

`ServiceCommSheet.tsx` envía campos que las Edge Functions no reconocen:

| Lo que envía el frontend | Lo que espera la Edge Function |
|---|---|
| `phone` | `to` |
| `template_name` | `templateName` |
| `language_code` | `languageCode` |
| `message` | `text` |
| *(omitido)* | `type: 'text'` |

**Resultado:** Cada mensaje enviado desde el chat falla silenciosamente -- la Edge Function recibe `undefined` en campos críticos.

### Bug 2: Se envía el NOMBRE del custodio como número de teléfono

`service.custodio_asignado` contiene `"RODRIGO RAINIER BECERRIL VELAZCO"`, NO un número telefónico. El campo correcto es `custodio_telefono` de `servicios_planificados`, pero `BoardService` no lo incluye.

### Bug 3: `BoardService` no carga `custodio_telefono` ni `telefono_cliente`

La query en `useBitacoraBoard` no selecciona estos campos. Sin ellos, es imposible enviar mensajes a nadie.

### Bug 4: `servicio_id` nunca se inserta en los mensajes enviados

Ni `kapso-send-message` ni `kapso-send-template` insertan `servicio_id` en el registro de `whatsapp_messages`. Sin este campo, los mensajes enviados NO aparecen en el chat del servicio (que filtra por `servicio_id`).

### Bug 5: Formato de `components` incorrecto para templates

El frontend envía un **array** (`components: [{ type: 'body', ... }]`), pero la Edge Function espera un **objeto** (`components: { body: { parameters: [...] } }`).

### Bug 6: `telefono_cliente` no disponible para el reporte al cliente

`ClientReportComposer` pide al monitorista escribir manualmente el teléfono del cliente. El campo `telefono_cliente` existe en la BD pero no se pasa al componente.

### Bug 7: `servicio_id` es UUID en BD pero se pasa como string de ID

El campo `servicio_id` en `whatsapp_messages` es tipo `uuid`, y `BoardService.id` es el UUID correcto. Pero hay que asegurarse de que se pase `service.id` (UUID) y no `service.id_servicio` (código alfanumérico).

---

## Plan de Corrección

### 1. Ampliar `BoardService` con campos de teléfono

En `useBitacoraBoard.ts`, agregar `custodio_telefono` y `telefono_cliente` al `select` de `servicios_planificados` y a la interfaz `BoardService`.

### 2. Corregir `ServiceCommSheet.tsx` -- todas las llamadas

- **handleSendNudge**: Cambiar `phone` → `to`, `template_name` → `templateName`, `language_code` → `languageCode`, usar `service.custodio_telefono` en vez de `service.custodio_asignado`, y convertir `components` de array a objeto `{ body: { parameters: [...] } }`.
- **handleSendMessage**: Cambiar `phone` → `to`, `message` → `text`, agregar `type: 'text'`, usar `service.custodio_telefono`, y pasar `context: { servicio_id: service.id }`.
- **handleSendReport**: Mismo fix de `components` format, y pasar `context: { servicio_id: service.id }`.

### 3. Corregir Edge Functions -- insertar `servicio_id`

En `kapso-send-message/index.ts` y `kapso-send-template/index.ts`, aceptar `servicio_id` del `context` y insertarlo en el registro de `whatsapp_messages`.

### 4. Pre-popular `telefono_cliente` en `ClientReportComposer`

Pasar `service.telefono_cliente` como valor default del campo destinatario.

### 5. Validación de teléfono antes de enviar

Agregar guard en `handleSendMessage` y `handleSendNudge`: si `custodio_telefono` no existe, mostrar toast de error en lugar de intentar enviar.

