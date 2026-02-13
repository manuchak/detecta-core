

## Solucion: Normalizar telefonos en el origen para eliminar el problema de raiz

### Problema sistematico

El telefono en `profiles.phone` se guarda con formato humano (`720 449 6776` o `+52 720 449 6776`), pero las tablas operativas (`servicios_custodia`, `checklist_servicio`, `documentos_custodio`, `custodios_operativos`) usan formato limpio (`7204496776`). Cada hook necesita normalizar manualmente, y cuando no lo hace, el custodio no ve sus datos.

Lugares donde hoy se pasa `profile.phone` sin normalizar:
- `ServiceChecklistPage.tsx` -> `ChecklistWizard` (linea 88)
- `MobileDashboardLayout.tsx` -> `findCustodioByPhone` (ya normaliza, OK)
- `useCustodianDocuments.ts` -> query directo con `custodioTelefono` (sin normalizar)
- `useServiceChecklist.ts` -> query directo con `custodioTelefono` (sin normalizar)
- `ChecklistAuditSection.tsx` -> query directo con `custodioTelefono` (sin normalizar)

### Solucion en 2 capas

**Capa 1 - Utilidad centralizada (TypeScript)**

Crear una funcion `normalizePhone` en `src/lib/phoneUtils.ts` que elimine espacios, guiones y codigo de pais, dejando solo los ultimos 10 digitos:

```typescript
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}
```

**Capa 2 - Aplicar en todos los puntos de consumo**

| Archivo | Cambio |
|---|---|
| `src/lib/phoneUtils.ts` | **NUEVO** - funcion `normalizePhone` |
| `src/pages/custodian/ServiceChecklistPage.tsx` | Normalizar `userProfile.phone` antes de pasarlo a `ChecklistWizard` |
| `src/hooks/useServiceChecklist.ts` | Normalizar `custodioTelefono` al inicio del hook |
| `src/hooks/useCustodianDocuments.ts` | Normalizar `custodioTelefono` en la query |
| `src/hooks/useCustodianServices.ts` | Reemplazar inline `replace` por `normalizePhone` |
| `src/components/monitoring/ChecklistAuditSection.tsx` | Normalizar `custodioTelefono` en la query |
| `src/components/custodian/MobileDashboardLayout.tsx` | Reemplazar `cleanPhone` inline por `normalizePhone` |

Esto garantiza que cualquier telefono que llegue de `profiles` se normalice automaticamente antes de compararse con las tablas operativas, eliminando el problema para todos los custodios presentes y futuros.

### Resultado

- Un solo lugar donde se define la normalizacion
- Imposible que un hook nuevo olvide normalizar (patron claro a seguir)
- Todos los custodios ven sus servicios, checklists y documentos sin importar como se guardo su telefono en `profiles`

