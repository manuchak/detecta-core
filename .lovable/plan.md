

# Fix: Modal "Asignar Clientes a CSM" - Bugs de seleccion y CTA cortado

## Problemas detectados

### Bug 1: AIRMAR no se selecciona (doble-toggle)
Al hacer clic en la fila del cliente, se disparan DOS handlers: el `onClick` del `div` contenedor Y el `onCheckedChange` del `Checkbox`. Ambos llaman a `handleToggle`, lo que causa que el cliente se seleccione e inmediatamente se deseleccione (toggle doble). AIRMAR fue el primer clic y por eso no se tilda.

### Bug 2: CTA cortado
El `DialogFooter` se corta porque el layout usa `max-h-[60vh]` en el panel central pero el footer queda fuera del flujo controlado, y el `DialogContent` con `overflow-hidden` lo recorta.

## Solucion

### Archivo: `src/pages/CustomerSuccess/components/CSBulkAssignByCSMModal.tsx`

1. **Eliminar el `onCheckedChange` del Checkbox** dentro de cada fila de cliente. Dejar solo el `onClick` del div contenedor para evitar el doble-toggle. El checkbox se renderiza como controlado (`checked={...}`) sin handler propio.

2. **Mismo fix para "Seleccionar todos"**: Mover el handler al div contenedor en lugar de tenerlo duplicado.

3. **Corregir layout del footer**: Cambiar la estructura para que el `DialogContent` use `flex flex-col` y el panel central tenga `flex-1 overflow-hidden` con el footer siempre visible fuera del area scrolleable.

### Cambios concretos

- Linea 210: Cambiar `<Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => handleToggle(c.id)} />` a `<Checkbox checked={selectedIds.has(c.id)} />` (sin handler)
- Linea 208: Agregar `e.stopPropagation()` al onClick del div
- Linea 92: Cambiar el className del DialogContent para usar `flex flex-col` con altura controlada
- Linea 103: Ajustar el panel central para que respete el espacio del footer

