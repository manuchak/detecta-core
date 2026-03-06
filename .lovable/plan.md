

# Fix: UI/UX del ClienteFormModal — contenido desbordado

## Problema

El `DialogContent` base tiene `style={{ zoom: 1.428571 }}` (factor de zoom global 0.7 invertido). Combinado con `max-w-3xl` en el modal, el contenido efectivo se escala ~1.43x, causando que los formularios se salgan visualmente de la tarjeta. Los grids de 2-3 columnas quedan apretados y los inputs se desbordan.

## Solucion

### 1. Ajustar el DialogContent del modal

Cambiar `max-w-3xl` a `max-w-2xl` para compensar el zoom. Al aplicarse el 1.43x, `max-w-2xl` (672px) renderiza efectivamente a ~960px — suficiente para forms de 2 columnas sin desborde.

### 2. Reducir grids de 3 columnas a 2

En `ContactosTab` y `GadgetsTab`, los formularios de agregar usan `grid-cols-3` que queda demasiado comprimido dentro del modal. Cambiar a `grid-cols-2` y apilar campos.

### 3. Ajustar TabsList para que no desborde

La lista de 8 tabs se sale horizontalmente. Usar `flex-wrap` o reducir padding/text para que quepan sin scroll horizontal.

### 4. Inputs con truncado

Agregar `min-w-0` a los contenedores de grid para que inputs largos se trunquen en lugar de desbordar.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `ClienteFormModal.tsx` | `max-w-2xl`, tabs con `flex-wrap`, `min-w-0` en grid items |
| `ContactosTab.tsx` | Grids de 3→2 columnas, layout compacto |
| `GadgetsTab.tsx` | Grids de 3→2 columnas, layout compacto |
| `ReglasFacturacionTab.tsx` | `min-w-0` en grid items |

