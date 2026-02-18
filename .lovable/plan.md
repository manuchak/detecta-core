
# Restringir acceso del rol Customer Success a modulos de Operaciones y Supply

## Problema actual

El rol `customer_success` puede ver los grupos de navegacion "Supply & Talento" y "Operaciones" en la barra lateral porque no esta incluido en `RESTRICTED_NAVIGATION_ROLES` en `navigationConfig.ts`. Aunque algunos sub-modulos tienen listas de roles que excluyen a CS, el grupo completo sigue visible.

## Solucion

### Archivo: `src/config/navigationConfig.ts`

Agregar `customer_success` a `RESTRICTED_NAVIGATION_ROLES` para que solo vea los grupos permitidos:

```typescript
export const RESTRICTED_NAVIGATION_ROLES: Record<string, string[]> = {
  'monitoring': ['monitoring'],
  'soporte': ['monitoring'],
  'customer_success': ['dashboard', 'customer-success', 'capacitacion', 'system'],
};
```

Esto limita la navegacion del rol CS a:
- **Dashboard** (incluye CRM Hub, que ya tiene a CS en su lista de roles)
- **Customer Success** (su modulo principal)
- **Capacitacion** (LMS, donde ya tiene acceso)
- **Sistema** (configuracion/settings)

Los grupos **Supply & Talento**, **Operaciones**, **Facturacion**, **Monitoreo & Soporte** y **Seguridad** quedaran ocultos para CS.

### Archivo: `src/components/navigation/GlobalNav.tsx`

Sin cambios necesarios. El GlobalNav ya filtra por la lista `roles` de cada modulo, y CS solo aparece en `customer-success`. Los modulos de operaciones y supply no lo incluyen.

### Sin cambios de base de datos
Es un cambio exclusivamente de navegacion frontend. Las politicas RLS existentes ya protegen los datos a nivel de backend.
