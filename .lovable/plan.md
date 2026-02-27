

# Optimizacion Mobile: Plan 2026 y KPIs

## Diagnostico actual

La pestana "Plan 2026" tiene 5 secciones verticales sin adaptacion mobile: header con badges que se desbordan, bullet charts en grid de 2 columnas, pace indicators en grid de 2 columnas, burn-up chart con altura fija de 300px, tabla de varianza con 6 columnas, y scorecard trimestral/anual. En un viewport de 390px, los badges del header se apilan mal, los bullet charts pierden legibilidad, y la tabla es ilegible sin scroll horizontal.

Los KPIs ya tienen optimizacion mobile basica (priority cards + "Ver mas"), pero hay oportunidad de mejorar la jerarquia visual y el feedback tactil.

## Cambios planificados

### 1. StrategicPlanTracker — Header compacto mobile

**Problema**: Los 3 badges (fecha datos, dia/mes, status) se desbordan horizontalmente.

**Solucion**:
- En mobile, mover badges debajo del titulo en una fila con `flex-wrap gap-1.5`
- Reducir el grid de 4 stats a 2x2 con separadores visuales mas claros
- Las stats ya usan `text-xl sm:text-2xl`, mantener

### 2. Bullet Charts — Layout vertical en mobile

**Problema**: Grid `grid-cols-1 md:grid-cols-2` ya apila en mobile, pero cada BulletChart tiene leyenda con textos que se truncan en 390px.

**Solucion**:
- En `BulletChart.tsx`: reorganizar la fila superior (label + valores) a stack vertical en mobile — label arriba, valores abajo
- La leyenda inferior: cambiar de `flex justify-between` a layout compacto con el porcentaje del plan como elemento prominente (badge) en lugar de texto inline
- Aumentar la altura de la barra de 32px (h-8) a 40px en mobile para mejor touch target

### 3. Pace Indicators — Compactar informacion

**Problema**: Cada PaceIndicator tiene ~7 filas de datos con textos largos. Dos stacked ocupan mucho scroll vertical.

**Solucion**:
- En mobile, usar `MobileChartBlock` (ya creado) con tabs "Servicios" y "GMV" para mostrar un PaceIndicator a la vez en lugar de apilar ambos
- Dentro de cada PaceIndicator: la seccion de proyeccion es densa — consolidar "Proyeccion", "Meta" y "Deficit" en una fila compacta tipo stat-row en mobile
- El texto de metodologia (italic, 10px) se oculta en mobile — no aporta valor en glance

### 4. BurnUp Chart — Altura responsive

**Problema**: Altura fija `h-[300px]` — demasiado en mobile donde compite con scroll.

**Solucion**:
- Cambiar a `h-[220px] md:h-[300px]`
- Reducir font-size del eje Y a 9px en mobile
- YAxis width de 60 a 45 en mobile para ganar espacio horizontal del chart
- Tabs de Servicios/GMV: aumentar min-height a 44px para touch target

### 5. Tabla de Varianza Diaria — Card-list en mobile

**Problema**: Tabla de 6 columnas ilegible en 390px, requiere scroll horizontal.

**Solucion**:
- En mobile, reemplazar la tabla con una lista de cards compactas (una por dia)
- Cada card muestra: dia (con badge "Hoy"), plan vs actual como stat-row, varianza como badge coloreado, y acumulados como texto secundario
- Maximo 5 dias visibles en mobile (en lugar de 7) para reducir scroll
- Patron collapsible: por defecto mostrar solo 3 dias, con "Ver mas" para los restantes

### 6. QuarterlyAnnualScorecard — Stack optimizado

**Problema**: Grid `grid-cols-2` funciona pero los textos de proyeccion YoY se truncan en mobile.

**Solucion**:
- En mobile, cambiar grid de MetricColumns a `grid-cols-1` (stack vertical) — cada metrica ocupa full width con mejor legibilidad
- Seccion YoY: cambiar a stack vertical con formato simplificado: "Proy: 25K vs 22K (+13.6%)" en una sola linea por metrica
- Badge de header (dia X de Y): usar formato corto "D15/90" en mobile

### 7. ExecutiveKPIsBar — Refinamientos adicionales

**Problema**: Ya tiene optimizacion basica, pero oportunidades de mejora.

**Solucion**:
- Agregar feedback visual al tap en cards (active:scale-95 transition)
- En el boton "Ver mas", agregar microcopy del contenido colapsado: "Custodios, Armados, Proveedores..."
- Variaciones porcentuales: en mobile compactar a solo el numero con icono (sin "+" prefix) para ganar espacio

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/executive/StrategicPlanTracker.tsx` | Header responsive, MobileChartBlock para PaceIndicators, tabla a card-list, BurnUp height |
| `src/components/executive/BulletChart.tsx` | Layout vertical en mobile para label/valores, barra mas alta, leyenda compacta |
| `src/components/executive/PaceIndicator.tsx` | Proyeccion compacta, ocultar metodologia en mobile |
| `src/components/executive/BurnUpChart.tsx` | Altura responsive, ejes compactos |
| `src/components/executive/QuarterlyAnnualScorecard.tsx` | Grid cols-1 mobile, YoY compacto |
| `src/components/executive/ExecutiveKPIsBar.tsx` | Touch feedback, microcopy en "Ver mas" |

## Principios de diseno aplicados

1. **Jerarquia vertical**: Lo mas critico arriba (status semaforo + stats clave), detalles expandibles abajo
2. **One-thing-at-a-time**: PaceIndicators en tabs, no stacked
3. **Touch-first**: 44px minimo en toda interaccion, active states visibles
4. **Glanceable**: Numeros grandes, badges de color, sin texto innecesario
5. **Zero horizontal scroll**: Eliminar toda necesidad de scroll-x en 390px

