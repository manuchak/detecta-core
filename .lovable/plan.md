
# Plan: Mostrar Armados en Pestaña Bajas

## Diagnóstico

**Problema:** La consulta `bajasQuery` en `useOperativeProfiles.ts` solo busca en `custodios_operativos`:
```typescript
.from('custodios_operativos')
.eq('estado', 'inactivo')
```

**Datos en BD:**
- Armados activos: 16
- Armados inactivos: **69** (no se muestran)

## Solución

Modificar el sistema para consultar bajas de ambas tablas y mostrarlas unificadas con un indicador de tipo.

## Cambios Técnicos

### 1. Actualizar Interface `BajaProfile`

**Archivo:** `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts`

Agregar campo `tipo_personal` para distinguir custodios de armados:

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
  tipo_personal: 'custodio' | 'armado';  // NUEVO
}
```

### 2. Modificar `bajasQuery` para incluir armados

**Archivo:** `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts`

Consultar ambas tablas y combinar resultados:

```typescript
const bajasQuery = useQuery({
  queryKey: ['operative-profiles', 'bajas'],
  queryFn: async () => {
    // Fetch custodios inactivos
    const { data: custodios, error: errorCustodios } = await supabase
      .from('custodios_operativos')
      .select(`id, nombre, telefono, zona_base, estado, motivo_inactivacion, 
               tipo_inactivacion, fecha_inactivacion, fecha_reactivacion_programada, 
               numero_servicios, rating_promedio`)
      .eq('estado', 'inactivo');
    
    // Fetch armados inactivos
    const { data: armados, error: errorArmados } = await supabase
      .from('armados_operativos')
      .select(`id, nombre, telefono, zona_base, estado, motivo_inactivacion,
               tipo_inactivacion, fecha_inactivacion, fecha_reactivacion_programada,
               numero_servicios, rating_promedio`)
      .eq('estado', 'inactivo');
    
    // Combinar con tipo
    const bajasCustodios = (custodios || []).map(c => ({ ...c, tipo_personal: 'custodio' }));
    const bajasArmados = (armados || []).map(a => ({ ...a, tipo_personal: 'armado' }));
    
    // Ordenar por fecha de inactivación
    return [...bajasCustodios, ...bajasArmados]
      .sort((a, b) => /* fecha desc */);
  }
});
```

### 3. Actualizar `BajasDataTable`

**Archivo:** `src/pages/PerfilesOperativos/components/BajasDataTable.tsx`

- Agregar columna "Tipo" con badge (Custodio/Armado)
- Agregar filtro por tipo de personal
- Actualizar mensaje vacío para ser genérico

| Columna Actual | Columna Nueva |
|----------------|---------------|
| Nombre | Nombre |
| - | **Tipo** (badge: Custodio/Armado) |
| Zona | Zona |
| Estado | Estado |
| Motivo | Motivo |
| Fecha Baja | Fecha Baja |
| Servicios | Servicios |

### 4. Actualizar Estadísticas

Actualizar `totalBajas` en stats para contar ambos tipos.

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Solo custodios inactivos | Custodios + Armados inactivos |
| Sin distinción de tipo | Badge visual por tipo |
| 0 armados visibles | 69 armados visibles |
| Filtro solo por motivo | Filtro por tipo + motivo |
