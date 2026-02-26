
# Migrar datos de vehiculo del Lead al Candidato al aprobar

## Problema

Los datos del vehiculo (marca, modelo, placas, color, etc.) se recopilan durante la entrevista telefonica en `MissingInfoDialog` y se guardan como JSON en el campo `leads.notas` (bajo la llave `vehiculo`). Sin embargo, cuando el lead se aprueba y se crea el registro en `candidatos_custodios` via `sync_lead_to_candidato`, la funcion RPC solo recibe nombre, email, telefono, fuente y estado_proceso. Los campos vehiculares quedan vacios y aparecen como `[PENDIENTE]` en el dialogo de contratos.

## Solucion

Extraer los datos vehiculares del JSON de notas del lead ANTES de llamar a `sync_lead_to_candidato`, y luego actualizar el candidato recien creado con esos datos. Esto se hace en dos pasos porque la funcion RPC existente no acepta parametros vehiculares y modificarla requeriria una migracion SQL.

## Cambios

### 1. Modificar `handleApproveLead` en `src/hooks/useLeadApprovals.ts`

Despues de que `sync_lead_to_candidato` retorne exitosamente el `candidatoId`:

1. Leer `leads.notas` del lead actual (ya disponible en `lead.notas`)
2. Parsear el JSON y extraer el objeto `vehiculo` y `experiencia`
3. Hacer un `UPDATE` a `candidatos_custodios` con los campos:
   - `marca_vehiculo` desde `notas.vehiculo.marca_vehiculo`
   - `modelo_vehiculo` desde `notas.vehiculo.modelo_vehiculo`
   - `placas_vehiculo` desde `notas.vehiculo.placas`
   - `color_vehiculo` desde `notas.vehiculo.color_vehiculo`
   - `tipo_vehiculo` desde `notas.vehiculo.tipo_vehiculo`
   - `numero_licencia` desde `notas.experiencia.licencia_conducir` (si aplica)
   - `licencia_expedida_por` desde `notas.experiencia.tipo_licencia`
   - `direccion` desde `notas.datos_personales.direccion`

Esto va inmediatamente despues de la linea 379 (`console.log('Candidato vinculado exitosamente')`), antes de actualizar el estado del lead.

### 2. Parseo seguro del JSON de notas

```text
// Pseudocodigo
let notesData = {};
try {
  notesData = lead.notas ? JSON.parse(lead.notas) : {};
} catch { notesData = {}; }

const vehiculo = notesData.vehiculo || {};
const datosPersonales = notesData.datos_personales || {};
const experiencia = notesData.experiencia || {};

// Solo actualizar campos que tengan valor real
const updatePayload = {};
if (vehiculo.marca_vehiculo) updatePayload.marca_vehiculo = vehiculo.marca_vehiculo;
if (vehiculo.modelo_vehiculo) updatePayload.modelo_vehiculo = vehiculo.modelo_vehiculo;
// ... etc para cada campo

if (Object.keys(updatePayload).length > 0) {
  await supabase.from('candidatos_custodios')
    .update(updatePayload)
    .eq('id', candidatoId);
}
```

### Impacto

- Los contratos generados despues de la aprobacion mostraran los datos vehiculares correctamente en lugar de `[PENDIENTE]`
- No requiere migracion SQL (usa UPDATE directo a la tabla existente)
- No afecta leads existentes ya aprobados (solo aplica a nuevas aprobaciones)
- Es tolerante a fallos: si el update de datos vehiculares falla, la aprobacion sigue siendo valida (log warning, no throw)
