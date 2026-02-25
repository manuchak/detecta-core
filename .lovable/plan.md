

# Plan Integral: Documentacion y Contratos de Supply

## Contexto

Se fusionan dos planes previos en una implementacion completa:
1. **Plantillas reales** de los 4 documentos originales (Aviso de Privacidad, Convenio de Confidencialidad, Contrato Propietario, Contrato No Propietario) con todos sus campos
2. **Subida de contratos fisicos** escaneados como paliativo durante la migracion digital

---

## Parte 1: Migracion de Base de Datos

### 1A. Nuevas columnas en `candidatos_custodios`

La tabla actualmente solo tiene campos basicos (nombre, telefono, email, vehiculo_propio, etc.). Se agregan ~23 columnas para persistir datos que se reutilizan entre contratos:

```text
Grupo Personal:        direccion
Grupo Licencia:        numero_licencia, licencia_expedida_por
Grupo Vehiculo:        marca_vehiculo, modelo_vehiculo, numero_serie,
                       clave_vehicular, verificacion_vehicular,
                       numero_motor, placas_vehiculo, color_vehiculo,
                       tarjeta_circulacion
Grupo Factura:         numero_factura, fecha_factura, factura_emitida_a
Grupo Seguro:          numero_poliza, aseguradora, fecha_poliza,
                       poliza_emitida_a, tipo_poliza
Grupo Bancarios:       banco, numero_cuenta, clabe, beneficiario
Grupo No-Propietario:  nombre_propietario_vehiculo
```

Todas TEXT, nullable, sin defaults.

### 1B. Nueva columna en `contratos_candidato`

- `es_documento_fisico` (BOOLEAN, default false) -- para distinguir contratos subidos manualmente

### 1C. Storage bucket

- Crear bucket `contratos-escaneados` (publico) para archivos subidos de contratos fisicos
- RLS: permitir insert/select a roles supply/admin/owner

---

## Parte 2: Plantillas HTML en `plantillas_contrato`

Se hara UPSERT de 4 plantillas (desactivando las existentes con tipo_contrato coincidente y creando nuevas con version 2). El HTML de cada una se transcribira fielmente del documento original con placeholders `{{variable}}`.

### Plantilla 1: Aviso de Privacidad (`aviso_privacidad`)
- Variables: `nombre_completo`
- Contenido: Texto legal completo del aviso (6 paginas), con clausulas de datos personales, finalidades, transferencias, derechos ARCO, etc.
- Firma: Solo nombre y firma del receptor

### Plantilla 2: Convenio de Confidencialidad (`confidencialidad`)
- Variables: `nombre_completo`, `direccion`, `fecha_contratacion`
- Contenido: 5 paginas con declaraciones, 15 clausulas (objeto, reconocimiento, eliminacion, obligaciones, propiedad intelectual, exclusividad, no competencia, jurisdiccion)
- Firma: Revelador (Julia Rodriguez) y Receptor (custodio)

### Plantilla 3: Contrato Prestacion Servicios Propietario (`prestacion_servicios_propietario`)
- Variables: `nombre_completo`, `direccion`, `numero_licencia`, `licencia_expedida_por`, `marca_vehiculo`, `modelo_vehiculo`, `numero_serie`, `clave_vehicular`, `verificacion_vehicular`, `numero_motor`, `placas`, `color_vehiculo`, `tarjeta_circulacion`, `numero_factura`, `fecha_factura`, `factura_emitida_a`, `numero_poliza`, `aseguradora`, `fecha_poliza`, `poliza_emitida_a`, `tipo_poliza`, `banco`, `numero_cuenta`, `clabe`, `beneficiario`, `email_custodio`, `email_analista`, `nombre_analista`, `fecha_contratacion`
- Contenido: 12 paginas, 25 clausulas
- Incluye clausula H sobre propiedad del vehiculo

### Plantilla 4: Contrato Prestacion Servicios No Propietario (`prestacion_servicios_no_propietario`)
- Variables: Mismas que propietario + `nombre_propietario_vehiculo`
- Contenido: 14 paginas (incluye Carta Responsiva como anexo)
- La Carta Responsiva requiere datos del propietario del vehiculo y del prestador de servicios

### Notas sobre las plantillas
- Los textos legales se transcriben fielmente de los documentos DOCX proporcionados
- Se remueve la referencia a CURP en las variables (consistente con el cambio de liberacion)
- "Prestador de servicios" = datos del custodio
- Las plantillas existentes de confidencialidad y aviso_privacidad (version 1) se marcan como `activa: false`

---

## Parte 3: Actualizar Hook `useContratosCandidato.ts`

### 3A. Ampliar `getDatosInterpolacion()`

Agregar todos los campos nuevos al tipo de parametro y al objeto de retorno:
- Campos de factura: `numero_factura`, `fecha_factura`, `factura_emitida_a`
- Campos de seguro: `numero_poliza`, `aseguradora`, `fecha_poliza`, `poliza_emitida_a`, `tipo_poliza`
- Campos bancarios: `banco`, `numero_cuenta`, `clabe`, `beneficiario`
- Campos analista: `nombre_analista`, `email_analista`
- Campos no-propietario: `nombre_propietario_vehiculo`
- `fecha_contratacion` = fecha actual formateada

Cada campo tendra un fallback `[PENDIENTE]` si esta vacio.

### 3B. Nuevo hook `useSubirContratoFisico()`

Mutation que:
1. Comprime la imagen si es JPG/PNG (siguiendo el estandar del proyecto: Canvas API, 1920x1080, 0.7 quality)
2. Sanitiza el nombre de archivo (quitar espacios/caracteres especiales)
3. Sube a storage bucket `contratos-escaneados/{candidatoId}/{tipoContrato}_{timestamp}.ext`
4. Inserta registro en `contratos_candidato` con:
   - `firmado: true`, `estado: 'firmado'`
   - `es_documento_fisico: true`
   - `pdf_url`: URL publica del archivo
   - `plantilla_id: null`
5. Invalida queries de contratos

---

## Parte 4: Actualizar `ContractGenerateDialog.tsx`

Redisenar el dialogo con secciones colapsables para organizar los ~30 campos:

```text
+-------------------------------------------+
| Generar Contrato de Prestacion de Serv... |
+-------------------------------------------+
| Datos Personales (colapsable)             |
|   - Nombre completo (auto)                |
|   - Direccion                             |
|   - Email (auto)                          |
|   - Telefono (auto)                       |
+-------------------------------------------+
| Datos del Analista (auto, no editable)    |
|   - Nombre analista                       |
|   - Email analista                        |
|   - Fecha de contratacion (auto: hoy)     |
+-------------------------------------------+
| Licencia y Vehiculo (solo si aplica)      |
|   - Numero licencia                       |
|   - Expedida por                          |
|   - Marca, Modelo, Serie, Clave vehicular |
|   - Verificacion, Motor, Placas, Color    |
|   - Tarjeta de circulacion               |
+-------------------------------------------+
| Factura del Vehiculo (solo si aplica)     |
|   - Numero factura, Fecha, A nombre de    |
+-------------------------------------------+
| Seguro del Vehiculo (solo si aplica)      |
|   - Poliza, Aseguradora, Fecha, Titular   |
|   - Tipo de poliza                        |
+-------------------------------------------+
| Datos Bancarios (solo si aplica)          |
|   - Banco, Cuenta, CLABE, Beneficiario    |
+-------------------------------------------+
| No Propietario (solo si aplica)           |
|   - Nombre del propietario del vehiculo   |
+-------------------------------------------+
|              [Cancelar] [Generar]          |
+-------------------------------------------+
```

Cambios clave:
- Consultar `profiles` del usuario autenticado para auto-completar nombre/email del analista
- Cargar datos existentes del candidato desde `candidatos_custodios` (todos los campos nuevos)
- `fecha_contratacion` se genera automaticamente como la fecha actual
- Las secciones vehiculares/bancarias solo aparecen para contratos de prestacion de servicios
- Para aviso de privacidad: solo nombre y firma
- Para confidencialidad: nombre, direccion, fecha

---

## Parte 5: Nuevo componente `ContractUploadDialog.tsx`

Dialogo para subir contratos escaneados:
- Input de archivo (acepta PDF, JPG, PNG, max 20MB)
- Preview: thumbnail para imagenes, nombre de archivo para PDFs
- Boton "Subir Contrato Firmado"
- Compresion automatica para imagenes (estandar del proyecto)
- Al subir, el contrato se marca como firmado automaticamente

---

## Parte 6: Actualizar `ContractsTab.tsx`

Para cada tipo de contrato sin documento generado, mostrar dos opciones:

```text
[Generar Contrato]  |  [Subir Firmado]
```

- "Generar Contrato" -> flujo digital existente
- "Subir Firmado" -> abre `ContractUploadDialog`

Cuando un contrato tiene `es_documento_fisico: true`, mostrar un badge "Documento fisico" en la tarjeta del contrato para distinguirlo del flujo digital.

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| Migracion SQL | Agregar ~23 columnas a candidatos_custodios, 1 a contratos_candidato, crear bucket |
| SQL Data (INSERT) | Desactivar plantillas v1, insertar 4 plantillas v2 con HTML completo |
| `src/hooks/useContratosCandidato.ts` | Ampliar getDatosInterpolacion, agregar useSubirContratoFisico |
| `src/components/recruitment/contracts/ContractGenerateDialog.tsx` | Secciones colapsables, autocompletado analista, todos los campos |
| `src/components/recruitment/contracts/ContractUploadDialog.tsx` | **Nuevo** - dialogo de subida de escaneos |
| `src/components/recruitment/contracts/ContractsTab.tsx` | Agregar boton "Subir Firmado", badge "Documento fisico" |

## Orden de implementacion

1. Migracion de BD (columnas + bucket)
2. Insertar plantillas HTML
3. Hook: getDatosInterpolacion ampliado + useSubirContratoFisico
4. ContractGenerateDialog rediseado
5. ContractUploadDialog nuevo
6. ContractsTab con dual-boton

## Notas

- Los errores de gl-matrix son de una dependencia externa y no afectan runtime
- El contrato de no-propietario incluye una "Carta Responsiva" como anexo integrado en la misma plantilla HTML
- La columna `documentacion_curp` se mantiene deprecada (consistente con el cambio anterior)
- Los datos del analista vienen de la tabla `profiles` (campos `display_name` y `email`)

