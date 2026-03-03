

# Evaluación Completa del Sistema: Acceso Admin y Políticas RLS

## Resumen Ejecutivo

Audité 292 tablas, ~558 políticas RLS, todas las rutas del frontend, 3 hooks de autenticación, y funciones de seguridad del backend. **El rol admin tiene acceso correcto en la gran mayoría del sistema**, pero hay brechas puntuales y un error de build activo.

---

## Estado Actual por Capa

### 1. Frontend — Rutas (App.tsx)
**Resultado: ✅ OK**

Todas las rutas protegidas con `RoleProtectedRoute` incluyen `'admin'` en `allowedRoles`. Rutas verificadas:
- `/home`, `/dashboard`, `/executive-dashboard`, `/crm`, `/facturacion`, `/legal`, `/customer-success`, `/services`, `/leads`, `/monitoring`, `/seguridad`, `/wms`, `/planeacion`, `/lms`, `/installers`, `/settings`, `/administration`, `/tickets`

### 2. Frontend — Auth Hooks
**Resultado: ✅ OK**

Los 3 hooks de auth (`AuthContext`, `useUnifiedAuth`, `useStableAuth`) dan a admin permisos completos:
- `canViewLeads: true`, `canEditLeads: true`, `canManageUsers: true`, `canViewDashboard: true`

### 3. Frontend — PermissionProtectedRoute (role_permissions table)
**Resultado: ⚠️ Brecha parcial**

Algunas rutas usan `PermissionProtectedRoute` que consulta la tabla `role_permissions`. Admin tiene 15 entradas que cubren las rutas críticas (`dashboard`, `leads`, `monitoring`, etc.), pero si se agregan nuevos módulos protegidos por permiso sin insertar la entrada para admin, se bloqueará el acceso.

### 4. Backend — Funciones de Seguridad (SECURITY DEFINER)
**Resultado: ✅ OK**

Las funciones clave incluyen admin:
- `check_admin_secure()` → `role IN ('admin', 'owner')` ✅
- `is_admin_user_secure()` → `role IN ('admin', 'owner')` ✅
- `can_access_recruitment_data()` → incluye `admin` ✅
- `can_manage_wms()` → incluye `admin` ✅
- `es_staff_incidentes()` → incluye `admin` ✅
- `puede_acceder_planeacion()` → incluye `admin` ✅
- `user_has_wms_access()` → incluye `admin` ✅

### 5. Backend — Políticas RLS por tabla
**Resultado: ⚠️ Mayormente OK, con gaps menores**

La mayoría de tablas usan `check_admin_secure()` o `user_has_role_direct('admin')`. Sin embargo, encontré tablas donde el admin depende de funciones helper que ya lo incluyen, así que el acceso está garantizado.

Tablas con acceso abierto para autenticados (admin incluido implícitamente):
- `business_targets`, `calendario_feriados_mx`, `candidatos_armados`, `capacitaciones_seguridad`, `contratos_candidato`, `cs_config`, `cs_nps_sends` — usan `USING (true)` o `auth.uid() IS NOT NULL`

### 6. Build Error Activo
**Resultado: ❌ Error**

```
send-custodian-invitation/index.ts:2 — npm:resend@2.0.0 not found
```
La edge function importa Resend con protocolo `npm:` que ya no es soportado. Debe cambiarse a `esm.sh`.

---

## Hallazgos y Brechas Identificadas

### Brecha 1: Edge Function Build Error (CRÍTICO)
**Archivo:** `supabase/functions/send-custodian-invitation/index.ts`
**Problema:** `import { Resend } from "npm:resend@2.0.0"` falla en el build.
**Fix:** Cambiar a `import { Resend } from "https://esm.sh/resend@2.0.0"`

### Brecha 2: `get_current_user_role_secure` — customer_success sin prioridad explícita
**Impacto:** Menor. El rol `customer_success` cae en `ELSE 50` del ORDER BY. Si un usuario tiene múltiples roles activos, `customer_success` podría no ser seleccionado como primario. No afecta admin.

### Brecha 3: Linter — 83 warnings
- 1 ERROR: Vista con SECURITY DEFINER (debería usar `security_invoker`)
- 82 WARN: Funciones sin `search_path` explícito (riesgo de search path injection)

**Para admin esto no bloquea acceso**, pero es deuda de seguridad.

### Brecha 4: El error en /home (screenshot)
El error "The app encountered an error" en `/home` visible en la imagen **no es un problema de permisos de admin**. Los console logs solo muestran warnings de Fragment props. El error probablemente viene de un componente del Home que falla al cargar datos (posiblemente un query de Recharts o un KPI widget con datos undefined). Esto requiere debug separado.

---

## Plan de Remediación

### Fase 1 — Fix inmediato (build error)
| Archivo | Cambio |
|---|---|
| `supabase/functions/send-custodian-invitation/index.ts` | Cambiar `npm:resend@2.0.0` → `https://esm.sh/resend@2.0.0` |

### Fase 2 — Hardening admin access
| Acción | Detalle |
|---|---|
| Insertar permisos faltantes en `role_permissions` para admin | Agregar entradas para todos los módulos que podrían usar `PermissionProtectedRoute` en el futuro |
| Actualizar `get_current_user_role_secure` | Agregar `customer_success` con prioridad explícita (posición 22) |

### Fase 3 — Deuda de seguridad (opcional, no bloquea admin)
| Acción | Detalle |
|---|---|
| Fijar `search_path` en funciones SECURITY DEFINER | 82 funciones necesitan `SET search_path = public` |
| Convertir vista SECURITY DEFINER a `security_invoker` | 1 vista identificada por el linter |

### Checklist para Live
Antes de publicar:
1. Verificar que admin en Live tiene las mismas entradas en `role_permissions`
2. Ejecutar el fix del edge function
3. Confirmar que `get_current_user_role_secure` devuelve 'admin' correctamente en Live

---

## Conclusión

**El rol admin tiene acceso completo a todas las rutas y datos del sistema.** No hay bloqueos de RLS ni de frontend para admin/owner. Los hallazgos son:
1. Un build error activo en una edge function (fix simple)
2. Deuda técnica de seguridad en funciones sin search_path (no afecta acceso)
3. El error en `/home` del screenshot no es de permisos sino de un componente con datos fallidos

