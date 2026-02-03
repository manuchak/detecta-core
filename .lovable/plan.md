
# Plan Fase 2: Integraciones UI para Custodios y Armados

## Resumen de Alcance

La Fase 2 implementa las integraciones de UI para ambos tipos de operativos. Los hooks creados en Fase 1 ya soportan el campo `operativo_tipo`, por lo que la lógica de negocio es reutilizable.

### Alcance Custodios
- Columna de preferencia editable en CustodiosZonasTab
- Acciones de estatus (activar/inactivar) en tabla
- Botón de cambio de estatus en InformacionPersonalTab
- Penalización de score por mismatch de preferencia

### Alcance Armados
- **Crear nuevo** ArmadosZonasTab (equivalente a CustodiosZonasTab)
- Mejorar ArmedGuardAssignmentStep con badges de historial
- Botón de cambio de estatus en InformacionPersonalTab (compartido)

---

## Parte A: Integraciones para Custodios

### A.1 Modificar CustodiosZonasTab.tsx

**Cambios:**

1. **Nueva columna "Preferencia"** con selector inline:

```typescript
// Agregar al fetch
.select('id, nombre, zona_base, estado, disponibilidad, telefono, 
         tipo_ultimo_servicio, contador_locales_consecutivos, 
         contador_foraneos_consecutivos, fecha_ultimo_servicio,
         preferencia_tipo_servicio') // NUEVO

// Nueva función de actualización
const handlePreferenciaChange = async (custodioId: string, nuevaPreferencia: string) => {
  setUpdatingIds(prev => new Set([...prev, custodioId]));
  
  const { error } = await supabase
    .from('custodios_operativos')
    .update({ 
      preferencia_tipo_servicio: nuevaPreferencia,
      updated_at: new Date().toISOString() 
    })
    .eq('id', custodioId);
  
  if (error) {
    toast.error('Error al actualizar preferencia');
  } else {
    toast.success('Preferencia actualizada');
    queryClient.invalidateQueries({ queryKey: ['custodios-operativos-zonas'] });
  }
  
  setUpdatingIds(prev => {
    const next = new Set(prev);
    next.delete(custodioId);
    return next;
  });
};
```

2. **Badge visual de preferencia** en cada fila:

```text
[Home] Local     - Badge azul
[Plane] Foráneo  - Badge verde  
[—] Indistinto   - Sin badge
```

3. **Acciones de estatus** en menú contextual:

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => openCambioEstatus(custodio)}>
      {custodio.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

4. **Integrar CambioEstatusModal** al final del componente.

### A.2 Modificar InformacionPersonalTab.tsx

**Cambios:**

1. **Importar componentes necesarios:**

```typescript
import { CambioEstatusModal } from '@/components/operatives/CambioEstatusModal';
import { PreferenciaServicioSelector } from '@/components/operatives/PreferenciaServicioSelector';
import { useUpdateOperativoPreferencia } from '@/hooks/useUpdateOperativoPreferencia';
import { Button } from '@/components/ui/button';
import { Power, Settings } from 'lucide-react';
```

2. **Agregar estado para el modal:**

```typescript
const [showEstatusModal, setShowEstatusModal] = useState(false);
const { updatePreferencia, isUpdating } = useUpdateOperativoPreferencia();
```

3. **Nueva card "Configuración Operativa"** (después de Estado y Disponibilidad):

```text
+--------------------------------------------------+
|  [Settings] Configuración Operativa              |
|  ------------------------------------------------|
|  Preferencia de servicio:                        |
|  [PreferenciaServicioSelector]                   |
|                                                  |
|  Estado actual: [Activo]                         |
|  [Cambiar Estatus]                               |
+--------------------------------------------------+
```

4. **Renderizado condicional** para mostrar botón de estatus:

```typescript
<Button 
  variant={profile.estado === 'activo' ? 'outline' : 'default'}
  onClick={() => setShowEstatusModal(true)}
  className="w-full"
>
  <Power className="h-4 w-4 mr-2" />
  {profile.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
</Button>
```

5. **Modal al final del componente:**

```typescript
<CambioEstatusModal
  open={showEstatusModal}
  onOpenChange={setShowEstatusModal}
  operativo={{
    id: profile.id,
    nombre: profile.nombre,
    tipo: tipo, // 'custodio' | 'armado'
    estadoActual: profile.estado
  }}
/>
```

### A.3 Modificar proximidadOperacional.ts

**Agregar penalización por mismatch de preferencia:**

```typescript
// Dentro de calcularProximidadOperacional, después del score de rotación

// 6. PENALIZACIÓN POR MISMATCH DE PREFERENCIA
const preferencia = (custodio as any).preferencia_tipo_servicio;
let penalizacionPreferencia = 0;

if (preferencia && preferencia !== 'indistinto') {
  const esServicioForaneo = servicioNuevo.es_foraneo;
  
  if (preferencia === 'local' && esServicioForaneo) {
    // Custodio prefiere local pero servicio es foráneo
    penalizacionPreferencia = -15;
    scoring.detalles.razones.push('⚠️ Prefiere servicios locales');
  } else if (preferencia === 'foraneo' && !esServicioForaneo) {
    // Custodio prefiere foráneo pero servicio es local
    penalizacionPreferencia = -10;
    scoring.detalles.razones.push('ℹ️ Prefiere servicios foráneos');
  }
}

// Aplicar penalización al score total
scoring.score_total = Math.max(0, Math.min(100, scoring.score_total + penalizacionPreferencia));
```

### A.4 Modificar useProximidadOperacional.ts

**Incluir preferencia en el query y datos procesados:**

```typescript
// En el procesamiento de custodios, agregar preferencia al objeto
custodioProcessed.preferencia_tipo_servicio = custodio.preferencia_tipo_servicio;

// Agregar al tipo CustodioConProximidad
preferencia_tipo_servicio?: 'local' | 'foraneo' | 'indistinto';
```

---

## Parte B: Integraciones para Armados

### B.1 Crear ArmadosZonasTab.tsx (NUEVO)

Crear un nuevo componente equivalente a CustodiosZonasTab para gestionar armados:

**Ubicación:** `src/pages/Planeacion/components/configuration/ArmadosZonasTab.tsx`

**Estructura:**

```typescript
export function ArmadosZonasTab() {
  // Estados similares a CustodiosZonasTab
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSinZona, setFilterSinZona] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('90');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [showEstatusModal, setShowEstatusModal] = useState(false);
  const [selectedArmado, setSelectedArmado] = useState<ArmadoOperativo | null>(null);
  
  // Fetch armados operativos
  const { data: armados = [], isPending, refetch } = useAuthenticatedQuery(
    ['armados-operativos-zonas'],
    async () => {
      const { data, error } = await supabase
        .from('armados_operativos')
        .select(`
          id, nombre, zona_base, estado, disponibilidad, telefono,
          tipo_ultimo_servicio, fecha_ultimo_servicio,
          preferencia_tipo_servicio, tipo_armado, licencia_portacion,
          experiencia_anos
        `)
        .eq('estado', 'activo')
        .order('nombre');
      
      if (error) throw error;
      return data;
    }
  );

  // Métricas, filtros, y UI similares a CustodiosZonasTab
  // Con columnas adicionales específicas de armados:
  // - Tipo de armado (interno/externo)
  // - Licencia de portación
  // - Años de experiencia
}
```

**Características:**
- Métricas: Total activos, Sin zona, Zonas cubiertas, Completitud
- Filtros de actividad (60, 90, 120, +120 días)
- Columna de preferencia editable
- Columna de tipo de armado
- Acciones de estatus (activar/inactivar)
- Badge de licencia vigente/vencida

### B.2 Integrar ArmadosZonasTab en PlanningConfigurationTab.tsx

**Agregar nuevo tab:**

```typescript
import ArmadosZonasTab from './configuration/ArmadosZonasTab';

// En TabsList
<TabsTrigger value="armados-zonas" className="flex items-center gap-2">
  <Shield className="h-4 w-4" />
  Armados
</TabsTrigger>

// En contenido
<TabsContent value="armados-zonas">
  <ArmadosZonasTab />
</TabsContent>
```

### B.3 Mejorar ArmedGuardAssignmentStep.tsx

**Agregar badges de historial similares a CustodianCard:**

```typescript
// Importar componente
import { ServiceHistoryBadges } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ServiceHistoryBadges';

// En el renderizado de cada guard
<div key={guard.id} className="border rounded-lg p-3 ...">
  <div className="flex justify-between items-start">
    <div>
      <div className="font-medium">{guard.nombre}</div>
      
      {/* NUEVO: Badges de historial */}
      <ServiceHistoryBadges
        diasSinServicio={guard.fecha_ultimo_servicio 
          ? differenceInDays(new Date(), new Date(guard.fecha_ultimo_servicio))
          : null
        }
        tipoUltimoServicio={guard.tipo_ultimo_servicio}
        fechaUltimoServicio={guard.fecha_ultimo_servicio}
        serviciosLocales15d={guard.servicios_locales_15d || 0}
        serviciosForaneos15d={guard.servicios_foraneos_15d || 0}
        compact={true}
      />
      
      {/* Badge de preferencia si no es indistinto */}
      {guard.preferencia_tipo_servicio && 
       guard.preferencia_tipo_servicio !== 'indistinto' && (
        <Badge variant={guard.preferencia_tipo_servicio === 'local' ? 'secondary' : 'default'}>
          {guard.preferencia_tipo_servicio === 'local' ? (
            <><Home className="h-3 w-3 mr-1" /> Prefiere Local</>
          ) : (
            <><Plane className="h-3 w-3 mr-1" /> Prefiere Foráneo</>
          )}
        </Badge>
      )}
    </div>
    ...
  </div>
</div>
```

### B.4 Actualizar useArmedGuardsOperativos.ts

**Incluir campos nuevos en el select:**

```typescript
const { data, error } = await supabase
  .from('armados_operativos')
  .select(`
    *,
    preferencia_tipo_servicio,
    servicios_locales_15d,
    servicios_foraneos_15d,
    tipo_ultimo_servicio
  `)
  .eq('estado', 'activo');
```

---

## Parte C: Mejoras Compartidas

### C.1 Actualizar ServiceHistoryBadges.tsx

**Agregar prop `compact` para uso en ArmedGuardAssignmentStep:**

```typescript
interface ServiceHistoryBadgesProps {
  diasSinServicio: number | null;
  tipoUltimoServicio: 'local' | 'foraneo' | null;
  fechaUltimoServicio: string | null;
  serviciosLocales15d: number;
  serviciosForaneos15d: number;
  compact?: boolean; // NUEVO: Para armados
}

export function ServiceHistoryBadges({ 
  ..., 
  compact = false 
}: ServiceHistoryBadgesProps) {
  if (compact) {
    // Renderizado compacto para armados (solo días sin servicio + 15d)
    return (
      <div className="flex items-center gap-2 text-xs">
        {diasSinServicio !== null && (
          <span className={getDiasSinServicioColor(diasSinServicio)}>
            {diasSinServicio}d
          </span>
        )}
        <span className="text-muted-foreground">
          15d: {serviciosLocales15d}L/{serviciosForaneos15d}F
        </span>
      </div>
    );
  }
  
  // Renderizado completo para custodios (existente)
  return (...);
}
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `src/pages/Planeacion/components/configuration/CustodiosZonasTab.tsx` | Modificar | Alta |
| `src/pages/PerfilesOperativos/components/tabs/InformacionPersonalTab.tsx` | Modificar | Alta |
| `src/utils/proximidadOperacional.ts` | Modificar | Alta |
| `src/hooks/useProximidadOperacional.ts` | Modificar | Alta |
| `src/pages/Planeacion/components/configuration/ArmadosZonasTab.tsx` | **Crear** | Alta |
| `src/pages/Planeacion/components/configuration/PlanningConfigurationTab.tsx` | Modificar | Media |
| `src/components/planeacion/ArmedGuardAssignmentStep.tsx` | Modificar | Media |
| `src/hooks/useArmedGuardsOperativos.ts` | Modificar | Media |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ServiceHistoryBadges.tsx` | Modificar | Media |

---

## Secuencia de Implementación

1. **CustodiosZonasTab.tsx** - Agregar preferencia y acciones de estatus
2. **InformacionPersonalTab.tsx** - Agregar card de configuración operativa
3. **proximidadOperacional.ts** - Agregar penalización por preferencia
4. **useProximidadOperacional.ts** - Incluir preferencia en datos
5. **ArmadosZonasTab.tsx** - Crear nuevo componente
6. **PlanningConfigurationTab.tsx** - Agregar tab de armados
7. **ServiceHistoryBadges.tsx** - Agregar modo compacto
8. **ArmedGuardAssignmentStep.tsx** - Integrar badges de historial

---

## Resumen de Cobertura

| Funcionalidad | Custodios | Armados |
|---------------|-----------|---------|
| Gestión de preferencias | ✅ CustodiosZonasTab | ✅ ArmadosZonasTab (nuevo) |
| Cambio de estatus | ✅ CustodiosZonasTab + InformacionPersonalTab | ✅ ArmadosZonasTab + InformacionPersonalTab |
| Badges de historial en asignación | ✅ CustodianCard | ✅ ArmedGuardAssignmentStep (mejorado) |
| Penalización de score | ✅ proximidadOperacional.ts | ⏳ Fase futura (requiere crear scoring de armados) |
