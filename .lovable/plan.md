

# Fix: Agregar `customer_success` al enum `app_role` en la base de datos

## Problema

El error "Invalid role: customer_success" ocurre porque el rol **no existe en el enum `app_role` de la base de datos**. El dropdown del frontend muestra el rol correctamente, pero al intentar guardarlo en la tabla `user_roles`, PostgreSQL lo rechaza porque no es un valor valido del enum.

### Roles actuales en el enum de la base de datos:
`owner, admin, supply_admin, bi, monitoring_supervisor, monitoring, supply, soporte, pending, unverified, custodio, ejecutivo_ventas, coordinador_operaciones, tecnico_instalador, planificador, supply_lead`

### Roles faltantes en el enum (usados en el codigo):
- `customer_success`
- `capacitacion_admin`
- `jefe_seguridad`
- `analista_seguridad`
- `instalador`
- `facturacion_admin`
- `facturacion`
- `finanzas_admin`
- `finanzas`

## Solucion

Ejecutar una migracion SQL para agregar los valores faltantes al enum `app_role`:

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_success';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'capacitacion_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'jefe_seguridad';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analista_seguridad';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'instalador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'facturacion_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'facturacion';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finanzas_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finanzas';
```

## Cambios necesarios

1. **Migracion de base de datos** -- Agregar los 9 valores faltantes al enum `app_role`
2. **Sin cambios de codigo** -- El frontend ya tiene los roles configurados correctamente

## Resultado esperado

Despues de la migracion, podras asignar el rol "Customer Success" a Alfredo Zuniga y a cualquier otro usuario sin errores.
