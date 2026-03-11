

# Unificar navegación móvil en KPIDashboard

## Problema
En móvil, al entrar a `/dashboard/kpis` aparece un botón "← Volver" genérico sin la barra de navegación unificada de 5 iconos que tiene el ExecutiveDashboard. El usuario pierde contexto de dónde está y no puede navegar entre secciones sin volver atrás.

## Solución

### `src/pages/Dashboard/KPIDashboard.tsx`

Reemplazar el header móvil actual (← Volver + refresh icon) por:

1. **Título de sección**: "KPIs de la Organización" como `h2` compacto con el botón refresh al lado
2. **Barra de 5 tabs unificada** (idéntica a ExecutiveDashboard): los 5 iconos (TrendingUp, Target, Star, BarChart3, Radio) con KPIs como tab activa, que navegan a las mismas rutas (`/dashboard`, `/dashboard/plan`, `/dashboard/starmap`, `/dashboard/kpis`, `/dashboard/operativo`)
3. **Sub-tabs de 4 categorías** debajo (Ops, Clientes, KPIs, Resumen) — sin cambios

Resultado en 390px:
```text
┌───────────────────────────┐
│ KPIs de la Organización 🔄│
│ [📈] [🎯] [⭐] [📊] [📡] │  ← nav unificada, 📊 activo
│ [Ops] [Client] [KPIs] [+] │  ← sub-tabs
│ contenido...               │
└───────────────────────────┘
```

### Cambios específicos
- Eliminar el bloque `← Volver` + refresh button
- Agregar título `"KPIs de la Organización"` con refresh icon inline
- Agregar `<Tabs>` con los 5 `TabsTrigger` icon-only, valor `"kpis"` como activo, mismo `handleTabChange` que navega entre rutas
- Solo afecta la rama `isMobile` del header — desktop sin cambios

## Archivo a modificar
- `src/pages/Dashboard/KPIDashboard.tsx` — solo el bloque móvil del header (líneas ~268-285)

