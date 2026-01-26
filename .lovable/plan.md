
# Plan de Mejora: Perfiles Operativos - Filtro por Defecto y Evaluación/Economics Armados

## Diagnóstico del Estado Actual

### 1. Problema del Filtro por Defecto
En la imagen se observa que se muestran **445 custodios** pero solo **90 activos en 30 días** e **342 inactivos +60 días**. Esto significa que el 76% de los perfiles visibles son inactivos, lo cual dificulta la operación diaria.

**Estado actual:**
- El hook `useOperativeProfiles.ts` filtra `.neq('estado', 'archivado')` pero **no filtra por actividad**
- Los DataTables tienen filtro de actividad pero **defaulta a "Toda actividad"**
- Resultado: Los usuarios ven primero los 342 custodios inactivos mezclados con los 90 activos

### 2. Sistema de Evaluaciones para Armados
**Estado actual:**
- `EvaluacionesTab.tsx` depende de `candidatoId` que viene de `pc_custodio_id`
- Los armados internos **no tienen vinculación a la tabla de candidatos/leads**
- Resultado: Siempre muestra "Este perfil no tiene un candidato asociado"

### 3. Sistema de Economics para Armados
**Estado actual:**
- `EconomicsTab.tsx` línea 24-30: Muestra placeholder "en desarrollo"
- Ya existe `useArmadosInternosMetrics.ts` con las tarifas escalonadas por km ($6/km hasta 100km, $5.5/km 101-250km, etc.)
- La lógica de cálculo existe pero **no está integrada** al perfil individual

---

## Plan de Implementación

### Corrección 1: Filtro por Defecto = "Activo" en DataTables

**Archivos a modificar:**
- `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx`
- `src/pages/PerfilesOperativos/components/ArmadosDataTable.tsx`

**Cambios:**

```typescript
// CustodiosDataTable.tsx - Línea 36
// CAMBIAR DE:
const [activityFilter, setActivityFilter] = useState<string>('all');

// A:
const [activityFilter, setActivityFilter] = useState<string>('activo');
```

```typescript
// ArmadosDataTable.tsx - Agregar filtro de actividad (actualmente no existe)
// Línea 36: Agregar nuevo estado
const [activityFilter, setActivityFilter] = useState<string>('activo');

// Agregar cálculo de nivel_actividad para armados (similar a custodios)
// Agregar columna de Actividad en la tabla
// Agregar Select de filtro de actividad
```

**Impacto:**
- Vista inicial: Solo 90 custodios activos (vs 445)
- Vista armados: Solo armados con actividad reciente
- Usuario puede cambiar a "Toda actividad" si lo necesita

---

### Corrección 2: Nivel de Actividad para Armados

**Archivo a modificar:** `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts`

**Cambios:**
El hook de custodios ya calcula `nivel_actividad` pero armados no lo tiene. Se debe agregar:

```typescript
// Líneas 128-162 - Agregar cálculo de actividad a armados
const armadosQuery = useQuery({
  queryKey: ['operative-profiles', 'armados'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('armados_operativos')
      .select(`...`)
      .neq('estado', 'archivado')
      .order('nombre');
    
    if (error) throw error;
    
    // AGREGAR: Calcular nivel de actividad igual que custodios
    return (data || []).map(a => {
      const { diasSinActividad, nivel } = calculateActivityLevel(a.fecha_ultimo_servicio);
      return {
        ...a,
        dias_sin_actividad: diasSinActividad,
        nivel_actividad: nivel
      } as ArmadoProfile;
    });
  },
  staleTime: 5 * 60 * 1000
});
```

**Interfaz ArmadoProfile:** Agregar los campos calculados:
```typescript
export interface ArmadoProfile {
  // ... campos existentes
  dias_sin_actividad: number;
  nivel_actividad: 'activo' | 'moderado' | 'inactivo' | 'sin_actividad';
}
```

---

### Corrección 3: Columna y Filtro de Actividad en ArmadosDataTable

**Archivo:** `src/pages/PerfilesOperativos/components/ArmadosDataTable.tsx`

**Cambios:**
1. Importar configuración de badges de actividad
2. Agregar estado para filtro de actividad
3. Agregar columna "Actividad" entre "Tipo" y "Zona"
4. Agregar Select de filtro
5. Actualizar lógica de filtrado

```typescript
// Agregar columna después de tipo_armado
{
  accessorKey: 'nivel_actividad',
  header: 'Actividad',
  cell: ({ row }) => {
    const nivel = row.original.nivel_actividad;
    const config = activityBadgeConfig[nivel];
    return (
      <Badge className={cn('text-xs font-normal', config.className)}>
        {config.label}
      </Badge>
    );
  },
}
```

---

### Corrección 4: Sistema de Economics para Armados

**Archivo a modificar:** `src/pages/PerfilesOperativos/components/tabs/EconomicsTab.tsx`

**Nuevo hook a crear:** `src/pages/PerfilesOperativos/hooks/useArmadoEconomics.ts`

Este hook reutilizará la lógica de tarifas de `useArmadosInternosMetrics.ts`:

```typescript
// Tarifas escalonadas por km (reutilizar de useArmadosInternosMetrics)
const TARIFAS_KM = [
  { kmMin: 0, kmMax: 100, tarifaPorKm: 6.0, rango: '0-100 km' },
  { kmMin: 100, kmMax: 250, tarifaPorKm: 5.5, rango: '101-250 km' },
  { kmMin: 250, kmMax: 400, tarifaPorKm: 5.0, rango: '251-400 km' },
  { kmMin: 400, kmMax: Infinity, tarifaPorKm: 4.6, rango: '400+ km' },
];

export function useArmadoEconomics(nombre: string | undefined) {
  return useQuery({
    queryKey: ['armado-economics', nombre],
    queryFn: async (): Promise<ArmadoEconomics> => {
      // 1. Buscar en asignacion_armados por armado_nombre_verificado o armado_id
      // 2. JOIN con servicios_custodia para obtener km_recorridos
      // 3. Calcular costos usando tarifas escalonadas
      // 4. Calcular tendencias mensuales
      // 5. Retornar estructura similar a CustodioEconomics
    },
    enabled: !!nombre
  });
}
```

**Modificar EconomicsTab.tsx:**
- Importar `useArmadoEconomics`
- Renderizar UI de economics cuando tipo === 'armado'
- Mostrar: Ingresos por servicio, KM totales, tarifa promedio aplicada, tendencia mensual

---

### Corrección 5: Sistema de Evaluaciones para Armados

**Problema identificado:** Los armados internos no pasan por el flujo de leads/candidatos, por lo que no tienen `candidatoId`.

**Solución:** Crear un flujo alternativo para armados basado en su ID de `armados_operativos`.

**Archivo a modificar:** `src/pages/PerfilesOperativos/PerfilForense.tsx`

```typescript
// Líneas 136-141 - Ajustar la lógica para armados
<TabsContent value="evaluaciones">
  {tipo === 'custodio' ? (
    <EvaluacionesTab 
      candidatoId={candidatoId} 
      candidatoNombre={profile.nombre} 
    />
  ) : (
    <ArmadoEvaluacionesTab 
      armadoId={id} 
      armadoNombre={profile.nombre}
    />
  )}
</TabsContent>
```

**Nuevo componente:** `src/pages/PerfilesOperativos/components/tabs/ArmadoEvaluacionesTab.tsx`

Contenido inicial (placeholder con capacidad de expansión):
- Estado de licencia de portación (vigente/por vencer/vencida)
- Años de experiencia
- Equipamiento disponible
- Score de confiabilidad histórico
- Tasas de confirmación/respuesta

---

## Flujo de Datos Corregido

```text
┌─────────────────────────────────────────────────────────────┐
│                    PERFILES OPERATIVOS                      │
├─────────────────────────────────────────────────────────────┤
│  useOperativeProfiles()                                     │
│    ├── custodiosQuery → calculateActivityLevel() ✓          │
│    └── armadosQuery   → calculateActivityLevel() ← AGREGAR  │
├─────────────────────────────────────────────────────────────┤
│  DataTable (Custodios)                                      │
│    └── activityFilter: 'activo' ← CAMBIAR DEFAULT           │
├─────────────────────────────────────────────────────────────┤
│  DataTable (Armados)                                        │
│    ├── Agregar columna Actividad                            │
│    ├── Agregar filtro de actividad                          │
│    └── activityFilter: 'activo' ← AGREGAR                   │
├─────────────────────────────────────────────────────────────┤
│  PERFIL FORENSE                                             │
│    ├── EconomicsTab                                         │
│    │     ├── tipo='custodio' → useProfileEconomics() ✓      │
│    │     └── tipo='armado'   → useArmadoEconomics() ← CREAR │
│    └── EvaluacionesTab                                      │
│          ├── tipo='custodio' → Psicométrica/Toxicológica ✓  │
│          └── tipo='armado'   → ArmadoEvaluacionesTab ← CREAR│
└─────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar/Crear

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Cambiar default a 'activo' | ALTA |
| `src/pages/PerfilesOperativos/components/ArmadosDataTable.tsx` | Agregar columna + filtro actividad | ALTA |
| `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts` | Agregar nivel_actividad a armados | ALTA |
| `src/pages/PerfilesOperativos/hooks/useArmadoEconomics.ts` | CREAR - Economics para armados | MEDIA |
| `src/pages/PerfilesOperativos/components/tabs/EconomicsTab.tsx` | Integrar useArmadoEconomics | MEDIA |
| `src/pages/PerfilesOperativos/components/tabs/ArmadoEvaluacionesTab.tsx` | CREAR - Evaluaciones armados | MEDIA |
| `src/pages/PerfilesOperativos/PerfilForense.tsx` | Renderizar tab correcto por tipo | MEDIA |

---

## Modelo de Datos Economics Armados

```typescript
interface ArmadoEconomics {
  // Totales históricos
  serviciosTotales: number;
  kmTotales: number;
  costoTotalEstimado: number; // Usando tarifas escalonadas
  
  // Unit Economics
  tarifaPromedioKm: number;
  costoPromedioServicio: number;
  
  // Por rango de km
  distribucionPorRango: {
    rango: string;
    servicios: number;
    kmTotales: number;
    costoTotal: number;
    tarifaAplicada: number;
  }[];
  
  // Tendencia mensual (últimos 6 meses)
  tendenciaMensual: {
    mes: string;
    mesLabel: string;
    servicios: number;
    kmTotales: number;
    costoEstimado: number;
  }[];
  
  // Primer y último servicio
  primerServicio: string | null;
  ultimoServicio: string | null;
  diasActivo: number;
}
```

---

## Compatibilidad con Otros Workflows

| Workflow | Impacto |
|----------|---------|
| Asignación de armados en Planeación | ✅ Sin cambios - usa armados_disponibles_extendido |
| Reportes de Equidad Armados | ✅ Sin cambios - usa datos directos de DB |
| Registro de pagos armados | ✅ Sin cambios - usa useProveedoresPagos |
| Sincronización leads → armados | ✅ Sin cambios - flujo independiente |
| Filtro 90 días en Planeación | ✅ Sin cambios - lógica separada |

---

## Tests de Verificación

1. **Filtro por defecto Custodios**: Abrir /perfiles-operativos → Debe mostrar ~90 custodios (activos 30d) no 445
2. **Filtro por defecto Armados**: Tab Armados → Debe mostrar solo armados con actividad reciente
3. **Cambiar filtro**: Seleccionar "Toda actividad" → Debe mostrar todos los registros
4. **Economics Armado**: Abrir perfil armado → Tab Economics → Debe mostrar métricas con tarifas escalonadas
5. **Evaluaciones Armado**: Abrir perfil armado → Tab Evaluaciones → Debe mostrar estado licencia y métricas
