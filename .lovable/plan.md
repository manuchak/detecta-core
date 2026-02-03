
# Plan: Funcionalidades Criticas para Planeacion de Folios

## Resumen

Implementar dos funcionalidades criticas para el flujo de planeacion:

1. **Seccion "Pendientes de Folio"** en el Dashboard Operacional
2. **Filtro por Tipo de Folio** en la tabla de Servicios Programados

---

## Parte A: Seccion "Pendientes de Folio" en Dashboard

### A.1 Ubicacion y Diseno

Agregar una nueva seccion en `OperationalDashboard.tsx` despues de "Acciones Prioritarias", con:
- Lista de servicios cuyo `id_servicio` tiene 36 caracteres (UUID temporal)
- Ordenados por hora de cita (mas urgentes primero)
- Boton de accion rapida para editar y agregar folio Saphiro

### A.2 Logica de Filtrado

```typescript
// Servicios con folio temporal (UUID del sistema)
const serviciosSinFolio = serviciosHoy.filter(s => 
  s.id_servicio && s.id_servicio.length === 36
);
```

### A.3 Componente Visual

```text
+------------------------------------------+
| FileText  Pendientes de Folio Saphiro    |
| Servicios con ID temporal del sistema    |
+------------------------------------------+
| [!] Cliente ABC                          |
|     Origen → Destino          10:30 [Ed] |
| [!] Cliente XYZ                          |
|     Origen → Destino          11:00 [Ed] |
+------------------------------------------+
```

### A.4 Cambios en OperationalDashboard.tsx

- Agregar estado `editFolioModalOpen` y `selectedFolioService`
- Filtrar `serviciosSinFolio` de `serviciosHoy`
- Renderizar nueva seccion entre "Acciones Prioritarias" y "Resumen por Zona"
- Reutilizar `ContextualEditModal` para edicion rapida del folio

---

## Parte B: Filtro por Tipo de Folio en Servicios Programados

### B.1 Nuevo Estado de Filtro

Agregar un nuevo filtro `tipoFolioFilter` con opciones:
- `'todos'` - Todos los servicios
- `'con_folio'` - Solo con folio Saphiro (id_servicio != 36 chars)
- `'sin_folio'` - Solo pendientes de folio (id_servicio == 36 chars)

### B.2 Ubicacion en UI

Agregar botones de filtro en la fila de controles existente (linea 732-770), junto a los filtros de tipo cliente:

```text
Filtrar: [Todos] [Empresarial] [PF]  |  Folio: [Todos] [Con Folio] [Sin Folio (7)]
```

### B.3 Logica de Filtrado Combinada

```typescript
// En el useMemo de groupedServices
let filteredData = summary.services_data;

// Filtro por tipo cliente (existente)
if (tipoClienteFilter !== 'todos') { ... }

// NUEVO: Filtro por tipo folio
if (tipoFolioFilter === 'con_folio') {
  filteredData = filteredData.filter(s => 
    !s.id_servicio || s.id_servicio.length !== 36
  );
} else if (tipoFolioFilter === 'sin_folio') {
  filteredData = filteredData.filter(s => 
    s.id_servicio && s.id_servicio.length === 36
  );
}
```

### B.4 Cambios en ScheduledServicesTabSimple.tsx

1. Agregar estado: `const [tipoFolioFilter, setTipoFolioFilter] = useState<'todos' | 'con_folio' | 'sin_folio'>('todos');`
2. Calcular contador de sin folio: `const sinFolioCount = useMemo(() => ...)`
3. Agregar botones en la fila de filtros (linea 734-769)
4. Modificar `groupedServices` para aplicar filtro adicional
5. Agregar badge visual en cada servicio para indicar estado de folio

---

## Parte C: Hook Actualizado para Datos Completos

### C.1 Verificar useServiciosHoy

El hook ya incluye `id_servicio` en la query, lo cual es suficiente para la clasificacion.

### C.2 Nuevo Hook usePendingFolioServices (Opcional)

Si se necesitan mas campos para la seccion del dashboard:

```typescript
export const usePendingFolioServices = () => {
  return useQuery({
    queryKey: ['pending-folio-services'],
    queryFn: async (): Promise<ServicioPlanificado[]> => {
      const hoy = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('*')
        .gte('fecha_hora_cita', `${hoy}T00:00:00`)
        .lt('fecha_hora_cita', `${hoy}T23:59:59`)
        .not('estado_planeacion', 'in', '(cancelado,completado)')
        .order('fecha_hora_cita', { ascending: true });
      
      return (data || []).filter(s => s.id_servicio?.length === 36);
    }
  });
};
```

---

## Archivos a Modificar

| Archivo | Cambio | Descripcion |
|---------|--------|-------------|
| `src/pages/Planeacion/components/OperationalDashboard.tsx` | Modificar | Agregar seccion "Pendientes de Folio" |
| `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` | Modificar | Agregar filtro por tipo de folio |
| `src/hooks/useServiciosHoy.ts` | Verificar | Confirmar que incluye `id_servicio` |

---

## Detalles de Implementacion

### Dashboard: Nueva Seccion

**Ubicacion**: Despues de linea 361 (cierre de "Acciones Prioritarias")

```typescript
{/* Pendientes de Folio Saphiro - NUEVA SECCION */}
{serviciosSinFolio.length > 0 && (
  <div className="apple-card">
    <div className="apple-section-header">
      <h3 className="apple-section-title flex items-center gap-2">
        <FileText className="h-5 w-5 text-warning" />
        Pendientes de Folio Saphiro
        <Badge variant="secondary" className="ml-2">
          {serviciosSinFolio.length}
        </Badge>
      </h3>
      <p className="apple-section-description">
        Servicios con ID temporal del sistema
      </p>
    </div>
    <div className="apple-list">
      {serviciosSinFolio.slice(0, 5).map((servicio) => (
        // ... renderizado similar a Acciones Prioritarias
      ))}
    </div>
  </div>
)}
```

### Tabla: Filtros de Folio

**Ubicacion**: Linea 763 (despues de botones PF)

```typescript
{/* Separador visual */}
<Separator orientation="vertical" className="h-6 mx-2" />

{/* Filtro por Folio */}
<div className="flex gap-1">
  <Button
    variant={tipoFolioFilter === 'todos' ? 'secondary' : 'ghost'}
    size="sm"
    onClick={() => setTipoFolioFilter('todos')}
    className="h-7 text-xs"
  >
    <FileText className="w-3 h-3 mr-1" />
    Folio
  </Button>
  <Button
    variant={tipoFolioFilter === 'sin_folio' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setTipoFolioFilter('sin_folio')}
    className={cn(
      "h-7 text-xs",
      tipoFolioFilter === 'sin_folio' && "bg-amber-600 hover:bg-amber-700"
    )}
  >
    Sin Folio ({sinFolioCount})
  </Button>
</div>
```

---

## Validaciones y Edge Cases

| Caso | Manejo |
|------|--------|
| `id_servicio` es null | Tratar como "sin folio" (necesita Saphiro) |
| Servicio sin datos de folio | Mostrar "ID Temporal" como placeholder |
| Todos tienen folio | Ocultar seccion/filtro para no saturar |
| Modal de edicion | Reutilizar `ContextualEditModal` existente |

---

## Flujo de Usuario

1. **Dashboard**: Planificador ve seccion "Pendientes de Folio" con servicios marcados
2. **Click "Editar"**: Abre modal contextual para actualizar `id_servicio`
3. **Guarda**: Servicio desaparece de la lista de pendientes
4. **Tabla**: Puede filtrar por "Sin Folio" para ver todos los pendientes del dia
5. **Edicion masiva**: Facilita identificar y actualizar multiples servicios

---

## Consideraciones Tecnicas

1. **Performance**: Filtrado en cliente, no queries adicionales
2. **Reactividad**: Al guardar folio, refetch automatico actualiza ambas vistas
3. **Consistencia**: Misma logica de 36 caracteres en dashboard y tabla
4. **UX**: Colores de advertencia (amber/warning) para pendientes
