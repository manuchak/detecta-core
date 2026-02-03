
# Plan: Agregar Eliminacion de Rutas en Desuso al Modulo de Rutas

## Estado: ✅ COMPLETADO

## Contexto

El modulo de rutas tiene dos vistas principales:
1. **Pendientes** - Ya tiene funcionalidad de eliminar rutas (individual y masiva)
2. **Todas las Rutas** (MatrizPreciosTab) - ✅ Ahora también permite eliminar rutas

El componente `DeleteRouteDialog` ya existe con soft-delete, motivos obligatorios y auditoria, y ahora está conectado a ambas vistas.

## Solucion Implementada

Se extendió `MatrizPreciosTab.tsx` con:
1. ✅ Filtros de actividad (60, 90, 120, +120 días) para identificar rutas sin uso
2. ✅ Selección múltiple de rutas con checkboxes
3. ✅ Acción de eliminar individual (menú dropdown)
4. ✅ Acción de eliminar masiva (botón bulk)
5. ✅ Reutilización del `DeleteRouteDialog` existente

## Cambios Técnicos Realizados

### Archivo: `src/pages/Planeacion/components/MatrizPreciosTab.tsx`

**1. Imports agregados:**
- Checkbox, DropdownMenu, DeleteRouteDialog, PendingPriceRoute

**2. Estados nuevos:**
- `selectedRoutes` - Set para rutas seleccionadas
- `routesToDelete` - Array para el diálogo de eliminación
- `activityFilter` - Filtro de actividad (all, 60, 90, 120, 120+)

**3. Filtro de actividad:**
- Opciones: Todas, Últimos 60/90/120 días, +120 días sin uso
- Basado en `fecha_vigencia`

**4. Columna de checkbox:**
- Solo visible con permisos
- Selección individual y "seleccionar todo"

**5. Menú de acciones mejorado:**
- DropdownMenu con opciones: Ver detalles, Editar, Eliminar
- Opción eliminar solo con permisos

**6. Botón de acción masiva:**
- Aparece cuando hay rutas seleccionadas
- Muestra contador de seleccionadas

**7. DeleteRouteDialog integrado:**
- Convierte MatrizPrecio a PendingPriceRoute
- Limpia selección al completar

## Flujo de Usuario

1. ✅ Usuario navega a Planeación > Rutas > Todas las Rutas
2. ✅ Aplica filtro de actividad "+120 días" para ver rutas antiguas
3. ✅ Selecciona las rutas a eliminar (individual o múltiple)
4. ✅ Hace clic en "Eliminar"
5. ✅ Selecciona motivo obligatorio (ej: "Sin servicios en +120 días")
6. ✅ Confirma eliminación
7. ✅ Las rutas se desactivan con nota de auditoría

## Resultado

- ✅ Filtro visual para identificar rutas en desuso
- ✅ Eliminación individual desde menú de acciones
- ✅ Eliminación masiva con checkboxes
- ✅ Trazabilidad con motivos y fechas
- ✅ Consistencia con el flujo existente en "Pendientes"
