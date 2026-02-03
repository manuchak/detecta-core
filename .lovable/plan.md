
# Análisis: Unificación de Flujos de Asignación de Custodios

## Estado Actual ✅

**Los 3 flujos principales YA están unificados** con los mismos componentes modulares:

| Flujo | Archivo | Componentes Modulares |
|-------|---------|----------------------|
| Crear Servicio | `CustodianStep/index.tsx` | QuickStats, CustodianSearch, CustodianList, ConflictSection |
| Asignación Pendiente | `PendingAssignmentModal.tsx` | QuickStats, CustodianSearch, CustodianList, ConflictSection |
| Reasignar/Agregar | `ReassignmentModal.tsx` | QuickStats, CustodianSearch, CustodianList, ConflictSection |

**Características compartidas:**
- Cards con score de compatibilidad (%)
- Equity badges (Priorizar / Alta carga)  
- Historial de 15 días (Local/Foráneo)
- Búsqueda debounced con filtros rápidos
- Virtualización con IntersectionObserver
- Sección de conflictos colapsible

## Diferencias Menores Detectadas

| Aspecto | ServiceCreation | PendingAssignment | Reassignment |
|---------|-----------------|-------------------|--------------|
| Ancho modal | N/A (page) | `max-w-4xl` | `max-w-2xl` |
| Altura lista | `max-h-[400px]` | `max-h-[400px]` | `max-h-[300px]` |
| Reporte indisponibilidad | ✅ | ❌ | ❌ |
| Reporte rechazo | ✅ | ❌ | ❌ |

## Mejoras Propuestas (Opcional)

Para máxima consistencia, se pueden agregar las funcionalidades faltantes:

### 1. Homologar dimensiones de ReassignmentModal

```typescript
// ReassignmentModal.tsx línea 305
<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col z-[60]">
```

### 2. Agregar callbacks de Indisponibilidad/Rechazo a PendingAssignmentModal

```typescript
// PendingAssignmentModal.tsx - Agregar handlers
const handleReportUnavailability = (custodio: CustodioConProximidad) => {
  // Abrir modal de indisponibilidad
  setTargetCustodio(custodio);
  setShowUnavailabilityDialog(true);
};

const handleReportRejection = (custodio: CustodioConProximidad) => {
  // Abrir modal de rechazo tipificado
  setTargetCustodio(custodio);
  setShowRejectionDialog(true);
};

// Pasar a CustodianList
<CustodianList
  ...
  onReportUnavailability={handleReportUnavailability}
  onReportRejection={handleReportRejection}
/>
```

### 3. Agregar callbacks a ReassignmentModal

Misma lógica que punto 2 para `ReassignmentModal.tsx`.

## Archivos a Modificar (Si se aprueban mejoras)

| Archivo | Cambio |
|---------|--------|
| `src/components/planeacion/PendingAssignmentModal.tsx` | Agregar handlers de indisponibilidad/rechazo |
| `src/components/planeacion/ReassignmentModal.tsx` | Homologar dimensiones + agregar handlers |

## Resultado Esperado

| Feature | Crear | Pendiente | Reasignar |
|---------|-------|-----------|-----------|
| QuickStats | ✅ | ✅ | ✅ |
| Search + Filtros | ✅ | ✅ | ✅ |
| CustodianCards | ✅ | ✅ | ✅ |
| Virtualización | ✅ | ✅ | ✅ |
| ConflictSection | ✅ | ✅ | ✅ |
| Reportar Indisponibilidad | ✅ | ✅ (nuevo) | ✅ (nuevo) |
| Reportar Rechazo | ✅ | ✅ (nuevo) | ✅ (nuevo) |

## Detalles Técnicos

Los callbacks de indisponibilidad/rechazo requieren:

1. **Estado adicional**:
```typescript
const [targetCustodio, setTargetCustodio] = useState<CustodioConProximidad | null>(null);
const [showUnavailabilityDialog, setShowUnavailabilityDialog] = useState(false);
const [showRejectionDialog, setShowRejectionDialog] = useState(false);
```

2. **Integración con componentes existentes**:
   - `ReportUnavailabilityCard` para indisponibilidad
   - `RejectionTypificationDialog` para rechazos

3. **Hook de mutación** para persistir cambios en BD:
   - `custodio_indisponibilidades` para indisponibilidad
   - `custodio_rechazos` para rechazos (7 días exclusión)

## Resumen

Los 3 flujos ya comparten la misma **UI base** (componentes modulares). Las mejoras propuestas agregarían las **funcionalidades operacionales** (reportar indisponibilidad/rechazo) que actualmente solo tiene el flujo de ServiceCreation.

Si deseas implementar estas mejoras, confirma y procederé con los cambios.
