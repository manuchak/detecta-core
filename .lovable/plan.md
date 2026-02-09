

# Mejorar visibilidad de horas en la lista lateral del TV Dashboard

## Problema

El equipo reporta que las horas de salida y los bloques de horarios son dificiles de leer en la pantalla de 50 pulgadas. Causas:

1. **Hora en separador de grupo** (linea 76): `text-[11px]` con `text-gray-500` -- demasiado pequeño y bajo contraste
2. **Hora en cada fila** (linea 98): `text-sm` (~14px) con `text-gray-400` -- pequeña y gris tenue
3. **Separador de grupo** tiene fondo casi invisible (`bg-white/[0.03]`) y lineas tenues (`bg-white/10`)

## Cambios en `src/components/monitoring/tv/TVServicesList.tsx`

### 1. Separador de bloque horario (linea 74-80)

- Aumentar texto de `text-[11px]` a `text-sm` (14px)
- Cambiar color de `text-gray-500` a `text-gray-300` (mas brillante)
- Aumentar fondo de `bg-white/[0.03]` a `bg-white/[0.07]` para que el bloque se distinga
- Cambiar lineas de `bg-white/10` a `bg-white/20` para mayor contraste
- Agregar `font-semibold` al texto de la hora

### 2. Hora en cada fila de servicio (linea 98-100)

- Aumentar de `text-sm` a `text-base` (16px)
- Cambiar de `text-gray-400` a `text-emerald-400` para que resalte con el color del reloj principal
- Agregar `font-semibold` para mayor peso visual

### 3. Header "SERVICIOS" (linea 67)

- Aumentar de `text-xs` a `text-sm` para consistencia con los nuevos tamanos

## Resultado

- Horas de bloque: 14px, gris claro, fondo distinguible
- Horas por fila: 16px, verde esmeralda (consistente con el reloj), bold
- Legible a 3-5 metros de distancia en el videowall

