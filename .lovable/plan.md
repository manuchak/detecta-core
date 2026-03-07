

# Plan: Rediseño Mobile-First del Home con estilo Apple/Glassmorphism

## Concepto

Cuando `useIsMobile()` es `true`, renderizar un layout completamente diferente en `Home.tsx`: header compacto, hero simplificado, grid de apps estilo iOS (4 columnas, iconos glassmorphism), y bottom navigation bar fija. En desktop, el layout actual se mantiene sin cambios.

## Cambios

### 1. Nuevo componente: `src/components/home/MobileHomeLayout.tsx`

Layout vertical full-screen, sin scroll innecesario:

```text
┌─────────────────────────┐
│  Buenos días             │  ← Header minimalista (avatar + nombre + hora)
│  Carlos                  │
├─────────────────────────┤
│                          │
│  ┌─────────────────────┐ │
│  │  47 servicios hoy   │ │  ← Hero card glassmorphism compacto
│  │  ██████████░░ 78%    │ │     (versión condensada del HeroActionCard)
│  └─────────────────────┘ │
│                          │
│  ┌───┐ ┌───┐ ┌───┐      │
│  │GMV│ │Act│ │Tur│      │  ← 3 metric pills inline (glassmorphism)
│  └───┘ └───┘ └───┘      │
│                          │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐    │
│  │📊│ │👥│ │📅│ │🚛│    │  ← App grid 4 cols (iOS style)
│  │BI│ │Led│ │Pln│ │Svc│  │
│  ├──┤ ├──┤ ├──┤ ├──┤    │
│  │📡│ │📦│ │💰│ │🏢│    │
│  │Mon│ │Inv│ │Fac│ │CRM│  │
│  └──┘ └──┘ └──┘ └──┘    │
│                          │
├─────────────────────────┤
│ 🏠  📊  📅  ⚙️          │  ← Bottom nav glassmorphism
└─────────────────────────┘
```

Componente que recibe los mismos props que ya usa Home.tsx (hero, displayWidgets, modules) y los renderiza en formato mobile.

### 2. Nuevo componente: `src/components/home/MobileHomeBottomNav.tsx`

Bottom nav con 4 tabs fijos: Inicio (activo), Dashboard, Servicios, Más. Estilo glassmorphism con backdrop-blur. Usa `useNavigate` para las rutas principales.

### 3. Editar `src/pages/Home/Home.tsx`

Agregar `useIsMobile()` y renderizar condicionalmente:
- Mobile: `<MobileHomeLayout>` con bottom nav
- Desktop: layout actual sin cambios

### 4. Editar `src/index.css`

Agregar clases CSS:
- `.liquid-glass-bottom-nav` — nav inferior con blur intenso y borde superior sutil
- `.liquid-glass-metric-pill` — pill compacto para las 3 métricas
- Ajustar `.liquid-glass-app` para mobile (grid 4 cols más compacto, aspect-ratio cuadrado, touch targets de 60px+)

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/components/home/MobileHomeLayout.tsx` | Crear — layout mobile completo |
| `src/components/home/MobileHomeBottomNav.tsx` | Crear — bottom nav glassmorphism |
| `src/pages/Home/Home.tsx` | Editar — fork mobile/desktop con useIsMobile |
| `src/index.css` | Editar — agregar clases glass para mobile |

## Principios de Diseño

- **Zero chrome**: sin bordes gruesos, sin sombras pesadas, solo blur y transparencias
- **Touch-first**: targets mínimos de 44px, padding generoso
- **Densidad controlada**: hero + 3 pills + app grid — todo visible sin scroll en pantallas de 667px+
- **Safe area**: padding-bottom para bottom nav respetando notch/home indicator
- **Animaciones Apple**: stagger en app icons con `animate-apple-slide-in` existente

