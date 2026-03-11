

# Fix: Vista detallada de KPIs inaccesible en móvil

## Problema

En `KPIHeroCard.tsx` (línea 78-84), cuando el usuario toca una tarjeta KPI en móvil:
- Si tiene tooltip → abre el drawer del tooltip y **nunca llama a `onClick`**
- El `onClick` es lo que abre `KPIDetailView` con los gráficos detallados
- Resultado: en móvil los gráficos de análisis detallado son completamente inaccesibles

## Solución

Cambiar la interacción móvil para que **un solo tap** abra la vista detallada (igual que desktop), y el tooltip se integre como contenido secundario dentro de esa misma vista, o se acceda con un gesto diferente (long-press o botón info).

**Enfoque elegido**: En móvil, el tap siempre ejecuta `onClick` (abre el detail view). El contenido del tooltip se muestra como un resumen compacto al inicio del drawer de detalle, antes de los gráficos. Esto elimina el conflicto tap-tooltip vs tap-detail.

### Cambios en `KPIHeroCard.tsx`
- Modificar `handleCardClick`: en móvil, siempre llamar `onClick?.()` primero (si existe). Si no hay `onClick` pero sí `tooltip`, abrir el drawer del tooltip como fallback.
- Pasar el contenido del `tooltip` como prop adicional al detail view para integrarlo.

### Cambios en `KPIDetailView.tsx`
- Aceptar un nuevo prop opcional `tooltipContent?: React.ReactNode`
- En la versión móvil (Drawer), renderizar el tooltip content como un bloque compacto colapsable al inicio, antes del `DetailContent`, dando contexto rápido sin perder los gráficos.

### Cambios en `ExecutiveMetricsGrid.tsx`
- Pasar el `tooltip` content también como `tooltipContent` al callback de `onKPIClick`, o manejar el estado para que `KPIDetailView` reciba el tooltip correspondiente al KPI seleccionado.

## Archivos a modificar
- `src/components/executive/KPIHeroCard.tsx` — priorizar onClick sobre tooltip en móvil
- `src/components/executive/KPIDetailView.tsx` — integrar tooltip summary en drawer móvil
- `src/components/executive/ExecutiveMetricsGrid.tsx` — pasar tooltipContent al detail view

