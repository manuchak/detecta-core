

# Unificar Navegacion Movil del Dashboard

## Problema

Actualmente hay **dos componentes separados** que renderizan en rutas distintas:
- `ExecutiveDashboard` → `/dashboard`, `/dashboard/plan`, `/dashboard/starmap`, `/dashboard/operativo` — tiene su propia barra de tabs (Proyecciones, Plan 2026, StarMap, KPIs, Operativo)
- `KPIDashboard` → `/dashboard/kpis` — tiene su **propio header duplicado** (greeting, tabs Proy./KPIs, botón refresh) + 4 sub-tabs (Ops, Clientes, KPIs, Resumen)

En movil, al navegar a KPIs se pierde la barra unificada del ExecutiveDashboard y aparece un header redundante con greeting y tabs duplicadas.

## Solucion

**Eliminar la ruta separada de KPIDashboard en movil** e integrar su contenido directamente dentro de ExecutiveDashboard, como ya se hace con StarMap, Plan 2026 y Operativo.

### Cambios

#### 1. `src/pages/Dashboard/ExecutiveDashboard.tsx`
- Cuando `currentTab === 'kpis'` en movil, renderizar el contenido de KPIDashboard inline (las 4 sub-tabs: Ops, Clientes, KPIs, Resumen) en lugar de navegar a `/dashboard/kpis`
- Extraer la logica de contenido del KPIDashboard a un componente reutilizable `KPIInlineContent`
- Mantener la barra de tabs unificada visible en todo momento

#### 2. `src/pages/Dashboard/KPIDashboard.tsx`
- En movil: eliminar el header duplicado (greeting, tabs Proy./KPIs, refresh button)
- Renderizar solo las 4 sub-tabs y su contenido
- En desktop: mantener el layout actual sin cambios

#### 3. `src/App.tsx`
- En movil, `/dashboard/kpis` puede redirigir a `/dashboard` con tab=kpis, o simplemente el KPIDashboard detecta `isMobile` y omite su header propio

### Enfoque elegido: KPIDashboard sin header en movil

La forma mas limpia es que **KPIDashboard en movil no renderice su propio header** (greeting, tabs de nivel 1, refresh). Solo muestra las 4 sub-tabs y contenido. La navegacion de nivel 1 ya la provee ExecutiveDashboard.

Para que funcione sin cambiar rutas:
- `ExecutiveDashboard` tab "KPIs" en movil: `navigate('/dashboard/kpis')` (ya lo hace)
- `KPIDashboard` en movil: oculta greeting, oculta tabs Proy./KPIs, solo muestra sub-tabs + contenido
- Agregar un boton "← Volver" compacto en KPIDashboard movil que regresa a `/dashboard`

### Optimizacion de tarjetas de indicadores

Las HeroCards del `OperationalHeroBar` (Fill Rate, On-Time, Servicios, GMV) actualmente usan `text-3xl` para el valor y padding generoso. En movil:
- Reducir a `text-2xl` el valor principal
- Comprimir padding de `p-4` a `p-3`
- Grid de 2 columnas en movil (`grid-cols-2`) en vez de 1 columna, para ver 4 KPIs sin scroll

## Archivos a modificar
- `src/pages/Dashboard/KPIDashboard.tsx` — ocultar header en movil, agregar back button
- `src/components/executive/OperationalHeroBar.tsx` — grid 2-col y tipografia compacta en movil

## Resultado en 390px

```text
┌───────────────────────────┐
│ detecta      🔔  AD       │  ← TopBar (UnifiedLayout)
├───────────────────────────┤
│ Dashboard Ejecutivo       │
│ [📈][🎯][⭐][📊][📡]     │  ← Tabs unificadas (ExecutiveDashboard)
│         ↑ KPIs activo     │
├───────────────────────────┤
│ ← Volver                  │
│ [Ops] [Client] [KPIs] [+] │  ← Sub-tabs KPI
├───────────────────────────┤
│ FILL RATE  │ ON-TIME      │
│ 93.4%  🟡  │ 100%   🟢   │  ← 2-col compact
│ Meta:95%   │ Meta:90%     │
│ ↘-4%      │ —+0%         │
├────────────┼──────────────┤
│ SERVICIOS  │ GMV MTD      │
│ 318    🟢  │ $4.2M   🟢  │
│ ↗+44.5%   │ ↗+12%        │
└───────────────────────────┘
```

