

# Estrategia de Navegacion Movil — KPI Dashboard

## Problema actual (390px)

La vista tiene **dos niveles de tabs apilados** mas contenido denso:

1. **Nivel 1**: Proy. / KPIs (2 tabs) — funciona bien
2. **Nivel 2**: 7 tabs internas (Ops, Adq., Clientes, KPIs, Costos, Resumen, Calib.) — se desbordan horizontalmente con scroll oculto, el usuario no sabe que hay mas tabs a la derecha, y la barra ocupa espacio vertical valioso

El screenshot confirma: la barra de 7 tabs con scroll horizontal es poco descubrible y se come ~56px de altura.

## Estrategia: Scroll-snap tabs con indicadores de overflow

En lugar de cambiar la arquitectura de navegacion (que romperia URLs existentes), la solucion es hacer que las 7 tabs sean **visualmente claras en su scroll horizontal** con estas mejoras:

### 1. Scroll-snap con fade indicators (`KPIDashboard.tsx`)

- Envolver la `TabsList` de 7 tabs en un contenedor con `overflow-x-auto` + `scroll-snap-type: x mandatory`
- Cada `TabsTrigger` recibe `scroll-snap-align: start`
- Agregar **gradient fades** en los bordes izq/der cuando hay contenido oculto (CSS pseudo-elements)
- Reducir padding horizontal de cada tab para que quepan ~4 visibles a la vez

### 2. Agrupar tabs por contexto — reducir de 7 a 4 tabs en movil

En 390px, consolidar la navegacion:

| Tab movil | Contenido |
|-----------|-----------|
| Ops | Operacional (tab actual) |
| Clientes | Clientes + Adquisicion (como secciones apiladas) |
| KPIs | KPIs grid + Costos (como secciones apiladas) |
| Resumen | Resumen + Calibracion |

Esto elimina el scroll horizontal por completo — 4 tabs caben perfectamente en 390px.

### 3. Dentro de cada tab agrupada, separadores visuales

Usar un `<Separator>` con label entre las secciones combinadas:

```text
┌─────────────────────────┐
│ [Ops] [Client] [KPIs] [Sum] │  ← 4 tabs, sin scroll
├─────────────────────────┤
│ — Clientes —            │
│ ClientAnalytics cards   │
│                         │
│ — Adquisicion —         │
│ AcquisitionOverview     │
│ DailyLeadsCallsChart    │
└─────────────────────────┘
```

### 4. Header compacto en movil

- Mover el boton `Actualizar` al lado del greeting (ya lo hace parcialmente)
- Eliminar padding vertical excesivo

## Archivos a modificar

- **`src/pages/Dashboard/KPIDashboard.tsx`**: Deteccion `isMobile`, reemplazar 7 `TabsTrigger` por 4 en movil, combinar contenido de `TabsContent` agrupados, header compacto
- Sin nuevos componentes necesarios — solo logica condicional en el archivo existente

## Resultado en 390px

```text
┌───────────────────────────┐
│ Buenas noches, Manuel     │
│ [Proy.] [KPIs]        🔄 │
│                           │
│ [Ops] [Client] [KPIs] [+] │
│                           │
│ FILL RATE MTD             │
│ 93.4%  Meta: 95%          │
│ ↘ -4%  vs Febrero         │
│                           │
│ ON-TIME MTD               │
│ 100%   Meta: 90%          │
│ — +0%  vs Febrero         │
│ ...                       │
└───────────────────────────┘
```

4 tabs visibles sin scroll = descubribilidad total en movil, sin perder informacion.

