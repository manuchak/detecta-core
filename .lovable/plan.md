

# Bug: AlertDialogAction cierra el diálogo antes de completar la mutación

## Diagnóstico

El bug está en `PauseConfirmDialog.tsx`. El componente `AlertDialogAction` de Radix **cierra automáticamente el diálogo al hacer click** (comportamiento por defecto del primitivo). Esto causa:

1. El monitorista hace click en "Iniciar pausa"
2. El diálogo se cierra **inmediatamente** (Radix auto-close)
3. La mutación se dispara en background
4. El usuario no ve el estado "Procesando…" ni recibe feedback visual
5. Si la mutación falla, el usuario no entiende qué pasó
6. Si el usuario hace click rápido o la mutación tiene un delay, puede intentar activar otra pausa

## Fix

**Archivo:** `src/components/monitoring/bitacora/PauseConfirmDialog.tsx`

Agregar `e.preventDefault()` al `onClick` del `AlertDialogAction` para evitar el cierre automático. El diálogo se cerrará solo cuando la mutación tenga éxito (ya manejado en `MonitoristaAssignmentBar` con `onSuccess: () => setPauseDialogOpen(false)`).

```tsx
<AlertDialogAction
  onClick={(e) => {
    e.preventDefault();
    onConfirm(tipoPausa);
  }}
  disabled={isPending || !checked || noAvailable || noServices}
>
```

Mismo fix aplicar al `AlertDialogCancel` para que no se pueda cancelar mientras `isPending` está activo (ya tiene `disabled={isPending}` pero el auto-close de Radix podría ignorarlo).

**1 archivo, ~2 líneas cambiadas.**

