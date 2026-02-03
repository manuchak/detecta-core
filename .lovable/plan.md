
# Plan: Mejorar UX/UI de Edición de Custodio en ReassignmentModal

## Problema Identificado

El modal "Agregar Custodio" (`ReassignmentModal.tsx`) usa un sistema legacy de dropdown que:

1. **No funciona correctamente** - Posibles problemas de z-index o eventos en el Select
2. **No aplica las mejoras del módulo de selección** - Falta:
   - Cards con score de compatibilidad (%)
   - Equity badges (Priorizar / Alta carga)
   - Historial de 15 días (Local/Foráneo)
   - Búsqueda con debounce y filtros rápidos
   - Stats de disponibilidad (QuickStats)
   - Botones WhatsApp/Llamar integrados

## Solución Propuesta

Reemplazar el dropdown de custodios en `ReassignmentModal.tsx` con los componentes modulares del `CustodianStep`, manteniendo la lógica de armados/proveedores intacta.

```text
Antes (Legacy):
┌─────────────────────────────────┐
│ Select dropdown con 124 items  │
│ ▼ Seleccionar custodio         │
└─────────────────────────────────┘

Después (Unificado):
┌─────────────────────────────────┐
│ QuickStats: 🟢80 🟡20 🟠15 ⚠️9 │
├─────────────────────────────────┤
│ 🔍 Buscar...  [Disponibles ✓]  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Juan Pérez         92% compat│
│ │ 📞 5512345678   🚗 Nissan   │
│ │ 🏠3L/2F 15d   🎯 Priorizar  │
│ │ [WhatsApp] [Llamar] [Asignar]│
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ María García       87% compat│
│ │ ...                          │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Detalles Técnicos

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/planeacion/ReassignmentModal.tsx` | Refactorizar sección de custodios |

### Cambios Específicos

**1. Agregar imports de componentes modulares:**
```typescript
import { QuickStats } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/QuickStats';
import { CustodianSearch } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianSearch';
import { CustodianList } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianList';
import { ConflictSection } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ConflictSection';
import { useCustodiosConProximidad, type CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import { 
  type CustodianCommunicationState, 
  type CustodianStepFilters, 
  DEFAULT_FILTERS 
} from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/types';
```

**2. Agregar estado local para componentes modulares:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState<CustodianStepFilters>(DEFAULT_FILTERS);
const [comunicaciones, setComunicaciones] = useState<Record<string, CustodianCommunicationState>>({});
const [highlightedIndex, setHighlightedIndex] = useState(-1);
```

**3. Crear objeto servicioNuevo para el hook de proximidad:**
```typescript
const servicioNuevo = useMemo(() => {
  if (!service) return undefined;
  return {
    fecha_programada: service.fecha_hora_cita?.split('T')[0] || new Date().toISOString().split('T')[0],
    hora_ventana_inicio: service.fecha_hora_cita?.split('T')[1]?.substring(0, 5) || '09:00',
    origen_texto: service.origen,
    destino_texto: service.destino,
    tipo_servicio: 'custodia',
    incluye_armado: service.requiere_armado,
    requiere_gadgets: false
  };
}, [service]);
```

**4. Usar hook de proximidad en lugar de query básica:**
```typescript
const { data: categorized, isLoading: isLoadingCustodians } = useCustodiosConProximidad(
  servicioNuevo,
  { enabled: open && assignmentType === 'custodian' }
);
```

**5. Implementar filtrado local:**
```typescript
const filteredCustodians = useMemo(() => {
  if (!categorized) return [];
  let result: CustodioConProximidad[] = [];
  
  if (filters.disponibles) result = [...result, ...categorized.disponibles];
  if (filters.parcialmenteOcupados) result = [...result, ...categorized.parcialmenteOcupados];
  if (filters.ocupados) result = [...result, ...categorized.ocupados];
  
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(c => 
      c.nombre?.toLowerCase().includes(term) ||
      c.telefono?.toLowerCase().includes(term) ||
      c.zona_base?.toLowerCase().includes(term)
    );
  }
  
  return result;
}, [categorized, searchTerm, filters]);
```

**6. Reemplazar Select con componentes modulares (líneas ~257-302):**
```tsx
{assignmentType === 'custodian' ? (
  <div className="space-y-4">
    {/* Stats rápidos */}
    <QuickStats categorized={categorized} isLoading={isLoadingCustodians} />
    
    {/* Búsqueda y filtros */}
    <CustodianSearch
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filters}
      onFilterToggle={(key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }))}
      resultsCount={filteredCustodians.length}
      totalCount={totalCount}
    />
    
    {/* Lista de custodios con cards */}
    <CustodianList
      custodians={filteredCustodians}
      isLoading={isLoadingCustodians}
      selectedId={selectedId}
      highlightedIndex={highlightedIndex}
      comunicaciones={comunicaciones}
      onSelect={handleSelectCustodian}
      onContact={handleContact}
    />
    
    {/* Sección de conflictos colapsible */}
    {categorized?.noDisponibles && categorized.noDisponibles.length > 0 && (
      <ConflictSection
        custodians={categorized.noDisponibles}
        onOverrideSelect={handleOverrideSelect}
      />
    )}
  </div>
) : (
  // Mantener lógica existente de armados/proveedores
  ...
)}
```

**7. Implementar handlers para selección y contacto:**
```typescript
const handleSelectCustodian = (custodio: CustodioConProximidad) => {
  setSelectedId(custodio.id);
  setSelectedName(custodio.nombre);
  
  setComunicaciones(prev => ({
    ...prev,
    [custodio.id]: { status: 'acepta' as const, method: 'whatsapp' }
  }));
};

const handleContact = (custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => {
  setComunicaciones(prev => ({
    ...prev,
    [custodio.id]: { status: 'contacted' as const, method }
  }));
  
  if (method === 'whatsapp') {
    window.open(`https://wa.me/${custodio.telefono?.replace(/\D/g, '')}`, '_blank');
  } else {
    window.open(`tel:${custodio.telefono}`, '_self');
  }
};

const handleOverrideSelect = (custodio: CustodioConProximidad) => {
  setSelectedId(custodio.id);
  setSelectedName(custodio.nombre);
  toast.info('Custodio con conflicto seleccionado - se requiere justificación');
};
```

**8. Ajustar altura del modal para lista:**
```tsx
<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden z-[60]">
  ...
  {/* Lista con scroll interno */}
  <div className="max-h-[400px] overflow-y-auto">
    <CustodianList ... />
  </div>
```

### Lógica Preservada

- La sección de **armados/proveedores** (`assignmentType === 'armed_guard'`) se mantiene intacta
- Los campos de **razón**, **remover asignación**, y **proveedor externo** no cambian
- El callback `onReassign` mantiene la misma firma

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Dropdown básico con 124+ opciones | Lista scrollable con cards enriquecidos |
| Sin métricas de compatibilidad | Score % + equity badges visibles |
| Sin filtros | Filtros por disponibilidad + búsqueda |
| Sin historial | Badges de historial 15d (Local/Foráneo) |
| Sin contacto directo | Botones WhatsApp/Llamar integrados |
| z-index/positioning issues | Componentes probados y estables |

## Beneficios

1. **Consistencia** - Misma UI en creación y edición
2. **Información** - Planners ven scores y equidad antes de asignar
3. **Rendimiento** - Virtualización para listas largas
4. **Usabilidad** - Contacto directo sin salir del modal
