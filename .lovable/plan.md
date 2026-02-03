
# Plan: Fix Indisponibilidad Bug in Planning Module

## Root Cause Analysis

The error occurs when planners try to report unavailability from the CustodianStep due to **three mismatches** between the UI component and the database:

| Issue | Location | Problem |
|-------|----------|---------|
| 1. Invalid `tipo_indisponibilidad` | ReportUnavailabilityCard.tsx | UI sends `emergencia_familiar` but DB expects `familiar` |
| 2. Null `motivo` | CustodianStep/index.tsx | `motivo` is required in DB but can be undefined |
| 3. Invalid date | CustodianStep/index.tsx | `addDays(new Date(), null)` when "Hasta nuevo aviso" selected |

## Code Flow

```text
UI Component                    Handler Function               Database
┌────────────────────┐         ┌────────────────────┐         ┌──────────────────┐
│ emergencia_familiar│  ─────▶ │ tipo: data.tipo   │  ─────▶ │ tipo NOT IN enum │ ❌
│ motivo: undefined  │  ─────▶ │ motivo: undefined │  ─────▶ │ motivo NOT NULL  │ ❌  
│ dias: null         │  ─────▶ │ addDays(..., null)│  ─────▶ │ Invalid Date     │ ❌
└────────────────────┘         └────────────────────┘         └──────────────────┘
```

## Solution

### File 1: `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/index.tsx`

**Fix the `handleUnavailabilitySubmit` function** (lines 253-280):

```typescript
// BEFORE (buggy)
const handleUnavailabilitySubmit = async (data: {
  tipo: string;
  motivo: string;
  dias: number;
}) => {
  await crearIndisponibilidad.mutateAsync({
    custodio_id: unavailabilityCustodian.id,
    tipo_indisponibilidad: data.tipo as any,
    motivo: data.motivo,  // Can be undefined!
    fecha_fin_estimada: addDays(new Date(), data.dias).toISOString(),  // null produces Invalid Date
    // ...
  });
};

// AFTER (fixed)
const handleUnavailabilitySubmit = async (data: {
  tipo: string;
  motivo?: string;
  dias: number | null;
}) => {
  // Map UI types to DB-compatible types
  const tipoMapping: Record<string, string> = {
    'emergencia_familiar': 'familiar',
    'falla_mecanica': 'falla_mecanica',
    'enfermedad': 'enfermedad',
    'capacitacion': 'capacitacion',
    'otro': 'otro',
  };
  
  const tipoDb = tipoMapping[data.tipo] || 'otro';
  const motivoDb = data.motivo || tipoDb; // Fallback to type if no notes
  
  await crearIndisponibilidad.mutateAsync({
    custodio_id: unavailabilityCustodian.id,
    tipo_indisponibilidad: tipoDb as any,
    motivo: motivoDb,  // Always has a value now
    fecha_fin_estimada: data.dias 
      ? addDays(new Date(), data.dias).toISOString() 
      : undefined,  // undefined for "indefinido"
    // ...
  });
};
```

## Changes Summary

| File | Change |
|------|--------|
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/index.tsx` | Fix type signature, add mapping for `emergencia_familiar` to `familiar`, handle null `dias`, provide default `motivo` |

## Validation

After fix:
- "Emergencia familiar" + "Hasta nuevo aviso" + no notes = Should insert successfully
- All duration options work correctly
- All reason types map to valid DB values
