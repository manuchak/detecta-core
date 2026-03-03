

## Diagnóstico del módulo de inscripciones LMS

### Problema encontrado

Las rutas del LMS Admin permiten acceso a 4 roles: `admin`, `owner`, `supply_admin`, `capacitacion_admin`. Sin embargo, las **políticas RLS en la base de datos** solo incluyen 3 de esos roles (`admin`, `owner`, `supply_admin`). El rol `capacitacion_admin` está **completamente excluido** de todas las políticas RLS del LMS.

Esto explica por qué solo Brenda y Marbe (probablemente `admin` o `supply_admin`) pueden operar, mientras que cualquier usuario con rol `capacitacion_admin` puede entrar a la página pero ve todo vacío o recibe errores al buscar usuarios.

### Tablas afectadas y políticas a actualizar

| Tabla | Policy | Agregar `capacitacion_admin` |
|---|---|---|
| `lms_cursos` | `lms_cursos_select_publicados` | SELECT (ver cursos admin) |
| `lms_cursos` | `lms_cursos_insert_admin` | INSERT (crear cursos) |
| `lms_cursos` | `lms_cursos_update_admin` | UPDATE (editar cursos) |
| `lms_cursos` | `lms_cursos_delete_admin` | DELETE (eliminar cursos) |
| `lms_inscripciones` | `lms_inscripciones_select` | SELECT (ver inscripciones) |
| `lms_inscripciones` | `lms_inscripciones_insert` | INSERT (inscribir usuarios) |
| `lms_inscripciones` | `lms_inscripciones_update` | UPDATE (cambiar estado) |
| `profiles` | — | SELECT (buscar usuarios para inscribir) |
| `lms_progreso` | `lms_progreso_select` | SELECT (ver progreso de inscritos) |

### Plan de acción

**1 migración SQL** que:
- Hace `DROP POLICY` + `CREATE POLICY` para cada una de las 9 políticas anteriores, agregando `'capacitacion_admin'` al array de roles permitidos
- Para `profiles`, agrega `capacitacion_admin` a la policy existente `customer_success_view_profiles` (o crea una nueva si es más limpio)

**Sin cambios frontend** — el código ya está correcto, solo le faltan los permisos en DB.

