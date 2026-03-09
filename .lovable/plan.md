

# Botón de Gastos Extraordinarios en Dashboard del Custodio

## Situación actual
- Ya existe la página `/custodian/expenses` con `CreateExpenseForm` completo (tipo, monto, motivo, urgencia, foto)
- Ya existe el tab "Gastos" en el `MobileBottomNavNew`
- El `QuickActionsGrid` del dashboard tiene 5 acciones rápidas pero ninguna para gastos extraordinarios

## Cambio

### `src/components/custodian/QuickActionsGrid.tsx`
Agregar un sexto botón "Gastos Extra" al grid de acciones rápidas:
- Icono: `Receipt` (consistente con el bottom nav)
- Color: naranja/amber para diferenciarlo de los existentes
- Acción: navega a `/custodian/expenses`
- Sublabel: "Solicitar reembolso"

Esto le da al custodio acceso directo desde el dashboard sin tener que buscar en el bottom nav, siguiendo el patrón de los demás quick actions.

| Archivo | Cambio |
|---------|--------|
| `src/components/custodian/QuickActionsGrid.tsx` | Agregar botón "Gastos Extra" al grid |

