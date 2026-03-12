

# Mejoras a Apoyos Extraordinarios: Folios Únicos + Múltiples Fotos

## Problema 1: Folios duplicados
El campo "folio" se guarda en `notas` (text libre). No hay validación de unicidad — dos custodios pueden subir el mismo folio sin error.

## Problema 2: Solo 1 foto
`comprobante_url` es un solo campo `string | null`. El formulario solo permite 1 imagen. Necesitan hasta 3.

---

## Solución

### 1. Validación de folio único (frontend)
Antes de insertar, hacer un `SELECT` para verificar si ya existe una solicitud con ese folio en `notas`:

```typescript
// En useCreateCustodianExpense, antes del insert:
const { data: existing } = await supabase
  .from('solicitudes_apoyo_extraordinario')
  .select('id')
  .eq('notas', folioTrimmed)
  .limit(1);

if (existing && existing.length > 0) {
  throw new Error('FOLIO_DUPLICADO');
}
```

Mostrar toast específico: "Este folio ya fue registrado". El formulario no se cierra para que el custodio corrija.

### 2. Múltiples fotos (hasta 3) usando `comprobante_url` como JSON array
En lugar de alterar la tabla (que solo tiene `comprobante_url: text`), guardar un JSON array de URLs en ese mismo campo: `["url1","url2","url3"]`. Esto es retrocompatible — las URLs existentes (strings simples) se manejan con un helper.

**Archivos a modificar:**

#### `CreateExpenseForm.tsx`
- Cambiar `archivo: File | null` → `archivos: File[]` (max 3)
- Grid de previews con botón de eliminar individual
- Botón "Agregar foto" habilitado mientras `archivos.length < 3`

#### `useCustodianExpenses.ts` — `useCreateCustodianExpense`
- Subir N archivos al storage en paralelo
- Guardar `comprobante_url` como `JSON.stringify([url1, url2, url3])`
- Agregar validación de folio duplicado antes del insert
- Helper `parseComprobantes(url: string | null): string[]` que parsea JSON array o devuelve `[url]` para compatibilidad

#### `GastosAprobacionSection.tsx` (Coordinador)
- Usar `parseComprobantes()` para mostrar thumbnails múltiples
- En el listado: mostrar hasta 3 mini-thumbnails
- En el dialog de detalle: gallery horizontal de imágenes clickeables

#### `AprobacionGastosPanel.tsx` (Facturación)
- Mismo cambio: usar `parseComprobantes()` para mostrar múltiples fotos

### 3. Archivos afectados
1. `src/hooks/useCustodianExpenses.ts` — validación folio + upload múltiple + helper parser
2. `src/components/custodian/CreateExpenseForm.tsx` — UI multi-foto (grid 3 slots)
3. `src/components/monitoring/coordinator/GastosAprobacionSection.tsx` — gallery de fotos
4. `src/pages/Facturacion/components/GastosExtraordinarios/AprobacionGastosPanel.tsx` — gallery de fotos

No se requieren cambios de base de datos ni migraciones.

