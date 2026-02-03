
# Plan: Sistema de Reactivación y Rollback de Bajas ✅ IMPLEMENTADO

## Cambios Realizados

### 1. ✅ Hook `useReactivacionMasiva.ts` (NUEVO)
- Reactivación masiva de custodios y armados
- Actualización de BD por lotes
- Registro en historial de estatus
- Invalidación de queries

### 2. ✅ Modal `ReactivacionMasivaModal.tsx` (NUEVO)
- UI para confirmar reactivación masiva
- Lista de operativos seleccionados
- Campo de motivo obligatorio
- Notas opcionales

### 3. ✅ `BajaDetailsDialog.tsx` (MODIFICADO)
- Botón "Reactivar" individual
- Formulario inline con motivo
- Integración con `useCambioEstatusOperativo`
- Badge para distinguir Armado/Custodio

### 4. ✅ `BajasDataTable.tsx` (MODIFICADO)
- Checkboxes para selección múltiple
- Botón "Reactivar (n)" cuando hay selección
- Integración con modal de reactivación masiva
- onClick en celdas (no en row completo por checkbox)

### 5. ✅ `useCambioEstatusOperativo.ts` (MODIFICADO)
- Agregada invalidación de `operative-profiles`

### 6. ✅ `useBajaMasiva.ts` (YA TENÍA)
- Ya incluía invalidación de `operative-profiles`

## Flujo de Rollback Implementado

```
Usuario detecta error → Pestaña Bajas → Selecciona operativos
        ↓
Click "Reactivar (n)" → Modal confirmación
        ↓
Confirmar → BD actualizada + historial
        ↓
Queries invalidadas → UI sincronizada
```
