

# Integrar SIERCP como paso obligatorio antes de Liberacion

## Situacion actual

El flujo actual es:
```text
Lead -> Entrevista exitosa -> Aprobar -> Liberar custodio
```

La opcion "Aplicar SIERCP" existe pero esta escondida en el menu dropdown de "mas acciones" y no es obligatoria. El `SendSIERCPDialog` ya funciona: genera un token, muestra el link copiable, y tiene botones de WhatsApp/Email.

## Flujo propuesto

```text
Lead -> Entrevista exitosa -> Aprobar -> Enviar SIERCP -> [Candidato completa] -> Liberar
```

### Que cambia para el usuario

1. **Al aprobar un candidato**, en lugar de ver directamente el boton "Liberar", vera un boton **"Enviar SIERCP"** (con icono Brain, color morado)
2. Al hacer clic se abre el dialog existente `SendSIERCPDialog` donde puede:
   - Generar el link unico
   - **Copiar el link** para enviar manualmente (opcion principal mientras WhatsApp no esta 100%)
   - Enviar por WhatsApp (abre wa.me con mensaje pre-armado)
   - Enviar por Email (abre mailto)
3. Una vez que el SIERCP esta **completado**, el boton cambia a **"Liberar"** (flujo actual)
4. Si el SIERCP esta **pendiente/enviado**, se muestra un badge indicando el estado ("SIERCP Enviado", "SIERCP En progreso")

## Cambios tecnicos

### 1. `src/components/leads/approval/ImprovedLeadCard.tsx`

- Agregar query a `siercp_invitations` para el lead actual (usar `useSIERCPInvitations`)
- Modificar la seccion de botones post-aprobacion (lineas 205-225):

| Condicion | Boton mostrado |
|-----------|---------------|
| Aprobado + Sin invitacion SIERCP | "Enviar SIERCP" (abre dialog) |
| Aprobado + SIERCP enviado/pendiente | Badge de estado + "Ver SIERCP" |
| Aprobado + SIERCP completado + vinculado | "Liberar" (flujo actual) |
| Aprobado + SIERCP completado + no vinculado | "Re-vincular" (flujo actual) |

- Agregar badge visual en la tarjeta mostrando estado SIERCP cuando aplique

### 2. `src/components/leads/approval/SendSIERCPDialog.tsx`

- Enfatizar la opcion de **copiar link** como accion principal (boton mas grande/prominente)
- Mantener WhatsApp y Email como opciones secundarias
- Agregar texto explicativo: "Copia el link y envialo manualmente al candidato"

### 3. `src/components/leads/approval/LeadCard.tsx` (card legacy)

- Aplicar la misma logica de estados SIERCP para consistencia

### 4. Sin cambios en backend

- La tabla `siercp_invitations` ya existe con todos los campos necesarios
- El hook `useSIERCPInvitations` ya tiene toda la logica de crear, marcar como enviado, cancelar
- El `getInvitationUrl` ya genera la URL correcta

## Lo que NO se toca

- El proceso de liberacion (`liberar_custodio_a_planeacion_v2`) no cambia
- Las evaluaciones psicometricas existentes en perfiles operativos no cambian
- El flujo de entrevistas y aprobacion no cambia
- La ruta `/assessment/:token` (donde el candidato hace la prueba) no cambia

## Resumen de archivos

- **Editar**: `ImprovedLeadCard.tsx` (logica de botones post-aprobacion + hook SIERCP)
- **Editar**: `SendSIERCPDialog.tsx` (enfatizar opcion copiar link manual)
- **Editar**: `LeadCard.tsx` (consistencia con card legacy)
