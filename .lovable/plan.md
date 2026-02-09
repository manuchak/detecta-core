

# Aumentar horas a 26px y 30px con ajustes de layout

## Problema potencial

Al pasar de 20px a 30px en la hora de cada fila, el texto del cliente (linea 101, `text-sm`/14px) queda muy pequeño en comparacion y el `gap-2` puede no ser suficiente. Ademas, el padding-left del custodio (linea 106, `pl-[3.25rem]`) ya no alineara correctamente porque la hora ahora ocupa mas espacio horizontal (~5 caracteres "HH:MM" a 30px).

## Cambios en `src/components/monitoring/tv/TVServicesList.tsx`

### 1. Separador de bloque horario (linea 76)
- Cambiar `text-lg` (18px) a `text-[26px]`

### 2. Hora en cada fila (linea 98)
- Cambiar `text-xl` (20px) a `text-[30px]`

### 3. Ajustes de acompanamiento para evitar rotura

- **Nombre del cliente** (linea 101): Subir de `text-sm` (14px) a `text-lg` (18px) para mantener proporcion con la hora de 30px
- **Nombre del custodio** (linea 107): Subir de `text-xs` (12px) a `text-sm` (14px) para legibilidad
- **Padding del custodio** (linea 106): Eliminar el `pl-[3.25rem]` fijo y usar `pl-0` ya que el padding fijo no alineara con la hora mas grande. Alternativa: cambiar a un layout vertical puro donde cliente y custodio van debajo de la hora sin intentar alinear
- **Layout de fila** (linea 97): Cambiar de `flex items-baseline` a `flex items-center` para centrar verticalmente la hora grande junto al nombre
- **Gap** (linea 97): Aumentar de `gap-2` a `gap-3` para dar mas aire entre hora y nombre
- **Padding vertical de fila** (linea 95): Aumentar de `py-2` a `py-3` para que las filas mas altas respiren

### 4. Header "SERVICIOS" (linea 67)
- Subir de `text-sm` a `text-base` para proporcionalidad general

## Resultado

- Hora de bloque: 26px, gris claro, centrada entre lineas
- Hora por fila: 30px, verde esmeralda, bold
- Cliente: 18px, blanco, legible junto a la hora
- Custodio: 14px, gris, sin padding fijo roto
- Sin desbordamiento ni textos cortados gracias a `min-w-0` y `truncate` existentes

