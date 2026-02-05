
# Plan: Optimización del Registro de Custodios y Hardening de Seguridad

## Resumen Ejecutivo

Implementar mejoras en el flujo de registro de custodios y reforzar la seguridad para garantizar que los custodios solo accedan a su módulo dedicado, sin posibilidad de visualizar información sensible de otros módulos incluso si conocen las URLs.

---

## Análisis de Seguridad Actual

### Flujo de Registro Actual (Funcionando Correctamente)
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUJO DE REGISTRO DE CUSTODIOS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Admin genera invitación]                                                  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │ custodian_      │────▶│ Email enviado   │                               │
│  │ invitations     │     │ con link único  │                               │
│  └─────────────────┘     └────────┬────────┘                               │
│                                   │                                         │
│                                   ▼                                         │
│                    /auth/registro-custodio?token=XXX                        │
│                                   │                                         │
│                                   ▼                                         │
│                    ┌─────────────────────────┐                              │
│                    │ CustodianSignup.tsx     │                              │
│                    │ - Valida token (RPC)    │                              │
│                    │ - Crea cuenta Supabase  │                              │
│                    │ - Asigna rol 'custodio' │                              │
│                    └───────────┬─────────────┘                              │
│                                │                                            │
│                                ▼                                            │
│                    ┌─────────────────────────┐                              │
│                    │   /custodian (Portal)   │                              │
│                    └─────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Brechas de Seguridad Identificadas

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| Acceso a rutas sin protección de rol | ALTA | Rutas como `/tickets`, `/services`, `/lms` usan solo `ProtectedRoute` (autenticación) sin validar rol |
| Navegación manual a URLs | MEDIA | Custodio podría escribir manualmente `/leads`, `/dashboard`, etc. |
| RLS incompleto para custodio | MEDIA | Algunas tablas podrían permitir lectura a usuarios autenticados |
| Sin página de login dedicada | BAJA | Custodios usan el mismo login que personal administrativo |

---

## Arquitectura de Seguridad Propuesta

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE SEGURIDAD MULTI-CAPA                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CAPA 1: NAVEGACIÓN (UI)                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  navigationConfig.ts: custodio NO aparece en ningún módulo            │  │
│  │  roleHomeConfig.ts: custodio → redirect: '/custodian'                 │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  CAPA 2: RUTAS (Router)                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  RoleProtectedRoute: Bloquea rutas sensibles para custodio            │  │
│  │  CustodianPortal: Solo permite ['custodio', 'admin', 'owner']         │  │
│  │  NUEVO: RoleBlockedRoute para rutas con ProtectedRoute solamente      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  CAPA 3: RLS (Base de Datos)                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Políticas que excluyen explícitamente 'custodio' de tablas sensibles │  │
│  │  Custodio solo accede: checklist_servicio (propio), profiles (propio) │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  CAPA 4: RPC/Edge Functions                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Funciones con SECURITY DEFINER validan rol antes de ejecutar         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Componente 1: Wrapper de Bloqueo por Rol

### Archivo: `src/components/RoleBlockedRoute.tsx` (Nuevo)

Componente que bloquea acceso a usuarios con roles específicos, redirigiendo a su portal dedicado.

```typescript
interface RoleBlockedRouteProps {
  children: ReactNode;
  blockedRoles: string[];
  redirectMap?: Record<string, string>;
}
```

**Uso:**
- Envuelve rutas que actualmente usan solo `ProtectedRoute`
- Redirige custodios a `/custodian` si intentan acceder a rutas no permitidas
- Muestra mensaje amigable antes de redirigir

---

## Componente 2: Constantes de Control de Acceso

### Archivo: `src/constants/accessControl.ts` (Modificar)

Agregar constantes para roles bloqueados de rutas administrativas:

```typescript
/**
 * Roles que NO deben acceder a módulos administrativos
 * Estos roles tienen portales dedicados y no necesitan acceso al sistema principal
 */
export const FIELD_OPERATOR_ROLES = [
  'custodio',
  'instalador'
] as const;

/**
 * Mapa de redirección para roles con portales dedicados
 */
export const PORTAL_REDIRECTS: Record<string, string> = {
  'custodio': '/custodian',
  'instalador': '/installers/portal'
} as const;
```

---

## Componente 3: Hardening de Rutas en App.tsx

### Rutas a Proteger con RoleBlockedRoute

| Ruta | Estado Actual | Cambio Requerido |
|------|---------------|------------------|
| `/tickets` | ProtectedRoute | + RoleBlockedRoute(FIELD_OPERATOR_ROLES) |
| `/services` | ProtectedRoute | + RoleBlockedRoute(FIELD_OPERATOR_ROLES) |
| `/lms` | ProtectedRoute | + RoleBlockedRoute(FIELD_OPERATOR_ROLES) |
| `/home` | ProtectedRoute | + Verificar redirect automático |

### Rutas Ya Protegidas (Sin Cambios)
- `/leads/*` → RoleProtectedRoute con roles específicos
- `/dashboard/*` → PermissionProtectedRoute
- `/planeacion/*` → RoleProtectedRoute
- `/monitoring` → Sin restricción (custodio podría ver mapa público)

---

## Componente 4: Migración SQL - Auditoría y Hardening RLS

### Archivo: Migración SQL para RLS

**Políticas a Auditar/Crear:**

```sql
-- 1. Verificar que leads NO permite acceso a custodio
-- ESTADO: OK - La política actual NO incluye custodio

-- 2. Verificar servicios_planificados
-- Agregar exclusión explícita de custodio para SELECT general
CREATE POLICY "servicios_planificados_block_field_operators"
ON public.servicios_planificados
FOR SELECT
USING (
  NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('custodio', 'instalador')
  )
  OR 
  -- Excepto su propio servicio por teléfono
  custodio_telefono = (SELECT phone FROM profiles WHERE id = auth.uid())
);

-- 3. Proteger pc_clientes (datos de clientes)
-- Ya tiene RLS pero verificar que custodio está bloqueado

-- 4. Proteger candidatos_custodios (datos de reclutamiento)
-- Ya tiene política restrictiva, verificar

-- 5. Proteger roi_custodios (datos financieros)
-- Ya tiene política restrictiva, verificar
```

---

## Componente 5: Mejoras en Login para Custodios

### Opción A: Página de Login Dedicada (Recomendada)

Crear `/auth/custodio-login` con:
- UI simplificada y mobile-first
- Prompt de PWA integrado
- Redirección automática a portal
- Sin enlaces a registro administrativo

### Opción B: Detección Automática Post-Login

En `useSmartAuthRedirect.ts` ya existe lógica para redirigir custodios:
```typescript
case 'custodio':
  return '/custodian';
```

---

## Componente 6: Función SQL de Validación de Rol

### Archivo: Migración SQL

```sql
-- Función helper para verificar si es operador de campo
CREATE OR REPLACE FUNCTION is_field_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('custodio', 'instalador')
    AND is_active = true
  )
$$;
```

---

## Archivos a Crear

| Archivo | Descripción | Líneas Est. |
|---------|-------------|-------------|
| `src/components/RoleBlockedRoute.tsx` | Wrapper de bloqueo por rol | ~60 |
| `supabase/migrations/XXX_custodio_security_hardening.sql` | Políticas RLS adicionales | ~100 |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/constants/accessControl.ts` | Agregar FIELD_OPERATOR_ROLES y PORTAL_REDIRECTS |
| `src/App.tsx` | Envolver rutas sensibles con RoleBlockedRoute |
| `src/pages/Auth/Login.tsx` | Agregar detección de custodio y prompt PWA |

---

## Orden de Implementación

1. **Fase 1 - Infraestructura:**
   - Crear `RoleBlockedRoute.tsx`
   - Actualizar `accessControl.ts` con nuevas constantes

2. **Fase 2 - Protección de Rutas:**
   - Modificar `App.tsx` para envolver rutas sensibles
   - Verificar que custodio no puede acceder manualmente

3. **Fase 3 - Hardening RLS:**
   - Crear migración SQL con políticas adicionales
   - Ejecutar auditoría de políticas existentes

4. **Fase 4 - UX de Login:**
   - Mejorar flujo de login para custodios
   - Integrar prompt de PWA después de registro

5. **Fase 5 - Testing:**
   - Probar acceso manual a URLs como custodio
   - Verificar que RLS bloquea queries directas

---

## Checklist de Seguridad Post-Implementación

- [ ] Custodio NO puede acceder a `/leads`
- [ ] Custodio NO puede acceder a `/dashboard`
- [ ] Custodio NO puede acceder a `/planeacion`
- [ ] Custodio NO puede acceder a `/tickets`
- [ ] Custodio NO puede acceder a `/services` (excepto su vista)
- [ ] Custodio NO puede acceder a `/wms`
- [ ] Custodio NO puede ver datos de otros custodios
- [ ] Custodio NO puede ver datos de clientes directamente
- [ ] RLS bloquea queries directas desde DevTools
- [ ] Login redirige automáticamente a portal

---

## Consideraciones Adicionales

### Logging de Intentos de Acceso
Registrar en `user_role_audit` cuando un custodio intenta acceder a rutas bloqueadas para detectar intentos de abuso.

### Rate Limiting
Considerar implementar rate limiting en el registro para prevenir abuso de tokens de invitación.

### Expiración de Sesiones
Las sesiones de custodios podrían tener TTL más corto que usuarios administrativos por seguridad.
