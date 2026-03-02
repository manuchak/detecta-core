
# Subida de Constancia de Capacitacion (Induccion al Puesto)

## Contexto del requerimiento

El equipo de Supply necesita subir el documento fisico firmado de "Induccion al Puesto" como evidencia de que el candidato tomo la capacitacion presencial. Actualmente existe un boton "Marcar como Completada (Presencial)" que solo actualiza la base de datos, pero **no permite adjuntar el documento escaneado/fotografiado**. Sin este archivo, no hay evidencia auditable y el proceso de liberacion queda incompleto.

## Analisis del sistema actual

- Ya existe `marcarCapacitacionManual` en `useCapacitacion.ts` que marca todos los modulos como completados y acepta `notas`.
- Ya existe `AdminDocumentUploadDialog` como patron probado para subida de documentos por parte del equipo Supply.
- La tabla `progreso_capacitacion` ya tiene campo `completado_manual_notas` pero **no tiene campo para URL de archivo**.
- La tabla `documentos_candidato` maneja documentos de reclutamiento con `tipo_documento` y `archivo_url`.

## Recomendacion de implementacion

### Opcion elegida: Agregar a `documentos_candidato` con tipo "constancia_capacitacion"

En lugar de modificar la tabla `progreso_capacitacion` (que es por modulo), es mas limpio y consistente usar `documentos_candidato` que ya tiene la infraestructura de archivo, validacion y visualizacion. Esto permite que la constancia aparezca tanto en la seccion de Capacitacion como en la seccion de Documentacion del perfil operativo.

### Cambios planificados

#### 1. Migracion SQL — Nuevo tipo de documento

Agregar `'constancia_capacitacion'` como valor aceptado en `documentos_candidato.tipo_documento`. Esto permite reutilizar toda la infraestructura existente de storage, validacion y visualizacion.

#### 2. `useCapacitacion.ts` — Extender `marcarCapacitacionManual`

Modificar la mutacion para aceptar un archivo opcional:
- Parametros: `{ notas?: string, archivo?: File }`
- Si se proporciona archivo: subirlo a storage bucket `documentos-candidatos` con path `{candidatoId}/constancia_capacitacion_{timestamp}.{ext}`
- Insertar registro en `documentos_candidato` con tipo `constancia_capacitacion` y la URL del archivo
- Mantener el flujo actual de marcar modulos como completados

#### 3. `TrainingTab.tsx` — Dialog mejorado con zona de upload

El dialog actual de "Marcar como Completada (Presencial)" solo tiene un textarea de notas. Se modificara para incluir:
- Zona de drag-and-drop / click para subir archivo (PDF, JPG, PNG)
- Preview del archivo seleccionado (imagen o icono PDF)
- El campo de notas existente se mantiene
- El archivo sera **obligatorio** — no se puede marcar capacitacion presencial sin evidencia
- Compresion de imagenes via Canvas API (patron ya establecido en el proyecto)

#### 4. `DocumentacionTab.tsx` — Visibilidad de la constancia

Agregar la constancia de capacitacion a la lista de documentos visibles en la seccion "Documentos de Reclutamiento" del perfil operativo. Solo requiere agregar el label en `DOCUMENTO_LABELS`:
- `constancia_capacitacion: 'Constancia de Capacitacion / Induccion'`

Esto funciona automaticamente porque `useProfileDocuments` ya trae todos los `documentos_candidato`.

#### 5. `LiberacionChecklistModal.tsx` — Validacion de evidencia

Actualmente el checklist de liberacion verifica `capacitacion_completa` (booleano). Se complementa para verificar tambien que exista el documento `constancia_capacitacion` en `documentos_candidato`, mostrando un warning amarillo si la capacitacion esta marcada como completa pero no tiene documento adjunto.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Agregar tipo `constancia_capacitacion` a documentos_candidato |
| `src/hooks/useCapacitacion.ts` | Aceptar archivo en `marcarCapacitacionManual`, subirlo a storage |
| `src/components/leads/evaluaciones/TrainingTab.tsx` | Agregar zona de upload al dialog de capacitacion manual |
| `src/pages/PerfilesOperativos/hooks/useProfileDocuments.ts` | Agregar label para `constancia_capacitacion` |
| `src/components/liberacion/LiberacionChecklistModal.tsx` | Warning si no hay constancia adjunta |

### Flujo de usuario resultante

1. Supply abre el perfil del candidato, va a la pestana de Capacitacion
2. Click en "Marcar como Completada (Presencial)"
3. Se abre dialog con: zona para subir foto/PDF de la constancia firmada + notas opcionales
4. Sube la foto del documento de induccion (se comprime automaticamente si es imagen)
5. Click en "Completar Capacitacion"
6. El sistema: sube archivo a storage, crea registro en documentos_candidato, marca todos los modulos como completados
7. La constancia queda visible en la seccion de Documentacion del perfil operativo
8. El checklist de liberacion refleja que la capacitacion esta completa CON evidencia

### Sin dependencias nuevas

Todo se resuelve con infraestructura existente: storage de Supabase, compresion de imagenes, patron de upload ya probado.
