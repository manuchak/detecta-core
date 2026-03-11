

# Debug: Módulo de Evaluaciones de Supply

## Problemas encontrados

### 1. CRÍTICO — Queries hardcoded a `candidatos_custodios` para candidatos armados

Cuando el usuario selecciona un candidato armado, el `CandidateEvaluationPanel` recibe `tipoOperativo='armado'` pero **no lo usa** en sus queries internos. Tres componentes consultan/actualizan exclusivamente `candidatos_custodios`:

| Componente | Línea | Problema |
|---|---|---|
| `CandidateEvaluationPanel.tsx` | 110 | `candidatoData` query hardcoded a `candidatos_custodios` — retorna `null` para armados |
| `PersonalDataTab.tsx` | 59, 105 | SELECT y UPDATE hardcoded a `candidatos_custodios` |
| `PersonalDataBadge.tsx` | 16 | SELECT hardcoded a `candidatos_custodios` |

**Efecto**: Para candidatos armados, `candidatoData` es `null`, lo que causa:
- Gate `personal_data` siempre falla (nombre/telefono/email son `undefined`)
- PersonalDataTab muestra formulario vacío y al guardar intenta UPDATE en tabla incorrecta
- `vehiculoPropio` siempre es `false`

### 2. CRÍTICO — `useCustodioLiberacion` hardcoded a `candidatos_custodios`

Al liberar un candidato armado, la sincronización de estado (línea 92) hace UPDATE a `candidatos_custodios` con el ID del armado — no encuentra fila, el estado no se actualiza.

### 3. MEDIO — `candidatos_armados` no tiene campos de vehículo ni CURP

La tabla `candidatos_armados` solo tiene: `nombre, telefono, email, vehiculo_propio`. No tiene: `curp, direccion, marca_vehiculo, modelo_vehiculo, placas_vehiculo, color_vehiculo, numero_serie, numero_motor, numero_licencia`. El formulario de datos personales necesita adaptarse.

### 4. BAJO — FK triggers ya aplicados (confirmado)

La migración SQL del mensaje anterior se ejecutó correctamente. Los 5 triggers `validate_candidato_id_dual` están activos y las FKs exclusivas fueron eliminadas. Las evaluaciones ya pueden insertarse con IDs de ambas tablas.

### 5. BAJO — Warning `React.Fragment` con `data-lov-id`

`UnifiedSidebar.tsx:373` pasa `data-lov-id` a `React.Fragment`. Es un warning del framework de desarrollo, no afecta funcionalidad.

## Plan de corrección

### A. Propagar `tipoOperativo` a queries dinámicos

**`CandidateEvaluationPanel.tsx`**:
- Cambiar el query de `candidatoData` (línea 107-114) para usar `tipoOperativo === 'armado' ? 'candidatos_armados' : 'candidatos_custodios'`
- Para armados, SELECT solo los campos que existen (`nombre, telefono, email, vehiculo_propio`)

**`PersonalDataTab.tsx`**:
- Recibir prop `tipoOperativo`
- Usar tabla dinámica en SELECT y UPDATE
- Ocultar campos que no existen en `candidatos_armados` (curp, direccion, datos vehículo detallados)
- Ajustar `FIELD_LIST` y `EMPTY_FORM` según tipo

**`PersonalDataBadge.tsx`**:
- Recibir prop `tipoOperativo`
- Query dinámico con campos correctos

### B. Fix liberación para armados

**`useCustodioLiberacion.ts`**:
- Aceptar parámetro opcional `tipoOperativo`
- Usar tabla correcta para UPDATE de estado

### C. Pasar `tipoOperativo` en la cadena de componentes

`CandidateEvaluationPanel` → `PersonalDataTab`, `PersonalDataBadge`

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/recruitment/CandidateEvaluationPanel.tsx` | Query dinámico + pasar prop a PersonalDataTab/Badge |
| `src/components/recruitment/personal/PersonalDataTab.tsx` | Tabla dinámica, campos condicionales |
| `src/components/recruitment/personal/PersonalDataBadge.tsx` | Tabla dinámica |
| `src/hooks/useCustodioLiberacion.ts` | Tabla dinámica para sync de estado |

