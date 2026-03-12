

# Plan: Botón de eliminar para todos los contratos (incluyendo firmados)

## Problema
El botón "Eliminar" solo aparece cuando el contrato **no está firmado** (línea 196 de `ContractsTab.tsx`: `!contrato.firmado && contrato.estado !== 'rechazado'`). Si Supply sube un documento errado y lo marca como firmado, no pueden reemplazarlo.

## Cambio

**`src/components/recruitment/contracts/ContractsTab.tsx`**:
- Mover el botón "Eliminar" **fuera** del bloque condicional `!contrato.firmado`, para que aparezca siempre que exista un contrato.
- Para contratos firmados, agregar un texto de confirmación más enfático en el AlertDialog indicando que se eliminará un contrato ya firmado y que podrán subir uno nuevo después.
- También limpiar el archivo de storage (`contratos-escaneados`) si el contrato es físico, para no dejar archivos huérfanos.

**`src/hooks/useContratosCandidato.ts`** — `useEliminarContrato`:
- Antes de eliminar el registro en DB, verificar si tiene `pdf_url` con bucket `contratos-escaneados` y eliminar el archivo de storage.

## Resultado
El equipo de Supply podrá eliminar cualquier contrato (firmado o no) y volver a subir el correcto. El diálogo de confirmación será claro sobre las implicaciones.

