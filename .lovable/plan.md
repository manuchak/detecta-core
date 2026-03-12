

# Bug: Monitoristas no pueden firmar en entrega de turno

## Diagnóstico

El problema está en la arquitectura del `ShiftHandoffDialog.tsx`. Los `SignaturePad` (canvas de firma) están **dentro del `ScrollArea`** de Radix (línea 175-473). El `ScrollAreaPrimitive.Viewport` aplica `overflow: scroll` internamente, lo que intercepta los eventos touch/pointer antes de que lleguen al canvas — especialmente en dispositivos táctiles que usan las estaciones de monitoreo.

Cuando el usuario intenta dibujar su firma, el ScrollArea interpreta el gesto como scroll y lo captura, impidiendo que el canvas reciba los eventos `touchmove`/`mousemove`.

## Solución

Mover los `SignaturePad` y el texto legal **fuera del ScrollArea**, en una sección fija entre el ScrollArea y el DialogFooter. Solo se renderizan en step 2.

### Cambio en `ShiftHandoffDialog.tsx`

**1. Extraer las firmas del ScrollArea (líneas ~451-471)**
- Eliminar el bloque de firmas y texto legal del contenido de step 2 dentro del ScrollArea
- Colocarlo como un `div` independiente entre `</ScrollArea>` y `<DialogFooter>`, condicionado a `step === 2`

**2. Agregar `position: relative` y `z-index` al contenedor de firmas** para asegurar que los eventos touch no sean capturados por capas superiores.

**3. Agregar `style={{ touchAction: 'none' }}` al contenedor** como refuerzo adicional para dispositivos táctiles.

### Resultado
Las firmas quedan en una zona fija visible sin competir con el ScrollArea por eventos de pointer/touch. El resumen de distribución sigue siendo scrolleable arriba.

