
# Plan: Corregir Validación de Teléfono y Columna DB en Portal Custodio

## Problema Identificado

| Bug | Causa | Impacto |
|-----|-------|---------|
| Subida silenciosa falla | Teléfono "Sin telefono" se sanitiza a "" | Usuario no ve error, foto no se guarda |
| Error DB repetido | `pc_custodios.telefono` no existe (es `tel`) | Logs llenos de errores, funcionalidad rota |

---

## Solución Propuesta

### 1. Validación de Teléfono en `useCustodianDocuments.ts`

Agregar validación estricta ANTES de intentar subir:

```typescript
// Sanitizar teléfono
const sanitizedPhone = custodioTelefono.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

// Validar que tenga al menos 8 dígitos
if (sanitizedPhone.replace(/[^0-9]/g, '').length < 8) {
  throw new Error('Tu número de teléfono no es válido. Por favor actualiza tu perfil.');
}
```

### 2. Mensaje de Error Específico en `DocumentUploadStep.tsx`

Nuevo tipo de error para teléfono inválido:

```typescript
type ErrorType = 'storage_low' | 'invalid_phone' | 'upload_failed' | 'generic';

// En catch de handleSubmit
if (error.message.includes('teléfono no es válido')) {
  setErrorType('invalid_phone');
  setErrorMessage('Actualiza tu número de teléfono en tu perfil para continuar');
}
```

UI específica con botón para ir a editar perfil.

### 3. Corregir Columna en `useChecklistMonitoreo.ts`

```typescript
// ANTES (línea 143)
.select('id, telefono')

// DESPUÉS  
.select('id, tel')
```

Y actualizar el mapeo:
```typescript
// ANTES
const telefonoMap = new Map(custodios?.map((c) => [c.id, c.telefono]) || []);

// DESPUÉS
const telefonoMap = new Map(custodios?.map((c) => [c.id, c.tel]) || []);
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCustodianDocuments.ts` | Validación estricta de teléfono sanitizado |
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | UI de error para teléfono inválido |
| `src/hooks/useChecklistMonitoreo.ts` | Cambiar `telefono` → `tel` |

---

## UI de Error para Teléfono Inválido

```text
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Teléfono no válido                                   │
│─────────────────────────────────────────────────────────│
│                                                         │
│ Para subir documentos necesitas un número de            │
│ teléfono válido registrado en tu perfil.                │
│                                                         │
│ Tu teléfono actual: "Sin telefono"                      │
│                                                         │
│                  [Ir a Mi Perfil]                       │
└─────────────────────────────────────────────────────────┘
```

---

## Resultado Esperado

| Escenario | Antes | Después |
|-----------|-------|---------|
| Teléfono "Sin telefono" | Falla silenciosa | Error claro con acción |
| Teléfono vacío | Falla silenciosa | Error claro |
| Teléfono válido | Funciona | Funciona igual |
| Monitoreo checklists | Error DB repetido | Funciona correctamente |
