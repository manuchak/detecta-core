

# Fix: Agregar roles faltantes a la funcion `get_available_roles_secure()`

## Problema

El error "Invalid role: customer_success" persiste porque la funcion de base de datos `get_available_roles_secure()` tiene una lista **hardcodeada** de roles validos que NO incluye `customer_success` ni otros roles nuevos. Esta funcion es usada por `update_user_role_secure()` para validar el rol antes de asignarlo.

## Roles faltantes en la funcion

La funcion actualmente tiene 18 roles. Faltan estos 7:
- `customer_success`
- `capacitacion_admin`
- `facturacion_admin`
- `facturacion`
- `finanzas_admin`
- `finanzas`

(Los roles `jefe_seguridad`, `analista_seguridad`, `instalador` ya estan incluidos)

## Solucion

Ejecutar una migracion SQL para reemplazar la funcion `get_available_roles_secure()` con una version actualizada que incluya todos los roles del enum `app_role`.

```sql
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN ARRAY[
    'owner', 'admin', 'supply_admin', 'capacitacion_admin',
    'coordinador_operaciones', 'jefe_seguridad', 'analista_seguridad',
    'supply_lead', 'ejecutivo_ventas', 'custodio', 'bi',
    'monitoring_supervisor', 'monitoring', 'supply', 'instalador',
    'planificador', 'soporte', 'facturacion_admin', 'facturacion',
    'finanzas_admin', 'finanzas', 'customer_success',
    'pending', 'unverified'
  ];
END;
$$;
```

## Cambios

1. **Una migracion SQL** -- Actualizar la funcion `get_available_roles_secure()` para incluir los 6 roles faltantes
2. **Sin cambios de codigo** -- El frontend ya esta correctamente configurado

## Resultado esperado

Despues de la migracion, podras asignar "Customer Success" a Alfredo Zuniga sin errores.
