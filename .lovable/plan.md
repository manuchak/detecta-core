

# Optimizacion Mobile del Dashboard Ejecutivo

## Contexto

El C-Level necesita consultar el dashboard desde el telefono. Actualmente el layout esta disenado para pantallas grandes: KPIs en 8 columnas, charts en grids de 3, tabs con iconos + texto, y padding generoso. En movil todo se comprime y pierde legibilidad.

## Filosofia de diseno

**"Executive Glance"** - En movil, el CEO necesita respuestas en 3 segundos: como vamos este mes? hay alertas? cual es la tendencia? No necesita los 20+ charts simultaneos; necesita un flujo vertical jerarquizado con la informacion mas critica primero.

## Cambios por componente

### 1. Layout principal (`ExecutiveDashboard.tsx`)
- Reducir padding: `px-6 py-8` a `px-3 py-4` en movil via responsive classes
- Tabs: cambiar de `grid-cols-4` con iconos+texto a scroll horizontal con solo iconos en movil (tooltip al tap)
- Ocultar timestamp de "Ultima actualizacion" en movil (ocupa espacio innecesario)
- Titulo: `text-3xl` a `text-xl` en movil

### 2. KPIs Bar (`ExecutiveKPIsBar.tsx`)
- Actualmente: `grid-cols-2 md:grid-cols-4 lg:grid-cols-8` (ya tiene algo de responsive)
- Optimizar: en movil mostrar los 4 KPIs mas criticos (Servicios, GMV, AOV, Clientes) prominentes en `grid-cols-2`, con los otros 4 colapsables en un "Ver mas"
- Tamano de fuente del valor: `text-xl` a `text-lg` en movil
- Variacion porcentual: mantener pero con fuente mas compacta

### 3. Bloques de Charts (6 bloques de grids)
- **Prioridad movil**: Solo mostrar el chart mas importante de cada bloque por defecto
- Cambiar todos los `grid-cols-1 lg:grid-cols-3` — ya son responsive pero en movil los 3 charts apilados son demasiados
- Implementar un patron de "swipe/tabs" dentro de cada bloque: en movil, cada bloque muestra 1 chart con dots de navegacion o tabs compactas para alternar entre los 2-3 charts del bloque
- Altura de charts: reducir de ~300px a ~220px en movil para que el chart + leyenda quepan sin scroll

### 4. Alertas criticas (`CriticalAlertsBar.tsx`)
- Ya es relativamente compacto
- Ajustar `flex-wrap` para que los badges se apilen correctamente en pantallas angostas
- Hacer el boton dismiss mas grande (44px touch target)

### 5. Comparativa Anual (`AnnualComparisonCard.tsx`)
- El grid de 3 columnas YTD funciona bien pero los numeros se truncan en movil
- Cambiar a `grid-cols-1` en movil con un formato de lista horizontal tipo "stat row"
- Seccion de ritmo: apilar verticalmente en lugar de `grid-cols-2`

### 6. Plan Estrategico (`StrategicPlanTracker.tsx`)
- BulletCharts y BurnUp: asegurar que `ResponsiveContainer` tenga altura minima adecuada
- Tabs internas: scroll horizontal en movil
- Scorecard trimestral: formato card-stack en lugar de tabla

### 7. Mejoras globales de touch & readability
- Todos los botones y tabs: minimo 44px de altura tactil
- Tooltips de charts: maximizar ancho del tooltip en movil (actualmente `max-w-xs`, cambiar a casi full-width)
- Badges: aumentar padding interno ligeramente para legibilidad

## Implementacion tecnica

### Archivos a modificar

| Archivo | Cambio principal |
|---------|-----------------|
| `src/pages/Dashboard/ExecutiveDashboard.tsx` | Layout responsive, tabs compactas, padding movil |
| `src/components/executive/ExecutiveKPIsBar.tsx` | KPIs priorizados con expandible en movil |
| `src/components/executive/CriticalAlertsBar.tsx` | Touch targets, wrap mejorado |
| `src/components/executive/AnnualComparisonCard.tsx` | Grid responsive para stats |
| `src/components/executive/GmvDailyChart.tsx` | Altura responsive del chart |
| `src/components/executive/GmvMoMChart.tsx` | Altura responsive |
| `src/components/executive/StrategicPlanTracker.tsx` | Tabs scroll, card-stack |
| `src/hooks/use-mobile.tsx` | Ya existe, se reutilizara |

### Patron tecnico

Se usara el hook existente `useIsMobile()` para alternar layouts donde las clases responsive de Tailwind no sean suficientes (ej: colapsar KPIs, cambiar estructura de bloques de charts).

Para los bloques de charts en movil, se implementara un patron ligero de "section tabs" usando `Tabs` de Radix que ya esta instalado, sin agregar dependencias nuevas.

### Sin dependencias nuevas

Todo se resuelve con Tailwind responsive classes + el hook `useIsMobile` existente + componentes Radix ya instalados.

## Resultado esperado

- CEO puede ver KPIs criticos, alertas y tendencia principal en los primeros 3 segundos
- Charts legibles y navegables con swipe/tabs por seccion
- Touch targets de 44px+ en toda interaccion
- Sin degradacion de la vista desktop existente

