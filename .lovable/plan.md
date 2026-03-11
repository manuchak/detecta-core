

# Bug: Candidatos armados se insertan en tabla equivocada al aprobar lead

## Causa raíz

El flujo de aprobación de leads (`handleApproveLead` en `useLeadApprovals.ts`) **siempre** llama al RPC `sync_lead_to_candidato`, que inserta exclusivamente en `candidatos_custodios`. No existe lógica para verificar el `tipo_custodio` del lead (almacenado en `notas.tipo_custodio`) y redirigir a `candidatos_armados` cuando corresponde.

```text
Lead (notas.tipo_custodio = "armado")
        │
        ▼
handleApproveLead()
        │
        ▼
sync_lead_to_candidato()  ← siempre inserta en candidatos_custodios ❌
        │
        ▼
EvaluacionesPage (tipoOperativo = "custodio")
        │
        ▼
DocumentsTab muestra: licencia_frente, licencia_reverso ❌
(debería mostrar: portacion_arma, registro_arma)
```

### Datos de Sergio Zuñiga:
- Lead `f1d3fe5e...` con `notas.tipo_custodio = "armado"`
- Insertado en `candidatos_custodios` (id: `30b5922c...`) — **tabla incorrecta**
- No existe en `candidatos_armados`
- El sistema le exige licencia de conducir (requisito de custodio) en lugar de portación/registro de arma

## Corrección propuesta

### 1. Migración SQL — Crear RPC `sync_lead_to_candidato_armado`

Nuevo RPC que inserta en `candidatos_armados` en lugar de `candidatos_custodios`, con los campos específicos de armados (tipo_armado, experiencia, etc.).

### 2. Modificar `handleApproveLead` en `useLeadApprovals.ts`

Antes de llamar al RPC, leer `tipo_custodio` de las notas del lead:

```typescript
const notesData = lead.notas ? JSON.parse(lead.notas) : {};
const tipoCustodio = notesData.tipo_custodio || 'custodio_vehiculo';
const esArmado = tipoCustodio === 'armado';

if (esArmado) {
  // Llamar RPC para candidatos_armados
  await supabase.rpc('sync_lead_to_candidato_armado', { ... });
} else {
  // Flujo actual: candidatos_custodios
  await supabase.rpc('sync_lead_to_candidato', { ... });
}
```

También condicionar la migración de datos vehiculares (líneas 382-416) para que solo aplique a custodios, y migrar datos de seguridad armada a `candidatos_armados` cuando corresponda.

### 3. Fix retroactivo para Sergio Zuñiga (SQL)

- Migrar su registro de `candidatos_custodios` a `candidatos_armados` 
- Reasociar sus documentos existentes (`documentos_candidato.candidato_id`)
- Actualizar `leads.candidato_custodio_id` (o agregar un campo `candidato_armado_id` si existe)

### Archivos impactados

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | RPC `sync_lead_to_candidato_armado` + fix retroactivo de Sergio |
| `src/hooks/useLeadApprovals.ts` | Bifurcar flujo según `tipo_custodio` del lead |

