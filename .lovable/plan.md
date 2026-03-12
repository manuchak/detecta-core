

# Fix: Contratos para armados — Anexo GPS condicional, contrato armado faltante, FK rígido

## Problemas encontrados

### 1. FK rígido en `contratos_candidato`
`contratos_candidato.candidato_id` referencia solo `candidatos_custodios(id)` — los armados no pueden tener contratos. Mismo bug que capacitación y socioeconómico.

### 2. Anexo GPS siempre requerido
`anexo_gps` está en `CONTRATOS_REQUERIDOS` (línea 72 de `useContratosCandidato.ts`), lo que lo hace obligatorio para todos. El anexo GPS solo aplica para candidatos con vehículo.

### 3. No existe contrato de armado
Solo existen `prestacion_servicios_propietario` y `prestacion_servicios_no_propietario` (ambos etiquetados "Contrato Custodio"). No hay un tipo de contrato para el armado como tal. Se necesita un tipo `prestacion_servicios_armado` con su etiqueta "Contrato Armado".

## Cambios

### Migración SQL
- Drop FK `contratos_candidato_candidato_id_fkey`, crear trigger dual-table
- Agregar `prestacion_servicios_armado` al CHECK constraint de `contratos_candidato` y `plantillas_contrato`

### `src/hooks/useContratosCandidato.ts`
- Agregar tipo `prestacion_servicios_armado` al type `TipoContrato`
- Agregar label: `'prestacion_servicios_armado': 'Contrato Armado'`
- Mover `anexo_gps` fuera de `CONTRATOS_REQUERIDOS` y hacerlo condicional a `tieneVehiculo`
- Modificar `getContratosRequeridosParaCandidato` para recibir `isArmado`:
  - Si `tieneVehiculo`: incluir `anexo_gps` + contrato vehicular (propietario/no propietario)
  - Si `isArmado`: incluir `prestacion_servicios_armado` en lugar del contrato custodio
  - Base: `confidencialidad` + `aviso_privacidad`

### `src/components/recruitment/CandidateEvaluationPanel.tsx`
- Pasar `isArmado` a `ContractsTab` y `ContractsProgressBadge`

### `src/components/recruitment/contracts/ContractsTab.tsx`
- Recibir prop `isArmado` y pasarlo a la lógica de contratos requeridos

### `src/components/recruitment/contracts/ContractsProgressBadge.tsx`
- Recibir prop `isArmado` y pasarlo al hook

### `src/components/liberacion/LiberacionChecklistModal.tsx`
- Pasar `isArmado` al hook de contratos progress

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Drop FK + trigger dual + nuevo tipo en CHECK |
| `useContratosCandidato.ts` | Tipo armado, anexo GPS condicional, param `isArmado` |
| `ContractsTab.tsx` | Prop `isArmado` |
| `ContractsProgressBadge.tsx` | Prop `isArmado` |
| `CandidateEvaluationPanel.tsx` | Pasar `isArmado` |
| `LiberacionChecklistModal.tsx` | Pasar `isArmado` |

