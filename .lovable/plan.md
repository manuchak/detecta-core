

## Efecto sombreado degradado para el año en curso - GmvMoMChart

### Cambio

Agregar un area con relleno degradado (gradient fill) debajo de la linea del ano en curso en el chart `GmvMoMChart.tsx`. Esto hara que visualmente se destaque con un sombreado que va de color solido arriba a transparente abajo, mientras las lineas de anos anteriores permanecen sin relleno.

### Implementacion tecnica

**Archivo:** `src/components/executive/GmvMoMChart.tsx`

1. Importar `Area`, `defs` desde Recharts y cambiar `LineChart` a `ComposedChart` (que soporta mezclar `Line` + `Area`)
2. Agregar un `<defs>` con un `<linearGradient>` vertical dentro del chart:
   - Color superior: el color del ano actual con opacidad ~0.3
   - Color inferior: transparente (opacidad 0)
3. Para el ano en curso, renderizar un `<Area>` con `fill="url(#gradientCurrentYear)"` ademas del `<Line>` existente
4. Los anos anteriores se mantienen solo como `<Line>` sin area

### Resultado visual

- Anos anteriores: lineas simples con puntos (sin cambio)
- Ano en curso: linea gruesa con puntos + area sombreada degradada debajo, creando un efecto de resaltado que guia la atencion del usuario hacia los datos actuales

