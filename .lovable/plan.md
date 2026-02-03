
# Análisis: Unificación de Flujos de Asignación de Custodios

## Estado Actual ✅ COMPLETADO

**Los 3 flujos principales están COMPLETAMENTE unificados** con los mismos componentes modulares:

| Flujo | Archivo | Componentes Modulares |
|-------|---------|----------------------|
| Crear Servicio | `CustodianStep/index.tsx` | QuickStats, CustodianSearch, CustodianList, ConflictSection |
| Asignación Pendiente | `PendingAssignmentModal.tsx` | QuickStats, CustodianSearch, CustodianList, ConflictSection |
| Reasignar/Agregar | `ReassignmentModal.tsx` | QuickStats, CustodianSearch, CustodianList, ConflictSection |

## Características Unificadas ✅

| Feature | Crear Servicio | Asignación Pendiente | Reasignar/Agregar |
|---------|---------------|---------------------|-------------------|
| QuickStats | ✅ | ✅ | ✅ |
| Search + Filtros | ✅ | ✅ | ✅ |
| CustodianCards con score % | ✅ | ✅ | ✅ |
| Equity badges | ✅ | ✅ | ✅ |
| Historial 15d (Local/Foráneo) | ✅ | ✅ | ✅ |
| Virtualización | ✅ | ✅ | ✅ |
| ConflictSection | ✅ | ✅ | ✅ |
| Reportar Indisponibilidad | ✅ | ✅ | ✅ |
| Reportar Rechazo (7 días) | ✅ | ✅ | ✅ |
| Ancho modal | N/A (page) | max-w-4xl | max-w-4xl |
| Altura lista | max-h-[400px] | max-h-[400px] | max-h-[400px] |

## Detalles de Implementación

### Componentes Compartidos
- `QuickStats`: Muestra conteo de disponibles/parciales/ocupados/conflictos
- `CustodianSearch`: Búsqueda debounced + filtros rápidos por disponibilidad
- `CustodianList`: Lista virtualizada con IntersectionObserver
- `ConflictSection`: Sección colapsible para custodios con conflicto

### Funcionalidades de Reporte
1. **Reportar Indisponibilidad** (`ReportUnavailabilityCard`)
   - Motivos: Falla mecánica, Enfermedad, Emergencia familiar, Capacitación, Otro
   - Duración: Hoy, 2-3 días, 1 semana, Indefinido
   - Persiste en `custodio_indisponibilidades`

2. **Reportar Rechazo** (`RejectionTypificationDialog`)
   - Motivos tipificados: Ocupado, Fuera de zona, Problema personal, etc.
   - Exclusión automática de 7 días
   - Persiste en `custodio_rechazos`

### Hooks Utilizados
- `useCustodiosConProximidad`: Scoring de compatibilidad basado en proximidad
- `useRegistrarRechazo`: Mutación para persistir rechazos con exclusión 7 días

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/planeacion/PendingAssignmentModal.tsx` | +Handlers de indisponibilidad/rechazo, +Dialogs |
| `src/components/planeacion/ReassignmentModal.tsx` | +Handlers de indisponibilidad/rechazo, +Dialogs, Ancho modal 4xl |

## Resultado

Experiencia de usuario consistente en todos los flujos de asignación de custodios, con las mismas herramientas operacionales disponibles para los planners independientemente del contexto de asignación.
