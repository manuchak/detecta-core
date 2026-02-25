
# Diferenciación de Documentación: Custodios vs Armados

## Problema

El sistema de captura de documentos en Supply usa una lista única (`DOCUMENTOS_REQUERIDOS`) para todos los candidatos sin distinguir tipo operativo. Un armado no necesita licencia de conducir, pero sí requiere documentos de portación y registro de arma que actualmente no existen en el sistema.

## Solución

### 1. Extender los tipos de documento

En `src/hooks/useDocumentosCandidato.ts`:

- Agregar nuevos tipos: `portacion_arma` y `registro_arma`
- Crear dos listas separadas:
  - `DOCUMENTOS_REQUERIDOS_CUSTODIO`: INE frente/reverso, licencia frente/reverso, CURP, RFC, comprobante domicilio, carta antecedentes
  - `DOCUMENTOS_REQUERIDOS_ARMADO`: INE frente/reverso, CURP, RFC, comprobante domicilio, carta antecedentes, portación de arma, registro de arma
- Agregar labels para los nuevos tipos en `DOCUMENTO_LABELS`
- Actualizar `useDocumentosProgress` para recibir un parámetro `tipoOperativo` y usar la lista correspondiente

### 2. Actualizar DocumentsTab

En `src/components/recruitment/documents/DocumentsTab.tsx`:

- Agregar prop `tipoOperativo: 'custodio' | 'armado'` a la interfaz `Props`
- Seleccionar la lista de documentos requeridos según el tipo
- Pasar el tipo operativo a `useDocumentosProgress`

### 3. Actualizar el edge function de OCR

En `supabase/functions/ocr-documento/index.ts`:

- Agregar soporte para los nuevos tipos `portacion_arma` y `registro_arma` en el procesamiento OCR (extraer número de permiso, fecha de vencimiento, tipo de arma)

### 4. Actualizar puntos de uso

Verificar y actualizar todos los componentes que renderizan `DocumentsTab` para pasar el `tipoOperativo` correcto (desde `EvaluacionesPage`, el perfil del candidato, etc.)

### 5. Migración SQL

- Agregar los nuevos valores de tipo de documento al constraint/enum en `documentos_candidato.tipo_documento` si existe validación a nivel de BD

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useDocumentosCandidato.ts` | Agregar tipos `portacion_arma`, `registro_arma`; crear listas por tipo operativo |
| `src/components/recruitment/documents/DocumentsTab.tsx` | Recibir `tipoOperativo` y filtrar documentos requeridos |
| `supabase/functions/ocr-documento/index.ts` | Soporte OCR para documentos de arma |
| Componentes padre que usan `DocumentsTab` | Pasar prop `tipoOperativo` |
| `src/components/liberacion/LiberacionChecklistModal.tsx` | Usar lista correcta según tipo operativo |
| Migración SQL | Permitir nuevos valores en `tipo_documento` |

## Listas finales de documentos

### Custodio
1. INE (Frente)
2. INE (Reverso)
3. Licencia de Conducir (Frente)
4. Licencia de Conducir (Reverso)
5. CURP
6. RFC / Constancia de Situación Fiscal
7. Comprobante de Domicilio
8. Carta de Antecedentes No Penales

### Armado
1. INE (Frente)
2. INE (Reverso)
3. Licencia de Portación de Arma
4. Registro del Arma
5. CURP
6. RFC / Constancia de Situación Fiscal
7. Comprobante de Domicilio
8. Carta de Antecedentes No Penales
