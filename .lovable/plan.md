

# Optimizacion Mobile del Dashboard KPIs

## Problemas Identificados

1. **Tooltips invisibles en movil**: `KPIHeroCard` usa Radix `Tooltip` (hover-only). En touch no se activa. El contenido es valioso (desglose CPA, formula, evolucion mensual) pero inaccesible.

2. **KPIDetailView no es mobile-friendly**: El panel de detalle usa `fixed inset-y-0 right-0 max-w-4xl` con `p-6` — ocupa todo el ancho pero con padding desktop. Las vistas internas (CPADetailView, ConversionRateDetailView, etc.) usan `grid-cols-4` que colapsa a `grid-cols-1` dejando tarjetas apiladas con mucho espacio vertical desperdiciado.

3. **KPI cards con whitespace excesivo**: Las tarjetas en `ExecutiveMetricsGrid` tienen `p-4 md:p-6` y valores `text-2xl md:text-3xl` que en una grilla 2-col movil dejan grandes bloques de espacio en blanco vertical.

## Solucion Propuesta

### A. Tooltips → Bottom Sheet en movil (`KPIHeroCard.tsx`)
- Detectar `useIsMobile()` en el componente
- En movil: al hacer tap en la tarjeta, abrir un `Drawer` (vaul) desde abajo con el contenido del tooltip
- En desktop: mantener el Tooltip de Radix sin cambios
- El drawer tendra `max-h-[70vh]` con scroll interno, header con titulo del KPI y boton cerrar

### B. KPIDetailView → Drawer fullscreen en movil (`KPIDetailView.tsx`)
- En movil: reemplazar el panel lateral `fixed right-0 max-w-4xl` por un `Drawer` fullscreen (vaul) con `snap-points={[1]}`
- Padding reducido `p-3` en lugar de `p-6`
- Header compacto sticky con titulo y boton X

### C. Detail Views responsivas (todas las vistas en `/details/*.tsx`)
- Cambiar `grid-cols-1 md:grid-cols-4` a `grid-cols-2 md:grid-cols-4` para que las summary cards se muestren en pares en movil (aprovechando ancho horizontal)
- Reducir padding de cards internas: `p-2` en movil
- Charts: reducir height de `h-80` a `h-48` en movil
- Valores: `text-lg` en movil en vez de `text-2xl`

### D. KPI Grid compacto (`ExecutiveMetricsGrid.tsx` + `KPIHeroCard.tsx`)
- Reducir padding de tarjetas en movil: `p-3` en vez de `p-4`
- Valores: `text-xl` en movil en vez de `text-2xl`
- Reducir `space-y-3` a `space-y-1.5` en movil
- Gap del grid: mantener `gap-3` (ya esta bien)

## Archivos a modificar
- `src/components/executive/KPIHeroCard.tsx` — tooltip → drawer en movil
- `src/components/executive/KPIDetailView.tsx` — panel → drawer fullscreen en movil
- `src/components/executive/ExecutiveMetricsGrid.tsx` — padding compacto
- `src/components/executive/details/CPADetailView.tsx` — grid 2-col movil, charts compactos
- `src/components/executive/details/ConversionRateDetailView.tsx` — idem
- `src/components/executive/details/RetentionDetailView.tsx` — idem
- `src/components/executive/details/LTVDetailView.tsx` — idem
- `src/components/executive/details/SupplyGrowthDetailView.tsx` — idem
- `src/components/executive/details/CustodianEngagementDetailView.tsx` — idem
- `src/components/executive/details/MonthlyCapacityDetailView.tsx` — idem

## Patron de referencia
El proyecto ya usa `vaul` (Drawer) extensivamente en otros modulos moviles. El patron de cleanup de body overflow de la memory de gobernanza se aplicara en los `onOpenChange` handlers.

