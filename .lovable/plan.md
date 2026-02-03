
# Plan: Agregar Pestaña de Bajas a Perfiles Operativos

## Resumen del Cambio

Agregar una nueva pestaña "Bajas" para gestionar custodios dados de baja (temporal o permanentemente), y filtrar la pestaña principal de "Custodios" para mostrar solo los activos, haciendo el listado más ligero.

## Datos Actuales en BD

| Estado | Cantidad |
|--------|----------|
| activo | 415 |
| suspendido | 36 |
| inactivo | 1 |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts` | Separar queries: activos vs bajas |
| `src/pages/PerfilesOperativos/index.tsx` | Agregar tab "Bajas" y stat card |
| `src/pages/PerfilesOperativos/components/BajasDataTable.tsx` | **CREAR** - Tabla de custodios dados de baja |

## Cambios Detallados

### 1. Hook `useOperativeProfiles.ts`

**Query de Custodios (solo activos)**:
```typescript
.eq('estado', 'activo')  // Antes: .neq('estado', 'archivado')
```

**Nueva Query de Bajas**:
```typescript
const bajasQuery = useQuery({
  queryKey: ['operative-profiles', 'bajas'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('custodios_operativos')
      .select(`id, nombre, telefono, zona_base, estado,
        motivo_inactivacion, tipo_inactivacion, 
        fecha_inactivacion, fecha_reactivacion_programada,
        numero_servicios, rating_promedio`)
      .in('estado', ['inactivo', 'suspendido'])
      .order('fecha_inactivacion', { ascending: false });
    
    return data || [];
  }
});
```

**Nueva Interface**:
```typescript
export interface BajaProfile {
  id: string;
  nombre: string;
  telefono: string | null;
  zona_base: string | null;
  estado: 'inactivo' | 'suspendido';
  motivo_inactivacion: string | null;
  tipo_inactivacion: 'temporal' | 'permanente' | null;
  fecha_inactivacion: string | null;
  fecha_reactivacion_programada: string | null;
  numero_servicios: number | null;
  rating_promedio: number | null;
}
```

**Stats actualizados**:
```typescript
totalBajas: bajasQuery.data?.length || 0,
bajasTemporales: bajasQuery.data?.filter(b => b.tipo_inactivacion === 'temporal').length || 0,
bajasPermanentes: bajasQuery.data?.filter(b => b.tipo_inactivacion === 'permanente').length || 0,
```

### 2. Página Principal `index.tsx`

**Nueva Stat Card** (reemplazar "Archivados" visualmente):
```text
┌─────────────────────────────────────────────────────────────────┐
│ Custodios│ Activos30d│ Inact+60d │ Docs OK │ Armados │  Bajas  │
│   415    │    89     │    353    │    0    │   85    │   37    │
└─────────────────────────────────────────────────────────────────┘
```

**Nueva Tab** (entre Armados y Archivados):
```text
┌─────────────────────────────────────────────────────────────────┐
│  Custodios 415  │  Armados 85  │  Bajas 37  │  Archivados 0    │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Nuevo Componente `BajasDataTable.tsx`

**Columnas**:
| Columna | Descripción |
|---------|-------------|
| Nombre | Nombre + teléfono |
| Zona | Zona base |
| Estado | Badge: Suspendido (temporal) / Inactivo (permanente) |
| Motivo | Motivo de baja formateado |
| Fecha Baja | Fecha de inactivación |
| Reactivación | Fecha programada o "Permanente" |
| Acciones | Reactivar (si es temporal) |

**Filtros**:
- Búsqueda por nombre/teléfono
- Tipo: Temporal / Permanente / Todos
- Motivo: vacaciones, incapacidad, sanción, baja voluntaria, etc.

**Acción de Reactivar**:
- Solo para bajas temporales con fecha de reactivación
- Actualizar estado a 'activo' y limpiar campos de inactivación
- Registrar en historial

## Flujo Visual Final

```text
┌──────────────────────────────────────────────────────────────────┐
│ Stats:  Custodios│Activos30d│Inact+60d│DocsOK│Armados│  Bajas  │
│            415   │    89    │   353   │  0   │  85   │   37    │
├──────────────────────────────────────────────────────────────────┤
│ Tabs: [Custodios 415] [Armados 85] [Bajas 37] [Archivados 0]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tab "Bajas":                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Buscar...  │ Tipo ▼ │ Motivo ▼ │         37 de 37      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Nombre        │ Zona │ Estado    │ Motivo   │ Fecha │ Acc │ │
│  │───────────────────────────────────────────────────────────│ │
│  │ SERGIO MONTANO│ CDMX │ Suspendido│ Sanción  │ 3 Feb │ 🔄  │ │
│  │ ISRAEL MAYO   │EDOMEX│ Suspendido│ Sanción  │ 3 Feb │ 🔄  │ │
│  │ MARTIN LOPEZ  │ Qro  │ Inactivo  │ Otro     │ 3 Feb │  -  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Beneficios

1. **Listado más ligero**: Custodios pasa de 452 a 415 registros
2. **Visibilidad de bajas**: Control claro de quién está suspendido y por qué
3. **Gestión de reactivaciones**: Ver fechas programadas y reactivar manualmente si es necesario
4. **Consistencia**: Mismo patrón visual que las otras pestañas
