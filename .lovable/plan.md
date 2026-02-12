

## Sistema de filtrado robusto para Checklists en Monitoreo

### Problema actual

El modulo de checklists solo permite filtrar por estado (completos, pendientes, sin checklist, alertas) y busqueda por texto. El equipo de monitoreo necesita filtrar por horarios y fechas para validar checklists de turnos especificos, dias anteriores o rangos horarios concretos.

### Solucion

Agregar una barra de filtros avanzados encima de la tabla de servicios con:

1. **Selector de fecha** - Para consultar checklists de dias especificos (no solo el turno actual)
2. **Filtro de rango horario** - Para acotar servicios por hora de cita (ej: solo los de 06:00-12:00)
3. **Presets rapidos** - Botones de acceso rapido: "Turno actual", "Hoy completo", "Ayer", "Esta semana"

### Cambios tecnicos

**1. Modificar `src/hooks/useChecklistMonitoreo.ts`**

Actualmente el hook calcula `desde` y `hasta` basandose solo en `timeWindow` (horas antes/despues de ahora). Se modificara para aceptar parametros opcionales de fecha y rango horario:

```typescript
interface ChecklistMonitoreoParams {
  timeWindow: number;
  fechaSeleccionada?: Date;      // null = hoy/turno actual
  horaDesde?: string;            // "06:00"
  horaHasta?: string;            // "18:00"
}
```

Cuando se proporciona `fechaSeleccionada`, se usara esa fecha como base en vez de `new Date()`. Los filtros de hora se aplicaran sobre `fecha_hora_cita` usando la zona CDMX.

**2. Nuevo componente: `src/components/monitoring/checklist/ChecklistFilters.tsx`**

Barra de filtros con:
- DatePicker (usando el componente Shadcn existente) para seleccionar fecha
- Dos selectores de hora (desde/hasta) con opciones cada 1 hora (00:00 a 23:00)
- Presets rapidos como botones/chips:
  - "Turno actual" (ventana +-timeWindow, comportamiento actual)
  - "Hoy completo" (00:00 - 23:59 del dia)
  - "Ayer" (00:00 - 23:59 del dia anterior)
  - "Esta semana" (lunes a hoy)
- Boton "Limpiar filtros" para resetear todo

**3. Modificar `src/pages/Monitoring/MonitoringPage.tsx`**

- Agregar estados para los nuevos filtros (fecha, hora desde, hora hasta)
- Pasar los filtros al hook `useChecklistMonitoreo`
- Renderizar `ChecklistFilters` entre el `ChecklistDashboard` y la tabla
- Actualizar el `queryKey` del hook para incluir los nuevos parametros

**4. Actualizar `src/components/monitoring/checklist/ChecklistDashboard.tsx`**

- Mostrar la fecha/rango seleccionado en el encabezado para que el equipo sepa que periodo estan viendo (ej: "Checklists del 10 Feb 2026" en vez de "Checklists del Turno")

### Flujo de usuario

```text
[Turno actual] [Hoy] [Ayer] [Esta semana]    [Fecha: 10/02/2026]  [06:00] - [18:00]  [Limpiar]
```

1. Por defecto: comportamiento actual (turno +-8h)
2. Click en "Hoy": muestra todos los servicios del dia completo
3. Seleccionar fecha: cambia la consulta a ese dia
4. Ajustar horas: filtra solo servicios en ese rango horario
5. "Limpiar": vuelve al comportamiento por defecto (turno actual)

### Archivos afectados

| Archivo | Accion |
|---|---|
| `src/components/monitoring/checklist/ChecklistFilters.tsx` | Crear - Componente de filtros |
| `src/hooks/useChecklistMonitoreo.ts` | Modificar - Aceptar params de fecha/hora |
| `src/pages/Monitoring/MonitoringPage.tsx` | Modificar - Estado de filtros y renderizado |
| `src/components/monitoring/checklist/ChecklistDashboard.tsx` | Modificar - Titulo dinamico |
| `src/components/monitoring/checklist/index.ts` | Modificar - Exportar ChecklistFilters |

No se requieren cambios en base de datos. La consulta existente a `servicios_planificados` con `.gte()` y `.lte()` sobre `fecha_hora_cita` ya soporta cualquier rango de fechas.
