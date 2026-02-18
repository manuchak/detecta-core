

# Fix: Mostrar Customer Success y roles faltantes en el dropdown

## Problema

El dropdown de "CAMBIAR ROL" en la pagina de roles usa una lista **hardcodeada** dentro de `RoleManager.tsx` (linea 69-73), que NO incluye `customer_success` ni varios otros roles. El hook `useAvailableRoles` que ya corregimos no se usa en este componente.

## Solucion

Actualizar dos secciones en `src/components/settings/roles/RoleManager.tsx`:

### 1. Lista de roles disponibles (linea 69-73)

Agregar los roles faltantes: `customer_success`, `capacitacion_admin`, `custodio`, `facturacion_admin`, `facturacion`, `finanzas_admin`, `finanzas`.

### 2. Mapa de nombres para display (linea 75-91)

Agregar las traducciones para los roles nuevos:
- `customer_success` -> "Customer Success"
- `capacitacion_admin` -> "Admin Capacitacion"
- `custodio` -> "Custodio"
- `facturacion_admin` -> "Admin Facturacion"
- `facturacion` -> "Facturacion"
- `finanzas_admin` -> "Admin Finanzas"
- `finanzas` -> "Finanzas"

## Archivo a modificar

- `src/components/settings/roles/RoleManager.tsx`

Solo se modifican 2 bloques dentro de este archivo. No se requieren cambios en base de datos ni en otros archivos.

