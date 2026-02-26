
# Agregar boton "Subir Firmado" a contratos ya generados

## Problema

El boton "Subir Firmado" solo se muestra cuando un contrato no ha sido generado. Una vez que se genera el contrato digitalmente (Convenio de Confidencialidad, Aviso de Privacidad, etc.), las unicas opciones son "Ver Contrato", "Firmar" (firma digital) y "Eliminar". No hay manera de subir el escaneo de un contrato que fue firmado fisicamente.

## Solucion

Agregar el boton "Subir Firmado" junto a los botones existentes cuando el contrato ya fue generado pero aun no esta firmado. Esto permite dos flujos paralelos:
- **Firma digital**: Usar el boton "Firmar" existente
- **Firma fisica**: Subir el documento escaneado con "Subir Firmado"

## Cambio

**Archivo:** `src/components/recruitment/contracts/ContractsTab.tsx`

En el bloque que renderiza los botones cuando ya existe un contrato (lineas 185-215), agregar el boton "Subir Firmado" dentro del condicional `!contrato.firmado`. El boton reutiliza el mismo `handleUpload(tipo)` y el `ContractUploadDialog` que ya existe.

Resultado visual: cuando un contrato esta generado pero no firmado, se veran 4 botones:
1. Ver Contrato
2. Firmar (digital)
3. Subir Firmado (fisico escaneado)
4. Eliminar
