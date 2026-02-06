
# Plan: Corregir Validación de Teléfono y Columna DB - COMPLETADO ✅

## Problema Identificado

| Bug | Causa | Impacto |
|-----|-------|---------|
| Subida silenciosa falla | Teléfono "Sin telefono" se sanitiza a "" | Usuario no ve error, foto no se guarda |
| Error DB repetido | `pc_custodios.telefono` no existe (es `tel`) | Logs llenos de errores, funcionalidad rota |

---

## Solución Implementada

### 1. ✅ Validación de Teléfono en `useCustodianDocuments.ts`

Agregada validación estricta ANTES de intentar subir - requiere mínimo 8 dígitos.

### 2. ✅ Mensaje de Error Específico en `DocumentUploadStep.tsx`

Nuevo tipo de error `invalid_phone` con UI específica mostrando:
- Icono de advertencia
- Mensaje claro "Teléfono no válido"
- Instrucción para contactar soporte

### 3. ✅ Corregida Columna en `useChecklistMonitoreo.ts`

Cambiado `telefono` → `tel` en query y mapeo.

---

## Resultado

| Escenario | Antes | Después |
|-----------|-------|---------|
| Teléfono "Sin telefono" | Falla silenciosa | Error claro con acción |
| Teléfono vacío | Falla silenciosa | Error claro |
| Teléfono válido | Funciona | Funciona igual |
| Monitoreo checklists | Error DB repetido | Funciona correctamente |
