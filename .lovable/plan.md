

# Plan: Unificar UI de Asignación entre Creación y Edición de Servicios

## Problema Identificado

Actualmente existen **dos implementaciones diferentes** para la asignación de custodios:

| Característica | ServiceCreation (Nuevo) | PendingAssignmentModal (Legacy) |
|----------------|------------------------|--------------------------------|
| Componente | `CustodianStep/components/*` | `CustodianAssignmentStep.tsx` |
| CustodianCard | Moderno con score, equity badges, historial 15d | Tarjeta básica sin métricas avanzadas |
| QuickStats | Grid 4 columnas (Disponibles, Parciales, etc.) | Sin stats |
| Búsqueda | Debounced con filtros rápidos | Básica |
| Virtualización | IntersectionObserver | No tiene |

Cuando se edita un servicio pendiente desde el Dashboard Operacional, se usa el componente legacy, perdiendo todas las mejoras de UX implementadas.

## Solución Propuesta

Refactorizar `PendingAssignmentModal` para reutilizar los componentes modulares del nuevo `CustodianStep`:

```text
src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/
├── CustodianCard.tsx        ← Reutilizar
├── CustodianList.tsx        ← Reutilizar  
├── CustodianSearch.tsx      ← Reutilizar
├── QuickStats.tsx           ← Reutilizar
├── ConflictSection.tsx      ← Reutilizar
├── SelectedCustodianSummary.tsx ← Adaptar
└── ServiceHistoryBadges.tsx ← Ya incluido en CustodianCard
```

## Detalles Técnicos

### Fase 1: Exportar tipos compartidos

Crear archivo de tipos reutilizables:

**Archivo:** `src/types/custodianAssignment.ts`

```typescript
// Exportar tipos usados por ambos flujos
export type { CustodianCommunicationState, CustodianStepFilters } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/types';
```

### Fase 2: Modificar PendingAssignmentModal.tsx

**Cambios principales:**

1. **Importar componentes mejorados:**
```typescript
import { QuickStats } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/QuickStats';
import { CustodianSearch } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianSearch';
import { CustodianList } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianList';
import { ConflictSection } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ConflictSection';
import type { CustodianCommunicationState, CustodianStepFilters, DEFAULT_FILTERS } from '../types';
```

2. **Agregar estado de filtros y búsqueda:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState<CustodianStepFilters>(DEFAULT_FILTERS);
const [comunicaciones, setComunicaciones] = useState<Record<string, CustodianCommunicationState>>({});
```

3. **Usar hook `useCustodiosConProximidad`:**
```typescript
const { data: categorized, isLoading, refetch } = useCustodiosConProximidad(servicioNuevo);
```

4. **Filtrar custodios localmente:**
```typescript
const filteredCustodians = useMemo(() => {
  if (!categorized) return [];
  let result = [...categorized.disponibles, ...categorized.parcialmenteOcupados];
  
  // Aplicar búsqueda
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(c => 
      c.nombre?.toLowerCase().includes(term) ||
      c.telefono?.toLowerCase().includes(term) ||
      c.zona_base?.toLowerCase().includes(term)
    );
  }
  
  // Aplicar filtros de categoría
  if (!filters.disponibles) {
    result = result.filter(c => !categorized.disponibles.includes(c));
  }
  if (!filters.parcialmenteOcupados) {
    result = result.filter(c => !categorized.parcialmenteOcupados.includes(c));
  }
  
  return result;
}, [categorized, searchTerm, filters]);
```

5. **Reemplazar rendering de lista:**
```tsx
{/* Antes: CustodianAssignmentStep (920 líneas legacy) */}
{/* Después: Componentes modulares */}

{/* Stats rápidos */}
<QuickStats categorized={categorized} isLoading={isLoading} />

{/* Búsqueda y filtros */}
<CustodianSearch
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  filters={filters}
  onFilterToggle={(key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }))}
  resultsCount={filteredCustodians.length}
  totalCount={totalCount}
/>

{/* Lista de custodios */}
<CustodianList
  custodians={filteredCustodians}
  isLoading={isLoading}
  selectedId={selectedCustodianId}
  highlightedIndex={highlightedIndex}
  comunicaciones={comunicaciones}
  onSelect={handleSelectCustodian}
  onContact={handleContact}
/>

{/* Sección de conflictos (colapsible) */}
{categorized?.noDisponibles?.length > 0 && (
  <ConflictSection
    custodians={categorized.noDisponibles}
    onOverrideSelect={handleOverrideSelect}
  />
)}
```

### Fase 3: Mantener compatibilidad de callbacks

Los callbacks existentes se mantienen pero se adaptan al formato del nuevo `CustodianCard`:

```typescript
const handleSelectCustodian = (custodio: CustodioConProximidad) => {
  // Actualizar estado local
  setSelectedCustodianId(custodio.id);
  
  // Actualizar comunicación
  setComunicaciones(prev => ({
    ...prev,
    [custodio.id]: { status: 'acepta', method: 'whatsapp' }
  }));
  
  // Llamar al callback original de asignación
  handleCustodianAssignmentComplete({
    custodio_nombre: custodio.nombre,
    custodio_asignado_id: custodio.id
  });
};

const handleContact = (custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => {
  // Abrir diálogo de contacto existente
  setContactCustodian(custodio);
  setContactMethod(method);
  setContactDialogOpen(true);
};
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/planeacion/PendingAssignmentModal.tsx` | Refactorizar para usar componentes modulares |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/types.ts` | Exportar tipos para reutilización |

## Resultado Esperado

Antes y después de la edición de servicios pendientes:

**Antes (Legacy):**
- Cards básicas sin métricas
- Sin stats de disponibilidad
- Sin filtros avanzados
- UI inconsistente con el flujo de creación

**Después (Unificado):**
- Cards con score compat%, equity badges, historial 15d
- QuickStats (Mostrados, Ideales, Ocupados, Filtrados)  
- Búsqueda debounced con filtros por categoría
- Badge "Sin conflictos" / "Priorizar" / "Alta carga"
- Botones WhatsApp/Llamar con tracking
- Virtualización para listas largas
- UI idéntica al flujo de creación

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Callbacks incompatibles | Adaptar formato de respuesta sin cambiar firma pública |
| Pérdida de funcionalidad de edición | Mantener `ContextualEditModal` para edición de datos básicos |
| Regresión en modo `direct_armed` | Conservar lógica de paso inicial sin modificar |

