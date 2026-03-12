

# Fix: Upload de documentos, contratos y socioeconómico para armados

## Problemas encontrados

### 1. Estudio Socioeconómico falla para armados (mismo bug que capacitación)
**`estudios_socioeconomicos`** tiene un FK rígido a `candidatos_custodios`:
```
estudios_socioeconomicos_candidato_id_fkey → candidatos_custodios(id) ON DELETE CASCADE
```
Cuando se intenta guardar un estudio socioeconómico para un candidato armado, el insert falla con foreign key violation — idéntico al bug de `progreso_capacitacion` que acabamos de resolver.

### 2. Contratos exigen contrato de vehículo a armados
`getContratosRequeridosParaCandidato()` siempre incluye un contrato de vehículo (`prestacion_servicios_propietario` o `prestacion_servicios_no_propietario`). Para armados sin vehículo esto no tiene sentido — el contrato de vehículo debe ser **opcional** para ambos tipos cuando no tienen vehículo propio.

La función actual:
```typescript
function getContratosRequeridosParaCandidato(vehiculoPropio: boolean): TipoContrato[] {
  return [
    ...CONTRATOS_REQUERIDOS, // confidencialidad, aviso_privacidad, anexo_gps
    vehiculoPropio ? propietario : noPropietario  // ← SIEMPRE incluye uno
  ];
}
```

El problema: siempre agrega un contrato de vehículo. Para armados (y custodios tipo `abordo` que tampoco tienen vehículo), el contrato de vehículo no aplica.

### 3. Upload de documentos para armados — sin error de FK
`documentos_candidato` ya usa un trigger de validación dual (`validate_candidato_id_both_tables`), por lo que los uploads de documentos funcionan correctamente a nivel DB. Si hay error visible, es probable que sea un efecto cascada del socioeconómico o un tema de UI. No se encontró bug técnico aquí.

---

## Cambios

### Migración SQL: Relajar FK de `estudios_socioeconomicos`
Mismo patrón aplicado a `progreso_capacitacion`:
- Drop `estudios_socioeconomicos_candidato_id_fkey`
- Crear trigger `validate_estudio_candidato_id()` que valide en ambas tablas

### Código: Hacer contrato de vehículo condicional

**`src/hooks/useContratosCandidato.ts`**: Modificar `getContratosRequeridosParaCandidato` para recibir un segundo parámetro `tieneVehiculo` (o renombrar para mayor claridad). Si el candidato no tiene vehículo (armados sin vehículo, tipo abordo), no incluir contrato de prestación de servicios vehicular.

```typescript
// Antes: siempre incluye contrato vehículo
function getContratosRequeridosParaCandidato(vehiculoPropio: boolean)

// Después: solo incluye si aplica vehículo
function getContratosRequeridosParaCandidato(vehiculoPropio: boolean, tieneVehiculo: boolean = true)
```

Cuando `tieneVehiculo === false`, solo retorna `CONTRATOS_REQUERIDOS` (confidencialidad, aviso_privacidad, anexo_gps).

**`src/components/recruitment/CandidateEvaluationPanel.tsx`**: Pasar `tieneVehiculo` basándose en el `tipoOperativo` y datos del candidato. Para armados sin `vehiculo_propio` y sin `armado_vehiculo`, `tieneVehiculo = false`.

**`src/components/recruitment/contracts/ContractsTab.tsx`**: Recibir nuevo prop `tieneVehiculo` y ocultar la sección de contrato vehicular cuando no aplica.

**`src/components/liberacion/LiberacionChecklistModal.tsx`**: Ajustar la llamada a `useContratosProgress` para pasar `tieneVehiculo`.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Drop FK + trigger dual para `estudios_socioeconomicos` |
| `src/hooks/useContratosCandidato.ts` | Parámetro `tieneVehiculo` en `getContratosRequeridosParaCandidato` |
| `src/components/recruitment/contracts/ContractsTab.tsx` | Prop `tieneVehiculo`, ocultar contrato vehicular si no aplica |
| `src/components/recruitment/CandidateEvaluationPanel.tsx` | Calcular `tieneVehiculo` según tipo operativo y pasar a ContractsTab |
| `src/components/liberacion/LiberacionChecklistModal.tsx` | Ajustar llamada a contratosProgress |

