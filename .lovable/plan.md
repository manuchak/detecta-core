

## Fix: Textos cortados en el Funnel Trapezoidal

### Problema

El `clip-path: polygon()` recorta visualmente cada banda, pero el padding horizontal es fijo (`px-8`). A medida que el indent crece (3%, 6%, 9%...), el borde izquierdo del trapecio se mueve hacia adentro y corta los textos e iconos.

### Solucion

Reemplazar el padding fijo por padding dinamico que crece proporcionalmente al indent de cada etapa. Asi el contenido siempre queda dentro del area visible del trapecio.

### Cambios en `CSLoyaltyFunnel.tsx`

1. **Padding horizontal dinamico**: Calcular `paddingLeft` y `paddingRight` basados en el porcentaje de indent + un margen base. Usar `style` inline en vez de clases Tailwind fijas.

   - Formula: `padding = (indent + INDENT_STEP) * containerWidth + baseMargin`
   - En practica, usar porcentajes CSS: `calc(${indent + INDENT_STEP + 2}% + 8px)` para cada lado

2. **Aumentar altura de las bandas**: Subir de 44px a 48px para dar mas espacio vertical al texto, especialmente en las etapas inferiores mas estrechas.

3. **Reducir font-size en etapas angostas**: Para las ultimas 2 etapas (promotor, embajador), usar `text-xs` en vez de `text-sm` para que el texto quepa sin problemas.

### Detalle tecnico

```text
Antes (roto):
  clipPath indent = 9%  +  padding fijo px-8 (32px)
  → El texto empieza en 32px pero el clip corta hasta ~9% del ancho (~50px en 550px card)
  → Texto cortado

Despues (fix):
  clipPath indent = 9%  +  paddingLeft = calc(11% + 8px)
  → El texto empieza despues del borde visible del trapecio
  → Texto siempre visible
```

### Archivo a modificar

Solo `src/pages/CustomerSuccess/components/CSLoyaltyFunnel.tsx` — el mismo archivo, ajuste de estilos inline.
