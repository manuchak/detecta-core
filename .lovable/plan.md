
# Plan: Funcionalidades Criticas para Planeacion de Folios

## Estado: ✅ COMPLETADO

---

## Resumen

Dos funcionalidades críticas para el flujo de planeación han sido implementadas:

1. ✅ **Sección "Pendientes de Folio"** en el Dashboard Operacional
2. ✅ **Filtro por Tipo de Folio** en la tabla de Servicios Programados

---

## Implementación Completada

### Parte A: Sección "Pendientes de Folio" en Dashboard

**Archivo modificado**: `src/pages/Planeacion/components/OperationalDashboard.tsx`

**Cambios realizados**:
- Importado `ContextualEditModal`, `useServiciosPlanificados`, y `useQueryClient`
- Agregado estado `editFolioModalOpen` y `selectedFolioService`
- Filtro `serviciosSinFolio` que detecta UUIDs de 36 caracteres
- Nueva sección visual entre "Acciones Prioritarias" y "Resumen por Zona"
- Modal de edición contextual para actualizar el folio Saphiro
- Refetch automático al guardar

### Parte B: Filtro por Tipo de Folio en Servicios Programados

**Archivo modificado**: `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx`

**Cambios realizados**:
- Importado icono `FileText`
- Agregado estado `tipoFolioFilter` con opciones: `todos`, `con_folio`, `sin_folio`
- `sinFolioCount` useMemo para contador en badge
- Lógica de filtrado combinada en `groupedServices`
- Botones de filtro en la barra de controles (junto a filtros de tipo cliente)
- Badge con contador de servicios sin folio

---

## Lógica de Detección de Folio

```typescript
// UUID temporal del sistema = 36 caracteres
const serviciosSinFolio = servicios.filter(s => 
  s.id_servicio && s.id_servicio.length === 36
);
```

---

## Flujo de Usuario

1. **Dashboard**: Planificador ve sección "Pendientes de Folio Saphiro" con servicios marcados
2. **Click "Editar"**: Abre modal contextual para actualizar `id_servicio`
3. **Guarda**: Servicio desaparece de la lista de pendientes (refetch automático)
4. **Tabla**: Puede filtrar por "Sin Folio" para ver todos los pendientes del día
5. **Edición masiva**: Facilita identificar y actualizar múltiples servicios
