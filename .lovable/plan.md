

# Mejora Visual: Temas Detectados

## Problema Actual

Los temas se muestran como pills/badges planos con escala CSS que los hace difíciles de leer (texto cortado, todos del mismo color rojo, sin jerarquía visual clara). No comunican la gravedad ni facilitan la exploración para stakeholders ejecutivos.

## Propuesta: Cards de Tema con Barras de Impacto

Reemplazar las burbujas por **mini-cards verticales** con los siguientes elementos:

```text
+--------------------------------------------+
| Temas Detectados                    4 temas |
|--------------------------------------------|
| [===========================] 3 menciones   |
| Incumplimiento de Protocolos Operativos     |
| #protocolo #consigna #incumplimiento        |
| Sentimiento: negativo                       |
|--------------------------------------------|
| [==================       ] 2 menciones     |
| Puntualidad y Disponibilidad de Personal    |
| #puntualidad #retraso #personal             |
| Sentimiento: negativo                       |
|--------------------------------------------|
| [=========               ] 1 mencion        |
| Fallas Tecnologicas y GPS                   |
| ...                                         |
+--------------------------------------------+
```

Cada card incluye:
- **Barra de progreso** proporcional al conteo (max = tema con mas menciones)
- **Color de la barra** segun sentimiento: rojo (negativo), verde (positivo), gris (neutro)
- **Nombre del tema** en texto claro, sin truncar
- **Keywords** como chips pequenos debajo del nombre
- **Badge de sentimiento** con icono (TrendingDown, TrendingUp, Minus)
- Ordenados de mayor a menor menciones

## Detalle Tecnico

### Archivo a modificar

`src/pages/CustomerSuccess/components/CSVoiceOfCustomer.tsx` - Funcion `ThemeBubbles` (lineas 64-101)

### Cambios especificos

Reemplazar el layout de `flex-wrap` con pills escalados por un layout vertical de cards con:
- `Progress` component de Radix (ya instalado) para la barra
- Iconos `TrendingDown`, `TrendingUp`, `Minus` de lucide para sentimiento
- Keywords como badges pequenos con `text-[10px]`
- Fondo sutil diferenciado por sentimiento (borde izquierdo de color)
- Sin tooltip ya que toda la info es visible directamente

### Layout responsivo

- En desktop: las cards ocupan el ancho completo de su columna (50% del grid)
- En mobile: stack vertical, full width
- ScrollArea si hay mas de 4 temas para no desbordar el card

