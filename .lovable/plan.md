

# Firmas Digitales en Incidentes + Mejora de Tarjetas del Listado

## Parte 1: Firmas Digitales (Creacion y Cierre)

### Nuevas columnas en `incidentes_operativos`

Se agregaran 6 columnas via SQL migration:

- `firma_creacion_base64` (text) - imagen base64 de la firma del creador
- `firma_creacion_email` (text) - email del usuario que firmo la creacion
- `firma_creacion_timestamp` (timestamptz) - momento exacto de la firma de creacion
- `firma_cierre_base64` (text) - imagen base64 de la firma de quien cerro
- `firma_cierre_email` (text) - email del usuario que firmo el cierre
- `firma_cierre_timestamp` (timestamptz) - momento exacto de la firma de cierre

### Flujo de Creacion (IncidentReportForm.tsx)

- Agregar el componente `SignaturePad` (ya existente en `src/components/custodian/checklist/SignaturePad.tsx`) al formulario, visible al registrar (boton "Registrar")
- La firma sera obligatoria para pasar de borrador a estado "abierto" (al hacer clic en "Registrar")
- Guardar borradores NO requiere firma (permite trabajar iterativamente)
- Al registrar: se guarda `firma_creacion_base64`, `firma_creacion_email` (del usuario autenticado), y `firma_creacion_timestamp`
- Validacion: si no hay firma, mostrar toast de error "Firma digital requerida para registrar el incidente"

### Flujo de Cierre (IncidentReportForm.tsx + IncidentListPanel.tsx)

- En el `AlertDialog` de confirmacion de cierre (tanto en lista como en formulario), agregar el `SignaturePad` dentro del dialogo
- El boton "Cerrar incidente" queda deshabilitado hasta que se dibuje la firma
- Al confirmar cierre: se guarda `firma_cierre_base64`, `firma_cierre_email`, y `firma_cierre_timestamp`

### PDF (IncidentPDFExporter.ts)

- Agregar seccion "6. Firmas Digitales" al final del PDF
- Renderizar la imagen de firma de creacion con nombre/email y timestamp
- Si el incidente esta cerrado, renderizar tambien la firma de cierre con nombre/email y timestamp

## Parte 2: Mejora de Tarjetas del Listado (IncidentListPanel.tsx)

La tarjeta actual solo muestra: severidad, estado, tipo, descripcion truncada, zona y fecha. Esto es insuficiente para evaluar rapidamente un incidente.

### Informacion adicional en cada tarjeta

Se rediseniara cada fila del listado para incluir:

- **Linea 1 (existente mejorada)**: Severidad badge + Estado badge + Tipo (label completo) + Fecha/hora
- **Linea 2 (nueva)**: Cliente | Zona | ID servicio vinculado (si existe) | Icono de atribuible a operacion
- **Linea 3 (nueva)**: Descripcion truncada (60 chars) + Conteo de entradas de cronologia (ej: "3 entradas") + Indicador de firma (check verde si tiene firma de creacion)
- **Indicadores visuales**: Badge de "Firmado" si tiene firma de creacion, badge de "Cerrado + Firmado" si tiene firma de cierre

### Cambios al query de listado

- El query actual solo hace `select('*')` de `incidentes_operativos`, lo cual ya trae todas las columnas incluyendo las nuevas de firma
- Para mostrar conteo de cronologia, se agregara un query ligero o se usara un count en el select

## Detalle tecnico de archivos a modificar

1. **SQL Migration** - Agregar las 6 columnas de firma a `incidentes_operativos`
2. **`src/hooks/useIncidentesOperativos.ts`** - Actualizar la interfaz `IncidenteOperativo` con los nuevos campos de firma; actualizar `useCreateIncidente` y `useUpdateIncidente` para incluir firma en el payload
3. **`src/components/monitoring/incidents/IncidentReportForm.tsx`** - Integrar `SignaturePad` antes del boton "Registrar"; validar firma obligatoria en `handleSubmit`; agregar `SignaturePad` al flujo de cierre
4. **`src/components/monitoring/incidents/IncidentListPanel.tsx`** - Rediseniur las tarjetas con la informacion expandida; agregar `SignaturePad` dentro del `AlertDialog` de cierre; mostrar indicadores de firma
5. **`src/components/monitoring/incidents/IncidentPDFExporter.ts`** - Agregar seccion 6 con firmas digitales renderizadas como imagenes

