
# Plan: Fixes de Documentacion Supply (6 bugs)

## Bug 1: OCR se queda en loop "Procesando OCR"

### Diagnostico
- Hay 2 documentos `licencia_frente` con `estado_validacion = 'procesando'` y `ocr_procesado = false` que nunca completaron
- Los logs del edge function `ocr-documento` estan vacios, sugiriendo que la funcion falla silenciosamente o no se invoca
- El problema esta en el catch del edge function: intenta hacer `await req.json()` una segunda vez, lo cual falla porque el body ya fue consumido
- Ademas, si la funcion falla, el documento queda atrapado en estado `procesando` sin mecanismo de recuperacion

### Solucion
1. **Fix edge function `ocr-documento`**: Guardar los parametros originales antes del try/catch para poder referenciarlos en el error handler. Evitar segundo `req.json()` en el catch
2. **Agregar timeout/retry en el frontend**: En `DocumentUploadDialog.tsx`, manejar el error de OCR para que si falla, el documento quede en estado `pendiente` (no `procesando`). Agregar un boton "Reintentar OCR" en la UI para documentos atascados
3. **Fix documentos atascados**: Crear una migracion SQL que actualice los documentos stuck (`estado_validacion = 'procesando'` AND `ocr_procesado = false`) a `pendiente`

### Archivos a modificar
- `supabase/functions/ocr-documento/index.ts` - Fix error handler
- `src/components/recruitment/documents/DocumentUploadDialog.tsx` - Manejar error de OCR gracefully
- `src/components/recruitment/documents/DocumentsTab.tsx` - Agregar boton "Reintentar OCR"
- Migracion SQL para limpiar documentos atascados

---

## Bug 2: Direccion del custodio en contratos debe venir de socioeconomicos

### Diagnostico
- La tabla `estudios_socioeconomicos` NO tiene columna de direccion (solo tiene scores y observaciones)
- La tabla `candidatos_custodios` tiene una columna `direccion` que se llena manualmente en el dialog de generacion de contratos
- El CURP extraido por OCR de los documentos se guarda en `documentos_candidato.ocr_datos_extraidos` pero no se sincroniza automaticamente a `candidatos_custodios`

### Solucion
- Dado que los socioeconomicos no almacenan direccion, la solucion practica es que los datos extraidos del OCR (CURP del documento CURP, direccion del INE/comprobante de domicilio) se pre-carguen automaticamente en `candidatos_custodios` cuando el OCR procese exitosamente
- Actualizar `ContractGenerateDialog.tsx` para buscar datos OCR como fuente alternativa cuando la direccion o CURP esten pendientes en `candidatos_custodios`
- Agregar campo `curp` a la tabla `candidatos_custodios` via migracion SQL

### Archivos a modificar
- Migracion SQL: agregar columna `curp` a `candidatos_custodios`
- `supabase/functions/ocr-documento/index.ts` - Sincronizar datos OCR extraidos a `candidatos_custodios`
- `src/components/recruitment/contracts/ContractGenerateDialog.tsx` - Pre-cargar CURP y direccion desde OCR si estan vacios
- `src/hooks/useContratosCandidato.ts` - Agregar `curp` a `getDatosInterpolacion`

---

## Bug 3: Convenio de Confidencialidad - reproduccion fiel

### Diagnostico
- La plantilla actual en BD dice "DETECTA SERVICIOS DE INTELIGENCIA S.A. DE C.V." pero el documento original del usuario dice **"GSM CUSTODIAS S.A.P.I. DE C.V."** representada por **"JULIA RODRIGUEZ VARGAS"**
- La estructura actual tiene: Declaraciones, Clausulas (PRIMERA a DECIMA), secciones de Informacion Confidencial, Sanciones
- El documento que muestra el screenshot del usuario es basico: "CONTRATO DE CONFIDENCIALIDAD... El que suscribe {{nombre_completo}}, con CURP {{curp}}, y domicilio en {{direccion}}..."
- La plantilla debe seguir el formato mas simple y directo que coincide con lo que la empresa realmente usa

### Solucion
- Actualizar la plantilla HTML de confidencialidad en la BD via migracion SQL con el contenido correcto basado en el formato del screenshot: GSM Custodias como contratante, Julia Rodriguez Vargas como representante, clausulas de Objeto, Vigencia y Sanciones, con interpolacion de `{{nombre_completo}}`, `{{curp}}` y `{{direccion}}`

### Archivos a modificar
- Migracion SQL: UPDATE `plantillas_contrato` SET `contenido_html` para `confidencialidad`

---

## Bug 4: Aviso de Privacidad incompleto

### Diagnostico
- La plantilla actual tiene: Identidad, Datos recabados, Datos sensibles, Finalidades, Transferencias, y posiblemente falta la seccion de Derechos ARCO, Medios para ejercer derechos, Consentimiento, Modificaciones al aviso, y la seccion de aceptacion/firma

### Solucion
- Revisar la plantilla completa en BD y completar las secciones faltantes (seccion de firma/aceptacion con `{{nombre_completo}}`, `{{fecha_actual}}`, campo de consentimiento)
- Actualizar via migracion SQL

### Archivos a modificar
- Migracion SQL: UPDATE `plantillas_contrato` SET `contenido_html` para `aviso_privacidad`

---

## Bug 5: Crear Anexo GPS

### Diagnostico
- NO existe plantilla activa de `anexo_gps` en la BD (no aparecio en el query)
- El tipo ya existe en el codigo (`TipoContrato`, `CONTRATO_LABELS`, `CONTRATOS_REQUERIDOS`)
- El documento original tiene: Antecedentes (contrato previo), 4 clausulas (pago de $3,582 IVA incluido por GPS Suntech, pago en 4 semanas, ratificacion de terminos, jurisdiccion CDMX), firmas de Julia Rodriguez Vargas y el prestador

### Solucion
- Crear la plantilla HTML del Anexo GPS fielmente basada en el documento original, con variables de interpolacion: `{{nombre_completo}}`, `{{fecha_actual}}`
- Insertar en `plantillas_contrato` via migracion SQL

### Archivos a modificar
- Migracion SQL: INSERT `plantillas_contrato` para `anexo_gps`

---

## Bug 6: Crear tarjeta "Contrato Custodio" con checkmark no-propietario

### Diagnostico
- Actualmente existen dos tarjetas separadas: "Contrato Custodio Propietario" y "Contrato Custodio No Propietario"
- El usuario quiere una sola tarjeta "Contrato Custodio" con un checkmark que indique si el custodio NO es propietario
- El documento de contrato proporcionado (12 paginas) es el contrato completo de prestacion de servicios para propietarios de vehiculo de GSM Custodias
- Debe reemplazar las plantillas existentes con el contenido fiel del documento original

### Solucion
1. **Unificar tarjetas**: En `ContractsTab.tsx`, mostrar una sola tarjeta "Contrato Custodio" con un checkbox para indicar si el custodio no es propietario. Segun el estado del checkbox, se usa la plantilla `prestacion_servicios_propietario` o `prestacion_servicios_no_propietario`
2. **Actualizar plantilla propietario**: Reemplazar el `contenido_html` de `prestacion_servicios_propietario` con la reproduccion fiel del documento adjunto (las 25 clausulas completas con todas las variables de interpolacion)
3. **UI**: Agregar checkbox "El custodio NO es propietario del vehiculo" dentro de la card unificada

### Archivos a modificar
- `src/hooks/useContratosCandidato.ts` - Renombrar label a "Contrato Custodio"
- `src/components/recruitment/contracts/ContractsTab.tsx` - Unificar las tarjetas propietario/no-propietario en una sola con checkbox
- Migracion SQL: UPDATE plantilla `prestacion_servicios_propietario` con contenido fiel del documento

---

## Resumen de migraciones SQL necesarias

1. Fix documentos atascados en `procesando`
2. Agregar columna `curp` a `candidatos_custodios`
3. UPDATE plantilla `confidencialidad` con contenido correcto de GSM Custodias
4. UPDATE plantilla `aviso_privacidad` completando secciones faltantes
5. INSERT plantilla `anexo_gps` con contenido fiel del documento original
6. UPDATE plantilla `prestacion_servicios_propietario` con contenido fiel del contrato completo (12 paginas)

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/functions/ocr-documento/index.ts` | Fix error handler + sincronizar datos OCR a candidatos_custodios |
| `src/components/recruitment/documents/DocumentsTab.tsx` | Boton "Reintentar OCR" para docs atascados |
| `src/components/recruitment/documents/DocumentUploadDialog.tsx` | Manejar error OCR gracefully |
| `src/components/recruitment/contracts/ContractGenerateDialog.tsx` | Pre-cargar CURP/direccion desde OCR |
| `src/components/recruitment/contracts/ContractsTab.tsx` | Unificar tarjetas contrato custodio con checkbox |
| `src/hooks/useContratosCandidato.ts` | Agregar curp, renombrar label contrato custodio |
| Migraciones SQL (6) | Templates de contratos + fix datos |

## Nota sobre build errors
Los errores de `gl-matrix/index.d.ts` son del paquete `mapbox-gl` y no afectan la funcionalidad. Son errores de tipo en node_modules, no del proyecto.
