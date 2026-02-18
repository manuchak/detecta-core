
# Mejoras al modal "Asignar Clientes a CSM"

## Cambio 1: Filtrar CSMs solo con rol `customer_success`

Actualmente el dropdown de CSM muestra TODOS los usuarios con perfil. Se modificara el hook `useCSMOptions` en `src/hooks/useAssignCSM.ts` para hacer un join con la tabla `user_roles` y solo retornar usuarios que tengan el rol `customer_success` activo.

## Cambio 2: Rediseno del modal con mejor UX

El modal actual usa un Dialog generico con pasos numerados que no aprovechan bien el espacio. Se rediseñara para:

- **Layout de dos paneles**: CSM a la izquierda (lista compacta con avatares/iniciales), clientes a la derecha
- **Seleccion de CSM visual**: En lugar de un dropdown, mostrar una lista clickeable de CSMs con indicador de cuantos clientes tienen asignados actualmente
- **Barra de resumen sticky**: En el footer, mostrar un resumen claro del CSM seleccionado + cantidad de clientes marcados
- **Badge de conteo**: Mostrar junto a cada CSM cuantos clientes ya tiene asignados
- **Mejor alineacion**: El modal sera `max-w-2xl` para dar espacio a ambos paneles

---

## Detalles tecnicos

### `src/hooks/useAssignCSM.ts` - `useCSMOptions()`
- Cambiar la query para hacer join con `user_roles`:
```sql
SELECT p.id, p.display_name 
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'customer_success' AND ur.is_active = true
```
- Esto garantiza que solo aparezcan usuarios con el rol correcto

### `src/pages/CustomerSuccess/components/CSBulkAssignByCSMModal.tsx`
- Redisenar a layout de dos columnas dentro del dialog
- Panel izquierdo: lista de CSMs (clickeables, con badge de clientes asignados)
- Panel derecho: lista de clientes con checkboxes (aparece al seleccionar CSM)
- Footer con boton de accion contextual
- Ampliar a `max-w-2xl` para acomodar el layout

### Sin cambios de base de datos
La tabla `user_roles` ya tiene la columna `is_active` y el rol `customer_success` ya esta en el enum.
