

# Fix: Menu de acciones de cursos no visible por conflicto de zoom

## Causa raiz

- Las paginas LMS resetean el zoom a `1.0` con `LMSZoomReset`
- Pero el CSS global aplica `[data-radix-popper-content-wrapper] { zoom: 1.428571 !important }` a TODOS los dropdowns Radix
- Resultado: en LMS el dropdown se renderiza al 143% de tamano y se posiciona fuera del area visible

## Solucion: Usar Sheet para todos los dispositivos

En vez de luchar contra el conflicto de zoom del DropdownMenu, reemplazar el dropdown por un **Sheet** (panel lateral) tanto en mobile como en desktop. Esto evita completamente el problema ya que el Sheet usa un portal con su propio posicionamiento fijo, no depende de Radix Popper.

## Cambios

### `src/components/lms/admin/LMSCursosLista.tsx`

- Eliminar la bifurcacion `isMobile ? Sheet : DropdownMenu` 
- Usar **Sheet** en ambos casos (mobile y desktop)
- Eliminar imports de `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuTrigger` y `useIsMobile`
- Simplificar el componente `CursoCard`: al hacer clic en los 3 puntos siempre abre el Sheet lateral
- El Sheet ya funciona correctamente en LMS porque su `style={{ zoom: 1.428571 }}` esta en el `SheetContent` directamente (no usa Radix Popper)

El resultado sera un panel lateral limpio con las opciones de curso que funciona identicamente en desktop y mobile, sin depender del sistema de zoom de Radix Popper.
