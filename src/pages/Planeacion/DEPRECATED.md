# Componentes Deprecados - Módulo Planeación

## ⚠️ NO ELIMINAR ESTOS ARCHIVOS HASTA: 2026-02-01

Este documento registra los componentes legacy que han sido reemplazados por el nuevo sistema de creación de servicios.

---

## Sistema Legacy de Creación de Servicios

### Componente Principal Deprecado

| Archivo | Líneas | Reemplazo | Estado |
|---------|--------|-----------|--------|
| `components/RequestCreationWorkflow.tsx` | ~1,331 | `ServiceCreation/` (modular) | ⚠️ DEPRECATED |

### Componentes Workflow Deprecados

| Archivo Legacy | Reemplazo Nuevo Sistema | Estado |
|----------------|-------------------------|--------|
| `components/workflow/RouteSearchStep.tsx` | `ServiceCreation/steps/RouteStep/` | ⚠️ DEPRECATED |
| `components/workflow/ServiceAutoFillStep.tsx` | `ServiceCreation/steps/ServiceStep/` | ⚠️ DEPRECATED |
| `components/workflow/CustodianAssignmentStep.tsx` | `ServiceCreation/steps/CustodianStep/` | ⚠️ DEPRECATED |
| `components/workflow/EnhancedArmedGuardAssignmentStep.tsx` | `ServiceCreation/steps/ArmedStep/` | ⚠️ DEPRECATED |
| `components/workflow/FinalConfirmationStep.tsx` | `ServiceCreation/steps/ConfirmationStep/` | ⚠️ DEPRECATED |
| `components/workflow/StepIndicator.tsx` | `ServiceCreation/ServiceCreationSidebar.tsx` | ⚠️ DEPRECATED |
| `components/workflow/WorkflowSummary.tsx` | `ServiceCreation/ServicePreviewCard.tsx` | ⚠️ DEPRECATED |
| `components/workflow/ServiceWizardActions.tsx` | Integrado en cada Step | ⚠️ DEPRECATED |
| `components/workflow/FormProgressIndicator.tsx` | `useFormPersistence` hook | ⚠️ DEPRECATED |
| `components/workflow/WorkflowHeader.tsx` | Layout integrado | ⚠️ DEPRECATED |

---

## Por qué mantener temporalmente

1. **Rollback de emergencia**: Si el nuevo sistema presenta bugs críticos, cambiar `FEATURE_FLAGS.USE_NEW_SERVICE_CREATION = false` restaura el sistema legacy inmediatamente.

2. **Referencia para migración**: Algunas lógicas específicas pueden necesitar ser portadas al nuevo sistema.

3. **Verificación de dependencias**: Tiempo para confirmar que no hay imports ocultos o dependencias externas.

---

## Feature Flag de Control

```typescript
// src/constants/featureFlags.ts
export const FEATURE_FLAGS = {
  USE_NEW_SERVICE_CREATION: true, // Set to false for emergency rollback
};
```

---

## LocalStorage Keys Legacy

El sistema legacy usa las siguientes keys que deben limpiarse después del periodo de observación:

- `service_creation_workflow_*` - Borradores del sistema legacy
- `scw_suppress_restore` - Flag de sesión legacy
- `scw_force_restore` - Flag de sesión legacy

El nuevo sistema usa:
- `service-draft-*` - Borradores del nuevo sistema

---

## Fecha de eliminación segura

**Después de: 2026-02-01** (2 semanas de observación en producción)

### Checklist pre-eliminación:

- [ ] Confirmar que no hay errores en logs relacionados con RequestCreationWorkflow
- [ ] Verificar que todos los usuarios están usando el nuevo sistema
- [ ] Limpiar localStorage keys legacy
- [ ] Remover feature flag
- [ ] Eliminar archivos listados arriba
- [ ] Actualizar este documento

---

## Contacto

Para preguntas sobre esta migración, consultar el historial de commits o los memory entries relacionados:
- `memory/features/planning/service-creation-*`
- `memory/bug-fixes/planning/creation-workflow-*`
