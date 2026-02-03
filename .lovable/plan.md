
# Plan: Sistema de Reactivación y Rollback de Bajas

## Problema Identificado

1. **Sin rollback**: No existe manera de reactivar operativos dados de baja por error
2. **Caché**: Query con staleTime de 5 min puede mostrar datos desactualizados
3. **Datos en BD**: 69 armados + 347 custodios = 416 bajas totales (pero UI puede estar cacheada)

## Solución

Agregar capacidad de reactivación individual y masiva desde la pestaña Bajas.

## Cambios Técnicos

### 1. Modificar `BajaDetailsDialog.tsx`

Agregar botón "Reactivar" con confirmación:

```text
┌─────────────────────────────────────────┐
│ Detalle de Baja: Juan Pérez             │
├─────────────────────────────────────────┤
│ Zona: CDMX Norte    Servicios: 45       │
│ Fecha baja: 15 Ene 2026                 │
│                                         │
│ [Sanciones Aplicadas]                   │
│ [Historial de Estatus]                  │
│                                         │
├─────────────────────────────────────────┤
│ [Cancelar]          [🔄 Reactivar]      │
└─────────────────────────────────────────┘
```

- Importar `useCambioEstatusOperativo`
- Agregar estado para modal de confirmación
- Formulario simple con motivo de reactivación
- Llamar al hook con `tipoCambio: 'reactivacion'`

### 2. Crear `ReactivacionMasivaModal.tsx`

Para rollback de errores en bajas masivas:

```text
┌─────────────────────────────────────────┐
│ ⚠️ Reactivar Operativos                 │
├─────────────────────────────────────────┤
│ Seleccionados: 5 operativos             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ Juan Pérez (Custodio) - CDMX     │ │
│ │ ☑ María López (Armado) - GDL       │ │
│ │ ☑ ...                               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Motivo: [Rollback de baja por error]    │
│                                         │
├─────────────────────────────────────────┤
│ [Cancelar]    [✓ Confirmar Reactivación]│
└─────────────────────────────────────────┘
```

### 3. Crear `useReactivacionMasiva.ts`

Hook para reactivar múltiples operativos:

```typescript
interface ReactivacionMasivaParams {
  operativos: Array<{
    id: string;
    tipo_personal: 'custodio' | 'armado';
    nombre: string;
  }>;
  motivo: string;
  notas?: string;
}
```

- Iterar sobre operativos y actualizar estado a 'activo'
- Limpiar campos de inactivación
- Registrar en historial con `tipo_cambio: 'reactivacion'`
- Invalidar queries de ambas pestañas

### 4. Actualizar `BajasDataTable.tsx`

Agregar selección múltiple y botón de reactivación masiva:

- Agregar columna de checkbox
- Estado para operativos seleccionados
- Botón "Reactivar seleccionados" en header de filtros
- Integrar con nuevo modal de reactivación masiva

### 5. Corregir invalidación de queries

En `useCambioEstatusOperativo.ts` agregar:
```typescript
queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
```

En `useBajaMasiva.ts` agregar lo mismo para que actualice todas las vistas.

## Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `BajaDetailsDialog.tsx` | Agregar botón y lógica de reactivación individual |
| `ReactivacionMasivaModal.tsx` | **Crear** nuevo modal |
| `useReactivacionMasiva.ts` | **Crear** nuevo hook |
| `BajasDataTable.tsx` | Agregar checkboxes y botón de reactivación masiva |
| `useCambioEstatusOperativo.ts` | Agregar invalidación de query `operative-profiles` |
| `useBajaMasiva.ts` | Agregar invalidación de query `operative-profiles` |

## Flujo de Rollback

```text
Usuario detecta error en baja masiva
        ↓
Pestaña Bajas → Selecciona operativos afectados
        ↓
Click "Reactivar seleccionados"
        ↓
Modal confirmación con lista + motivo
        ↓
Confirmar → Hook actualiza BD + registra historial
        ↓
Queries invalidadas → UI actualizada automáticamente
```

## Resultado Esperado

- Reactivación individual desde detalle de baja
- Reactivación masiva para rollback de errores
- Historial completo de cambios de estatus
- UI sincronizada con BD sin recargar página
