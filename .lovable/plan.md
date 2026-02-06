
# Plan: Ampliar Validación de ID de Servicio para Folios Externos

## Problema Identificado

El cliente **CARGOBOX LOGISTICS** usa el folio de Saphiro `EI&PESL-1`, pero el sistema rechaza el carácter `&` con el error:

> "Solo se permiten letras, números, guiones y guiones bajos"

### Causa Raíz

La validación actual en `EditServiceForm.tsx` usa un regex muy restrictivo:

```text
/^[a-zA-Z0-9_-]+$/
```

Este regex solo permite:
- Letras (a-z, A-Z)
- Números (0-9)
- Guión bajo (_)
- Guión (-)

Pero **NO permite** caracteres comunes en sistemas de facturación externos como:
- `&` (ampersand) - usado en Saphiro
- `/` (slash) - común en folios
- `#` (hash) - común en referencias
- `.` (punto) - común en códigos
- `()` (paréntesis) - variantes de productos

---

## Solución Propuesta

### Nueva Validación Permisiva

Cambiar de una lista de caracteres permitidos (**allowlist**) a una lista de caracteres prohibidos (**denylist**) que excluya únicamente caracteres peligrosos para inyección:

**Caracteres a prohibir (seguridad):**
| Carácter | Razón |
|----------|-------|
| `<` `>` | Prevenir inyección HTML |
| `'` `"` `` ` `` | Prevenir inyección SQL/Script |
| `\` | Prevenir secuencias de escape |
| `;` | Prevenir terminación SQL |
| `=` | Prevenir manipulación de queries |

**Caracteres ahora permitidos:**
| Carácter | Uso común |
|----------|-----------|
| `&` | Saphiro, ERPs (EI&PESL-1) |
| `/` | Folios con fecha (2024/001) |
| `#` | Referencias (#REF-123) |
| `.` | Códigos con versión (V1.2) |
| `()` | Variantes (PROD-A(1)) |
| `@` | Referencias de email |
| `+` | Códigos con variantes |

---

## Archivos a Modificar

### 1. `src/components/planeacion/EditServiceForm.tsx`

**Antes:**
```typescript
id_servicio: z.string()
  .trim()
  .min(1, 'El ID del servicio es requerido')
  .max(50, 'El ID no puede exceder 50 caracteres')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Solo se permiten letras, números, guiones y guiones bajos'),
```

**Después:**
```typescript
id_servicio: z.string()
  .trim()
  .min(1, 'El ID del servicio es requerido')
  .max(50, 'El ID no puede exceder 50 caracteres')
  .regex(
    /^[^<>'"`\\;=\s]+$/, 
    'No se permiten caracteres especiales de inyección (<, >, \', ", `, \\, ;, =) ni espacios'
  ),
```

**También actualizar el texto de ayuda (línea 606):**
```typescript
// Antes
"Solo letras, números, guiones y guiones bajos (máx. 50 caracteres)"

// Después  
"Acepta folios de sistemas externos. No usar: < > ' \" ` \\ ; ="
```

### 2. `src/utils/serviceIdGenerator.ts`

Actualizar la función `isValidServiceId` para consistencia:

```typescript
export function isValidServiceId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Formato SRV interno o cualquier formato externo seguro
  const validPatterns = [
    /^SRV-\d{8}-[A-Z0-9]{6}$/,  // Formato interno: SRV-20241225-ABC123
    /^[^<>'"`\\;=\s]+$/         // Formato externo: sin caracteres peligrosos
  ];
  
  return validPatterns.some(pattern => pattern.test(id));
}
```

---

## Casos de Uso Soportados

| Folio | Sistema | Estado |
|-------|---------|--------|
| `EI&PESL-1` | Saphiro (Cargobox) | Válido |
| `SRV-20260206-ABC123` | Interno Detecta | Válido |
| `2024/INV-001` | ERP con slash | Válido |
| `REF#12345` | Con hash | Válido |
| `PROD-A(1)` | Con paréntesis | Válido |
| `<script>` | Inyección HTML | Rechazado |
| `'; DROP TABLE` | Inyección SQL | Rechazado |

---

## Impacto

- **Usuarios afectados:** Operadores de Planeación que ingresan folios de sistemas externos
- **Riesgo:** Bajo - solo amplía caracteres permitidos, mantiene seguridad contra inyección
- **Compatibilidad:** 100% retrocompatible - IDs existentes siguen siendo válidos

---

## Verificación Post-Implementación

1. Probar ingreso de `EI&PESL-1` para cliente Cargobox
2. Verificar que folios con `/`, `#`, `.`, `()` funcionan
3. Confirmar que caracteres peligrosos `<`, `>`, `'`, `"` siguen siendo rechazados
