

# Filtro "Ver como Monitorista" en Bitácora (Vista Admin)

## Problema
Los admins/coordinadores ven todos los servicios del día. No pueden filtrar para ver exactamente la pantalla que ve un monitorista específico.

## Solución
Agregar un Select dropdown en `BitacoraBoard` (solo visible para roles admin/coordinator) que lista los monitoristas activos. Al seleccionar uno, las 3 columnas se filtran mostrando solo los servicios asignados a ese monitorista — exactamente lo que esa persona ve en su pantalla.

## Cambios

### 1. `src/components/monitoring/bitacora/BitacoraBoard.tsx`
- Agregar estado `filterMonitoristaId: string | null`
- Importar `useMonitoristaAssignment` para obtener la lista de monitoristas y sus asignaciones (`assignmentsByMonitorista`)
- Importar `useUserRole` para verificar si es admin/coordinator
- Agregar un `Select` dropdown arriba del grid con las opciones: "Todos los servicios" + lista de monitoristas con nombre
- Cuando se selecciona un monitorista, filtrar `pendingServices`, `enCursoServices` y `eventoEspecialServices` por los `servicio_id` asignados a ese monitorista
- El filtrado es puramente client-side usando los datos de asignaciones que ya se cargan

### 2. Sin cambios en `useBitacoraBoard.ts`
El hook ya carga todos los servicios para roles admin. El filtro se aplica en el componente como un `.filter()` sobre las listas existentes, usando el mapa de asignaciones que ya existe en `useMonitoristaAssignment`.

## Flujo
```text
Admin ve Bitácora
  └─ Select: [Todos ▼]  →  ve todos los servicios (comportamiento actual)
  └─ Select: [Karla Galvez ▼]  →  ve solo los servicios asignados a Karla
  └─ Select: [Cintia Chavez ▼]  →  ve solo los servicios asignados a Cintia
```

## Alcance
- 1 archivo modificado: `BitacoraBoard.tsx`
- Sin migraciones de base de datos
- Sin cambios en hooks existentes — reutiliza datos ya cargados

