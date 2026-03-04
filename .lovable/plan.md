
Diagnóstico claro: no está fallando una sola cosa, están fallando etapas encadenadas del mismo flujo. Por eso se siente “tan complicado”.

Fishbone (causa raíz actual)
```text
                    Error "No se pudo completar capacitación"
                                   |
        ----------------------------------------------------------------
        |                         |                         |
   Esquema BD                Flujo app                  Reintentos
   (progreso)                (3 pasos)                  (idempotencia)
   - Falta columna           1) Upload storage OK       - 1er intento crea
     completado_manual         2) Insert documento OK     documento
   - API responde               3) Upsert progreso FAIL  - 2do intento choca
     PGRST204                 => operación incompleta      con unique 23505
```

Evidencia real (sesión/red):
- Upload a `candidato-documentos` devuelve 200.
- Insert en `documentos_candidato` devuelve 201 (sí se guarda).
- Luego falla `progreso_capacitacion` con:
  `PGRST204: Could not find the 'completado_manual' column`.
- En reintento, falla antes con `23505 duplicate key` por índice único `idx_documentos_candidato_unico` (ya existe una constancia activa del primer intento).

Por qué se complicó:
1) Ya no era el bucket ni el CHECK de tipo (eso sí quedó resuelto).
2) El siguiente cuello de botella era de **esquema desalineado** en `progreso_capacitacion`.
3) Al reintentar, apareció un tercer problema: flujo no idempotente (insert duplicado de documento).

Plan de fix definitivo (implementación)
1. Migración de esquema en `progreso_capacitacion`  
   - Agregar columnas faltantes usadas por frontend:
     - `completado_manual boolean default false not null`
     - `completado_manual_por uuid null` (FK a `auth.users`)
     - `completado_manual_fecha timestamptz null`
     - `completado_manual_notas text null`
   - Esto elimina el `PGRST204` y alinea código + BD.

2. Hacer idempotente la parte de `documentos_candidato` en `useCapacitacion.ts`  
   - Antes de `insert`, buscar documento activo existente por `candidato_id + tipo_documento`.
   - Si existe: **update** del registro existente (reemplazar URL/metadatos/notas) en lugar de insertar uno nuevo.
   - Si no existe: insertar normal.
   - Mantener rollback de storage cuando falle DB.

3. Mejorar manejo de errores visibles al usuario  
   - Mapear explícitamente:
     - `PGRST204` → “Configuración pendiente: faltan columnas de capacitación manual.”
     - `23505` → “Ya existe una constancia activa; se actualizará la existente.”
   - Evitar toast genérico cuando haya código conocido.

4. Corrección de estado ya dañado (casos previos)  
   - Script de saneamiento para candidatos con constancia cargada pero sin progreso manual:
     - crear/actualizar `progreso_capacitacion` por módulo con `completado_manual=true`.
   - Así no quedan “subidas exitosas” pero progreso en 0%.

5. Validación E2E obligatoria (misma ruta `/leads/evaluaciones`)  
   - Subir constancia por primera vez → éxito + progreso completo.
   - Repetir subida (mismo candidato) → no duplicado, actualiza constancia, sin error.
   - Confirmar en red: sin `PGRST204`, sin `23505`, sin archivos huérfanos.

Detalles técnicos (resumen)
- La causa raíz vigente ya no es `documentos_candidato_tipo_documento_check`.
- El bloqueo actual es **columna inexistente** + **flujo no idempotente en reintentos**.
- El fix correcto combina **migración de esquema** + **update-or-insert en documento**.
