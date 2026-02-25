

# Eliminar CURP del Checklist de Documentacion de Liberacion

## Cambios

Se eliminara el campo CURP de todos los puntos donde se usa en el flujo de liberacion. El campo seguira existiendo en la base de datos pero no se mostrara ni se contabilizara en la UI.

### 1. `src/types/liberacion.ts`
- Eliminar la propiedad `documentacion_curp` de la interfaz `CustodioLiberacion` (o marcarla como opcional/deprecada).

### 2. `src/components/liberacion/LiberacionChecklistModal.tsx`
- **Linea ~146**: Quitar `lib.documentacion_curp` de la validacion de datos pre-existentes.
- **Linea ~178**: Quitar `documentacion_curp: tiposValidos.includes('curp')` del prefill de documentos.
- **Linea ~259**: Quitar `documentacion_curp` del merge de datos.
- **Lineas ~453-455**: Quitar el gate verde "CURP faltante" de la validacion de liberacion.
- **Linea ~719**: Quitar la fila `{ field: 'documentacion_curp', label: 'CURP' }` del checklist visual.

### 3. `src/hooks/useCustodioLiberacion.ts`
- **Linea ~370**: Quitar `liberacion.documentacion_curp` del array de calculo de progreso de documentacion. El total de documentos pasara de 6 a 5.

### Nota
La columna en la base de datos (`documentacion_curp`) no se elimina, simplemente se ignora en la UI. Esto evita migraciones y mantiene compatibilidad.

