

# Add "Desayuno" pause type (20 minutes)

Adding a new pause type `desayuno` with a 20-minute duration to the monitoring pause system. Changes span 3 files:

## Files to modify

### 1. `src/hooks/useMonitoristaPause.ts`
- Add `'desayuno'` to `TipoPausa` union type
- Add `desayuno: 20` to `PAUSE_DURATIONS`
- Add `desayuno: 'Desayuno'` to `PAUSE_LABELS`

### 2. `src/components/monitoring/bitacora/PauseConfirmDialog.tsx`
- Add `desayuno` entry to `PAUSE_ICONS` with a `Sunrise` icon (from lucide-react)

### 3. `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx`
- Add a new `DropdownMenuItem` for "Desayuno (máx 20m)" with the `Sunrise` icon, placed before the "Comida" option

No database migration needed — `tipo_pausa` is stored as free text in `bitacora_pausas_monitorista`.

