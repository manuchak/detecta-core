

# Unificar StarMap dentro del sistema de pestañas del Dashboard Ejecutivo

## Problema
Cuando el usuario toca la pestaña StarMap ⭐ en el dashboard ejecutivo móvil, se navega a `/dashboard/starmap` que renderiza `StarMapPage` como página independiente — con su propio header, botón "←" y sin las pestañas de navegación. El usuario pierde la barra de tabs y debe usar el botón back para regresar, rompiendo la consistencia con las demás pestañas (Proyecciones, Plan 2026, Operativo).

## Solución
Renderizar el contenido de StarMap **inline** dentro de `ExecutiveDashboard.tsx` cuando `currentTab === 'starmap'`, igual que ya se hace con `plan` → `<StrategicPlanTracker />` y `operativo` → `<MobileOperationalDashboard />`.

## Cambios

### 1. `src/pages/Dashboard/ExecutiveDashboard.tsx`
- Importar los componentes de StarMap: `useStarMapKPIs`, `StarMapVisualization`, `PillarDetailPanel`, `DataHealthSummary`, `IncidentPanel`
- Agregar rama `currentTab === 'starmap'` que renderice el contenido del StarMap directamente (sin header duplicado ni botón back), reutilizando los mismos componentes
- En móvil: layout vertical (visualización → detalle de pilar → grid de pilares → incidentes → data health)

### 2. `src/App.tsx`
- Cambiar la ruta `/dashboard/starmap` para que apunte a `ExecutiveDashboard` en lugar de `StarMapPage`, así al navegar directamente a la URL se carga el dashboard con la pestaña starmap activa (consistente con `/dashboard/plan`, `/dashboard/kpis`, etc.)

### 3. `src/pages/StarMap/StarMapPage.tsx`
- Sin cambios — se mantiene como página standalone accesible desde otros puntos si se necesita en el futuro.

Resultado: la pestaña StarMap se comporta igual que Plan 2026 y Operativo — el contenido aparece bajo las mismas tabs, sin perder la navegación.

