
Diagnóstico confirmado (con evidencia):
- En la sesión del usuario, el RPC `POST /rest/v1/rpc/lms_delete_curso_secure` responde **400**.
- Respuesta exacta: `{"code":"42703","message":"column \"curso_id\" does not exist"}`.
- El toast en UI muestra el mismo error.
- La función actual `lms_delete_curso_secure` contiene:
  - `DELETE FROM lms_certificados WHERE curso_id = p_curso_id;`
- Pero `lms_certificados` **no tiene** columna `curso_id`; sólo tiene `inscripcion_id` (entre otras).
- Además, detecté un segundo riesgo en la misma función:
  - `lms_puntos_historial.referencia_id` es `uuid`, pero se compara contra `p_curso_id::text`.

¿Sé cuál es el problema? **Sí**: la función SQL quedó desalineada del esquema real, y por eso nunca llega a borrar el curso.

Plan de corrección:
1. Crear una **nueva migración SQL** que reemplace `lms_delete_curso_secure`.
2. Mantener validaciones actuales (autenticado + rol `owner/admin` + curso existente).
3. Cambiar estrategia de borrado a “cascade-first” para evitar más desajustes de columnas:
   - Borrar manualmente sólo `lms_puntos_historial` con tipo correcto:
     - `WHERE referencia_id = p_curso_id AND referencia_tipo = 'curso'`
   - Borrar el registro en `lms_cursos`.
   - Dejar que los `FK ON DELETE CASCADE` eliminen automáticamente:
     - `lms_modulos`, `lms_contenidos`, `lms_progreso`, `lms_inscripciones`, `lms_certificados`, `lms_preguntas`.
4. Incluir `SET search_path = public` en la función por higiene de `SECURITY DEFINER`.
5. Conservar respuesta JSON de éxito con título e inscripciones eliminadas.

Borrador técnico (resumen):
```sql
CREATE OR REPLACE FUNCTION lms_delete_curso_secure(p_curso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- validar auth/rol/curso
-- delete from lms_puntos_historial where referencia_id = p_curso_id and referencia_tipo = 'curso';
-- delete from lms_cursos where id = p_curso_id; -- cascada elimina dependencias
-- return jsonb_build_object('success', true, ...);
$$;
```

Validación posterior (obligatoria):
- Probar de nuevo “Eliminar” en `/lms/admin` con “Supply Chain”.
- Verificar que el RPC ya responde `200` y `success: true`.
- Confirmar que desaparece del catálogo sin navegación accidental.
- Verificar en DB que ya no existe el curso ni sus registros relacionados.

Impacto en código frontend:
- **Ninguno** (la UI y `invalidateQueries` ya están correctos; el fallo es 100% backend SQL).
