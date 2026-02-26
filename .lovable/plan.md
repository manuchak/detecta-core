

# Fix: Función de eliminación de curso falla por tablas inexistentes

## Problema

La función RPC `lms_delete_curso_secure` falla con el error:
```
relation "lms_respuestas_quiz" does not exist
```

La función intenta borrar de dos tablas que no existen en la base de datos:
- `lms_respuestas_quiz` -- no existe
- `lms_preguntas_quiz` -- no existe

La tabla real de preguntas es `lms_preguntas`, que tiene `curso_id` directo (no pasa por contenidos/módulos).

## Solución

Recrear la función `lms_delete_curso_secure` con las referencias correctas a las tablas existentes:

1. Eliminar las líneas que borran de `lms_respuestas_quiz` (tabla inexistente)
2. Reemplazar `DELETE FROM lms_preguntas_quiz WHERE contenido_id IN (...)` por `DELETE FROM lms_preguntas WHERE curso_id = p_curso_id`
3. Mantener el resto del borrado en cascada igual (progreso, contenidos, módulos, inscripciones, certificados, puntos, curso)

### Migración SQL

```sql
CREATE OR REPLACE FUNCTION lms_delete_curso_secure(p_curso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_curso_titulo text;
  v_inscripciones_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
  LIMIT 1;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sin permisos');
  END IF;

  SELECT titulo INTO v_curso_titulo FROM lms_cursos WHERE id = p_curso_id;
  IF v_curso_titulo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado');
  END IF;

  SELECT COUNT(*) INTO v_inscripciones_count FROM lms_inscripciones WHERE curso_id = p_curso_id;

  -- 1. Delete quiz questions (tabla real: lms_preguntas con curso_id directo)
  DELETE FROM lms_preguntas WHERE curso_id = p_curso_id;

  -- 2. Delete progress
  DELETE FROM lms_progreso WHERE contenido_id IN (
    SELECT c.id FROM lms_contenidos c
    JOIN lms_modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id
  );

  -- 3. Delete content
  DELETE FROM lms_contenidos WHERE modulo_id IN (
    SELECT id FROM lms_modulos WHERE curso_id = p_curso_id
  );

  -- 4. Delete modules
  DELETE FROM lms_modulos WHERE curso_id = p_curso_id;

  -- 5. Delete inscriptions
  DELETE FROM lms_inscripciones WHERE curso_id = p_curso_id;

  -- 6. Delete certificates
  DELETE FROM lms_certificados WHERE curso_id = p_curso_id;

  -- 7. Delete points history
  DELETE FROM lms_puntos_historial
  WHERE referencia_id = p_curso_id::text AND referencia_tipo = 'curso';

  -- 8. Delete the course
  DELETE FROM lms_cursos WHERE id = p_curso_id;

  RETURN jsonb_build_object(
    'success', true,
    'titulo', v_curso_titulo,
    'inscripciones_eliminadas', v_inscripciones_count
  );
END;
$$;
```

### Archivos a modificar
Ninguno -- solo se necesita la migración SQL para corregir la función en la base de datos.
