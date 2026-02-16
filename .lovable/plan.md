

# Cambiar Header del PDF: Barra Gris Claro + Logo Sin Comprimir

## Cambios

### 1. Color de fondo del header: rojo a gris claro
Cambiar `backgroundColor` de `#EB0000` (rojo) a `#F0F0F0` (surface/gris claro). Ajustar los colores de texto de blanco a negro/gris oscuro para mantener contraste legible.

### 2. Logo sin compresion
El logo actual esta forzado a 26x26 puntos (cuadrado), lo que comprime logos que no son cuadrados. La solucion es:
- Aumentar el alto del header de 36pt a 42pt para dar mas espacio
- Cambiar el estilo del logo para usar `objectFit: 'contain'` y dimensiones mas generosas (height: 28, width: auto via `maxWidth: 80`) para que mantenga su proporcion original

### Archivos a modificar

**`src/components/pdf/styles.ts`** (lineas 20-47):
- `headerBar.backgroundColor`: cambiar de `PDF_COLORS.red` a `PDF_COLORS.surface`
- `headerLogo`: cambiar de `width: 26, height: 26` a `height: 28, maxWidth: 80, objectFit: 'contain'`
- `headerTitle.color`: cambiar de `PDF_COLORS.white` a `PDF_COLORS.black`
- `headerSubtitle.color`: cambiar de `PDF_COLORS.white` a `PDF_COLORS.gray`
- `headerSubtitle.opacity`: eliminar (ya no necesario con texto gris)

**`src/components/pdf/tokens.ts`** (linea 69):
- `headerHeight`: cambiar de `36` a `42` para acomodar el logo mas grande

### Resultado visual
- Barra superior gris claro (#F0F0F0) en lugar de roja
- Logo con proporciones originales preservadas
- Titulo en negro bold, subtitulo en gris
- Aspecto mas limpio y profesional
