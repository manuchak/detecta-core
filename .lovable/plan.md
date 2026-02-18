

# Agregar acceso del rol `customer_success` a CRM Hub y Capacitacion (LMS)

## Estado actual

El rol `customer_success` ya existe en el sistema y tiene acceso configurado al modulo **Customer Success**. Sin embargo, **no tiene acceso** a:
- **CRM Hub** (`/crm`)
- **Capacitacion / LMS** (`/lms`, `/lms/admin`, `/lms/reportes`, etc.)

## Cambios necesarios

Se debe agregar `'customer_success'` en los arrays de roles permitidos en 4 archivos:

### 1. `src/App.tsx` - Rutas protegidas

- **CRM Hub** (linea ~335): Agregar `'customer_success'` al `allowedRoles` de la ruta `/crm`
- **LMS Dashboard** (linea ~978): La ruta `/lms` no tiene `RoleProtectedRoute` (es accesible a cualquier usuario autenticado), asi que no requiere cambio
- **LMS Admin** (lineas ~1004, 1016, 1030, 1042, 1054): Estas rutas estan restringidas a `capacitacion_admin`. Agregar `'customer_success'` solo si el rol debe poder administrar cursos. Si solo debe consumir cursos, no se tocan.

### 2. `src/config/navigationConfig.ts` - Menu lateral

- **CRM Hub** (linea ~129): Agregar `'customer_success'` al array `roles` del item CRM Hub
- **Capacitacion** (linea ~480): Agregar `'customer_success'` al array `roles` del grupo Capacitacion

### 3. `src/components/navigation/GlobalNav.tsx` - Navegacion global

- **CRM Hub** (linea ~89): No existe entrada de CRM en GlobalNav, pero hay Customer Success. Verificar si CRM aparece aqui o solo en sidebar.

### 4. `src/config/roleHomeConfig.ts` - Modulos del home

- **customer_success** (linea ~445): Agregar `'crm'` y `'lms'` al array `modules`

## Detalle tecnico

### App.tsx - Ruta CRM

```typescript
// Linea ~335: Agregar customer_success
<RoleProtectedRoute allowedRoles={['admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi', 'customer_success']}>
```

### navigationConfig.ts - CRM Hub y LMS

```typescript
// CRM Hub (~linea 129)
roles: ['admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi', 'customer_success'],

// Capacitacion (~linea 480)
roles: ['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'supply_lead', 'ejecutivo_ventas', 'bi', 'monitoring_supervisor', 'planificador', 'soporte', 'customer_success'],
```

### roleHomeConfig.ts - Modulos accesibles

```typescript
customer_success: {
  redirect: '/customer-success',
  modules: ['settings', 'crm', 'lms']
},
```

## Archivos a modificar

1. `src/App.tsx` -- Agregar `customer_success` al `allowedRoles` de `/crm`
2. `src/config/navigationConfig.ts` -- Agregar `customer_success` a los roles de CRM Hub y Capacitacion
3. `src/config/roleHomeConfig.ts` -- Agregar modulos `crm` y `lms` al rol
4. `src/components/navigation/GlobalNav.tsx` -- Si CRM tiene entrada, agregar el rol (verificar)

No se requieren cambios en base de datos ya que el rol `customer_success` ya existe en el enum y en las tablas de roles.
