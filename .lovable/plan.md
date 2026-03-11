

# Mejora del Header Móvil — Módulo de Monitoreo

## Problema

En móvil (390x743), el módulo muestra **3 capas de navegación apiladas**:
1. `SimplifiedTopBar` (logo detecta + shield + bell + avatar) — 56px
2. Header propio del shell ("Monitoreo" + refresh) — ~44px  
3. `MobileTabSelector` (pills horizontales) — ~52px

Eso consume ~152px (20% del viewport) solo en navegación, dejando poco espacio para contenido. Además, la barra superior muestra elementos redundantes o inútiles en contexto móvil (breadcrumbs ocultos, command menu oculto, etc.).

## Solución

Fusionar las 2 barras superiores en un **header único compacto** que integre los elementos esenciales de ambas.

### Header unificado (MonitoringMobileShell)

```text
┌─────────────────────────────────────┐
│ ← (back)   Monitoreo    🔔  🔄  👤 │  ← 48px, una sola línea
├─────────────────────────────────────┤
│ [Bitácora] [Mapa] [Perf] [Check]→  │  ← pills scrollables
├─────────────────────────────────────┤
│                                     │
│         CONTENIDO (643px)           │
│                                     │
└─────────────────────────────────────┘
```

Elementos del header unificado:
- **Izquierda**: Botón back (flecha) que navega a Home
- **Centro**: Título "Monitoreo" (font-semibold, text-base)
- **Derecha**: Notificaciones (badge), refresh, avatar con dropdown

### Ocultar SimplifiedTopBar en móvil dentro de Monitoring

En `MonitoringMobileShell`, el zoom reset ya existe. Agregaremos un efecto que oculte el `SimplifiedTopBar` añadiendo una clase al body o al header, y lo restaure al desmontar. Alternativamente, haremos que `MonitoringMobileShell` use `h-[100dvh]` con `position: fixed inset-0` para cubrir toda la pantalla, superponiéndose al layout padre.

## Archivos

| Archivo | Cambio |
|---|---|
| `MonitoringMobileShell.tsx` | Rediseñar header: integrar back, notificaciones, avatar, refresh en una línea. Usar `fixed inset-0 z-50` para cubrir el layout padre completo |
| `MobileTabSelector.tsx` | Ajustar padding para alinearse al nuevo header (quitar `-mx-4`, usar padding interno consistente) |

2 archivos, cambios focalizados en el shell móvil sin afectar desktop.

