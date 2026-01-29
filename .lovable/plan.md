
# Plan: Rediseño Minimalista del Widget de Clima

## Objetivo
Transformar el widget de clima a un diseño minimalista con 6 ciudades estratégicas en grid de 2 filas × 3 columnas, corrigiendo el overflow de iconos.

## Ciudades Seleccionadas (basado en volumen de rutas)
1. **Ciudad de México** - Hub principal
2. **Guadalajara** - Zona Occidente
3. **Monterrey** - Zona Norte
4. **Puebla** - Zona Centro
5. **Querétaro** - Bajío/Centro
6. **León** - Corredor Bajío

## Diseño Propuesto

```text
┌─────────────────────────────────────────────────────────────────┐
│ ☁️ Condiciones Climáticas                              [Demo]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ CDMX      ☀️ │  │ GDL       ⛅ │  │ MTY       ☁️ │          │
│  │ 22°        │  │ 26°        │  │ 28°        │          │
│  │ 💨 12 km/h  │  │ 💨 10 km/h  │  │ 💨 8 km/h   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Puebla    🌧️ │  │ Querétaro ☀️ │  │ León      ☀️ │          │
│  │ 19°        │  │ 24°        │  │ 23°        │          │
│  │ 💨 8 km/h   │  │ 💨 5 km/h   │  │ 💨 7 km/h   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Cambios Técnicos

### 1. WeatherWidget.tsx - Tarjeta Minimalista

**Antes:**
- Cards con `min-w-[200px]` en scroll horizontal
- Layout complejo con múltiples secciones
- Iconos que pueden desbordarse

**Después:**
- Grid fijo `grid-cols-3` con 2 filas
- Tarjetas compactas con padding reducido
- Layout vertical simple: Ciudad + Icono → Temperatura → Viento
- Iconos contenidos con `shrink-0`

### 2. useWeatherData.ts - 6 Ciudades Estratégicas

**Antes:** 4 ciudades (CDMX, Puebla, Querétaro, Guadalajara)

**Después:** 6 ciudades ordenadas por relevancia logística:
```typescript
const mockWeatherData: WeatherData[] = [
  { location: "CDMX", ... },
  { location: "Guadalajara", ... },
  { location: "Monterrey", ... },
  { location: "Puebla", ... },
  { location: "Querétaro", ... },
  { location: "León", ... },
];
```

## Especificaciones de Diseño

| Elemento | Valor |
|----------|-------|
| Grid | `grid-cols-2 sm:grid-cols-3` |
| Gap | `gap-3` |
| Card padding | `p-3` |
| Ciudad font | `text-xs font-medium truncate` |
| Temperatura | `text-lg font-semibold` |
| Iconos | `h-5 w-5 shrink-0` (evita overflow) |
| Detalles | Solo viento, ocultar humedad |

## Archivos a Modificar

1. **`src/components/monitoring/WeatherWidget.tsx`**
   - Rediseñar `WeatherCard` con layout minimalista
   - Cambiar contenedor a grid de 2 filas
   - Actualizar `LoadingSkeleton` para 6 cards

2. **`src/hooks/useWeatherData.ts`**
   - Agregar León y Monterrey al mock data
   - Usar abreviaciones (CDMX vs "Ciudad de México")

## Beneficios
- **Sin scroll horizontal** - Todo visible de un vistazo
- **Iconos contenidos** - `shrink-0` previene overflow
- **6 ciudades clave** - Cobertura de principales corredores
- **Responsive** - 2 cols en móvil, 3 en desktop
