
Objetivo: resolver de raíz el error persistente en “Completar Capacitación” con una revisión exhaustiva basada en evidencia real de red/DB.

Resumen de hallazgos (evidencia):
1) La subida a Storage ya funciona:
- POST /storage/v1/object/candidato-documentos/... → 200 OK.
2) El fallo real ocurre después, al insertar metadata:
- POST /rest/v1/documentos_candidato → 400
- Mensaje exacto: `new row for relation "documentos_candidato" violates check constraint "documentos_candidato_tipo_documento_check"` (code 23514).
3) El valor enviado por frontend es:
- `tipo_documento = 'constancia_capacitacion'`.
4) La constraint actual de DB solo acepta:
- `ine_frente, ine_reverso, licencia_frente, licencia_reverso, curp, rfc, comprobante_domicilio, carta_antecedentes`.
- No incluye `constancia_capacitacion`.

Fishbone (causa raíz):
```text
                   Error al completar capacitación
                             |
     ---------------------------------------------------------
     |                        |                             |
  Datos DB                Lógica App                   UX/Observabilidad
  (Constraint)            (flujo upload→insert)       (mensaje genérico)
  - CHECK de              - Se sube archivo           - Toast “No se pudo...”
    tipo_documento          correctamente               sin detalle accionable
    desactualizado        - Falla insert por CHECK    - Difícil detectar causa
  - No contempla          - Puede dejar archivo
    constancia_*            huérfano en storage
```

Causa raíz confirmada:
- Incompatibilidad entre catálogo de tipos en código y restricción CHECK en `documentos_candidato`.
- El bug ya no es bucket/Storage; ahora es validación de esquema en DB.

Plan de implementación (fix robusto):
1) Migración SQL (principal)
- Actualizar `documentos_candidato_tipo_documento_check` para incluir `constancia_capacitacion`.
- Aprovechar para incluir también tipos ya usados por app (`portacion_arma`, `registro_arma`) y evitar futuros errores del mismo patrón.
- Mantener la constraint (no remover validación), solo alinear catálogo permitido.

2) Alineación de tipos en frontend (consistencia)
- Extender `TipoDocumento` en `useDocumentosCandidato.ts` para incluir `constancia_capacitacion`.
- Verificar que labels/catálogos de UI y tipos TS coincidan con los valores permitidos por DB.

3) Hardening del flujo en `useCapacitacion.ts`
- Si falla el insert en `documentos_candidato` tras subir archivo, ejecutar rollback de storage (`remove`) para evitar archivos huérfanos.
- Mapear errores de Postgres (ej. 23514) a mensajes legibles para usuario (p. ej. “Tipo de documento no permitido por configuración”).

4) Mejorar visibilidad de errores al usuario
- Mantener try/catch de `handleMarcarManual`, pero mostrar `error.message` normalizado cuando exista.
- En `onError` de mutación, registrar contexto mínimo útil (candidato_id, tipo_documento, step que falló: upload/insert/upsert).

5) Validación post-fix (obligatoria)
- Prueba E2E: abrir modal, subir PDF/JPG, completar, verificar:
  a) toast de éxito,
  b) registro en `documentos_candidato`,
  c) progreso de módulos actualizado,
  d) sin errores 400 en red.
- Prueba de falla controlada: forzar tipo inválido y confirmar mensaje claro + rollback de archivo.

Entregables esperados:
- 1 migración SQL de constraint.
- Ajustes en `useCapacitacion.ts` (rollback + error mapping).
- Ajuste de tipos en `useDocumentosCandidato.ts`.
- Flujo “Completar Capacitación” estable y trazable.
