
# Bug: "Error al generar el contrato" - Causa Raiz

## Problema
El equipo de Supply no puede generar contratos digitales. El insert falla silenciosamente con un error de constraint violation.

## Causa Raiz
La tabla `contratos_candidato` tiene un **CHECK constraint** (`contratos_candidato_tipo_contrato_check`) que solo permite 5 valores:

```text
'confidencialidad', 'prestacion_servicios', 'codigo_conducta', 'aviso_privacidad', 'responsiva_equipo'
```

Pero el codigo intenta insertar 3 tipos adicionales que **no estan en la lista**:
- `prestacion_servicios_propietario`
- `prestacion_servicios_no_propietario`  
- `anexo_gps`

Estos tipos fueron agregados en la logica de la aplicacion (v2.1 de contratos) pero nunca se actualizo el CHECK constraint en la base de datos.

## Solucion

Una sola migracion SQL que actualice el CHECK constraint para incluir los 8 tipos de contrato validos:

```sql
ALTER TABLE contratos_candidato
  DROP CONSTRAINT contratos_candidato_tipo_contrato_check;

ALTER TABLE contratos_candidato
  ADD CONSTRAINT contratos_candidato_tipo_contrato_check
  CHECK (tipo_contrato::text = ANY(ARRAY[
    'confidencialidad',
    'prestacion_servicios',
    'codigo_conducta',
    'aviso_privacidad',
    'responsiva_equipo',
    'prestacion_servicios_propietario',
    'prestacion_servicios_no_propietario',
    'anexo_gps'
  ]::text[]));
```

No se requieren cambios en el frontend. El codigo ya maneja correctamente los 8 tipos; solo falta que la base de datos los acepte.
