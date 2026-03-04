

# Auditoría RLS — Customer Success y LMS (con capacitacion_admin full-access)

## Estado Actual del LMS

### Hallazgo critico: `capacitacion_admin` bloqueado en 5 tablas y 3 funciones RPC

El rol `capacitacion_admin` tiene acceso correcto en `lms_cursos` e `lms_inscripciones`, pero esta **excluido** de:

| Recurso | Roles actuales | Falta `capacitacion_admin` |
|---|---|---|
| `lms_modulos` (4 policies: SELECT/INSERT/UPDATE/DELETE) | admin, owner, supply_admin | **Si** |
| `lms_contenidos` (4 policies: SELECT/INSERT/UPDATE/DELETE) | admin, owner, supply_admin | **Si** |
| `lms_preguntas` (4 policies: SELECT/INSERT/UPDATE/DELETE) | admin, owner, supply_admin | **Si** |
| `lms_certificados_plantillas` (ALL policy) | admin, capacitacion_admin | Falta owner, supply_admin |
| RPC `lms_archive_curso_secure` | owner, admin | **Si** |
| RPC `lms_delete_curso_secure` | owner, admin | **Si** |
| RPC `lms_reactivate_curso_secure` | owner, admin | **Si** |

Ademas, el sidebar tiene dos problemas:
- Modulo padre LMS (linea 534): **no incluye** `capacitacion_admin`
- Hijo "Gestion" (linea 546): **no incluye** `capacitacion_admin`

Y `roleHomeConfig.ts` no reconoce `capacitacion_admin` como tipo de rol, por lo que no tiene configuracion de home/redirect.

### Todas las policies LMS usan subqueries directas a `user_roles` (riesgo recursion)

Las 18+ policies de LMS hacen `EXISTS (SELECT 1 FROM user_roles ...)` sin funciones SECURITY DEFINER.

### Customer Success: ~10 policies con subqueries directas + NPS/CSAT abiertos

(Sin cambios respecto al plan anterior — `has_cs_management_role()` ya existe para reutilizar.)

---

## Plan de Correccion

### Fase 1 — Crear funcion SECURITY DEFINER para LMS

```text
has_lms_admin_role() → admin, owner, supply_admin, capacitacion_admin
```

### Fase 2 — Migrar 18 policies LMS usando `has_lms_admin_role()`

Recrear policies en:
- `lms_cursos` (4) — ya incluyen capacitacion_admin, solo migrar a funcion
- `lms_modulos` (4) — **fix: agregar capacitacion_admin**
- `lms_contenidos` (4) — **fix: agregar capacitacion_admin**
- `lms_preguntas` (4) — **fix: agregar capacitacion_admin**
- `lms_inscripciones` (3) — ya incluyen, migrar a funcion
- `lms_progreso` (1 SELECT) — ya incluye, migrar a funcion
- `lms_certificados_plantillas` (1) — **fix: agregar owner, supply_admin**

### Fase 3 — Actualizar 3 funciones RPC para incluir `capacitacion_admin`

Recrear con role check ampliado:
- `lms_archive_curso_secure` — agregar `supply_admin`, `capacitacion_admin`
- `lms_delete_curso_secure` — agregar `supply_admin`, `capacitacion_admin`
- `lms_reactivate_curso_secure` — agregar `supply_admin`, `capacitacion_admin`

### Fase 4 — Migrar ~10 policies CS + endurecer NPS/CSAT

- `cs_quejas`: Drop duplicada, recrear ALL usando `has_cs_management_role()`
- `cs_touchpoints`: Drop granulares redundantes, recrear ALL
- `cs_capa`: Recrear usando `has_cs_management_role()`
- `cs_health_scores`: Recrear ALL + BI read
- `cs_nps_campaigns` (4): Restringir de `true` a `has_cs_management_role()`
- `cs_nps_sends` (4): Igual
- `cs_csat_surveys` (4): Igual

### Fase 5 — Frontend: Agregar `capacitacion_admin` al sidebar y roleHomeConfig

En `navigationConfig.ts`:
- Linea 534: Agregar `capacitacion_admin` al array `roles` del modulo padre LMS
- Linea 546: Agregar `capacitacion_admin` al array `roles` del hijo "Gestion"

En `roleHomeConfig.ts`:
- Agregar `capacitacion_admin` al tipo `UserRole`
- Agregar configuracion de home con redirect a `/lms/admin` y modulos `['lms', 'settings']`

### Archivos a modificar

| Capa | Archivo | Cambio |
|---|---|---|
| DB | Nueva migracion SQL | Crear `has_lms_admin_role()`, recrear ~28 policies LMS + CS + NPS/CSAT, actualizar 3 RPCs |
| Frontend | `src/config/navigationConfig.ts` | Agregar `capacitacion_admin` a LMS parent + Gestion |
| Frontend | `src/config/roleHomeConfig.ts` | Agregar tipo y config para `capacitacion_admin` |

