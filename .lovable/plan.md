

## Plan: Corregir 2 problemas operativos de planeacion

### Problema 1: Error de "Referencia Cliente" al cambiar hora de servicio

**Causa raiz**: El campo `id_interno_cliente` tiene una validacion Zod de maximo 50 caracteres. El servicio de BIRKENSTOCK tiene un valor de ~57 caracteres ("San Pedro Garza Garcia, N.L. Local 217-218 Local 217-218"). Cuando Daniela intenta cambiar solo la hora, el sistema valida TODOS los campos del formulario (incluido `id_interno_cliente`), y la validacion falla por exceder el limite, bloqueando el guardado.

**Solucion**: Dos cambios complementarios:

1. **Aumentar limite de caracteres**: Cambiar la validacion de `id_interno_cliente` de 50 a 200 caracteres en el schema Zod, ya que las referencias de facturacion de clientes pueden incluir direcciones completas.

2. **Validacion solo de campos modificados**: Ajustar la logica de `handleSave` para que la validacion Zod se ejecute unicamente sobre los campos que realmente cambiaron (ya existe la logica de `changedFields`, pero la validacion se ejecuta ANTES sobre todo el formulario). Esto evita que un campo que el planeador no toco bloquee un cambio en otro campo.

**Archivo**: `src/components/planeacion/EditServiceForm.tsx`
- Linea 45: Cambiar `.max(50, ...)` a `.max(200, ...)`
- Linea 646: Actualizar `maxLength={50}` a `maxLength={200}` en el input HTML
- Lineas 360-394: Mover la validacion para que se aplique sobre `changedFields` en lugar de sobre todo `formData`

---

### Problema 2: Custodio "Ignacio Villegas" no aparece en el listado de reasignacion

**Causa raiz**: El filtro por defecto en el modal de reasignacion tiene `ocupados: false` (definido en `DEFAULT_FILTERS`). Si Ignacio Villegas tiene servicios asignados ese dia, el RPC `verificar_disponibilidad_equitativa_custodio` lo clasifica como "ocupado" y queda oculto por defecto.

Daniela necesita reasignar porque el custodio original tiene "Hoy No Circula" (contingencia ambiental en CDMX que restringe la circulacion de vehiculos). El custodio de reemplazo (Ignacio Villegas) probablemente ya tiene otro servicio, por lo que queda clasificado como "ocupado" y no es visible con los filtros por defecto.

**Verificacion en BD**: Ignacio Villegas Sanchez (id: `0f65378c`) esta `activo` con `disponibilidad = 'disponible'`, confirmando que el filtro de categoria es lo que lo oculta.

**Solucion**: Cambiar los filtros por defecto en el modal de reasignacion para que incluyan la categoria "ocupados", ya que en el contexto de reasignacion (cambio de custodio por emergencia) es critico ver a todos los operativos disponibles.

**Archivos**:
- `src/components/planeacion/ReassignmentModal.tsx` linea 92: Usar filtros de reasignacion especificos con `ocupados: true`
- Alternativamente, crear una constante `REASSIGNMENT_FILTERS` que active las tres categorias por defecto

---

### Resumen de cambios

| Archivo | Cambio | Impacto |
|---------|--------|---------|
| `EditServiceForm.tsx` | Aumentar limite de `id_interno_cliente` de 50 a 200 chars | Permite guardar servicios con referencias largas |
| `EditServiceForm.tsx` | Validar solo campos modificados | Evita bloqueos por campos que el planeador no toco |
| `ReassignmentModal.tsx` | Filtros de reasignacion con `ocupados: true` por defecto | Ignacio Villegas y otros custodios con carga aparecen de inmediato |

### Seccion tecnica

**Cambio 1 - Validacion parcial**:
```text
Antes:
  const validationResult = editServiceSchema.safeParse(formData);
  // Valida TODO el formulario, incluyendo campos no modificados

Despues:
  // Construir changedFields primero
  // Luego validar solo los campos en changedFields usando .pick() o .partial()
  const partialSchema = editServiceSchema.partial();
  const validationResult = partialSchema.safeParse(changedFields);
```

**Cambio 2 - Filtros de reasignacion**:
```text
// En ReassignmentModal.tsx
const REASSIGNMENT_FILTERS: CustodianStepFilters = {
  disponibles: true,
  parcialmenteOcupados: true,
  ocupados: true,        // <-- Cambio clave
  scoreMinimo: null,
};

const [filters, setFilters] = useState<CustodianStepFilters>(REASSIGNMENT_FILTERS);
```

