
# Agregar Edicion Inline en Perfiles Operativos

## Resumen

Actualmente la tabla de Custodios en `/perfiles-operativos` solo permite ver perfiles. Se agregaran capacidades de edicion directa desde la lista:
1. **Editar Zona Base**: Selector inline para cambiar la zona del custodio
2. **Editar Preferencia de Servicio**: Selector para local/foraneo/indistinto
3. **Dar de Baja**: Menu de acciones con modal que requiere motivo y guarda historial

---

## Cambios Requeridos

### 1. Hook: Agregar `preferencia_tipo_servicio` al query

**Archivo**: `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts`

Agregar el campo al SELECT y al interface `CustodioProfile`:

```typescript
export interface CustodioProfile {
  // ... campos existentes
  preferencia_tipo_servicio: 'local' | 'foraneo' | 'indistinto' | null;
}

// En el query de custodios:
.select(`
  id, nombre, telefono, ...,
  preferencia_tipo_servicio  // <- agregar
`)
```

### 2. Componente: Expandir `CustodiosDataTable.tsx`

**Archivo**: `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx`

| Elemento | Cambio |
|----------|--------|
| Imports | Agregar `CambioEstatusModal`, `Select`, iconos de preferencia |
| Estado | Agregar `updatingIds`, `showEstatusModal`, `selectedCustodio` |
| Columna Zona | Cambiar de texto a `<Select>` editable |
| Nueva columna | Agregar columna "Preferencia" con selector |
| Columna Acciones | Agregar `DropdownMenu` con opcion "Dar de baja" |
| Render | Agregar `<CambioEstatusModal>` al final |

**Nueva estructura de columnas**:

```text
| Custodio | Zona [Select] | Actividad | Servicios | Preferencia [Select] | Rating | Acciones [Dropdown] |
```

### 3. Funciones de actualizacion

Agregar handlers para:

```typescript
// Actualizar zona
const handleZonaChange = async (custodioId: string, nuevaZona: string) => {
  setUpdatingIds(prev => new Set([...prev, custodioId]));
  const { error } = await supabase
    .from('custodios_operativos')
    .update({ zona_base: nuevaZona, updated_at: new Date().toISOString() })
    .eq('id', custodioId);
  // ... invalidate queries, toast
};

// Actualizar preferencia
const handlePreferenciaChange = async (custodioId: string, pref: PreferenciaTipoServicio) => {
  // Similar pattern
};
```

---

## Estructura Visual Final

```text
+----------------------------------------------------------------------------------------------------------+
| Custodio            | Zona           | Actividad | Servicios | Preferencia     | Rating | Acciones       |
+----------------------------------------------------------------------------------------------------------+
| ABEL CRUZ CERON     | [CDMX     ▼]   | [Activo]  |    162    | [Local      ▼]  | ★ 5.0  | [👁] [⋯]      |
| ALAN ARMANDO...     | [EDOMEX   ▼]   | [Activo]  |    557    | [Indistinto ▼]  | ★ 5.0  | [👁] [⋯]      |
+----------------------------------------------------------------------------------------------------------+
                                                                                           |
                                                                                  +--------+--------+
                                                                                  | 👁 Ver perfil   |
                                                                                  |-----------------|
                                                                                  | ⛔ Dar de baja  |
                                                                                  +-----------------+
```

---

## Flujo de "Dar de Baja"

1. Usuario hace click en "Dar de baja" del menu de acciones
2. Se abre `CambioEstatusModal` con datos del custodio seleccionado
3. Modal muestra:
   - Estatus actual (badge)
   - Tipo de baja: Temporal / Permanente
   - Si temporal: fecha de reactivacion programada
   - Motivo (requerido): vacaciones, incapacidad medica, sancion, etc.
   - Notas adicionales (opcional)
4. Al confirmar:
   - Se actualiza `custodios_operativos.estado = 'inactivo'`
   - Se guarda en `operativo_estatus_historial` con `creado_por`, fecha, motivo
5. Custodio desaparece de la lista (filtro por defecto = activos)

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts` | Agregar `preferencia_tipo_servicio` al query e interface |
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Agregar selectores de zona/preferencia, dropdown de acciones, modal |

---

## Detalles Tecnicos

### Lista de zonas disponibles

Reutilizar la constante de `CustodiosZonasTab.tsx`:

```typescript
const ZONAS_DISPONIBLES = [
  { value: 'Ciudad de México', label: 'CDMX' },
  { value: 'Estado de México', label: 'EDOMEX' },
  { value: 'Jalisco', label: 'Jalisco' },
  // ... etc
];
```

### Opciones de preferencia

```typescript
const PREFERENCIA_OPTIONS = [
  { value: 'local', label: 'Local', icon: Home },
  { value: 'foraneo', label: 'Foráneo', icon: Plane },
  { value: 'indistinto', label: 'Indistinto', icon: CircleDot },
];
```

### Invalidacion de queries tras cambios

```typescript
queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
```

---

## Notas de UX

- Los selectores inline muestran spinner durante actualizacion (`updatingIds`)
- El menu de acciones agrupa "Ver perfil" y "Dar de baja"
- Modal de baja incluye validacion: motivo es requerido
- Toast de confirmacion al completar cada accion
- Los custodios inactivos no aparecen en la lista por defecto (se filtran por estado)
