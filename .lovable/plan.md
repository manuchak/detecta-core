

## Diagnostico: Motivos de rechazo limitados en modales de asignacion

### Causa raiz

Existen **2 dialogos de rechazo diferentes** en la aplicacion con catalogos completamente distintos:

| Dialogo | Donde se usa | Motivos disponibles |
|---|---|---|
| `CustodianContactDialog` | Creacion de servicio (CustodianStep) | 6 categorias, ~30 motivos especificos |
| `RejectionTypificationDialog` | PendingAssignmentModal, ReassignmentModal, ArmedCallManagementModal | Solo 6 motivos genericos |

El catalogo completo (el que el equipo espera ver) tiene categorias como:
- Disponibilidad Personal (8 motivos: Asuntos familiares, Cita medica, Enfermo, Vacaciones, etc.)
- Problemas del Vehiculo (5 motivos: Auto en taller, Falla mecanica, No circula, etc.)
- Preferencias del Servicio (6 motivos: Cancela servicio, Solo quiere foraneo, etc.)
- Limitaciones Geograficas (4 motivos)
- Problemas Economicos/Documentales (4 motivos)
- Comunicacion/Otros (3 motivos)

El `RejectionTypificationDialog` solo tiene:
- Ocupado con otro servicio
- Fuera de zona de cobertura
- Problema personal/familiar
- Indisponible fisicamente
- Documentacion vencida
- No disponible - sin especificar

### Solucion

Refactorizar `RejectionTypificationDialog` para usar el catalogo centralizado que ya existe en `src/constants/rejectionCategories.ts` (que fue extraido precisamente de `CustodianContactDialog` para reutilizacion).

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/planeacion/RejectionTypificationDialog.tsx` | Reemplazar el array hardcodeado de 6 motivos por el catalogo completo de `REJECTION_CATEGORIES` importado desde `src/constants/rejectionCategories.ts`. Agregar selector de categoria + selector de motivo especifico (dos niveles). Mantener la logica de indisponibilidad existente pero conectarla con `requiresUnavailability` del catalogo. |

### Detalle tecnico

1. Importar `REJECTION_CATEGORIES` desde `@/constants/rejectionCategories`
2. Reemplazar el array `rejectionReasons` (lineas 19-56) por un flujo de dos pasos:
   - Paso 1: Seleccionar categoria (6 categorias con iconos y colores)
   - Paso 2: Seleccionar motivo especifico dentro de la categoria
3. Conectar `requiresUnavailability` del catalogo con el toggle de indisponibilidad existente (reemplaza la logica hardcodeada de `canMarkUnavailable` en linea 98)
4. El `onConfirm` enviara el string formateado como `"Categoria: Motivo especifico"` para mantener compatibilidad con los handlers existentes en los modales

### Impacto

- PendingAssignmentModal: vera los ~30 motivos completos
- ReassignmentModal: vera los ~30 motivos completos
- ArmedCallManagementModal: vera los ~30 motivos completos
- No requiere cambios en los modales consumidores (la interfaz `onConfirm(reason, days?)` se mantiene)

