
## Diagnóstico completo

### Bug 1 — Navegación incompleta (confirmado por imagen)
`src/config/navigationConfig.ts` líneas 405-424: el módulo `customer-success` solo tiene 3 hijos en el sidebar:
- Panorama, Cartera, Operativo

Faltan: **Análisis Clientes** y **Staff CSM**. El usuario lo ve en la imagen — solo 3 items en el sidebar lateral.

### Bug 2 — Pantalla en blanco
La pantalla en blanco se produce porque el rol `customer_success` llega a `/customer-success` y el tab default "Panorama" carga `CSPanorama` que usa `useCSCartera` → hace queries a `pc_clientes`, `servicios_custodia`, `servicios_planificados`, `cs_quejas`, `cs_touchpoints`. Si el RLS bloquea alguna de esas tablas para el rol, el hook lanza un error no manejado que rompe el render.

La migración anterior solo insertó permisos en `role_permissions` (tabla de control frontend) pero **no creó políticas RLS** en Supabase para el rol `customer_success` en las tablas reales que usa el módulo.

## Plan de corrección

### 1. Agregar links faltantes en el sidebar — `src/config/navigationConfig.ts`
Agregar dos entradas a `children` del módulo `customer-success`:
```
{ id: 'cs_analisis', label: 'Análisis Clientes', path: '/customer-success?tab=analisis', icon: BarChart3 }
{ id: 'cs_staff', label: 'Staff CSM', path: '/customer-success?tab=staff', icon: UserCog }
```

### 2. Agregar política RLS en Supabase — migración SQL
Crear policies `SELECT` para `customer_success` en las tablas críticas usadas por `useCSCartera` y `CSPanorama`:
- `pc_clientes` — SELECT
- `cs_quejas` — SELECT  
- `cs_touchpoints` — SELECT, INSERT, UPDATE (necesita crear/actualizar touchpoints)
- `servicios_custodia` — SELECT (read-only)
- `servicios_planificados` — SELECT (read-only)

### 3. Agregar manejo de error en `useCSCartera` — defensive render
Si `useCSCartera` devuelve `isError`, actualmente el componente `CSPanorama` puede intentar `.filter()` sobre `undefined` y romper el render. Agregar guard `data ?? []` en el hook o en los consumidores.

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/config/navigationConfig.ts` | +2 children en módulo customer-success |
| `supabase/migrations/...sql` | RLS SELECT para customer_success en 5 tablas |
