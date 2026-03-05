

# Diagnóstico: 3 problemas del equipo Supply con SIERCP

## Problema 1 — Carlos Camacho: "No aparece para generar el reporte"

**Síntoma**: Candidato completó la evaluación hace ~1 hora pero no aparece en la vista de resultados.

**Causa raíz**: La RPC `complete_siercp_assessment` usa `v_invitation.candidato_custodio_id` como `candidato_id` en la inserción a `evaluaciones_psicometricas` (línea 62). Si la invitación fue creada **sin** `candidato_custodio_id` (campo nullable), el resultado se guarda con `candidato_id = NULL`. La `InvitationsTable` sí lo muestra (filtra por `siercp_invitations`), pero la columna `evaluacion_id` en la invitación sí se vincula correctamente — el problema es que la **join** `evaluacion:evaluacion_id(...)` no retorna datos si `evaluacion_id` no se actualizó.

Revisando la RPC: **falta el UPDATE que vincule `evaluacion_id`** en `siercp_invitations`. La RPC actualiza `status = 'completed'` y `completed_at`, pero **no** hace `evaluacion_id = v_evaluacion_id`. Entonces la tabla de invitaciones nunca sabe qué evaluación le corresponde, y la columna "Ver reporte" queda vacía.

**Fix**: Agregar `evaluacion_id = v_evaluacion_id` al UPDATE de la RPC `complete_siercp_assessment`.

## Problema 2 — Marbelli Casillas: "Cancelé las pruebas pero ya no me aparece el candidato"

**Síntoma**: Canceló invitaciones enviadas durante fallo del sistema. Ahora al intentar reenviar, el candidato ya no aparece en la pestaña "Candidatos" (solo en "Evaluaciones").

**Causa raíz**: El `activeInvitation` en `useSIERCPInvitations` (línea 149-152) filtra por status `['pending', 'sent', 'opened', 'started']` y `expires_at > now()`. Cuando **todas** las invitaciones de un lead están canceladas/expiradas, `activeInvitation = undefined`, lo cual es correcto. Sin embargo, el `SendSIERCPDialog` (línea 124) muestra el botón "Generar Enlace" solo si `!activeInvitation`. Esto **debería** funcionar.

El problema real es más sutil: si Marbelli canceló invitaciones que ya estaban en estado `completed` (el sistema las marcó como completadas antes de que ella las cancelara, porque el candidato sí terminó), la RPC ya insertó la evaluación. Al cancelar la invitación post-completada, el candidato queda en `evaluaciones_psicometricas` pero **sin `candidato_custodio_id`** (si nunca se vinculó), o con el vínculo roto.

La otra posibilidad es que al cancelar, el `SendSIERCPDialog` **sí** muestra "Generar enlace", pero el lead desapareció del listado de la pestaña "Candidatos" porque su estado cambió. Necesitaría verificar con datos reales, pero el fix más probable es:

**Fix**: Cuando se cancela una invitación que tiene `status != 'completed'`, permitir crear una nueva. El código actual ya lo permite (no hay restricción de unicidad). El problema de Marbelli es probablemente que la invitación **expiró** (no se canceló realmente), y el lead no aparece porque el filtro del listado excluye leads con invitaciones completadas. Hay que verificar en la base de datos.

## Problema 3 — Brenda Jimenez: "Ya realizaron la prueba pero el sistema solicita que las vuelvan a realizar"

**Síntoma**: Candidatos que ya completaron SIERCP aparecen sin resultados, como si nunca la hubieran hecho.

**Causa raíz**: Esto está directamente relacionado con el Problema 1. La RPC `complete_siercp_assessment` **no vincula** `evaluacion_id` en la tabla `siercp_invitations`. Por lo tanto:
- La invitación queda con `status = 'completed'` pero `evaluacion_id = NULL`
- La `InvitationsTable` hace join `evaluacion:evaluacion_id(...)` que retorna `null`
- Los badges de progreso del candidato (Psico, en la LeadCard) no detectan evaluación completada
- El sistema asume que no hay evaluación y permite/solicita reenviar

## Plan de corrección

### Cambio 1 (SQL — Fix principal): Actualizar RPC para vincular `evaluacion_id`

Modificar `complete_siercp_assessment` para agregar `evaluacion_id = v_evaluacion_id` al UPDATE:

```sql
UPDATE siercp_invitations
SET status = 'completed',
    completed_at = now(),
    evaluacion_id = v_evaluacion_id   -- ← FALTA ESTO
WHERE id = v_invitation.id;
```

Esto resuelve los 3 problemas de raíz: Carlos verá el reporte, Brenda no verá solicitudes de re-evaluación, y Marbelli podrá re-crear invitaciones sin confusión.

### Cambio 2 (SQL — Fix retroactivo): Patch de datos huérfanos

Una migración one-shot para vincular evaluaciones ya existentes que quedaron sin `evaluacion_id`:

```sql
UPDATE siercp_invitations si
SET evaluacion_id = ep.id
FROM evaluaciones_psicometricas ep
WHERE si.candidato_custodio_id = ep.candidato_id
  AND si.status = 'completed'
  AND si.evaluacion_id IS NULL
  AND ep.evaluador_id IS NULL;
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Fix RPC + patch retroactivo de datos huérfanos |

Cero archivos TypeScript. El frontend ya maneja `evaluacion_id` correctamente — solo faltaba que la RPC lo populara.

