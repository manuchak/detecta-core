
# Portal de Armados - Adaptacion del Portal de Custodios

## Contexto
El portal de custodios (`/custodian`) es una app movil con 4 secciones: Dashboard, Servicios, Vehiculo y Soporte. Se necesita un portal equivalente para armados (`/armado`) que refleje su caso de uso operativo: no tienen vehiculo propio, no hacen checklists de transporte, pero si necesitan ver sus asignaciones y levantar tickets de soporte.

## Diferencias clave Custodio vs Armado

```text
Funcionalidad         | Custodio              | Armado
----------------------|-----------------------|---------------------------
Vehiculo/Mante.       | SI (tab dedicado)     | NO (no aplica)
Checklist pre-serv.   | SI (docs + fotos)     | NO (no aplica)
Onboarding docs       | Licencia, circulacion | Licencia de portacion
                      | poliza de seguro      | (si aplica)
Fuente de servicios   | servicios_planificados| asignacion_armados
                      | + servicios_custodia  |
KM recorridos         | SI (metrica clave)    | NO
Indisponibilidades    | custodio_indis.       | armado_indisponibilidades
Soporte/Tickets       | SI                    | SI (misma logica)
Tabla operativa       | custodios_operativos  | armados_operativos
Identificador         | telefono              | telefono + armado_id
```

## Arquitectura

### Fase 1: Backend - Rol y Autenticacion

**1.1 Agregar rol `armado` al sistema**
- Migracion SQL: insertar `armado` en la tabla de roles (o enum) si no existe
- Actualizar `src/types/roleTypes.ts`: agregar `'armado'` al type `Role`
- Actualizar `src/constants/accessControl.ts`:
  - Agregar `'armado'` a `FIELD_OPERATOR_ROLES`
  - Agregar entrada en `PORTAL_REDIRECTS`: `'armado': '/armado'`
  - Agregar case en `getTargetRouteForRole`: `case 'armado': return '/armado'`

**1.2 Edge Function: `create-armado-account`**
- Clonar `create-custodian-account` y adaptar:
  - Asignar rol `armado` en lugar de `custodio`
  - Vincular con `armados_operativos` por email/telefono
  - Misma logica de rescue path para usuarios existentes

**1.3 Tabla de invitaciones**
- Crear `armado_invitations` (misma estructura que `custodian_invitations`):
  - `id`, `email`, `phone`, `armado_operativo_id`, `token`, `status`, `created_by`, `created_at`, `used_at`
- RLS: admins y supply pueden crear/leer

### Fase 2: Frontend - Portal `/armado`

**2.1 Paginas del portal** (en `src/pages/armado/`)

| Pagina | Basada en | Adaptacion |
|--------|-----------|------------|
| `ArmadoPortal.tsx` | `CustodianPortal.tsx` | Verifica rol `armado`, sin `OnboardingGuard` (fase 1) |
| `ArmadoDashboard.tsx` | `CustodianDashboard.tsx` | Sin vehiculo, sin checklist, servicios desde `asignacion_armados` |
| `ArmadoServicesPage.tsx` | `CustodianServicesPage.tsx` | Query a `asignacion_armados` JOIN `servicios_custodia` |
| `ArmadoSupportPage.tsx` | `CustodianSupportPage.tsx` | Misma logica de tickets, diferentes categorias |

**2.2 Hooks del portal** (en `src/hooks/`)

- `useArmadoProfile.ts` - Similar a `useCustodianProfile`, busca en `armados_operativos` por telefono del usuario
- `useArmadoServices.ts` - Consulta `asignacion_armados` JOIN `servicios_custodia/servicios_planificados` para obtener servicios asignados al armado
- `useArmadoTickets.ts` - Reutiliza la logica de `useCustodianTicketsEnhanced` pero con telefono del armado

**2.3 Navegacion movil**

- `ArmadoBottomNav.tsx` - 3 tabs en lugar de 4:
  - Inicio (dashboard)
  - Servicios (historial de asignaciones)
  - Soporte (tickets)
  - Sin tab de "Vehiculo"

**2.4 Dashboard movil adaptado**

El dashboard mostrara:
- Saludo personalizado con nombre del armado
- Proximo servicio asignado (desde `asignacion_armados` activas)
- Stats: servicios del mes, rating promedio
- Acciones rapidas: ver servicios, reportar indisponibilidad, soporte
- Alertas de tickets pendientes/resueltos (misma logica que custodios)
- Sin: KM, mantenimiento vehicular, checklist, semaforos de mantenimiento

**2.5 Servicios del armado**

La vista de servicios mostrara:
- Datos del servicio: cliente, origen, destino, fecha, tipo
- Tarifa acordada (desde `asignacion_armados.tarifa_acordada`)
- Estado de la asignacion
- Sin: KM recorridos, costo_custodio

### Fase 3: Rutas y Seguridad

**3.1 Rutas en App.tsx**
```text
/armado              -> ArmadoPortal (layout con Outlet)
/armado/             -> ArmadoDashboard (index)
/armado/services     -> ArmadoServicesPage
/armado/support      -> ArmadoSupportPage
```

**3.2 Seguridad**
- `RoleBlockedRoute` ya bloquea field operators de rutas admin; agregar `armado` al array
- RLS en `armado_invitations`: solo roles admin/supply
- El portal usa el mismo patron de `ProtectedRoute` que el de custodios

### Fase 4: Flujo de Invitacion

**4.1 Pagina de registro**
- `ArmadoSignup.tsx` - Clonar `CustodianSignup.tsx`, adaptar para consumir `create-armado-account`
- Ruta: `/auth/registro-armado`

**4.2 Pagina de invitaciones admin**
- Adaptar o extender `CustodianInvitationsPage` con un toggle para tipo de operativo (custodio/armado)
- O crear `ArmadoInvitationsPage` independiente

## Resumen de archivos

### Nuevos archivos (~12)
- `src/pages/armado/ArmadoPortal.tsx`
- `src/pages/armado/ArmadoDashboard.tsx`
- `src/pages/armado/ArmadoServicesPage.tsx`
- `src/pages/armado/ArmadoSupportPage.tsx`
- `src/hooks/useArmadoProfile.ts`
- `src/hooks/useArmadoServices.ts`
- `src/components/armado/ArmadoBottomNav.tsx`
- `src/components/armado/ArmadoMobileDashboard.tsx`
- `src/pages/Auth/ArmadoSignup.tsx`
- `supabase/functions/create-armado-account/index.ts`

### Archivos modificados (~4)
- `src/types/roleTypes.ts` - agregar `'armado'`
- `src/constants/accessControl.ts` - agregar rol, ruta, redirect
- `src/App.tsx` - agregar rutas `/armado/*` y `/auth/registro-armado`
- Migracion SQL - tabla `armado_invitations`, rol en BD

### Lo que se reutiliza sin cambios
- Sistema de tickets (`useCustodianTicketsEnhanced`, `MobileTicketWizard`, `MobileTicketsList`)
- Componentes de UI movil (cards, alerts, badges)
- Edge function de soporte (`support-chat-bot`)
- Patron de autenticacion y proteccion de rutas

## Orden de implementacion sugerido
1. Migracion SQL + rol `armado`
2. Modificar `roleTypes.ts` y `accessControl.ts`
3. Crear hooks (`useArmadoProfile`, `useArmadoServices`)
4. Crear paginas del portal y componentes
5. Agregar rutas en `App.tsx`
6. Edge function `create-armado-account`
7. Pagina de registro y flujo de invitacion
