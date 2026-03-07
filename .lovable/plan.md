

# Plan: Ocultar tab "Operativo" en desktop

## Cambio

En `src/pages/Dashboard/ExecutiveDashboard.tsx`:

1. **Ocultar el TabsTrigger "Operativo"** cuando `isMobile` es `false` (ya tenemos el hook `useIsMobile`).
2. **Cambiar el grid de tabs** de `grid-cols-5` a `grid-cols-4` en desktop (ya que serán 4 tabs).
3. **Redirigir a `/dashboard`** si un usuario desktop llega a `/dashboard/operativo` directamente (por URL).

## Detalle técnico

- Envolver el `<TabsTrigger value="operativo">` en `{isMobile && ...}` 
- Cambiar `grid-cols-5` → `grid-cols-4` en la TabsList desktop
- Agregar un redirect: si `!isMobile && currentTab === 'operativo'`, navegar a `/dashboard`

Un solo archivo editado: `ExecutiveDashboard.tsx`.

